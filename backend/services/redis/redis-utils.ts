type PipelineRecord = Record<string, (...args: (string | number)[]) => unknown>;

/**
 * Type guard: narrows a pipeline object to a record of callable methods.
 */
function isPipelineRecord(pipeline: unknown): pipeline is PipelineRecord {
  return typeof pipeline === "object" && pipeline !== null && !Array.isArray(pipeline);
}

/**
 * Common logic for executing Redis pipelines across different clients
 */
export function buildRedisPipeline<TPipeline>(
  pipeline: TPipeline,
  commands: Array<{ command: string; args: (string | number)[] }>
): TPipeline {
  if (!isPipelineRecord(pipeline)) {
    return pipeline;
  }
  for (const cmd of commands) {
    const method = pipeline[cmd.command];
    if (typeof method === "function") {
      method(...cmd.args);
    }
  }
  return pipeline;
}
