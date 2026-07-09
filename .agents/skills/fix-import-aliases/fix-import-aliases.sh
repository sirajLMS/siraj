#!/usr/bin/env bash

# Fix Import Aliases Script - Parallel Subagent Version
# Dispatches parallel subagents to fix imports in different directories

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

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

# Check sed
if sed --version 2>/dev/null | head -1 | grep -q GNU; then
    SED_INPLACE=(-i)
else
    SED_INPLACE=(-i '')
fi

# Find and fix files
find "$dir" -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "index.ts" | while IFS= read -r file; do
    if ! grep -qE "from ['\"]\.\.?/" "$file" && ! grep -qE "import\(['\"]\.\.?/" "$file"; then
        continue
    fi
    
    echo "  Processing: ${file#$PROJECT_ROOT/}"
    
    sed "${SED_INPLACE[@]}" \
        -e "s|from ['\"]\./|from '${alias_prefix}/|g" \
        -e "s|from ['\"]\.\./|from '${alias_prefix}/|g" \
        -e "s|import(['\"])\./|import('${alias_prefix}/|g" \
        -e "s|import(['\"])\.\./|import('${alias_prefix}/|g" \
        "$file"
done

echo "Done: $name"
SUBCRIPT
    chmod +x "$temp_script"
    
    # Run in background
    "$temp_script" "$dir" "$alias_prefix" &
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
