// Artifact Utilities - Artifact 工具函数
import { readTextFile } from '../../tauri/fs';
import { isAbsolutePath, joinPath } from '@/utils';
import { useConfigStore } from '@/stores/configStore';
import { ARTIFACT_SNAPSHOT_MAX_LENGTH, ARTIFACT_SNAPSHOT_TIMEOUT_MS } from '../internal/constants';

/**
 * Resolves artifact snapshot path
 */
export function resolveArtifactSnapshotPath(path: string): string | null {
  const normalizedPath = path.trim();
  if (!normalizedPath) {
    return null;
  }

  if (isAbsolutePath(normalizedPath)) {
    return normalizedPath;
  }

  const workingDirectory = useConfigStore.getState().workingDirectory.trim();
  if (!workingDirectory) {
    return null;
  }

  return joinPath(workingDirectory, normalizedPath);
}

/**
 * Reads artifact snapshot with timeout
 */
export async function readArtifactSnapshot(path: string): Promise<string> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    const content = await Promise.race([
      readTextFile(path),
      new Promise<string>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Timed out while reading file snapshot.'));
        }, ARTIFACT_SNAPSHOT_TIMEOUT_MS);
      }),
    ]);

    return content.length > ARTIFACT_SNAPSHOT_MAX_LENGTH
      ? content.slice(0, ARTIFACT_SNAPSHOT_MAX_LENGTH)
      : content;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
