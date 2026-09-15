import subprocess
import re
from collections import defaultdict
from pathlib import Path

def run_command(cmd, cwd):
    print(f"Running {cmd}...")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
    # Combine stdout and stderr since bun often logs to stderr or stdout
    return result.stdout + "\n" + result.stderr

def generate_task_list():
    project_root = Path(__file__).resolve().parents[2]
    cwd = str(project_root)
    lint_out = run_command("bun run lint", cwd)
    tsgo_out = run_command("bun run tsgo", cwd)

    tasks = defaultdict(list)
    root_str = str(project_root) + "/"

    # Parse TSGO Output
    # Typical format: filePath(line,col): error TSXXXX: Message
    # Indented lines following the error are usually part of the type trace
    current_file = None
    current_error = []

    for line in tsgo_out.splitlines():
        # Match a new TypeScript compiler error line
        ts_match = re.match(r'^([a-zA-Z0-9_/\.\-\[\]\(\)]+\.tsx?)\(\d+,\d+\):\s+error\s+TS', line)
        if ts_match:
            if current_file and current_error:
                tasks[current_file].append("\n".join(current_error))

            # Clean up full path if present
            raw_path = ts_match.group(1)
            current_file = raw_path.replace(root_str, "").replace("/workspace/frontend/", "")
            current_error = [line.strip()]
        elif line.startswith("  ") and current_file:
            # Continuation of the TypeScript error (e.g., overload traces)
            current_error.append(line.rstrip())
        else:
            if current_file and current_error:
                tasks[current_file].append("\n".join(current_error))
                current_file = None
                current_error = []

    if current_file and current_error:
        tasks[current_file].append("\n".join(current_error))

    # Parse Lint Output (Stylish format typically)
    # Formats often look like:
    # /path/to/project/app/Component.tsx
    #   10:5  error  Message  rule-name
    current_file = None
    for line in lint_out.splitlines():
        line = line.rstrip()
        if not line:
            continue

        # Match a file header for eslint
        if line.startswith(root_str) or line.startswith("/workspace/") or (line.endswith(".ts") or line.endswith(".tsx")):
            current_file = line.replace(root_str, "").replace("/workspace/frontend/", "").strip()
        elif current_file and re.match(r'^\s+\d+:\d+\s+(error|warning)', line):
            tasks[current_file].append(f"Lint: {line.strip()}")

    # Output to the trackable file
    output_path = project_root / "all_errors.txt"
    with open(output_path, "w") as f:
        f.write("# Error Task Tracking List\n")
        f.write("# Formatting: [ ] To Do | [-] In Progress | [x] Done\n\n")

        for file_path in sorted(tasks.keys()):
            for err in tasks[file_path]:
                f.write(f"[ ] File: {file_path}\n")
                f.write("    Error Details:\n")
                for err_line in err.splitlines():
                    f.write(f"      {err_line}\n")
                f.write("\n")

    print(f"Task list generated successfully at {output_path}")

if __name__ == "__main__":
    generate_task_list()