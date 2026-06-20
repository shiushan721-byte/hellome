import { createHash } from 'node:crypto';
import type { SkillVersionRecord } from '../types/skills';

function stableSnapshot(version: SkillVersionRecord): string {
  return JSON.stringify({
    versionNumber: version.versionNumber,
    versionLabel: version.versionLabel,
    title: version.title,
    summary: version.summary ?? null,
    inputConfig: version.inputConfig,
    understandingConfig: version.understandingConfig,
    executionConfig: version.executionConfig,
    businessFrame: version.businessFrame,
    artifactConfig: version.artifactConfig,
  });
}

export function computeSkillVersionChecksum(version: SkillVersionRecord): string {
  const digest = createHash('sha256').update(stableSnapshot(version)).digest('hex');
  return `sha256:${digest}`;
}

export function withSkillVersionChecksum(version: SkillVersionRecord): SkillVersionRecord {
  return {
    ...version,
    checksum: computeSkillVersionChecksum(version),
  };
}
