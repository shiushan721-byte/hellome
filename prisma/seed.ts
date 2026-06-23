import 'dotenv/config';
import { requirePrismaClient } from '../src/server/db/prisma';
import { computeSkillVersionChecksum } from '../src/server/skillChecksum';
import type { SkillVersionRecord } from '../src/types/skills';
import {
  buildDemoLedgerSeeds,
  buildDemoSkillSeed,
  buildDemoTaskSeeds,
  buildDemoUsers,
  buildDemoVideoAgentSeeds,
} from '../src/server/bootstrap/demoSeedData';
import { buildAdminUserFixtures } from '../src/server/bootstrap/adminUserFixtures';
import { seedAdminAgents } from '../src/server/bootstrap/adminAgentSeed';

const prisma = requirePrismaClient();

const UGC_STEPS = [
  { key: 'understanding', title: '理解需求' },
  { key: 'script', title: '生成脚本' },
  { key: 'shots', title: '规划镜头' },
  { key: 'assets', title: '生成人物 / 产品镜头' },
  { key: 'composite', title: '合成样片' },
  { key: 'delivery', title: '导出交付包' },
] as const;

async function seedUsers() {
  const userIdByExternalId = new Map<string, string>();
  const workspaceIdBySlug = new Map<string, string>();

  for (const userSeed of buildDemoUsers()) {
    const user = await prisma.user.upsert({
      where: { externalId: userSeed.externalId },
      update: {
        displayName: userSeed.displayName,
        email: userSeed.email,
        phone: userSeed.phone,
      },
      create: {
        externalId: userSeed.externalId,
        displayName: userSeed.displayName,
        email: userSeed.email,
        phone: userSeed.phone,
      },
    });

    const workspace = await prisma.workspace.upsert({
      where: { slug: userSeed.workspaceSlug },
      update: { name: userSeed.workspaceName, ownerId: user.id },
      create: {
        slug: userSeed.workspaceSlug,
        name: userSeed.workspaceName,
        ownerId: user.id,
      },
    });

    userIdByExternalId.set(userSeed.externalId, user.id);
    workspaceIdBySlug.set(userSeed.workspaceSlug, workspace.id);
  }

  return { userIdByExternalId, workspaceIdBySlug };
}

async function seedTasks(
  userIdByExternalId: Map<string, string>,
  workspaceIdBySlug: Map<string, string>,
  skillBinding: { skillId: string; skillVersionId: string },
) {
  for (const taskSeed of buildDemoTaskSeeds()) {
    const userId = userIdByExternalId.get(taskSeed.userExternalId);
    const workspaceId = workspaceIdBySlug.get(taskSeed.workspaceSlug);
    if (!userId || !workspaceId) continue;

    const createdAt = new Date('2026-06-18T10:00:00.000Z');
    const completedAt =
      taskSeed.status === 'completed' ? new Date('2026-06-18T10:18:00.000Z') : null;

    await prisma.task.upsert({
      where: { id: taskSeed.id },
      update: {
        name: taskSeed.name,
        agentType: 'media',
        status: taskSeed.status,
        executionMode: 'backend_silent',
        estimatedTokenMin: 12000,
        estimatedTokenMax: 28000,
        tokenUsed: taskSeed.tokenUsed,
        currentTokenUsed: taskSeed.tokenUsed,
        costEstimate: '预计 1 次样片生成 + 1 次视频合成',
        requiresConfirm: taskSeed.status === 'waiting_confirmation',
        skillId: skillBinding.skillId,
        skillVersionId: skillBinding.skillVersionId,
        userId,
        workspaceId,
        completedAt,
      },
      create: {
        id: taskSeed.id,
        name: taskSeed.name,
        agentType: 'media',
        status: taskSeed.status,
        executionMode: 'backend_silent',
        createdAt,
        startedAt: createdAt,
        completedAt,
        estimatedTokenMin: 12000,
        estimatedTokenMax: 28000,
        tokenUsed: taskSeed.tokenUsed,
        currentTokenUsed: taskSeed.tokenUsed,
        costEstimate: '预计 1 次样片生成 + 1 次视频合成',
        requiresConfirm: taskSeed.status === 'waiting_confirmation',
        skillId: skillBinding.skillId,
        skillVersionId: skillBinding.skillVersionId,
        userId,
        workspaceId,
      },
    });

    await prisma.taskInput.upsert({
      where: { taskId: taskSeed.id },
      update: {
        sellingPoint: taskSeed.sellingPoint,
        platform: taskSeed.platform,
        effectGoal: taskSeed.effectGoal,
      },
      create: {
        taskId: taskSeed.id,
        sellingPoint: taskSeed.sellingPoint,
        platform: taskSeed.platform,
        effectGoal: taskSeed.effectGoal,
      },
    });

    await prisma.taskRun.deleteMany({ where: { taskId: taskSeed.id } });
    await prisma.taskRun.create({
      data: {
        taskId: taskSeed.id,
        status: taskSeed.status,
        mode: 'backend_silent',
        attempt: 1,
        startedAt: createdAt,
        completedAt,
      },
    });

    await prisma.taskStep.deleteMany({ where: { taskId: taskSeed.id } });
    await prisma.taskStep.createMany({
      data: UGC_STEPS.map((step, index) => ({
        taskId: taskSeed.id,
        key: step.key,
        title: step.title,
        orderIndex: index,
        status:
          taskSeed.status === 'completed'
            ? 'completed'
            : index === 0
              ? 'completed'
              : index === 1
                ? 'active'
                : 'pending',
        tokenUsed: index === 0 ? 1200 : 0,
      })),
    });

    await prisma.taskEvent.deleteMany({ where: { taskId: taskSeed.id } });
    await prisma.taskEvent.createMany({
      data: [
        {
          id: `${taskSeed.id}-event-1`,
          taskId: taskSeed.id,
          type: 'task_created',
          level: 'info',
          message: '任务已创建，等待后端静默执行',
          createdAt,
        },
        {
          id: `${taskSeed.id}-event-2`,
          taskId: taskSeed.id,
          type: taskSeed.status === 'completed' ? 'task_completed' : 'waiting_confirmation',
          level: 'info',
          message:
            taskSeed.status === 'completed'
              ? '样片已生成，交付包已就绪'
              : '系统理解完成，等待确认后进入高成本生成',
          createdAt: completedAt ?? new Date('2026-06-18T10:06:00.000Z'),
        },
      ],
    });

    await prisma.hermesExecution.deleteMany({ where: { taskId: taskSeed.id } });
    await prisma.hermesExecution.create({
      data: {
        id: `${taskSeed.id}-exec-1`,
        taskId: taskSeed.id,
        mode: 'backend_silent',
        recipe: 'media-ugc@v0.1.0',
        status: taskSeed.status === 'completed' ? 'completed' : 'waiting_confirmation',
        skillId: skillBinding.skillId,
        skillVersionId: skillBinding.skillVersionId,
        createdAt,
      },
    });
  }
}

async function seedSkillRow(
  userIdByExternalId: Map<string, string>,
  skillSeed: ReturnType<typeof buildDemoSkillSeed>,
): Promise<{ skillId: string; skillVersionId: string; checksum: string } | null> {
  const ownerId = userIdByExternalId.get(skillSeed.ownerExternalId);
  if (!ownerId) return null;

  const prismaDb = prisma as any;
  const publishedAt = new Date('2026-06-18T09:00:00.000Z');
  const versionRecord: SkillVersionRecord = {
    id: skillSeed.version.id,
    versionNumber: skillSeed.version.versionNumber,
    versionLabel: skillSeed.version.versionLabel,
    status: 'published',
    title: skillSeed.version.title,
    summary: skillSeed.version.summary,
    inputConfig: skillSeed.version.inputConfig as unknown as SkillVersionRecord['inputConfig'],
    understandingConfig: skillSeed.version.understandingConfig as unknown as SkillVersionRecord['understandingConfig'],
    executionConfig: skillSeed.version.executionConfig as unknown as SkillVersionRecord['executionConfig'],
    businessFrame: skillSeed.version.businessFrame as unknown as SkillVersionRecord['businessFrame'],
    artifactConfig: skillSeed.version.artifactConfig as unknown as SkillVersionRecord['artifactConfig'],
    createdAt: publishedAt.toISOString(),
    publishedAt: publishedAt.toISOString(),
  };
  const checksum = computeSkillVersionChecksum(versionRecord);

  await prismaDb.skill.upsert({
    where: { slug: skillSeed.slug },
    update: {
      name: skillSeed.name,
      description: skillSeed.description,
      category: 'ugc_video',
      status: 'published',
      currentVersion: skillSeed.version.versionNumber,
      publishedAt,
      ownerId,
    },
    create: {
      id: skillSeed.id,
      slug: skillSeed.slug,
      name: skillSeed.name,
      description: skillSeed.description,
      category: 'ugc_video',
      status: 'published',
      currentVersion: skillSeed.version.versionNumber,
      publishedAt,
      ownerId,
    },
  });

  await prismaDb.skillVersion.upsert({
    where: {
      skillId_versionNumber: {
        skillId: skillSeed.id,
        versionNumber: skillSeed.version.versionNumber,
      },
    },
    update: {
      versionLabel: skillSeed.version.versionLabel,
      status: 'published',
      title: skillSeed.version.title,
      summary: skillSeed.version.summary,
      checksum,
      inputConfig: skillSeed.version.inputConfig,
      understandingConfig: skillSeed.version.understandingConfig,
      executionConfig: skillSeed.version.executionConfig,
      businessFrame: skillSeed.version.businessFrame,
      artifactConfig: skillSeed.version.artifactConfig,
      publishedAt,
    },
    create: {
      id: skillSeed.version.id,
      skillId: skillSeed.id,
      versionNumber: skillSeed.version.versionNumber,
      versionLabel: skillSeed.version.versionLabel,
      status: 'published',
      title: skillSeed.version.title,
      summary: skillSeed.version.summary,
      checksum,
      inputConfig: skillSeed.version.inputConfig,
      understandingConfig: skillSeed.version.understandingConfig,
      executionConfig: skillSeed.version.executionConfig,
      businessFrame: skillSeed.version.businessFrame,
      artifactConfig: skillSeed.version.artifactConfig,
      publishedAt,
    },
  });

  return {
    skillId: skillSeed.id,
    skillVersionId: skillSeed.version.id,
    checksum,
  };
}

async function seedSkill(userIdByExternalId: Map<string, string>) {
  // 6 个智能体工坊视频智能体（设计稿要求）+ 1 个默认 media-ugc（兼容旧调用）
  const allSeeds = [buildDemoSkillSeed(), ...buildDemoVideoAgentSeeds()];
  let lastBinding = null;
  for (const seed of allSeeds) {
    const binding = await seedSkillRow(userIdByExternalId, seed);
    if (binding && seed.id === 'media-ugc') lastBinding = binding;
  }
  return lastBinding;
}

async function seedLedger(userIdByExternalId: Map<string, string>) {
  for (const ledgerSeed of buildDemoLedgerSeeds()) {
    const userId = userIdByExternalId.get(ledgerSeed.userExternalId);
    if (!userId) continue;

    const existing = ledgerSeed.taskId
      ? await prisma.usageLedger.findFirst({
          where: { userId, taskId: ledgerSeed.taskId },
        })
      : await prisma.usageLedger.findFirst({
          where: {
            userId,
            taskId: null,
            videoCost: ledgerSeed.videoCost ?? null,
          },
        });

    if (existing) {
      await prisma.usageLedger.update({
        where: { id: existing.id },
        data: {
          tokenUsed: ledgerSeed.tokenUsed,
          videoCost: ledgerSeed.videoCost ?? null,
          status: ledgerSeed.status,
        },
      });
      continue;
    }

    await prisma.usageLedger.create({
      data: {
        userId,
        taskId: ledgerSeed.taskId ?? null,
        tokenUsed: ledgerSeed.tokenUsed,
        videoCost: ledgerSeed.videoCost ?? null,
        status: ledgerSeed.status,
      },
    });
  }
}

async function seedAdminUserFixtures(
  userIdByExternalId: Map<string, string>,
  workspaceIdBySlug: Map<string, string>,
  skillBinding: { skillId: string; skillVersionId: string },
) {
  const now = new Date('2026-06-22T12:00:00.000Z');

  for (const fixture of buildAdminUserFixtures()) {
    const userId = userIdByExternalId.get(fixture.phone);
    const workspaceSlug = `user-${fixture.phone.replace(/\D/g, '').slice(-6)}`;
    const workspaceId = workspaceIdBySlug.get(workspaceSlug);
    if (!userId) continue;

    await prisma.userProfileAdminMeta.upsert({
      where: { userId },
      update: {
        status: fixture.status,
        tags: fixture.tags ?? undefined,
        lastLoginAt: fixture.lastLoginAt ? new Date(fixture.lastLoginAt) : null,
        disabledAt: fixture.status === 'disabled' ? now : null,
        disabledReason: fixture.disabledReason ?? null,
      },
      create: {
        userId,
        status: fixture.status,
        tags: fixture.tags ?? undefined,
        lastLoginAt: fixture.lastLoginAt ? new Date(fixture.lastLoginAt) : null,
        disabledAt: fixture.status === 'disabled' ? now : null,
        disabledReason: fixture.disabledReason ?? null,
      },
    });

    if (fixture.hermesDevices?.length) {
      for (const device of fixture.hermesDevices) {
        await prisma.hermesDevice.upsert({
          where: { id: device.id },
          update: {
            userId,
            deviceName: device.deviceName,
            os: device.os,
            version: device.version,
            status: device.status,
            debugEnabled: device.debugEnabled ?? true,
            lastSeenAt: device.status === 'connected' ? now : new Date('2026-06-20T08:00:00.000Z'),
          },
          create: {
            id: device.id,
            userId,
            deviceName: device.deviceName,
            os: device.os,
            version: device.version,
            status: device.status,
            debugEnabled: device.debugEnabled ?? true,
            lastSeenAt: device.status === 'connected' ? now : new Date('2026-06-20T08:00:00.000Z'),
          },
        });
      }
    }

    if (fixture.gnomic) {
      await prisma.gnomicAccountBinding.upsert({
        where: { hellomeUserId: fixture.phone },
        update: {
          gnomicUserId: fixture.gnomic.gnomicUserId,
          phone: fixture.phone,
          status: fixture.gnomic.status,
        },
        create: {
          hellomeUserId: fixture.phone,
          gnomicUserId: fixture.gnomic.gnomicUserId,
          phone: fixture.phone,
          status: fixture.gnomic.status,
        },
      });
    }

    if (fixture.topups?.length) {
      for (const [index, topup] of fixture.topups.entries()) {
        const topupId = `seed-topup-${fixture.phone.slice(-2)}-${index}`;
        await prisma.billingTopup.upsert({
          where: { id: topupId },
          update: {
            userId,
            tokenAmount: topup.tokenAmount,
            note: topup.note,
          },
          create: {
            id: topupId,
            userId,
            tokenAmount: topup.tokenAmount,
            note: topup.note,
            createdAt: new Date(`2026-06-${10 + index}T10:00:00.000Z`),
          },
        });
      }
    }

    const taskIdByKey = new Map<string, string>();

    if (fixture.tasks?.length && workspaceId) {
      for (const [index, task] of fixture.tasks.entries()) {
        const taskId = task.key;
        taskIdByKey.set(task.key, taskId);
        const createdAt = new Date(`2026-06-${12 + index}T09:00:00.000Z`);
        const completedAt =
          task.status === 'completed' ? new Date(`2026-06-${12 + index}T09:30:00.000Z`) : null;

        await prisma.task.upsert({
          where: { id: taskId },
          update: {
            name: task.name,
            agentType: task.agentType,
            status: task.status,
            tokenUsed: task.tokenUsed,
            currentTokenUsed: task.tokenUsed,
            requiresConfirm: task.requiresConfirm ?? false,
            userId,
            workspaceId,
            skillId: skillBinding.skillId,
            skillVersionId: skillBinding.skillVersionId,
            completedAt,
          },
          create: {
            id: taskId,
            name: task.name,
            agentType: task.agentType,
            status: task.status,
            executionMode: 'backend_silent',
            createdAt,
            startedAt: task.status === 'draft' || task.status === 'queued' ? null : createdAt,
            completedAt,
            estimatedTokenMin: 8000,
            estimatedTokenMax: 28000,
            tokenUsed: task.tokenUsed,
            currentTokenUsed: task.tokenUsed,
            requiresConfirm: task.requiresConfirm ?? false,
            userId,
            workspaceId,
            skillId: skillBinding.skillId,
            skillVersionId: skillBinding.skillVersionId,
          },
        });

        await prisma.taskInput.upsert({
          where: { taskId },
          update: {
            sellingPoint: task.sellingPoint,
            platform: task.platform,
            effectGoal: task.effectGoal,
          },
          create: {
            taskId,
            sellingPoint: task.sellingPoint,
            platform: task.platform,
            effectGoal: task.effectGoal,
          },
        });

        if (task.artifacts?.length) {
          for (const [artifactIndex, artifact] of task.artifacts.entries()) {
            const artifactId = `${taskId}-artifact-${artifactIndex}`;
            await prisma.taskArtifact.upsert({
              where: { id: artifactId },
              update: {
                taskId,
                type: artifact.type,
                label: artifact.label,
                fileName: artifact.fileName,
                url: artifact.url ?? null,
                mimeType: artifact.mimeType ?? null,
                sizeBytes: artifact.sizeBytes ?? null,
              },
              create: {
                id: artifactId,
                taskId,
                type: artifact.type,
                label: artifact.label,
                fileName: artifact.fileName,
                url: artifact.url ?? null,
                mimeType: artifact.mimeType ?? null,
                sizeBytes: artifact.sizeBytes ?? null,
              },
            });
          }
        }
      }
    }

    if (fixture.ledgers?.length) {
      for (const [index, ledger] of fixture.ledgers.entries()) {
        const ledgerId = `seed-ledger-${fixture.phone.slice(-2)}-${index}`;
        const taskId = ledger.taskKey ? taskIdByKey.get(ledger.taskKey) ?? null : null;
        await prisma.usageLedger.upsert({
          where: { id: ledgerId },
          update: {
            userId,
            taskId,
            tokenUsed: ledger.tokenUsed,
            videoCost: ledger.videoCost ?? null,
            status: ledger.status,
          },
          create: {
            id: ledgerId,
            userId,
            taskId,
            tokenUsed: ledger.tokenUsed,
            videoCost: ledger.videoCost ?? null,
            status: ledger.status,
            createdAt: new Date(`2026-06-${15 + index}T08:00:00.000Z`),
          },
        });
      }
    }
  }
}

export async function seedDatabase(): Promise<void> {
  const { userIdByExternalId, workspaceIdBySlug } = await seedUsers();
  const skillBinding =
    (await seedSkill(userIdByExternalId)) ?? {
      skillId: 'media-ugc',
      skillVersionId: 'media-ugc-v1',
    };
  await seedTasks(userIdByExternalId, workspaceIdBySlug, skillBinding);
  await seedLedger(userIdByExternalId);
  await seedAdminUserFixtures(userIdByExternalId, workspaceIdBySlug, skillBinding);
  await seedAdminAgents();
}

async function main() {
  await seedDatabase();
  console.log('[seed] demo users, tasks, skills, and ledger rows are ready');
}

main()
  .catch((error) => {
    console.error('[seed] failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
