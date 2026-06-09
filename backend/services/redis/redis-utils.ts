/**
 * Common logic for executing Redis pipelines across different clients
 */
export function buildRedisPipeline<TPipeline>(
  pipeline: TPipeline,
  commands: Array<{ command: string; args: (string | number)[] }>
): TPipeline {
  for (const cmd of commands) {
    (pipeline as unknown as Record<string, (...args: (string | number)[]) => unknown>)[cmd.command](...cmd.args);
  }
  return pipeline;
}
