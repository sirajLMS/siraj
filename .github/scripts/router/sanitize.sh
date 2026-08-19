#!/usr/bin/env bash
# ==============================================================================
# Unsupported Parameter Extractor, OmniRoute-Aligned Normalizer & Error Classifier
# ==============================================================================

# Extract unsupported parameter name(s) from upstream error text
extract_unsupported_params() {
    local error_text="$1"
    local params=""

    # Pattern 1: Unsupported parameter(s): `param` or 'param' or "param"
    params=$(echo "$error_text" | grep -oEi "Unsupported parameter(\(s\))?:?[[:space:]]*['\`\"][a-zA-Z0-9_.-]+['\`\"]" | grep -oEi "['\`\"][a-zA-Z0-9_.-]+['\`\"]" | tr -d "'\`\"" | sort -u || true)

    # Pattern 2: Unrecognized field 'param' or unknown parameter 'param'
    if [ -z "$params" ]; then
        params=$(echo "$error_text" | grep -oEi "(unrecognized|unknown|invalid|unexpected) (field|parameter|property|input)[[:space:]]*['\`\"][a-zA-Z0-9_.-]+['\`\"]" | grep -oEi "['\`\"][a-zA-Z0-9_.-]+['\`\"]" | tr -d "'\`\"" | sort -u || true)
    fi

    # Pattern 3: Extra inputs are not permitted [type=extra_forbidden, input_value=..., input_type=...]
    if [ -z "$params" ]; then
        params=$(echo "$error_text" | grep -oEi "input_value=[^, ]+" | cut -d= -f2 | tr -d "'\`\"" || true)
    fi

    echo "$params"
}

# Remove unsupported parameter(s) from JSON payload file
strip_param_from_json() {
    local body_file="$1"
    local param="$2"

    if [ -z "$param" ] || [ ! -s "$body_file" ] || ! command -v jq >/dev/null 2>&1; then
        return 1
    fi

    local tmp_out
    tmp_out=$(mktemp)

    if jq --arg p "$param" 'del(.[$p])' "$body_file" > "$tmp_out" 2>/dev/null; then
        if [ -s "$tmp_out" ]; then
            mv "$tmp_out" "$body_file"
            echo "[Sanitize] Stripped unsupported parameter '$param' from request payload." >&2
            return 0
        fi
    fi

    rm -f "$tmp_out"
    return 1
}

# Pre-normalize request parameters for NVIDIA NIM compatibility (Aligned with OmniRoute open-sse/translator/paramSupport.ts)
normalize_openai_payload() {
    local body_file="$1"

    if [ ! -s "$body_file" ] || ! command -v jq >/dev/null 2>&1; then
        return 0
    fi

    local tmp_out
    tmp_out=$(mktemp)

    # Apply OmniRoute rules:
    # 0. Strip leading "nvidia/" prefix if client uses OpenRouter naming style (e.g. "nvidia/z-ai/glm-5.2" -> "z-ai/glm-5.2")
    # 1. Map max_completion_tokens (OpenAI o1/o3) -> max_tokens
    # 2. Strip prompt_cache_key (Codex CLI / Cline / Cursor injects this; NVIDIA NIM 400s on it)
    # 3. Strip reasoning / thinking / reasoning_effort fields
    # 4. Strip snippy
    # 5. Clamp max_tokens for GLM-5.2 down to 16,000 output ceiling if exceeded
    if jq '
      # 0. Normalize model name if using OpenRouter vendor prefix (e.g. "nvidia/z-ai/glm-5.2" -> "z-ai/glm-5.2")
      (if (.model != null and (.model | test("^nvidia/[^/]+/[^/]+"))) then
        .model = (.model | sub("^nvidia/"; ""))
      else
        .
      end)
      # 1. Map max_completion_tokens -> max_tokens
      | if (.max_completion_tokens != null and .max_tokens == null) then
        .max_tokens = .max_completion_tokens | del(.max_completion_tokens)
      else
        .
      end
      # 2. Strip prompt_cache_key (#7617)
      | del(.prompt_cache_key)
      # 3. Strip thinking / reasoning / reasoning_effort (#6102, #2023, #2268)
      | if (.model // "" | test("glm-5\\.2|minimax"; "i")) then
          del(.reasoning, .thinking, .reasoning_effort)
        else
          .
        end
      # 4. Strip custom client params
      | del(.snippy)
      # 5. Clamp max_tokens for GLM-5.2 to 1000 (latency cap: keeps generation <25s within curl timeout)
      | if (.model // "" | test("glm-5\\.2"; "i")) and (.max_tokens == null or .max_tokens > 1000) then
          .max_tokens = 1000
        else
          .
        end
    ' "$body_file" > "$tmp_out" 2>/dev/null; then
        if [ -s "$tmp_out" ]; then
            mv "$tmp_out" "$body_file"
            return 0
        fi
    fi

    rm -f "$tmp_out"
}

# Ensure error responses sent to client are valid standard OpenAI JSON
format_openai_error_json() {
    local message="$1"
    local type="${2:-invalid_request_error}"
    local code="${3:-400}"
    local param="${4:-null}"

    if command -v jq >/dev/null 2>&1; then
        jq -n \
            --arg msg "$message" \
            --arg typ "$type" \
            --arg cod "$code" \
            --arg prm "$param" \
            '{error: {message: $msg, type: $typ, param: (if $prm == "null" then null else $prm end), code: $cod}}'
    else
        printf '{"error":{"message":"%s","type":"%s","param":null,"code":"%s"}}' "$message" "$type" "$code"
    fi
}

# Classify error string / response to decide routing strategy (Aligned with OmniRoute accountFallback & #8248)
classify_openai_error() {
    local error_text="$1"
    local status_code="$2"

    # 1. Transient NVIDIA DEGRADED Function State (#8248) -> Retry next key
    if echo "$error_text" | grep -qEi "(submitted for inference is DEGRADED|DEGRADED function cannot be invoked)"; then
        echo "gateway_error"
        return 0
    fi

    # 2. Quota Exhausted / Insufficient Balance -> Dead Key (24h lockout)
    if echo "$error_text" | grep -qEi "(insufficient_quota|quota_exceeded|credit_expired|exceeded your current quota|billing details)"; then
        echo "quota_exhausted"
        return 0
    fi

    # 3. Invalid / Revoked Auth Key -> Dead Key (24h lockout)
    if [ "$status_code" = "401" ] || [ "$status_code" = "403" ] || echo "$error_text" | grep -qEi "(invalid api key|incorrect api key|authorization failed|invalid_api_key)"; then
        echo "auth_failed"
        return 0
    fi

    # 4. Model Not Found / EOL -> Pass-through 404
    if [ "$status_code" = "404" ] || [ "$status_code" = "410" ] || echo "$error_text" | grep -qEi "(model_not_found|does not exist|404 page not found|has reached its end of life)"; then
        echo "model_not_found"
        return 0
    fi

    # 5. Context Window Exceeded -> Pass-through 400
    if echo "$error_text" | grep -qEi "(context_length_exceeded|maximum context length|too many tokens)"; then
        echo "context_length_exceeded"
        return 0
    fi

    # 6. Unsupported parameter -> Strip & retry
    if echo "$error_text" | grep -qEi "(unsupported parameter|unrecognized field|extra inputs are not permitted)"; then
        echo "unsupported_param"
        return 0
    fi

    # 7. Rate Limit (429) -> 60s cooldown
    if [ "$status_code" = "429" ] || echo "$error_text" | grep -qEi "(rate_limit_exceeded|too many requests|tokens per minute|requests per minute)"; then
        echo "rate_limit"
        return 0
    fi

    # 8. Gateway / Server Hiccup -> 10s cooldown
    if [ "$status_code" = "500" ] || [ "$status_code" = "502" ] || [ "$status_code" = "503" ] || [ "$status_code" = "504" ] || [ "$status_code" = "000" ] || echo "$error_text" | grep -qEi "(bad gateway|service unavailable|gateway timeout|overloaded|fetch failed)"; then
        echo "gateway_error"
        return 0
    fi

    echo "unknown"
}
