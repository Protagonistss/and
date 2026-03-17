// buildArtifactSections - 构建 artifact sections
import type { AgentRun } from "@/stores";
import type { ArtifactSection } from "@/features/agent/components";
import { toPreviewLines } from "@/features/agent/components/utils/agentViewUtils";

export function buildArtifactSections(run: AgentRun | null, streamContent: string): ArtifactSection[] {
  if (!run) return [];

  const activeStep = run.activeStepId
    ? run.steps.find((step) => step.id === run.activeStepId) || null
    : run.steps.find((step) => step.status === "running") || null;

  const sections: ArtifactSection[] = run.artifacts
    .filter((artifact) => artifact.kind === "file")
    .sort((left, right) => {
      const leftPriority = left.stepId === run.activeStepId ? 0 : 1;
      const rightPriority = right.stepId === run.activeStepId ? 0 : 1;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;
      return left.createdAt - right.createdAt;
    })
    .map((artifact) => {
      const preview = artifact.preview.trim() || artifact.title;
      return {
        id: artifact.id,
        path: artifact.path,
        state:
          streamContent.trim() && artifact.stepId === run.activeStepId ? "active" : "completed",
        preview,
        contentSnapshot: artifact.contentSnapshot || "",
        added: Math.max(1, toPreviewLines(preview, 24).length),
        removed: 0,
        cacheKey: `${run.id}:${artifact.path}`,
      };
    });

  if (streamContent.trim()) {
    const activeFileArtifact = [...(activeStep?.artifactRefs || [])]
      .reverse()
      .find((artifact) => artifact.kind === "file");

    if (activeFileArtifact) {
      sections.unshift({
        id: "stream-output",
        path: activeFileArtifact.path,
        state: "active",
        preview: streamContent.trim(),
        contentSnapshot: "",
        added: Math.max(1, toPreviewLines(streamContent.trim(), 24).length),
        removed: 0,
        cacheKey: `${run.id}:${activeFileArtifact.path}`,
      });
    }
  }

  const seenPaths = new Set<string>();
  return sections.filter((section) => {
    if (seenPaths.has(section.path)) return false;
    seenPaths.add(section.path);
    return true;
  });
}
