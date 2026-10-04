// ── CLI Output Colors ───────────────────────────────────────────────────────

export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";
export const GREEN = "\x1b[32m";
export const YELLOW = "\x1b[33m";
export const CYAN = "\x1b[36m";
export const RED = "\x1b[31m";
export const GRAY = "\x1b[90m";

// ── ngrok Install Hints ─────────────────────────────────────────────────────

export const NGROK_INSTALL_HINT_LINUX =
  "  Linux (apt): curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo 'deb https://ngrok-agent.s3.amazonaws.com buster main' | sudo tee /etc/apt/sources.list.d/ngrok.list && sudo apt update && sudo apt install ngrok";
export const NGROK_INSTALL_HINT_MACOS = "  macOS:       brew install ngrok";
export const NGROK_INSTALL_HINT_URL = "  Or visit:    https://ngrok.com/download\n";
