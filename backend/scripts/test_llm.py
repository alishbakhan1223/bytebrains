import os
import sys
import json
from pathlib import Path
import httpx
from dotenv import load_dotenv

# Load backend/.env
backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
load_dotenv(env_path)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "").strip()
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "").strip()

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-lite-latest").strip()
GROQ_MODEL = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b").strip()
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini").strip()

def mask(k: str) -> str:
    if not k:
        return "(none)"
    return k[:4] + "****" + k[-2:] if len(k) > 6 else "****"

def sanitize(text: str) -> str:
    for k in [GEMINI_API_KEY, GROQ_API_KEY, OPENAI_API_KEY]:
        if k and len(k) > 6:
            text = text.replace(k, mask(k))
    return text

print("==================================================")
print("BloodBridge LLM Connectivity Test (test_llm.py)")
print("==================================================")

# 1. Test Gemini
print(f"\n[1] Testing Gemini Provider")
print(f"    Key:   {mask(GEMINI_API_KEY)}")
print(f"    Model: {GEMINI_MODEL}")
if not GEMINI_API_KEY:
    print("    Result: SKIPPED (GEMINI_API_KEY not configured)")
else:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
    headers = {"Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY}
    body = {"contents": [{"parts": [{"text": "Say OK"}]}]}
    try:
        with httpx.Client(timeout=20.0) as client:
            resp = client.post(url, headers=headers, json=body)
            print(f"    Status: HTTP {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                ans = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                print(f"    Output: {ans}")
                print("    Result: PASS")
            else:
                print(f"    Error:  {sanitize(resp.text[:300])}")
                print("    Result: FAIL")
    except Exception as e:
        print(f"    Exception: {sanitize(str(e))}")
        print("    Result: FAIL")

# 2. Test Groq
print(f"\n[2] Testing Groq Provider")
print(f"    Key:   {mask(GROQ_API_KEY)}")
print(f"    Model: {GROQ_MODEL}")
if not GROQ_API_KEY:
    print("    Result: SKIPPED (GROQ_API_KEY not configured)")
else:
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {GROQ_API_KEY}"}
    body = {"model": GROQ_MODEL, "messages": [{"role": "user", "content": "Say OK"}], "max_tokens": 20}
    try:
        with httpx.Client(timeout=20.0) as client:
            resp = client.post(url, headers=headers, json=body)
            print(f"    Status: HTTP {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                ans = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                print(f"    Output: {ans}")
                print("    Result: PASS")
            else:
                print(f"    Error:  {sanitize(resp.text[:300])}")
                print("    Result: FAIL")
    except Exception as e:
        print(f"    Exception: {sanitize(str(e))}")
        print("    Result: FAIL")

# 3. Test OpenAI
print(f"\n[3] Testing OpenAI Provider")
print(f"    Key:   {mask(OPENAI_API_KEY)}")
print(f"    Model: {OPENAI_MODEL}")
if not OPENAI_API_KEY:
    print("    Result: SKIPPED (OPENAI_API_KEY not configured)")
else:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {OPENAI_API_KEY}"}
    body = {"model": OPENAI_MODEL, "messages": [{"role": "user", "content": "Say OK"}], "max_tokens": 20}
    try:
        with httpx.Client(timeout=20.0) as client:
            resp = client.post(url, headers=headers, json=body)
            print(f"    Status: HTTP {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                ans = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                print(f"    Output: {ans}")
                print("    Result: PASS")
            else:
                print(f"    Error:  {sanitize(resp.text[:300])}")
                print("    Result: FAIL")
    except Exception as e:
        print(f"    Exception: {sanitize(str(e))}")
        print("    Result: FAIL")

print("\n==================================================")
