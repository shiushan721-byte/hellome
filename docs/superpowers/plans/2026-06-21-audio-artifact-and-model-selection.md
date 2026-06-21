# Audio Artifact And Model Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add audio generation to the UGC delivery chain and let creators choose image, video, and audio models from skill configuration while keeping business-side task UX audio-agnostic.

**Architecture:** Extend `SkillExecutionConfig` with a stable model-selection object, expose a creator-facing model catalog endpoint, and persist the chosen models into skill versions. Then update `ugcTaskService` to synthesize an audio artifact during render, teach ingest/types/UI about `audio`, and surface the result in creator previews and task delivery UI.

**Tech Stack:** TypeScript, React, Express, Prisma, Node test runner

## Global Constraints

- Keep frontend business task flow audio-agnostic; audio is a creator-side execution parameter.
- Do not revert unrelated local changes already present in the worktree.
- Prefer additive changes and keep current fallback behavior for media/audio providers.
- Use TDD for behavior changes and run only changed verification commands after edits.

---

### Task 1: Extend skill execution config for model selection

**Files:**
- Modify: `src/types/skills.ts`
- Modify: `src/server/skillStudioService.ts`
- Modify: `src/lib/skillDraft.ts`
- Modify: `src/server/bootstrap/demoSeedData.ts`
- Test: `tests/server/skillStudioService.test.ts`

**Interfaces:**
- Consumes: existing `SkillExecutionConfig`
- Produces: `SkillModelSelectionConfig` with `imageModel`, `videoModel`, `audioModel`, `audioEnabled`

### Task 2: Expose creator model catalog and editor controls

**Files:**
- Modify: `server.ts`
- Modify: `src/lib/skillStudioApi.ts`
- Modify: `src/pages/app/CreatorSkillEditorPage.tsx`

**Interfaces:**
- Consumes: `listAvailableMediaModels()`, `listAvailableAudioModels()`
- Produces: creator-side model selection UI bound to `skill.latestVersion.executionConfig.modelSelection`

### Task 3: Add audio artifact generation to the UGC pipeline

**Files:**
- Modify: `src/types/ugc.ts`
- Modify: `src/server/ugcTaskService.ts`
- Modify: `src/server/hermesEventIngestService.ts`
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260621093000_add_audio_artifact_type/migration.sql`
- Test: `tests/server/hermesExecutionProtocol.test.ts`

**Interfaces:**
- Consumes: `generateAudio()`, persisted skill execution metadata
- Produces: `UgcTaskArtifact` with `type: 'audio'`

### Task 4: Surface audio in creator/task UI defaults

**Files:**
- Modify: `src/server/agentOrchestratorService.ts`
- Modify: `src/components/app/tasks/TaskResultSummaryBar.tsx`
- Modify: `src/components/app/tasks/UgcDeliveryPanel.tsx`

**Interfaces:**
- Consumes: task artifacts and skill business-frame defaults
- Produces: `audio_synthesize` default stage, `AI 配音版` delivery label, audio rows in artifact list

### Task 5: Verify and document

**Files:**
- Modify: `tests/server/skillStudioService.test.ts`
- Modify: `tests/server/hermesExecutionProtocol.test.ts`

**Interfaces:**
- Consumes: new skill config and audio artifact behavior
- Produces: regression coverage for defaults and artifact ingest/runtime
