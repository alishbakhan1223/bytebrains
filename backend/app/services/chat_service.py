import re
import json
import logging
from datetime import date, datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.entities import (
    User,
    BloodInventory,
    BloodRequest,
    DemandHistory,
    RiskAssessment,
    Hospital,
    BloodBank,
)
from app.models.enums import UserRole, BloodGroup, InventoryStatus, RequestPriority, RequestStatus
from app.services.inventory_service import get_system_thresholds
from app.services.risk_service import get_latest_risk_assessments
from app.services.audit_service import log_action
from app.services.llm_client import generate_chat_response

logger = logging.getLogger("bloodbridge.chat")

ACTION_TAG_REGEX = re.compile(r"<<<ACTION:([A-Z_]+):(\{.*?\})>>>", re.DOTALL)


def extract_action_tag(text: str) -> Tuple[str, Optional[str], Optional[Dict[str, Any]]]:
    """Extract machine-readable action tag from LLM response if present."""
    match = ACTION_TAG_REGEX.search(text)
    if not match:
        return text.strip(), None, None

    action_type = match.group(1)
    params_raw = match.group(2)
    cleaned_text = ACTION_TAG_REGEX.sub("", text).strip()

    try:
        parameters = json.loads(params_raw)
    except Exception as e:
        logger.warning("Failed to parse JSON in LLM action tag: %s", e)
        parameters = {}

    return cleaned_text, action_type, parameters


def build_live_context(db: Session, user: User) -> str:
    """Gathers fresh live database records and system thresholds to inject into LLM system prompt."""
    today = date.today()

    # 1. User & Facility Info
    hospital_name = None
    if user.hospital_id:
        h = db.query(Hospital).filter(Hospital.id == user.hospital_id).first()
        if h:
            hospital_name = h.name

    blood_bank_name = None
    if user.blood_bank_id:
        bb = db.query(BloodBank).filter(BloodBank.id == user.blood_bank_id).first()
        if bb:
            blood_bank_name = bb.name

    user_info = (
        f"User: {user.name} ({user.email})\n"
        f"Role: {user.role.value}\n"
        f"Assigned Hospital: {hospital_name or 'None'}\n"
        f"Assigned Blood Bank: {blood_bank_name or 'None'}"
    )

    # 2. Live Inventory Counts by Blood Group
    all_groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    inventory_summary = []
    thresholds = {}
    try:
        thresh_res = get_system_thresholds(db)
        if isinstance(thresh_res, tuple) and len(thresh_res) > 0 and isinstance(thresh_res[0], dict):
            thresholds = thresh_res[0]
        elif isinstance(thresh_res, dict):
            thresholds = thresh_res.get("min_inventory_thresholds", thresh_res)
    except Exception as e:
        logger.warning("Could not load thresholds: %s", e)

    for bg in all_groups:
        avail = db.query(func.sum(BloodInventory.quantity)).filter(
            BloodInventory.blood_group == bg,
            BloodInventory.status == InventoryStatus.AVAILABLE,
            BloodInventory.expiry_date >= today,
        ).scalar() or 0

        reserved = db.query(func.sum(BloodInventory.quantity)).filter(
            BloodInventory.blood_group == bg,
            BloodInventory.status == InventoryStatus.RESERVED,
        ).scalar() or 0

        min_thresh = thresholds.get(bg, 15)
        status = "HEALTHY" if avail >= min_thresh else "DEFICIT / LOW"
        inventory_summary.append(f"• {bg}: Available={avail} units, Reserved={reserved} units, Safety Threshold={min_thresh} units (Status: {status})")

    inventory_text = "\n".join(inventory_summary)

    # 3. Expiring Batches in Next 7 Days
    next_week = today + timedelta(days=7)
    expiring_batches = db.query(BloodInventory).filter(
        BloodInventory.status == InventoryStatus.AVAILABLE,
        BloodInventory.expiry_date >= today,
        BloodInventory.expiry_date <= next_week,
    ).order_by(BloodInventory.expiry_date.asc()).limit(10).all()

    if expiring_batches:
        exp_lines = []
        for b in expiring_batches:
            days_left = (b.expiry_date - today).days
            exp_lines.append(f"• Batch #{b.batch_id} ({b.blood_group.value}): {b.quantity} unit(s), Expiry Date: {b.expiry_date} ({days_left} day(s) left)")
        expiring_text = "\n".join(exp_lines)
    else:
        expiring_text = "No batches expiring within the next 7 days."

    # 4. Explainable Risk Engine Assessments
    risk_assessments = []
    try:
        risk_assessments = get_latest_risk_assessments(db)
    except Exception as re:
        logger.warning("Could not load risk assessments: %s", re)

    risk_lines = []
    for ra in risk_assessments:
        reasons_raw = ra.get("reasons", []) if isinstance(ra, dict) else getattr(ra, "reasons", [])
        if isinstance(reasons_raw, list):
            reasons_str = "; ".join(str(r) for r in reasons_raw)
        else:
            reasons_str = str(reasons_raw)
        bg_val = ra.get("blood_group", "Unknown") if isinstance(ra, dict) else getattr(ra, "blood_group", "Unknown")
        risk_level_val = ra.get("risk_level", "N/A") if isinstance(ra, dict) else getattr(ra, "risk_level", "N/A")
        score_val = ra.get("risk_score") if isinstance(ra, dict) else getattr(ra, "risk_score", None)
        score_str = f", Score={score_val}/100" if score_val is not None else ""
        curr_inv = ra.get("current_inventory", 0) if isinstance(ra, dict) else getattr(ra, "current_inventory", 0)
        pred_dem = ra.get("predicted_demand", 0) if isinstance(ra, dict) else getattr(ra, "predicted_demand", 0)
        exp_u = ra.get("expiring_units", 0) if isinstance(ra, dict) else getattr(ra, "expiring_units", 0)
        act_r = ra.get("active_requests", 0) if isinstance(ra, dict) else getattr(ra, "active_requests", 0)

        risk_lines.append(
            f"• {bg_val}: Risk Level={risk_level_val}{score_str}. "
            f"Current Stock={curr_inv}u, 7d Forecast Demand={pred_dem}u, "
            f"Expiring Units={exp_u}, Active Requests={act_r}. "
            f"Key Factors: {reasons_str}"
        )
    risk_text = "\n".join(risk_lines) if risk_lines else "No current risk assessments."

    # 5. Active Blood Requests Queue
    active_requests = db.query(BloodRequest).filter(
        BloodRequest.status.in_([RequestStatus.SUBMITTED, RequestStatus.REVIEWING])
    ).order_by(BloodRequest.created_at.desc()).limit(8).all()

    req_count = db.query(BloodRequest).filter(
        BloodRequest.status.in_([RequestStatus.SUBMITTED, RequestStatus.REVIEWING])
    ).count()

    critical_count = sum(1 for r in active_requests if r.priority == RequestPriority.CRITICAL)
    urgent_count = sum(1 for r in active_requests if r.priority == RequestPriority.URGENT)

    if active_requests:
        req_lines = [f"Total Pending Requests in Network: {req_count} (Critical: {critical_count}, Urgent: {urgent_count})"]
        for r in active_requests:
            req_lines.append(f"• Request #{r.id}: {r.blood_group.value} ({r.quantity} units), Priority: {r.priority.value}, Status: {r.status.value}, Hospital ID: {r.hospital_id}")
        requests_text = "\n".join(req_lines)
    else:
        requests_text = "No pending blood requests currently in the queue."

    # 6. Past 30 Days Transfusion Usage
    thirty_days_ago = today - timedelta(days=30)
    total_30d_used = db.query(func.sum(DemandHistory.units_used)).filter(DemandHistory.date >= thirty_days_ago).scalar() or 0

    return f"""=== BLOODBRIDGE LIVE DATABASE CONTEXT (Ground Truth) ===
[Current System Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}]

[Current Authenticated User]
{user_info}

[Network-Wide Live Blood Inventory by Group]
{inventory_text}

[Batches Expiring in Next 7 Days]
{expiring_text}

[Explainable Risk Engine Supply Forecast & Assessments]
{risk_text}

[Active Blood Request Queue]
{requests_text}

[Clinical Transfusion Demand (Past 30 Days)]
Total units transfused: {total_30d_used} units (Avg: {round(total_30d_used / 30, 1)} units/day)
=== END DATABASE CONTEXT ==="""


def build_system_prompt(live_context: str) -> str:
    return f"""You are the BloodBridge AI Clinical & Inventory Assistant, an expert AI operational assistant for a regional blood banking and hospital coordination network.

{live_context}

CRITICAL RULES & OPERATIONAL GUIDELINES:
1. STRICT GROUNDING ON DATABASE FACTS:
   - For all numbers, blood inventory counts, batch IDs, expiry dates, risk levels, and request queues, you MUST use ONLY the exact numbers provided in the Live Database Context above.
   - NEVER invent, guess, or hallucinate figures. If specific data is not in the context, explicitly state that it is not recorded in the live database.

2. BLOOD DONATION & MEDICAL KNOWLEDGE:
   - Answer general questions accurately:
     * Donation eligibility: Healthy adults aged 18-65, weight >= 50 kg, hemoglobin >= 12.5 g/dL (females) or 13.0 g/dL (males), at least 56 days (8 weeks) between whole blood donations.
     * Blood compatibility (Red Blood Cells):
       - O- is the Universal Donor (can donate RBCs to all groups: A+, A-, B+, B-, AB+, AB-, O+, O-). O- can only receive from O-.
       - AB+ is the Universal Recipient (can receive RBCs from any blood group). AB+ can only donate RBCs to AB+.
       - O+ can donate to O+, A+, B+, AB+; can receive from O+ and O-.
       - A+ can donate to A+, AB+; can receive from A+, A-, O+, O-.
       - A- can donate to A+, A-, AB+, AB-; can receive from A-, O-.
       - B+ can donate to B+, AB+; can receive from B+, B-, O+, O-.
       - B- can donate to B+, B-, AB+, AB-; can receive from B-, O-.
       - AB- can donate to AB+, AB-; can receive from AB-, A-, B-, O-.
     * Storage parameters: Red blood cells stored at 2°C to 6°C for up to 35-42 days. Platelets stored at 20°C to 24°C with continuous agitation for up to 5 days.
   - For any medical questions, always include a brief disclaimer: "(Note: Operational guidance only. Consult a licensed medical professional for clinical diagnosis.)"

3. MULTILINGUAL & TONE:
   - Respond in the language used by the user:
     * If the user writes in Roman Urdu (e.g., "O- aur AB+ ka compatibility batao", "Kitne units available hain?"), reply in fluent, natural Roman Urdu!
     * If Urdu script is used, reply in Urdu.
     * If English, reply in English.
   - Keep answers concise, clear, structured, and easy to read.

4. EMERGENCY BLOOD REQUEST CREATION (2-STEP CONFIRMATION GATE):
   - If the user asks to create, order, or dispatch a blood request (e.g. "Create an emergency request for 2 units of O-"):
     * Describe the proposed request clearly (Blood Group, Quantity, Priority, Notes).
     * Inform the user that requests require human authorization.
     * At the very end of your response, output this EXACT tag:
       <<<ACTION:CREATE_REQUEST:{{"blood_group":"<GROUP>","quantity":<INT>,"priority":"<Critical|Urgent|Normal>"}}>>>
     * Do NOT fabricate other actions. Only CREATE_REQUEST is supported."""


def handle_chat_message(
    db: Session,
    user: User,
    message: str,
    history: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    """
    Handles chat message using real LLM provider chain with live DB grounding.
    """
    clean_msg = message.strip()
    if not clean_msg:
        return {
            "response_text": "Please provide a valid question or command.",
            "source_type": "GUIDE",
        }

    # 1. Build live database context & system prompt
    live_context = build_live_context(db, user)
    system_prompt = build_system_prompt(live_context)

    # 2. Prepare conversation messages
    llm_messages: List[Dict[str, str]] = []
    if history:
        for item in history[-6:]:  # Keep recent context
            role = item.get("role", "user")
            content = item.get("content", "").strip()
            if content and role in ("user", "assistant"):
                llm_messages.append({"role": role, "content": content})

    llm_messages.append({"role": "user", "content": clean_msg})

    # 3. Call LLM provider chain with automatic fallback
    try:
        raw_reply, provider_name = generate_chat_response(llm_messages, system_prompt)
        cleaned_reply, action_type, action_params = extract_action_tag(raw_reply)

        source_type = "LIVE_DATABASE"
        if action_type == "CREATE_REQUEST":
            source_type = "ACTION_CONFIRMATION"
        elif "risk" in clean_msg.lower():
            source_type = "RISK_ENGINE"

        response_dict: Dict[str, Any] = {
            "response_text": cleaned_reply,
            "source_type": source_type,
            "provider": provider_name,
        }

        if action_type and action_params:
            # Ensure valid blood group
            bg = action_params.get("blood_group", "O-").upper().strip()
            qty = int(action_params.get("quantity", 2))
            prio = action_params.get("priority", "Critical").capitalize()

            response_dict["pending_action"] = {
                "action_type": action_type,
                "parameters": {
                    "blood_group": bg,
                    "quantity": qty,
                    "priority": prio,
                    "notes": f"Created via confirmed BloodBridge Assistant action by {user.email}",
                },
            }
            response_dict["structured_data"] = {
                "blood_group": bg,
                "quantity": qty,
                "priority": prio,
            }

        return response_dict

    except Exception as e:
        logger.error("LLM chat completion error: %s", e)
        # Fallback to local rule-based answer if all LLM providers fail
        return _fallback_local_handler(db, user, clean_msg, str(e))


def _fallback_local_handler(db: Session, user: User, message: str, error_detail: str) -> Dict[str, Any]:
    """Safety fallback in case external internet or all providers are completely unreachable."""
    clean_msg = message.lower()
    today = date.today()

    # Create request intent
    if "create" in clean_msg and ("request" in clean_msg or "emergency" in clean_msg):
        qty_match = re.search(r"(\d+)\s*(?:units?|bags?)?", clean_msg)
        quantity = int(qty_match.group(1)) if qty_match else 2
        bg_match = re.search(r"(AB\+|AB-|A\+|A-|B\+|B-|O\+|O-)", message, re.IGNORECASE)
        bg = bg_match.group(1).upper() if bg_match else "O-"
        priority = "Critical" if "emergency" in clean_msg or "critical" in clean_msg else "Normal"

        return {
            "response_text": (
                f"**Emergency Request Preparation**\n\n"
                f"I have structured this emergency blood order:\n"
                f"- **Blood Group:** {bg}\n"
                f"- **Quantity:** {quantity} units\n"
                f"- **Priority:** {priority}\n\n"
                f"Please authorize using the human approval gate below."
            ),
            "source_type": "ACTION_CONFIRMATION",
            "pending_action": {
                "action_type": "CREATE_REQUEST",
                "parameters": {
                    "blood_group": bg,
                    "quantity": quantity,
                    "priority": priority,
                    "notes": f"Fallback order prepared for {user.email}",
                },
            },
        }

    return {
        "response_text": (
            f"**BloodBridge Operational Assistant**\n\n"
            f"Note: External LLM services encountered an issue ({error_detail}). "
            f"Live database safeguards remain active. You can query inventory, check risk monitor, or prepare emergency requests."
        ),
        "source_type": "GUIDE",
    }


def execute_confirmed_action(
    db: Session,
    user: User,
    action_type: str,
    parameters: Dict[str, Any],
) -> Dict[str, Any]:
    """Execute confirmed action with full audit trail and RBAC."""
    if action_type == "CREATE_REQUEST":
        from app.services.request_service import create_blood_request
        from app.schemas.request import BloodRequestCreate

        priority_raw = str(parameters.get("priority", "Critical")).strip().title()
        try:
            req_priority = RequestPriority(priority_raw)
        except ValueError:
            req_priority = RequestPriority.CRITICAL

        bg_str = str(parameters.get("blood_group", "O-")).strip().upper()
        try:
            bg_enum = BloodGroup(bg_str)
        except ValueError:
            bg_enum = BloodGroup.O_NEG

        req_schema = BloodRequestCreate(
            hospital_id=user.hospital_id or 1,
            blood_group=bg_enum,
            quantity=int(parameters.get("quantity", 2)),
            priority=req_priority,
            required_datetime=datetime.utcnow() + timedelta(hours=2),
            notes=parameters.get("notes", "Created via confirmed Assistant action"),
        )
        created = create_blood_request(db, req_schema, current_user=user)
        log_action(
            db,
            action="CHATBOT_CONFIRMED_ACTION",
            entity_type="BloodRequest",
            entity_id=str(created.id),
            description=f"User {user.email} confirmed chatbot action: created request #{created.id} for {created.quantity} units of {created.blood_group.value}",
            user_id=user.id,
        )
        return {
            "status": "COMPLETED",
            "action_type": action_type,
            "message": f"Successfully created emergency request #{created.id} for {created.quantity} units of {created.blood_group.value}.",
            "data": {"request_id": created.id, "status": created.status.value},
        }

    return {"status": "FAILED", "message": f"Unsupported action type: {action_type}"}
