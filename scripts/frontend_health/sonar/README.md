# SonarQube Analysis Tooling

Modular TypeScript-based tooling for running SonarQube analysis and fetching results using Bun.

## Features

- **Automated Setup**: Starts Docker container, configures authentication, and generates tokens.
- **Dynamic Config**: Automatically reads project key and name from `sonar-project.properties`.
- **Modular Design**: Single-responsibility TypeScript modules for easy maintenance.
- **Rich Results**: Displays code quality issues, duplication metrics, and detailed duplication blocks.

## Usage

The main entry point is `sonar-scan` (or `scripts/frontend_health/sonar/ts/main.ts`).

### Commands

Available via `npm` or `bun run`:

- **Run Analysis**: `bun run sonar-scan` (or `bun run sonar-scan --scan`)
- **Fetch Issues Only**: `bun run sonar-result`
- **Full Report**: `bun run sonar-full`
- **Reset State**: `bun run sonar-scan --reset`
- **Help**: `bun run sonar-scan --help`

### CLI Flags

If running the script directly with Bun:

```bash
bun run scripts/frontend_health/sonar/ts/main.ts [flags]
```

- `--scan`: Run full analysis (setup, scan, and results).
- `--result`: Fetch and display issues only.
- `--full`: Fetch and display issues with duplication metrics.
- `--reset`: Reset setup state.
- `--help`: Show help message.

## Configuration

1. **Project Properties**: The script reads `sonar-project.properties` in the project root. See `sonar-project.properties.example` for reference.
2. **Authentication**: A `.sonar-token` is automatically generated and saved in the `sonar` directory during the first scan.
3. **Docker**: Ensure Docker is running. The script uses `docker-compose.yml` in the `sonar` directory.

## Directory Structure

```
scripts/frontend_health/sonar/
├── ts/
│   ├── main.ts            # CLI entry point
│   ├── config.ts          # Shared configuration & logging
│   ├── docker.ts          # Docker lifecycle management
│   ├── sonarqube-api.ts   # SonarQube API interactions
│   ├── scanner.ts         # Scanner installation & execution
│   ├── state.ts           # Setup state management
│   └── results.ts         # Results fetching & display
├── docker-compose.yml     # SonarQube container config
└── sonar-project.properties.example
```
