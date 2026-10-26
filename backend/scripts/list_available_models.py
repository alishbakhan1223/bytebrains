import os
from pathlib import Path
import httpx
from dotenv import load_dotenv

backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
load_dotenv(env_path)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "").strip()

print("Listing Gemini Models...")
if GEMINI_API_KEY:
    try:
        url = "https://generativelanguage.googleapis.com/v1beta/models"
        headers = {"x-goog-api-key": GEMINI_API_KEY}
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(url, headers=headers)
            print(f"Gemini listModels status: {resp.status_code}")
            if resp.status_code == 200:
                models = resp.json().get("models", [])
                gen_models = [m["name"] for m in models if "generateContent" in m.get("supportedGenerationMethods", [])]
                print(f"Supported generateContent models ({len(gen_models)}):")
                for m in gen_models[:15]:
                    print(f"  - {m}")
            else:
                print(f"Gemini list error: {resp.text[:300]}")
    except Exception as e:
        print(f"Gemini error: {e}")

print("\nListing Groq Models...")
if GROQ_API_KEY:
    try:
        url = "https://api.groq.com/openai/v1/models"
        headers = {"Authorization": f"Bearer {GROQ_API_KEY}"}
        with httpx.Client(timeout=15.0) as client:
            resp = client.get(url, headers=headers)
            print(f"Groq listModels status: {resp.status_code}")
            if resp.status_code == 200:
                models = resp.json().get("data", [])
                active_models = [m["id"] for m in models if m.get("active", True)]
                print(f"Groq models ({len(active_models)}):")
                for m in active_models:
                    print(f"  - {m}")
            else:
                print(f"Groq list error: {resp.text[:300]}")
    except Exception as e:
        print(f"Groq error: {e}")
