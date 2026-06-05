"""Backward-compatible shim — prefer app.core.logging for new code."""

from app.core.logging import configure_logging as setup_logging
from app.core.logging import get_logger

__all__ = ["setup_logging", "get_logger"]
