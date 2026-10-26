from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.deps import get_db, require_authenticated
from app.models.entities import User
from app.services.chat_service import handle_chat_message, execute_confirmed_action
from app.services.llm_client import check_assistant_health

router = APIRouter(prefix="/chat", tags=["BloodBridge Assistant"])
assistant_router = APIRouter(prefix="/assistant", tags=["BloodBridge Assistant Health"])


class ChatMessageHistoryItem(BaseModel):
    role: str
    content: str


class ChatMessageRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessageHistoryItem]] = None


class ChatConfirmActionRequest(BaseModel):
    action_type: str
    parameters: Dict[str, Any]


@router.get("/health")
@assistant_router.get("/health")
def get_assistant_health():
    """
    Health endpoint returning provider connectivity & configuration.
    Returns boolean status and masked provider info (never exposes API keys).
    """
    return check_assistant_health()


@router.post("")
def chat_with_assistant(
    req: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    """
    Grounded BloodBridge Assistant:
    Answers inventory, expiry, risk, and request queries strictly
    grounded in live database facts and ML models using real LLMs with multi-provider fallback.
    """
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be blank")

    history_list = None
    if req.history:
        history_list = [{"role": h.role, "content": h.content} for h in req.history]

    result = handle_chat_message(
        db=db,
        user=current_user,
        message=req.message,
        history=history_list,
    )
    return result


@router.post("/confirm")
def confirm_assistant_action(
    req: ChatConfirmActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated),
):
    """
    Explicit Human Confirmation Layer:
    Executes controlled actions prepared by the assistant (e.g. creating emergency blood requests).
    Strictly safeguards clinical and inventory operations.
    """
    result = execute_confirmed_action(
        db=db,
        user=current_user,
        action_type=req.action_type,
        parameters=req.parameters,
    )
    return result
