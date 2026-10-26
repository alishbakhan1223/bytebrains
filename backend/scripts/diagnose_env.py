import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
root_dir = backend_dir.parent

backend_env_path = backend_dir / ".env"
root_env_path = root_dir / ".env"

print(f"Backend directory: {backend_dir}")
print(f"Backend .env path: {backend_env_path} (exists: {backend_env_path.exists()})")
print(f"Root .env path:    {root_env_path} (exists: {root_env_path.exists()})")

def parse_env_file(path: Path):
    if not path.exists():
        return {}
    keys = {}
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            if "=" in stripped:
                k, v = stripped.split("=", 1)
                k = k.strip()
                v = v.strip()
                if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                    v = v[1:-1].strip()
                keys[k] = v
    return keys

backend_keys = parse_env_file(backend_env_path)
root_keys = parse_env_file(root_env_path)

def mask_key(val: str) -> str:
    if not val:
        return "(empty)"
    if len(val) <= 6:
        return "****"
    return val[:4] + "****" + val[-2:]

print("\n--- Keys in root .env (Masked) ---")
for pk in ["GEMINI_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY"]:
    v = root_keys.get(pk, "")
    print(f"  {pk}: {'Configured -> ' + mask_key(v) + f' (length: {len(v)})' if v else 'NOT CONFIGURED'}")

print("\n--- Keys in backend .env (Masked) ---")
for pk in ["GEMINI_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY"]:
    v = backend_keys.get(pk, "")
    print(f"  {pk}: {'Configured -> ' + mask_key(v) + f' (length: {len(v)})' if v else 'NOT CONFIGURED'}")

# If root has keys not in backend, copy them into backend/.env
to_sync = {}
for pk in ["GEMINI_API_KEY", "GROQ_API_KEY", "OPENAI_API_KEY", "GEMINI_MODEL", "GROQ_MODEL", "OPENAI_MODEL"]:
    if root_keys.get(pk) and not backend_keys.get(pk):
        to_sync[pk] = root_keys[pk]

if to_sync:
    print(f"\nSyncing {len(to_sync)} keys from root .env to backend/.env...")
    with open(backend_env_path, "a", encoding="utf-8") as f:
        f.write("\n# LLM API Keys synced from root .env\n")
        for k, v in to_sync.items():
            f.write(f"{k}={v}\n")
    print("Sync complete.")
