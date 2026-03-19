/**
 * Tool call confirmation bridge.
 * Allows the execution loop to await user confirm/reject before executing
 * tools that require confirmation (e.g. MCP tools).
 */

export type ToolConfirmationResult = 'confirm' | 'reject';

const pendingResolvers = new Map<string, (value: ToolConfirmationResult) => void>();

/**
 * Register a pending tool call and return a Promise that resolves when the user
 * confirms or rejects. Used by executeToolUses when a tool has requiresConfirmation.
 */
export function registerPendingToolCall(toolCallId: string): Promise<ToolConfirmationResult> {
  return new Promise((resolve) => {
    pendingResolvers.set(toolCallId, resolve);
  });
}

/**
 * Resolve a pending tool call with the user's choice. Called from the store
 * when the user clicks Confirm or Reject in the UI.
 */
export function resolvePendingToolCall(toolCallId: string, result: ToolConfirmationResult): void {
  const resolve = pendingResolvers.get(toolCallId);
  if (resolve) {
    pendingResolvers.delete(toolCallId);
    resolve(result);
  }
}

/**
 * Reject all pending tool calls (e.g. when user stops generation).
 * Prevents the execution loop from hanging on unresolved Promises.
 */
export function rejectAllPendingToolCalls(): void {
  for (const [id, resolve] of pendingResolvers) {
    pendingResolvers.delete(id);
    resolve('reject');
  }
}
