from pathlib import Path

from dotenv import load_dotenv


REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = Path(__file__).resolve().parents[1]


def load_environment() -> None:
    """Load local files without replacing variables set by the process.

    Production uses the root `.env` as the single EnvironmentFile for systemd.
    Developers may keep `backend/.env` for backend-only local values.
    """

    load_dotenv(BACKEND_ROOT / ".env", override=False)
    load_dotenv(REPO_ROOT / ".env", override=False)
