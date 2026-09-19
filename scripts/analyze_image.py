#!/usr/bin/env python3
"""Analyze image(s) with a local vision-LLM endpoint — first successful model wins.

Queries an OpenAI-compatible endpoint (default: local server on :20128) with several
image-capable models IN PARALLEL and prints the answer of the FIRST model that returns
a working (non-error, non-empty) response. Failed models are logged to stderr and the
remaining ones keep racing; if every model fails, all are retried up to --retries rounds.

Usage:
    python3 scripts/analyze_image.py scratch/screenshots/page.png
    python3 scripts/analyze_image.py a.png b.png -p "Is the text clipped?"
    python3 scripts/analyze_image.py shot.png --json          # machine-readable result
    python3 scripts/analyze_image.py shot.png --models m1,m2 # override model list

Auth: the endpoint works without a key, but if scripts/.image-analysis-key exists
beside this script (git-ignored) it is sent as `Authorization: Bearer <key>`.
"""

from __future__ import annotations

import argparse
import base64
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

import requests

DEFAULT_ENDPOINT = "http://localhost:20128/v1"
DEFAULT_MODELS = [
    "nvidia/z-ai/glm-5.3-flash",
    "nvidia/nvidia/ising-calibration-1-35b-a3b",
    "nvidia/google/diffusiongemma-26b-a4b-it",
]
KEY_FILE = Path(__file__).resolve().parent / ".image-analysis-key"
DEFAULT_TIMEOUT = 600  # seconds per HTTP request (local vision models can take minutes under load)
DEFAULT_RETRIES = 2  # rounds of "race all models" before giving up
DEFAULT_MAX_TOKENS = 8192  # reasoning models spend thousands of tokens thinking before answering

MIME_BY_SUFFIX = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
}

DEFAULT_SYSTEM_PROMPT = (
    "You are a meticulous UI visual inspector. You are given a screenshot of a web "
    "application and must report exactly what is visible in the pixels — never assume "
    "or invent details that are not clearly rendered."
)

DEFAULT_PROMPT = (
    "Analyze this UI screenshot. First describe precisely what you see (component type, "
    "label text, values shown, layout direction). Then report any styling issues you can "
    "observe, in particular: text that is cut off / clipped / truncated at an edge, "
    "overlapping elements, misalignment, broken borders or outlines, illegible text, and "
    "anything that looks visually broken. For each issue state WHERE it is and WHAT is "
    "wrong. If everything renders correctly, say so explicitly."
)


def log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def read_key() -> str | None:
    try:
        return KEY_FILE.read_text(encoding="utf-8").strip() or None
    except OSError:
        return None


def encode_image(path: Path) -> str:
    suffix = path.suffix.lower()
    mime = MIME_BY_SUFFIX.get(suffix)
    if mime is None:
        raise ValueError(f"Unsupported image type '{suffix}' for {path}")
    data = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{data}"


def build_payload(images: list[Path], prompt: str, system_prompt: str, max_tokens: int) -> dict[str, Any]:
    content: list[dict[str, Any]] = [{"type": "text", "text": prompt}]
    for image in images:
        content.append({"type": "image_url", "image_url": {"url": encode_image(image)}})
    # NOTE: no `temperature` — several models on this endpoint reject/ignore it
    # ("capabilities.temperature: false"), and it caused spurious failures.
    return {
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": content},
        ],
        "max_tokens": max_tokens,
    }


class ModelError(RuntimeError):
    """A model answered but the answer is unusable (HTTP error, error body, empty content)."""


def call_model(
    model: str,
    endpoint: str,
    headers: dict[str, str],
    payload: dict[str, Any],
    timeout: float,
) -> str:
    url = f"{endpoint.rstrip('/')}/chat/completions"
    try:
        response = requests.post(
            url, headers={**headers, "Content-Type": "application/json"}, data=json.dumps({"model": model, **payload}), timeout=timeout
        )
    except requests.RequestException as exc:
        raise ModelError(f"request failed: {exc}") from exc

    if response.status_code != 200:
        # Keep only the first 300 chars of the body — error pages can be huge.
        snippet = response.text.strip().replace("\n", " ")[:300]
        raise ModelError(f"HTTP {response.status_code}: {snippet}")

    try:
        data = response.json()
    except ValueError as exc:
        raise ModelError(f"non-JSON response: {response.text[:200]!r}") from exc

    if isinstance(data, dict) and data.get("error"):
        raise ModelError(f"endpoint error: {json.dumps(data['error'])[:300]}")

    try:
        choice = data["choices"][0]
    except (KeyError, IndexError, TypeError) as exc:
        raise ModelError(f"unexpected response shape: {json.dumps(data)[:300]}") from exc

    message = choice.get("message") or {}
    content = message.get("content")
    reasoning = message.get("reasoning_content")

    if isinstance(content, list):  # some backends return content-part arrays
        content = "".join(part.get("text", "") for part in content if isinstance(part, dict))

    if isinstance(content, str) and content.strip():
        return content.strip()

    if choice.get("finish_reason") == "length":
        # Reasoning models can spend the whole budget thinking (content stays null).
        raise ModelError("hit max_tokens before producing an answer — increase --max-tokens")
    if isinstance(reasoning, str) and reasoning.strip():
        raise ModelError("model returned only reasoning_content, no final answer")
    raise ModelError("model returned empty content")


def race_models(
    models: list[str],
    endpoint: str,
    headers: dict[str, str],
    payload: dict[str, Any],
    timeout: float,
) -> tuple[str, str]:
    """Run all models concurrently; return (model, content) of the first success."""
    with ThreadPoolExecutor(max_workers=max(1, len(models))) as executor:
        futures = {executor.submit(call_model, m, endpoint, headers, payload, timeout): m for m in models}
        try:
            for future in as_completed(futures):
                model = futures[future]
                try:
                    content = future.result()
                except ModelError as exc:
                    log(f"[analyze_image] {model}: FAILED ({exc})")
                    continue
                for pending in futures:  # not as_completed — cancel every not-yet-done future
                    pending.cancel()
                return model, content
        finally:
            for pending in futures:
                pending.cancel()
    raise ModelError("all models failed this round")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("images", nargs="+", type=Path, help="image file(s) to analyze")
    parser.add_argument("-p", "--prompt", default=DEFAULT_PROMPT, help="question/instruction sent with the image(s)")
    parser.add_argument("--system", default=DEFAULT_SYSTEM_PROMPT, help="system prompt override")
    parser.add_argument("--endpoint", default=DEFAULT_ENDPOINT, help=f"OpenAI-compatible base URL (default: {DEFAULT_ENDPOINT})")
    parser.add_argument("--models", default=None, help=f"comma-separated model list (default: {','.join(DEFAULT_MODELS)})")
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT, help=f"per-request timeout in seconds (default: {DEFAULT_TIMEOUT})")
    parser.add_argument("--max-tokens", type=int, default=DEFAULT_MAX_TOKENS, help=f"completion token budget (default: {DEFAULT_MAX_TOKENS}; reasoning models need a lot)")
    parser.add_argument("--retries", type=int, default=DEFAULT_RETRIES, help=f"rounds when all models fail (default: {DEFAULT_RETRIES})")
    parser.add_argument("--json", action="store_true", help="print result as JSON instead of plain text")
    args = parser.parse_args()

    for image in args.images:
        if not image.is_file():
            log(f"[analyze_image] no such file: {image}")
            return 2

    models = [m.strip() for m in (args.models.split(",") if args.models else DEFAULT_MODELS) if m.strip()]
    if not models:
        log("[analyze_image] empty model list")
        return 2

    headers: dict[str, str] = {}
    key = read_key()
    if key:
        headers["Authorization"] = f"Bearer {key}"

    try:
        payload = build_payload(args.images, args.prompt, args.system, args.max_tokens)
    except (OSError, ValueError) as exc:
        log(f"[analyze_image] {exc}")
        return 2

    started = time.monotonic()
    last_error = "no attempt made"
    for round_no in range(1, args.retries + 1):
        # Each retry round gets a progressively longer per-request timeout — under
        # concurrent load the local models can blow past a fixed timeout together.
        round_timeout = args.timeout * round_no
        try:
            model, content = race_models(models, args.endpoint, headers, payload, round_timeout)
        except ModelError as exc:
            last_error = str(exc)
            log(f"[analyze_image] round {round_no}/{args.retries}: {last_error}")
            if round_no < args.retries:
                time.sleep(2 * round_no)  # brief backoff before re-racing all models
            continue
        elapsed = time.monotonic() - started
        if args.json:
            print(json.dumps({"model": model, "elapsed_seconds": round(elapsed, 1), "prompt": args.prompt, "content": content}, ensure_ascii=False))
        else:
            print(content)
            log(f"[analyze_image] answered by: {model} ({elapsed:.1f}s)")
        return 0

    log(f"[analyze_image] all models failed after {args.retries} round(s): {last_error}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
