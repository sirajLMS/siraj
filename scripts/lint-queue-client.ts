const BASE_URL = "http://localhost:4777";

export async function requestLint(
  id: string,
  files: string[]
): Promise<{ success: boolean; output: string; exitCode: number }> {
  const response = await fetch(`${BASE_URL}/lint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, files }),
  });
  if (!response.ok) {
    throw new Error(`Lint queue request failed for ${id}: ${response.status}`);
  }
  return response.json();
}

export async function getQueueStatus(): Promise<{ running: boolean; queueLength: number }> {
  const response = await fetch(`${BASE_URL}/status`);
  return response.json();
}
