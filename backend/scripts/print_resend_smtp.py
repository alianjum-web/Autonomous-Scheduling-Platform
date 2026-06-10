#!/usr/bin/env python3
"""Print Resend SMTP values for Supabase dashboard (reads active backend env file, no deps)."""

from __future__ import annotations

import os
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.core.env_files import resolve_env_file_path  # noqa: E402

DEFAULTS = {
    "RESEND_FROM_NAME": "Autonomous Scheduling Platform",
    "RESEND_SMTP_HOST": "smtp.resend.com",
    "RESEND_SMTP_PORT": "465",
    "RESEND_SMTP_USERNAME": "resend",
    "RESEND_MIN_INTERVAL_SECONDS": "60",
}


def load_env_file(path: Path) -> dict[str, str]:
    if not path.is_file():
        return {}
    values: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def getenv(key: str, file_values: dict[str, str]) -> str:
    return os.environ.get(key) or file_values.get(key) or DEFAULTS.get(key, "")


def main() -> None:
    env_path = resolve_env_file_path()
    if override := os.environ.get("ENV_FILE"):
        env_path = Path(override)
        if not env_path.is_absolute():
            env_path = BACKEND_ROOT / env_path

    file_values = load_env_file(env_path)

    api_key = getenv("RESEND_API_KEY", file_values)
    from_email = getenv("RESEND_FROM_EMAIL", file_values)
    from_name = getenv("RESEND_FROM_NAME", file_values)
    host = getenv("RESEND_SMTP_HOST", file_values)
    port = getenv("RESEND_SMTP_PORT", file_values)
    username = getenv("RESEND_SMTP_USERNAME", file_values)
    min_interval = getenv("RESEND_MIN_INTERVAL_SECONDS", file_values)

    print("Resend → Supabase SMTP configuration")
    print("=" * 40)
    print(f"Env file:               {env_path}")
    print("Enable custom SMTP:     ON")
    print(f"Sender email:           {from_email or '(set RESEND_FROM_EMAIL)'}")
    print(f"Sender name:            {from_name}")
    print(f"Host:                   {host}")
    print(f"Port:                   {port}")
    print(f"Username:               {username}")
    print(f"Password:               {api_key or '(set RESEND_API_KEY)'}")
    print(f"Min interval per user:  {min_interval}s")
    print()
    if not api_key or not from_email:
        print(f"⚠ Missing RESEND_API_KEY or RESEND_FROM_EMAIL in {env_path.name}")
        sys.exit(1)
    print("Copy the values above into:")
    print("Supabase → Authentication → Emails → SMTP Settings")


if __name__ == "__main__":
    main()
