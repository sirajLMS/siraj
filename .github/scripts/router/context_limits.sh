#!/usr/bin/env bash
# ==============================================================================
# Model Context Limits & Token Guardrails
# ==============================================================================

# Context specs (Max Input Tokens, Max Output Tokens, Combined Window)
# nvidia/z-ai/glm-5.2: 186,365 input + 16,000 output = 202,365 combined
get_model_max_input() {
    local model="$1"
    case "$model" in
        *glm-5.2*|*glm-5*)
            echo 186365
            ;;
        *llama-3.3-70b*|*llama-3.1-*)
            echo 128000
            ;;
        *mistral-large*|*mixtral*)
            echo 128000
            ;;
        *deepseek-r1*|*deepseek-v3*)
            echo 64000
            ;;
        *)
            echo 128000 # default safety window
            ;;
    esac
}

get_model_max_output() {
    local model="$1"
    case "$model" in
        *glm-5.2*|*glm-5*)
            echo 16000
            ;;
        *llama-3.3-70b*|*llama-3.1-*)
            echo 8192
            ;;
        *)
            echo 4096
            ;;
    esac
}

# Estimate tokens (approx. 3.8 chars per token for code/diffs)
estimate_tokens() {
    local char_count="$1"
    echo $(( (char_count * 10) / 38 ))
}

# Validate request payload against model context window
validate_context_window() {
    local model="$1"
    local body_file="$2"

    local max_input
    max_input=$(get_model_max_input "$model")
    local body_size
    body_size=$(wc -c < "$body_file" 2>/dev/null || echo 0)
    local estimated_input_tokens
    estimated_input_tokens=$(estimate_tokens "$body_size")

    if [ "$estimated_input_tokens" -gt "$max_input" ]; then
        echo "{\"valid\":false,\"error\":{\"message\":\"This model's maximum context length is $max_input tokens. However, your request resulted in ~$estimated_input_tokens tokens.\",\"type\":\"context_length_exceeded\",\"param\":\"messages\",\"code\":\"context_length_exceeded\"}}"
        return 0
    fi

    echo "{\"valid\":true,\"estimated_tokens\":$estimated_input_tokens,\"max_input\":$max_input}"
    return 0
}
