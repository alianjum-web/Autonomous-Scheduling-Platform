import json
from pathlib import Path

import pytest

from app.core.feature_flags import FeatureFlagsStore, reload_feature_flags


@pytest.fixture
def flags_file(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    path = tmp_path / "feature-flags.json"
    path.write_text(
        json.dumps(
            {
                "version": 1,
                "hot_reload": True,
                "features": {
                    "ai": {
                        "chat_provider": "ollama",
                        "embedding_provider": "gemini",
                    }
                },
                "providers": {
                    "ollama": {"enabled": True, "chat_model": "llama3.2"},
                    "gemini": {"enabled": True, "chat_model": "gemini-2.0-flash"},
                },
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setenv("FEATURE_FLAGS_PATH", str(path))
    from app.core import config

    config.get_settings.cache_clear()
    return path


def test_feature_flags_load_and_hot_reload(flags_file: Path):
    store = FeatureFlagsStore()
    store._path = flags_file

    doc = store.get()
    assert doc.features.ai.chat_provider == "ollama"
    assert doc.features.ai.embedding_provider == "gemini"

    payload = json.loads(flags_file.read_text(encoding="utf-8"))
    payload["features"]["ai"]["chat_provider"] = "openai"
    flags_file.write_text(json.dumps(payload), encoding="utf-8")

    reloaded = store.get()
    assert reloaded.features.ai.chat_provider == "openai"


def test_reload_feature_flags_helper(flags_file: Path):
    reload_feature_flags()
    doc = reload_feature_flags()
    assert doc.features.ai.chat_provider == "ollama"
