import sys
import httpx
import json

BASE_URL = "http://localhost:8000/api/v1"

def print_result(name: str, resp: httpx.Response, expected_status: int = 200):
    status_ok = resp.status_code == expected_status
    flag = "[PASS]" if status_ok else f"[FAIL] (Expected {expected_status}, got {resp.status_code})"
    cors = resp.headers.get("access-control-allow-origin", "(NONE)")
    print(f"\n{flag} {name}")
    print(f"Status:   {resp.status_code} | CORS: {cors}")
    try:
        data = resp.json()
        formatted = json.dumps(data, indent=2)
        print(f"Body:     {formatted[:350]}{'...' if len(formatted) > 350 else ''}")
    except Exception:
        print(f"Body:     {resp.text[:350]}")
    return status_ok, resp.json() if resp.status_code in (200, 201) else None

def main():
    print("=" * 60)
    print("BLOODBRIDGE BACKEND COMPREHENSIVE SMOKE TEST")
    print("=" * 60)
    
    all_passed = True

    with httpx.Client(base_url=BASE_URL, timeout=30.0) as client:
        # 1. Unauthenticated Security Checks
        print("\n--- 1. Unauthenticated Endpoints (Should return 401 or 200 for public) ---")
        r = client.get("/auth/organizations", headers={"Origin": "http://localhost:3000"})
        ok, _ = print_result("GET /auth/organizations (Public)", r, 200)
        all_passed = all_passed and ok

        r = client.get("/auth/me", headers={"Origin": "http://localhost:3000"})
        ok, _ = print_result("GET /auth/me (Unauthenticated -> 401)", r, 401)
        all_passed = all_passed and ok

        r = client.post("/chat", json={"message": "hello"}, headers={"Origin": "http://localhost:3000"})
        ok, _ = print_result("POST /chat (Unauthenticated -> 401)", r, 401)
        all_passed = all_passed and ok

        # 2. Login as Admin
        print("\n--- 2. Admin Authentication & Endpoints ---")
        r = client.post(
            "/auth/login",
            json={"email": "admin@bloodbridge.org", "password": "admin123"},
            headers={"Origin": "http://localhost:3000"},
        )
        ok, admin_data = print_result("POST /auth/login (Admin)", r, 200)
        all_passed = all_passed and ok
        admin_token = admin_data.get("access_token") if admin_data else None
        admin_headers = {
            "Origin": "http://localhost:3000",
            "Authorization": f"Bearer {admin_token}"
        }

        r = client.get("/auth/me", headers=admin_headers)
        ok, _ = print_result("GET /auth/me (Admin Profile)", r, 200)
        all_passed = all_passed and ok

        r = client.get("/dashboards/admin", headers=admin_headers)
        ok, _ = print_result("GET /dashboards/admin", r, 200)
        all_passed = all_passed and ok

        r = client.get("/inventory", headers=admin_headers)
        ok, _ = print_result("GET /inventory", r, 200)
        all_passed = all_passed and ok

        # 3. Login as Blood Bank Staff
        print("\n--- 3. Blood Bank Staff Authentication ---")
        r = client.post(
            "/auth/login",
            json={"email": "bloodbank@bloodbridge.org", "password": "bloodbank123"},
            headers={"Origin": "http://localhost:3000"},
        )
        ok, bb_data = print_result("POST /auth/login (Blood Bank)", r, 200)
        all_passed = all_passed and ok
        bb_token = bb_data.get("access_token") if bb_data else None
        bb_headers = {
            "Origin": "http://localhost:3000",
            "Authorization": f"Bearer {bb_token}"
        }

        r = client.get("/dashboards/blood-bank", headers=bb_headers)
        ok, _ = print_result("GET /dashboards/blood-bank", r, 200)
        all_passed = all_passed and ok

        # 4. Login as Hospital Staff
        print("\n--- 4. Hospital Staff Authentication ---")
        r = client.post(
            "/auth/login",
            json={"email": "hospital@bloodbridge.org", "password": "hospital123"},
            headers={"Origin": "http://localhost:3000"},
        )
        ok, hosp_data = print_result("POST /auth/login (Hospital)", r, 200)
        all_passed = all_passed and ok
        hosp_token = hosp_data.get("access_token") if hosp_data else None
        hosp_headers = {
            "Origin": "http://localhost:3000",
            "Authorization": f"Bearer {hosp_token}"
        }

        r = client.get("/dashboards/hospital", headers=hosp_headers)
        ok, _ = print_result("GET /dashboards/hospital", r, 200)
        all_passed = all_passed and ok

        # 5. Assistant & LLM Endpoints
        print("\n--- 5. AI Assistant & LLM Endpoints ---")
        r = client.get("/assistant/health", headers=admin_headers)
        ok, health_data = print_result("GET /assistant/health", r, 200)
        all_passed = all_passed and ok

        r = client.post(
            "/chat",
            json={"message": "How many O+ units are available?"},
            headers=admin_headers,
        )
        ok, chat_o_plus = print_result("POST /chat ('How many O+ units are available?')", r, 200)
        all_passed = all_passed and ok

        r = client.post(
            "/chat",
            json={"message": "who can donate blood?"},
            headers=admin_headers,
        )
        ok, chat_who_donate = print_result("POST /chat ('who can donate blood?')", r, 200)
        all_passed = all_passed and ok

        # 6. Emergency Request 2-Step Confirmation Gate
        print("\n--- 6. Emergency Request 2-Step Confirmation Gate ---")
        r = client.post(
            "/chat",
            json={"message": "Create an emergency request for 2 units of O-"},
            headers=hosp_headers,
        )
        ok, emergency_res = print_result("POST /chat ('Create emergency request for 2 units of O-')", r, 200)
        all_passed = all_passed and ok

        pending_action = emergency_res.get("pending_action") if emergency_res else None
        if pending_action:
            print(f"Detected Pending Action: {pending_action.get('action_type')}")
            # Confirm action
            r = client.post(
                "/chat/confirm",
                json={
                    "action_type": pending_action.get("action_type"),
                    "parameters": pending_action.get("parameters"),
                },
                headers=hosp_headers,
            )
            ok, confirm_res = print_result("POST /chat/confirm (Human Confirmation Gate)", r, 200)
            all_passed = all_passed and ok
        else:
            print("WARNING: pending_action was not detected in emergency request response.")

    print("\n" + "=" * 60)
    if all_passed:
        print("SUCCESS: ALL SMOKE TESTS PASSED PERFECTLY!")
    else:
        print("WARNING: SOME SMOKE TESTS RETURNED UNEXPECTED RESULTS.")
    print("=" * 60)

if __name__ == "__main__":
    main()
