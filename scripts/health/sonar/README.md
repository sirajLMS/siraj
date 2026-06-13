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
- **Full Report (with duplications)**: `bun run sonar-duplications`
- **Reset State**: `bun run sonar-scan --reset`
- **Help**: `bun run sonar-scan --help`

### CLI Flags

If running the script directly with Bun:

```bash
bun run scripts/health/sonar/ts/main.ts [flags]
```

- `--scan`: Run full analysis (setup, scan, and results).
- `--result`: Fetch and display issues only.
- `--with-duplications`: Fetch and display issues with duplication metrics.
- `--reset`: Reset setup state.
- `--help`: Show help message.

## IDE Integration (SonarLint)

To get real-time feedback in your IDE (e.g., VS Code with SonarLint extension), you can connect it to the local SonarQube server running in Docker.

### Connection Details

- **Server URL**: `http://localhost:9000`
- **Connection Name**: `Local SonarQube` (or any name you prefer)
- **Authentication**:
  - **User Token**: Use the token found in `scripts/frontend_health/sonar/.sonar-token` (generated after the first scan).
  - **Manual Login**:
    - **Username**: `admin`
    - **Password**: `Admin123!@#$` (Default set by script)

### Setup in VS Code

1. Install the **SonarLint** extension.
2. Open Settings and search for `SonarLint: Connected Mode`.
3. Add a connection to `SonarQube` with the URL `http://localhost:9000`.
4. Provide the token from `.sonar-token`.
5. Bind your local project to the SonarQube project key (found in `sonar-project.properties`).

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
