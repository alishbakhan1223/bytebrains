import os
import logging
from typing import List, Dict, Any, Tuple, Optional
import httpx
from app.config import settings

logger = logging.getLogger("bloodbridge.llm")

# Provider model defaults (configurable via environment variables)
GEMINI_DEFAULT_MODEL = os.environ.get("GEMINI_MODEL", getattr(settings, "GEMINI_MODEL", "gemini-flash-lite-latest"))
GROQ_DEFAULT_MODEL = os.environ.get("GROQ_MODEL", getattr(settings, "GROQ_MODEL", "qwen/qwen3.8-27b"))
OPENAI_DEFAULT_MODEL = os.environ.get("OPENAI_MODEL", getattr(settings, "OPENAI_MODEL", "gpt-4o-mini"))

TIMEOUT_SECONDS = 20.0


def mask_key(k: str) -> str:
    if not k:
        return "(none)"
    if len(k) <= 6:
        return "****"
    return k[:4] + "****" + k[-2:]


def _sanitize(text: str) -> str:
    for k in [settings.GEMINI_API_KEY, settings.GROQ_API_KEY, settings.OPENAI_API_KEY]:
        if k and len(k) > 6:
            text = text.replace(k, mask_key(k))
    return text


def _call_gemini(
    messages: List[Dict[str, str]],
    system_prompt: str,
    model: str,
    api_key: str,
) -> str:
    """Call Google Gemini generateContent endpoint."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
    }

    # Format contents with strictly alternating user and model turns
    contents: List[Dict[str, Any]] = []
    for msg in messages:
        role = "user" if msg.get("role") == "user" else "model"
        text = msg.get("content", "").strip()
        if not text:
            continue
        if contents and contents[-1]["role"] == role:
            # Merge consecutive turns with the same role
            contents[-1]["parts"][0]["text"] += f"\n\n{text}"
        else:
            contents.append({"role": role, "parts": [{"text": text}]})

    # Gemini requires first content to be user
    if not contents:
        contents = [{"role": "user", "parts": [{"text": "Hello"}]}]
    elif contents[0]["role"] != "user":
        contents.insert(0, {"role": "user", "parts": [{"text": "Context initialization"}]})

    payload = {
        "system_instruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1024,
        },
    }

    with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
        resp = client.post(url, headers=headers, json=payload)
        if resp.status_code != 200:
            err_msg = ""
            try:
                err_json = resp.json()
                err_msg = err_json.get("error", {}).get("message", resp.text[:150])
            except Exception:
                err_msg = resp.text[:150]
            raise RuntimeError(f"HTTP {resp.status_code}: {_sanitize(err_msg)}")

        data = resp.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise RuntimeError("Gemini returned no candidates in response")

        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            raise RuntimeError("Gemini candidate content has no parts")

        return parts[0].get("text", "").strip()


def _call_groq(
    messages: List[Dict[str, str]],
    system_prompt: str,
    model: str,
    api_key: str,
) -> str:
    """Call Groq chat completions endpoint."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    groq_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        role = msg.get("role", "user")
        if role not in ("user", "assistant", "system"):
            role = "user"
        content = msg.get("content", "").strip()
        if content:
            groq_messages.append({"role": role, "content": content})

    payload = {
        "model": model,
        "messages": groq_messages,
        "temperature": 0.2,
        "max_tokens": 1024,
    }

    with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
        resp = client.post(url, headers=headers, json=payload)
        if resp.status_code != 200:
            err_msg = ""
            try:
                err_json = resp.json()
                err_msg = err_json.get("error", {}).get("message", resp.text[:150])
            except Exception:
                err_msg = resp.text[:150]
            raise RuntimeError(f"HTTP {resp.status_code}: {_sanitize(err_msg)}")

        data = resp.json()
        choices = data.get("choices", [])
        if not choices:
            raise RuntimeError("Groq returned no choices in response")

        return choices[0].get("message", {}).get("content", "").strip()


def _call_openai(
    messages: List[Dict[str, str]],
    system_prompt: str,
    model: str,
    api_key: str,
) -> str:
    """Call OpenAI chat completions endpoint."""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    openai_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        role = msg.get("role", "user")
        if role not in ("user", "assistant", "system"):
            role = "user"
        content = msg.get("content", "").strip()
        if content:
            openai_messages.append({"role": role, "content": content})

    payload = {
        "model": model,
        "messages": openai_messages,
        "temperature": 0.2,
        "max_tokens": 1024,
    }

    with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
        resp = client.post(url, headers=headers, json=payload)
        if resp.status_code != 200:
            err_msg = ""
            try:
                err_json = resp.json()
                err_msg = err_json.get("error", {}).get("message", resp.text[:150])
            except Exception:
                err_msg = resp.text[:150]
            raise RuntimeError(f"HTTP {resp.status_code}: {_sanitize(err_msg)}")

        data = resp.json()
        choices = data.get("choices", [])
        if not choices:
            raise RuntimeError("OpenAI returned no choices in response")

        return choices[0].get("message", {}).get("content", "").strip()


def generate_chat_response(
    messages: List[Dict[str, str]],
    system_prompt: str,
) -> Tuple[str, str]:
    """
    Executes the provider chain with automatic fallback:
      1. Gemini (primary)
      2. Groq (secondary)
      3. OpenAI (tertiary if set)
    Returns:
      (reply_text, provider_name)
    Raises:
      RuntimeError if all configured providers fail.
    """
    providers_to_try = []

    gemini_key = settings.GEMINI_API_KEY.strip()
    gemini_model = os.environ.get("GEMINI_MODEL", getattr(settings, "GEMINI_MODEL", GEMINI_DEFAULT_MODEL)).strip()
    if gemini_key:
        providers_to_try.append(("Gemini", _call_gemini, gemini_model, gemini_key))

    groq_key = settings.GROQ_API_KEY.strip()
    groq_model = os.environ.get("GROQ_MODEL", getattr(settings, "GROQ_MODEL", GROQ_DEFAULT_MODEL)).strip()
    if groq_key:
        providers_to_try.append(("Groq", _call_groq, groq_model, groq_key))

    openai_key = settings.OPENAI_API_KEY.strip()
    openai_model = os.environ.get("OPENAI_MODEL", getattr(settings, "OPENAI_MODEL", OPENAI_DEFAULT_MODEL)).strip()
    if openai_key:
        providers_to_try.append(("OpenAI", _call_openai, openai_model, openai_key))

    if not providers_to_try:
        raise RuntimeError("No LLM providers are configured in backend/.env (set GEMINI_API_KEY or GROQ_API_KEY).")

    errors: List[str] = []

    for name, caller, model, key in providers_to_try:
        try:
            logger.info("Calling LLM Provider: %s (model: %s)", name, model)
            reply = caller(messages, system_prompt, model, key)
            if reply:
                logger.info("LLM Provider %s responded successfully (%d chars)", name, len(reply))
                return reply, name
        except Exception as e:
            short_err = _sanitize(str(e))
            logger.warning("[LLM Fallback] Provider %s (model: %s) failed: %s. Falling back to next provider.", name, model, short_err)
            errors.append(f"{name}: {short_err}")

    error_summary = " | ".join(errors)
    raise RuntimeError(f"All configured LLM providers failed. Errors: {error_summary}")


def check_assistant_health() -> Dict[str, Any]:
    """
    Checks provider configuration and ping connectivity.
    NEVER leaks API keys.
    """
    results: Dict[str, Any] = {}

    # Check Gemini
    gemini_key = settings.GEMINI_API_KEY.strip()
    gemini_model = os.environ.get("GEMINI_MODEL", getattr(settings, "GEMINI_MODEL", GEMINI_DEFAULT_MODEL)).strip()
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent"
            headers = {"Content-Type": "application/json", "x-goog-api-key": gemini_key}
            payload = {"contents": [{"parts": [{"text": "Say OK"}]}]}
            with httpx.Client(timeout=8.0) as client:
                r = client.post(url, headers=headers, json=payload)
                results["gemini"] = {
                    "configured": True,
                    "working": r.status_code == 200,
                    "model": gemini_model,
                    "status_code": r.status_code,
                }
        except Exception as e:
            results["gemini"] = {
                "configured": True,
                "working": False,
                "model": gemini_model,
                "error": _sanitize(str(e)),
            }
    else:
        results["gemini"] = {"configured": False, "working": False, "model": gemini_model}

    # Check Groq
    groq_key = settings.GROQ_API_KEY.strip()
    groq_model = os.environ.get("GROQ_MODEL", getattr(settings, "GROQ_MODEL", GROQ_DEFAULT_MODEL)).strip()
    if groq_key:
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Content-Type": "application/json", "Authorization": f"Bearer {groq_key}"}
            payload = {"model": groq_model, "messages": [{"role": "user", "content": "Say OK"}], "max_tokens": 5}
            with httpx.Client(timeout=8.0) as client:
                r = client.post(url, headers=headers, json=payload)
                results["groq"] = {
                    "configured": True,
                    "working": r.status_code == 200,
                    "model": groq_model,
                    "status_code": r.status_code,
                }
        except Exception as e:
            results["groq"] = {
                "configured": True,
                "working": False,
                "model": groq_model,
                "error": _sanitize(str(e)),
            }
    else:
        results["groq"] = {"configured": False, "working": False, "model": groq_model}

    # Check OpenAI
    openai_key = settings.OPENAI_API_KEY.strip()
    openai_model = os.environ.get("OPENAI_MODEL", getattr(settings, "OPENAI_MODEL", OPENAI_DEFAULT_MODEL)).strip()
    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Content-Type": "application/json", "Authorization": f"Bearer {openai_key}"}
            payload = {"model": openai_model, "messages": [{"role": "user", "content": "Say OK"}], "max_tokens": 5}
            with httpx.Client(timeout=8.0) as client:
                r = client.post(url, headers=headers, json=payload)
                results["openai"] = {
                    "configured": True,
                    "working": r.status_code == 200,
                    "model": openai_model,
                    "status_code": r.status_code,
                }
        except Exception as e:
            results["openai"] = {
                "configured": True,
                "working": False,
                "model": openai_model,
                "error": _sanitize(str(e)),
            }
    else:
        results["openai"] = {"configured": False, "working": False, "model": openai_model}

    # Determine active provider
    active_provider = None
    for p in ["gemini", "groq", "openai"]:
        if results.get(p, {}).get("working"):
            active_provider = p
            break

    return {
        "status": "healthy" if active_provider else "degraded",
        "active_provider": active_provider,
        "providers": results,
    }
