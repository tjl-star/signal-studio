import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "**/*.e2e.ts",
  outputDir: "./test-results",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:8765",
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  webServer: {
    command: "cmd /c \"set PYTHONPATH=backend&& .\\.venv\\Scripts\\python.exe -m app.cli serve --host 127.0.0.1 --port 8765\"",
    cwd: "..",
    url: "http://127.0.0.1:8765/api/health",
    reuseExistingServer: true,
    timeout: 30_000
  }
});
