"""Validate backend/supabase/migrations layout and critical schema invariants."""

from __future__ import annotations

import re
from pathlib import Path

MIGRATIONS_DIR = Path(__file__).resolve().parents[1] / "supabase" / "migrations"
MIGRATION_PATTERN = re.compile(r"^[a-z0-9_]+\.sql$")
TIMESTAMP_PREFIX = re.compile(r"^[0-9]{14}_")


def _migration_path(name: str) -> Path:
    stem = name.removesuffix(".sql")
    matches = sorted(MIGRATIONS_DIR.glob(f"*_{stem}.sql"))
    assert len(matches) == 1, f"expected one migration matching *_{stem}.sql, found {len(matches)}"
    return matches[0]


def test_migrations_directory_exists():
    assert MIGRATIONS_DIR.is_dir()


def test_migration_filenames_use_supabase_timestamp_pattern():
    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    assert files, "expected at least one migration file"

    timestamps: list[str] = []
    for path in files:
        name = path.name
        assert TIMESTAMP_PREFIX.match(name), f"invalid migration filename: {name}"
        suffix = name[15:]
        assert MIGRATION_PATTERN.match(suffix), f"invalid migration suffix: {suffix}"
        timestamps.append(name[:14])

    assert timestamps == sorted(timestamps), "migration timestamps must be lexicographically ordered"
    assert len(timestamps) == len(set(timestamps)), "duplicate migration timestamps"


def test_no_legacy_root_supabase_directory():
    repo_root = Path(__file__).resolve().parents[2]
    assert not (repo_root / "supabase").exists(), "legacy root supabase/ must not exist"


def test_audit_migration_defines_triggers_and_append_only():
    migration_004 = _migration_path("production_hardening").read_text()
    migration_007 = _migration_path("phi_security_controls").read_text()

    assert "CREATE TABLE audit_logs" in migration_004
    assert "audit_patient_sessions" in migration_004
    assert "audit_appointments" in migration_004
    assert "audit_logs_no_update" in migration_007
    assert "audit_logs_no_delete" in migration_007
