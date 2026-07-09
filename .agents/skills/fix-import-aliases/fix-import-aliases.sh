#!/usr/bin/env bash

# Fix Import Aliases Script - Parallel Subagent Version
# Dispatches parallel subagents to fix imports in different directories

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PERL_SCRIPT="$SCRIPT_DIR/fix-import-aliases.pl"

echo "=== Fix Import Aliases (Parallel Subagents) ==="
echo "Project root: $PROJECT_ROOT"
echo ""

# Function to launch a subagent for fixing imports in a directory
launch_subagent() {
    local dir="$1"
    local alias_prefix="$2"
    local name="$3"
    
    echo "Launching subagent for: $name ($dir -> $alias_prefix)"
    
    # Create a temporary script for the subagent
    local temp_script="/tmp/fix-imports-${name//\//-}.sh"
    cat > "$temp_script" << 'SUBCRIPT'
#!/usr/bin/env bash
set -euo pipefail

dir="$1"
alias_prefix="$2"
PROJECT_ROOT="$3"
PERL_SCRIPT="$4"

# Find and fix files
find "$dir" -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "index.ts" | while IFS= read -r file; do
    # Skip if no relative imports
    if ! grep -qE "from ['\"]\.\.?/" "$file" && ! grep -qE "import\(['\"]\.\.?/" "$file" && ! grep -qE "^\s*['\"]\.\.?/" "$file"; then
        continue
    fi
    
    echo "  Processing: ${file#$PROJECT_ROOT/}"
    
    # Use perl script for multiline regex support
    ALIAS_PREFIX="$alias_prefix" perl "$PERL_SCRIPT" < "$file" > "$file.tmp" && mv "$file.tmp" "$file"
done

echo "Done: $name"
SUBCRIPT
    chmod +x "$temp_script"
    
    # Run in background with PROJECT_ROOT exported
    PROJECT_ROOT="$PROJECT_ROOT" PERL_SCRIPT="$PERL_SCRIPT" "$temp_script" "$dir" "$alias_prefix" "$PROJECT_ROOT" "$PERL_SCRIPT" &
    echo $!
}

# Main menu
echo "Select scope to fix:"
echo "  1) Frontend only (frontend/**/*.ts,tsx)"
echo "  2) Backend only (backend/**/*.ts,tsx)"
echo "  3) Both frontend and backend"
echo "  4) Custom path (glob pattern)"
echo "  5) All TypeScript files (app, backend, frontend, shared, test, scripts)"
echo ""
read -p "Enter choice (1-5): " choice

PIDS=()

case $choice in
    1)
        launch_subagent "$PROJECT_ROOT/frontend" "@/frontend" "frontend"
        ;;
    2)
        launch_subagent "$PROJECT_ROOT/backend" "@/backend" "backend"
        ;;
    3)
        launch_subagent "$PROJECT_ROOT/frontend" "@/frontend" "frontend"
        launch_subagent "$PROJECT_ROOT/backend" "@/backend" "backend"
        ;;
    4)
        read -p "Enter custom glob pattern (e.g., 'shared/**/*.ts'): " custom_path
        read -p "Enter @/ alias prefix (e.g., '@/shared'): " alias_prefix
        launch_subagent "$PROJECT_ROOT/$custom_path" "$alias_prefix" "custom"
        ;;
    5)
        launch_subagent "$PROJECT_ROOT/app" "@/app" "app"
        launch_subagent "$PROJECT_ROOT/backend" "@/backend" "backend"
        launch_subagent "$PROJECT_ROOT/frontend" "@/frontend" "frontend"
        launch_subagent "$PROJECT_ROOT/shared" "@/shared" "shared"
        launch_subagent "$PROJECT_ROOT/test" "@/test" "test"
        launch_subagent "$PROJECT_ROOT/scripts" "@/scripts" "scripts"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

# Wait for all background jobs
echo ""
echo "Waiting for all subagents to complete..."
wait

echo ""
echo "=== Done ==="
echo "Run 'bun tsgo' to type-check, then 'bun biome:check' to format."
