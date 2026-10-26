import os
from pathlib import Path
import httpx
from dotenv import load_dotenv

backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
load_dotenv(env_path)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "").strip()

print("Testing Gemini candidates...")
gemini_candidates = [
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash-lite",
    "gemini-3-flash-preview",
    "gemini-pro-latest",
    "gemini-2.5-pro",
]

for mod in gemini_candidates:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{mod}:generateContent"
    headers = {"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY}
    body = {"contents": [{"parts": [{"text": "Say OK"}]}]}
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, headers=headers, json=body)
            if resp.status_code == 200:
                ans = resp.json().get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                print(f"  [SUCCESS] {mod} -> {ans}")
            else:
                msg = resp.json().get("error", {}).get("message", resp.text[:100])
                print(f"  [FAILED] {mod} -> HTTP {resp.status_code}: {msg[:120]}")
    except Exception as e:
        print(f"  [ERROR] {mod} -> {e}")

print("\nTesting Groq candidates...")
groq_candidates = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
]

for mod in groq_candidates:
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {GROQ_API_KEY}"}
    body = {"model": mod, "messages": [{"role": "user", "content": "Say OK"}], "max_tokens": 20}
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, headers=headers, json=body)
            if resp.status_code == 200:
                ans = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                print(f"  [SUCCESS] {mod} -> {ans}")
            else:
                msg = resp.json().get("error", {}).get("message", resp.text[:100])
                print(f"  [FAILED] {mod} -> HTTP {resp.status_code}: {msg[:120]}")
    except Exception as e:
        print(f"  [ERROR] {mod} -> {e}")
