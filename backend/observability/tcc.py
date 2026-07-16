"""
Thin, gracefully-degrading wrapper around The Context Company (TCC) SDK.

All public helpers return no-op sentinels when:
  - the ``contextcompany`` package is not installed, or
  - ``TCC_API_KEY`` is absent from the environment, or
  - any TCC call raises unexpectedly.

This means ``agents/base.py`` can call these helpers unconditionally — if TCC
is unavailable the agent still completes normally and a single warning is logged.
"""

from __future__ import annotations

import contextvars
import json
import logging
import os
from typing import Any

_log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# ContextVar — set by routes.py before each orchestrator.run() call.
# Propagates automatically into asyncio.gather() branches.
# ---------------------------------------------------------------------------

current_user_id: contextvars.ContextVar[str | None] = contextvars.ContextVar(
    "tcc_current_user_id", default=None
)

# ---------------------------------------------------------------------------
# Lazy SDK import — try once, fall back to no-ops on failure.
# ---------------------------------------------------------------------------

_tcc: Any = None
_tcc_import_attempted = False
_warned_no_key = False


def _get_tcc() -> Any | None:
    """Return the ``contextcompany`` module, or ``None`` if unavailable."""
    global _tcc, _tcc_import_attempted, _warned_no_key

    if _tcc_import_attempted:
        return _tcc

    _tcc_import_attempted = True
    try:
        import contextcompany as _sdk  # noqa: PLC0415

        if not os.environ.get("TCC_API_KEY"):
            if not _warned_no_key:
                _warned_no_key = True
                _log.warning(
                    "TCC_API_KEY is not set — TCC tracing is disabled. "
                    "Set TCC_API_KEY to enable observability."
                )
            return None

        _tcc = _sdk
    except ImportError:
        _log.warning(
            "contextcompany package not installed — TCC tracing is disabled. "
            "Run: pip install contextcompany"
        )

    return _tcc


# ---------------------------------------------------------------------------
# No-op sentinel objects so call sites never need to guard on None.
# ---------------------------------------------------------------------------


class _NoOpStep:
    def prompt(self, text: str) -> _NoOpStep:
        return self

    def response(self, text: str) -> _NoOpStep:
        return self

    def model(self, **kwargs: Any) -> _NoOpStep:
        return self

    def tokens(self, **kwargs: Any) -> _NoOpStep:
        return self

    def end(self) -> None:
        pass

    def error(self, status_message: str = "") -> None:
        pass


class _NoOpToolCall:
    def args(self, a: dict) -> _NoOpToolCall:
        return self

    def result(self, r: Any) -> _NoOpToolCall:
        return self

    def end(self) -> None:
        pass

    def error(self, msg: str = "") -> None:
        pass


class _NoOpRun:
    """Returned when TCC is disabled so call sites stay unconditional."""

    def prompt(self, text: str) -> _NoOpRun:
        return self

    def response(self, text: str) -> _NoOpRun:
        return self

    def metadata(self, *args: Any, **kwargs: Any) -> _NoOpRun:
        return self

    def end(self) -> None:
        pass

    def error(self, status_message: str = "") -> None:
        pass

    def step(self) -> _NoOpStep:
        return _NoOpStep()

    def tool_call(self, name: str) -> _NoOpToolCall:
        return _NoOpToolCall()


_NOOP_RUN = _NoOpRun()
_NOOP_STEP = _NoOpStep()
_NOOP_TOOL_CALL = _NoOpToolCall()


class _Safe:
    """Proxy that makes every method call on a real TCC object non-fatal.

    Creation of runs/steps/tool_calls is guarded in the helpers below, but the
    subsequent method calls (``.prompt()``, ``.end()``, ``.tokens()`` …) happen
    on the returned objects inside the agent loop — this proxy guards those so
    a TCC-side failure (e.g. a network error during export) can never fail the
    agent turn.
    """

    def __init__(self, inner: Any):
        self._inner = inner

    def __getattr__(self, name: str) -> Any:
        def _call(*args: Any, **kwargs: Any) -> Any:
            try:
                result = getattr(self._inner, name)(*args, **kwargs)
            except Exception as exc:
                _log.warning("TCC .%s() failed: %s", name, exc)
                if name == "step":
                    return _NOOP_STEP
                if name == "tool_call":
                    return _NOOP_TOOL_CALL
                return self
            # step()/tool_call() hand back new real SDK objects — wrap them too.
            if name in ("step", "tool_call"):
                return _Safe(result)
            return self

        return _call


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------


def start_run(workflow_id: str) -> Any:
    """
    Start a TCC run scoped to *workflow_id* as the session.

    Returns either a real ``tcc.run()`` object or a ``_NoOpRun`` sentinel.
    Call ``.prompt()``, ``.response()``, ``.metadata()``, then ``.end()`` or
    ``.error()`` on the returned object.
    """
    sdk = _get_tcc()
    if sdk is None:
        return _NoOpRun()
    try:
        return _Safe(sdk.run(session_id=workflow_id))
    except Exception as exc:
        _log.warning("TCC start_run failed (workflow_id=%s): %s", workflow_id, exc)
        return _NoOpRun()


def start_step(run: Any) -> Any:
    """
    Start a TCC step on *run*.

    Returns either a real step object or a ``_NoOpStep`` sentinel.
    """
    sdk = _get_tcc()
    if sdk is None or isinstance(run, _NoOpRun):
        return _NoOpStep()
    try:
        return run.step()
    except Exception as exc:
        _log.warning("TCC start_step failed: %s", exc)
        return _NoOpStep()


def start_tool_call(run: Any, tool_name: str) -> Any:
    """
    Record a TCC tool_call on *run*.

    Returns either a real tool_call object or a ``_NoOpToolCall`` sentinel.
    """
    sdk = _get_tcc()
    if sdk is None or isinstance(run, _NoOpRun):
        return _NoOpToolCall()
    try:
        return run.tool_call(tool_name)
    except Exception as exc:
        _log.warning("TCC start_tool_call failed (tool=%s): %s", tool_name, exc)
        return _NoOpToolCall()


def messages_to_prompt(messages: list[dict]) -> str:
    """
    Serialize the outgoing LLM messages list into a readable prompt string for
    TCC step recording. Uses the last user/tool message when available; falls
    back to a compact JSON dump.
    """
    # Find the last non-system message to use as the representative prompt.
    for msg in reversed(messages):
        role = msg.get("role", "")
        if role in ("user", "tool"):
            content = msg.get("content", "")
            if content and isinstance(content, str):
                return content[:2000]  # cap at 2 000 chars
    # Fallback: compact JSON of all messages (truncated)
    try:
        return json.dumps(messages, ensure_ascii=False)[:2000]
    except Exception:
        return str(messages)[:2000]
