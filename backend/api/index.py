import sys
from pathlib import Path

# Ensure the backend directory is in sys.path for Vercel Serverless Function resolution
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.main import app
