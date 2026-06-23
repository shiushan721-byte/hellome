import type express from 'express';
import type { createAuthKit } from '../../../复用组件库/auth-login-kit/server-auth-kit';
import type { SkillBusinessFrameUpdate, SkillDebugInput, SkillVersionRecord } from '../../types/skills';
import {
  getAgentView,
  listAgentViews,
  updateAgentBusinessFrame,
} from '../agentOrchestratorService';
import { listAllSkills } from '../adminSkillService';
import {
  getSkill,
  getSkillVersions,
  listSkills,
  publishSkill,
  runSkillDebug,
  updateSkill,
} from '../skillStudioService';
import { auditFromRequest, listAuditLogs, writeAuditLog } from './auditLogService';
import {
  adjustUserTokens,
  getAdminUserDetail,
  listAdminUsersQuery,
} from './adminUserService';
import {
  getAdminHomeConfigState,
  getPublishedHomePageConfig,
  listHomePublishRecords,
  publishAdminHomeConfig,
  saveAdminHomeConfigDraft,
} from './homeConfigService';
import { registerAdminAgentRoutes } from './adminAgentRoutes';
import {
  getAdminDashboardStats,
  getPublishedConfigByScope,
  listAdminArtifacts,
  listAdminOrders,
  listAdminTasks,
  listAdminUsers,
  listFrontendConfigs,
  listGnomicBindings,
  listRechargePacks,
  listWorkflowTemplates,
  publishFrontendConfig,
  updateWorkflowTemplate,
  upsertFrontendConfig,
} from './adminService';

type AuthKit = ReturnType<typeof createAuthKit>;

function actorFromSession(session: NonNullable<ReturnType<AuthKit['currentSession']>>) {
  return {
    id: session.user.phone || session.user.email || session.id,
    name: session.user.name,
  };
}

export function registerAdminRoutes(app: express.Express, authKit: AuthKit): void {
  const requireAdmin: express.RequestHandler = (req, res, next) => {
    const session = authKit.requireAdminSession(req, res);
    if (!session) return;
    (req as express.Request & { adminSession: typeof session }).adminSession = session;
    next();
  };

  app.get('/api/public/configs/home', async (_req, res) => {
    try {
      const data = await getPublishedHomePageConfig();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取首页配置失败' });
    }
  });

  app.get('/api/public/configs/:scope', async (req, res) => {
    try {
      if (req.params.scope === 'home') {
        const data = await getPublishedHomePageConfig();
        res.json({ success: true, data });
        return;
      }
      const configs = await getPublishedConfigByScope(req.params.scope);
      res.json({ success: true, data: configs });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取配置失败' });
    }
  });

  app.get('/api/admin/home-config', requireAdmin, async (_req, res) => {
    try {
      const data = await getAdminHomeConfigState();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取首页配置失败' });
    }
  });

  app.put('/api/admin/home-config', requireAdmin, async (req, res) => {
    try {
      const session = (req as express.Request & { adminSession: NonNullable<ReturnType<AuthKit['currentSession']>> }).adminSession;
      const data = await saveAdminHomeConfigDraft({
        draftId: typeof req.body?.draftId === 'string' ? req.body.draftId : null,
        config: req.body?.config ?? {},
        actorId: actorFromSession(session).id,
      });
      await writeAuditLog(
        auditFromRequest(req, actorFromSession(session), {
          module: 'home_config',
          action: 'save_draft',
          targetType: 'frontend_config',
          targetId: data.draftId,
          after: { version: data.version },
        }),
      );
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '保存首页配置失败' });
    }
  });

  app.post('/api/admin/home-config/publish', requireAdmin, async (req, res) => {
    try {
      const session = (req as express.Request & { adminSession: NonNullable<ReturnType<AuthKit['currentSession']>> }).adminSession;
      const draftId = String(req.body?.draftId ?? '').trim();
      if (!draftId) {
        res.status(400).json({ success: false, error: '缺少草稿 ID' });
        return;
      }
      const data = await publishAdminHomeConfig(draftId, actorFromSession(session).id);
      await writeAuditLog(
        auditFromRequest(req, actorFromSession(session), {
          module: 'home_config',
          action: 'publish',
          targetType: 'frontend_config',
          targetId: draftId,
          after: data,
        }),
      );
      res.json({ success: true, data });
    } catch (error) {
      res.status(400).json({ success: false, error: error instanceof Error ? error.message : '发布首页配置失败' });
    }
  });

  app.get('/api/admin/home-config/publish-records', requireAdmin, async (_req, res) => {
    try {
      const data = await listHomePublishRecords();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取发布记录失败' });
    }
  });

  app.get('/api/admin/dashboard', requireAdmin, async (_req, res) => {
    try {
      const data = await getAdminDashboardStats();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取仪表盘失败' });
    }
  });

  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const parseBool = (value: unknown): boolean | undefined => {
        if (value === 'true' || value === '1') return true;
        if (value === 'false' || value === '0') return false;
        return undefined;
      };
      const data = await listAdminUsersQuery({
        q: String(req.query.q ?? '').trim() || undefined,
        status: String(req.query.status ?? '').trim() || undefined,
        hasHermes: parseBool(req.query.hasHermes),
        hasGnomic: parseBool(req.query.hasGnomic),
        hasTopup: parseBool(req.query.hasTopup),
        lowBalance: parseBool(req.query.lowBalance),
        createdFrom: String(req.query.createdFrom ?? '').trim() || undefined,
        createdTo: String(req.query.createdTo ?? '').trim() || undefined,
        page: Number(req.query.page) || 1,
        pageSize: Number(req.query.pageSize) || 20,
      });
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取用户失败' });
    }
  });

  app.get('/api/admin/users/:id', requireAdmin, async (req, res) => {
    try {
      const data = await getAdminUserDetail(req.params.id);
      if (!data) {
        res.status(404).json({ success: false, error: '用户不存在' });
        return;
      }
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取用户详情失败' });
    }
  });

  app.post('/api/admin/users/:id/token-adjustments', requireAdmin, async (req, res) => {
    try {
      const session = (req as express.Request & { adminSession: NonNullable<ReturnType<AuthKit['currentSession']>> }).adminSession;
      const tokenAmount = Number(req.body?.tokenAmount ?? 0);
      if (!Number.isFinite(tokenAmount) || tokenAmount === 0) {
        res.status(400).json({ success: false, error: 'Token 调整数量无效' });
        return;
      }
      const data = await adjustUserTokens(
        req.params.id,
        {
          type: String(req.body?.type ?? 'correction'),
          tokenAmount,
          reason: String(req.body?.reason ?? ''),
          note: String(req.body?.note ?? ''),
        },
        actorFromSession(session).id,
      );
      await writeAuditLog(
        auditFromRequest(req, actorFromSession(session), {
          module: 'users',
          action: 'adjust_tokens',
          targetType: 'user',
          targetId: req.params.id,
          after: {
            type: req.body?.type,
            tokenAmount,
            reason: req.body?.reason,
            note: req.body?.note,
            balanceAfter: data.balanceAfter,
          },
        }),
      );
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '调整 Token 失败' });
    }
  });

  app.get('/api/admin/orders', requireAdmin, async (_req, res) => {
    try {
      const data = await listAdminOrders();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取订单失败' });
    }
  });

  app.get('/api/admin/recharge-packs', requireAdmin, async (_req, res) => {
    try {
      const data = await listRechargePacks();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取充值包失败' });
    }
  });

  app.get('/api/admin/tasks', requireAdmin, async (_req, res) => {
    try {
      const data = await listAdminTasks();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取任务失败' });
    }
  });

  app.get('/api/admin/artifacts', requireAdmin, async (_req, res) => {
    try {
      const data = await listAdminArtifacts();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取成果失败' });
    }
  });

  app.get('/api/admin/frontend-configs', requireAdmin, async (req, res) => {
    try {
      const scope = String(req.query.scope ?? '').trim() || undefined;
      const data = await listFrontendConfigs(scope);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取前台配置失败' });
    }
  });

  app.post('/api/admin/frontend-configs', requireAdmin, async (req, res) => {
    try {
      const session = (req as express.Request & { adminSession: NonNullable<ReturnType<AuthKit['currentSession']>> }).adminSession;
      const data = await upsertFrontendConfig({
        id: req.body?.id,
        key: String(req.body?.key ?? ''),
        name: String(req.body?.name ?? ''),
        scope: String(req.body?.scope ?? ''),
        payload: req.body?.payload ?? {},
        actorId: actorFromSession(session).id,
      });
      await writeAuditLog(
        auditFromRequest(req, actorFromSession(session), {
          module: 'frontend_config',
          action: req.body?.id ? 'edit' : 'create',
          targetType: 'frontend_config',
          targetId: data.id,
          after: data,
        }),
      );
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '保存配置失败' });
    }
  });

  app.post('/api/admin/frontend-configs/:id/publish', requireAdmin, async (req, res) => {
    try {
      const session = (req as express.Request & { adminSession: NonNullable<ReturnType<AuthKit['currentSession']>> }).adminSession;
      const data = await publishFrontendConfig(req.params.id, actorFromSession(session).id);
      await writeAuditLog(
        auditFromRequest(req, actorFromSession(session), {
          module: 'frontend_config',
          action: 'publish',
          targetType: 'frontend_config',
          targetId: req.params.id,
          after: data,
        }),
      );
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '发布配置失败' });
    }
  });

  app.get('/api/admin/workflow-templates', requireAdmin, async (_req, res) => {
    try {
      const data = await listWorkflowTemplates();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取工作流模板失败' });
    }
  });

  app.put('/api/admin/workflow-templates/:templateId', requireAdmin, async (req, res) => {
    try {
      const session = (req as express.Request & { adminSession: NonNullable<ReturnType<AuthKit['currentSession']>> }).adminSession;
      const data = await updateWorkflowTemplate(req.params.templateId, req.body ?? {});
      await writeAuditLog(
        auditFromRequest(req, actorFromSession(session), {
          module: 'workflow_template',
          action: 'edit',
          targetType: 'workflow_template',
          targetId: req.params.templateId,
          after: data,
        }),
      );
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '更新模板失败' });
    }
  });

  app.get('/api/admin/integrations/gnomic/bindings', requireAdmin, async (_req, res) => {
    try {
      const data = await listGnomicBindings();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取 Gnomic 绑定失败' });
    }
  });

  app.get('/api/admin/audit-logs', requireAdmin, async (_req, res) => {
    try {
      const data = await listAuditLogs(200);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取审计日志失败' });
    }
  });

  app.get('/api/admin/skills', requireAdmin, async (req, res) => {
    try {
      const data = await listAllSkills();
      let skills = data.skills;
      const layer = String(req.query.layer ?? '').trim();
      if (layer && ['engineering', 'business', 'generation'].includes(layer)) {
        skills = skills.filter((s) => s.layer === layer);
      }
      const q = String(req.query.q ?? '').trim().toLowerCase();
      if (q) {
        skills = skills.filter(
          (s) =>
            s.id.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q),
        );
      }
      res.json({
        success: true,
        data: {
          total: skills.length,
          byLayer: {
            engineering: skills.filter((s) => s.layer === 'engineering').length,
            business: skills.filter((s) => s.layer === 'business').length,
            generation: skills.filter((s) => s.layer === 'generation').length,
          },
          skills,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取 Skill 失败' });
    }
  });

  app.get('/api/admin/studio/skills', requireAdmin, async (_req, res) => {
    try {
      const data = await listSkills();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取业务 Skill 失败' });
    }
  });

  app.get('/api/admin/studio/skills/:skillId', requireAdmin, async (req, res) => {
    try {
      const data = await getSkill(req.params.skillId);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取 Skill 详情失败' });
    }
  });

  app.put('/api/admin/studio/skills/:skillId', requireAdmin, async (req, res) => {
    try {
      const session = (req as express.Request & { adminSession: NonNullable<ReturnType<AuthKit['currentSession']>> }).adminSession;
      const payload = req.body as {
        name?: string;
        description?: string;
        latestVersion?: SkillVersionRecord;
      };
      if (!payload.name?.trim() || !payload.latestVersion) {
        res.status(400).json({ success: false, error: 'Skill 名称和版本配置不能为空' });
        return;
      }
      const externalId = session.user.email || session.user.phone || 'admin';
      const data = await updateSkill(externalId, req.params.skillId, {
        name: payload.name.trim(),
        description: payload.description?.trim() || undefined,
        latestVersion: payload.latestVersion,
      });
      await writeAuditLog(
        auditFromRequest(req, actorFromSession(session), {
          module: 'skills',
          action: 'update_skill',
          targetType: 'skill',
          targetId: req.params.skillId,
          after: { name: payload.name },
        }),
      );
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '保存 Skill 失败' });
    }
  });

  app.get('/api/admin/studio/skills/:skillId/versions', requireAdmin, async (req, res) => {
    try {
      const data = await getSkillVersions(req.params.skillId);
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取 Skill 版本失败' });
    }
  });

  app.post('/api/admin/studio/skills/:skillId/publish', requireAdmin, async (req, res) => {
    try {
      const session = (req as express.Request & { adminSession: NonNullable<ReturnType<AuthKit['currentSession']>> }).adminSession;
      const externalId = session.user.email || session.user.phone || 'admin';
      const data = await publishSkill(externalId, req.params.skillId);
      await writeAuditLog(
        auditFromRequest(req, actorFromSession(session), {
          module: 'skills',
          action: 'publish_skill',
          targetType: 'skill',
          targetId: req.params.skillId,
        }),
      );
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '发布 Skill 失败' });
    }
  });

  app.post('/api/admin/studio/skills/:skillId/debug', requireAdmin, async (req, res) => {
    try {
      const session = (req as express.Request & { adminSession: NonNullable<ReturnType<AuthKit['currentSession']>> }).adminSession;
      const input = req.body as SkillDebugInput;
      if (!input.sellingPoint?.trim()) {
        res.status(400).json({ success: false, error: '调试卖点不能为空' });
        return;
      }
      const externalId = session.user.email || session.user.phone || 'admin';
      const data = await runSkillDebug(externalId, req.params.skillId, {
        sellingPoint: input.sellingPoint.trim(),
        platform: input.platform?.trim() || '抖音',
        effectGoal: input.effectGoal?.trim() || '更像真人种草',
        referenceDirection: input.referenceDirection?.trim() || undefined,
      });
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Skill 调试失败' });
    }
  });

  app.post('/api/admin/studio/skills/:skillId/rollback', requireAdmin, async (req, res) => {
    try {
      const session = (req as express.Request & { adminSession: NonNullable<ReturnType<AuthKit['currentSession']>> }).adminSession;
      const versionId = String(req.body?.versionId ?? '').trim();
      if (!versionId) {
        res.status(400).json({ success: false, error: 'versionId 不能为空' });
        return;
      }
      const skill = await getSkill(req.params.skillId);
      const versions = await getSkillVersions(req.params.skillId);
      const target = versions.find((version) => version.id === versionId);
      if (!target) {
        res.status(404).json({ success: false, error: '未找到目标版本' });
        return;
      }
      const nextVersionNumber = Math.max(0, ...versions.map((version) => version.versionNumber)) + 1;
      const rolledVersion: SkillVersionRecord = {
        ...target,
        id: `${skill.id}-v${nextVersionNumber}-${Date.now().toString(36)}`,
        versionNumber: nextVersionNumber,
        versionLabel: `v0.${nextVersionNumber}.0-rollback`,
        status: 'draft',
        createdAt: new Date().toISOString(),
        publishedAt: undefined,
        checksum: undefined,
      };
      const externalId = session.user.email || session.user.phone || 'admin';
      const data = await updateSkill(externalId, skill.id, {
        name: skill.name,
        description: skill.description,
        latestVersion: rolledVersion,
      });
      await writeAuditLog(
        auditFromRequest(req, actorFromSession(session), {
          module: 'skills',
          action: 'rollback_skill',
          targetType: 'skill',
          targetId: req.params.skillId,
          after: { fromVersionId: versionId, newVersionId: rolledVersion.id },
        }),
      );
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '回滚 Skill 失败' });
    }
  });

  app.get('/api/admin/studio/agents', requireAdmin, async (_req, res) => {
    try {
      const data = await listAgentViews();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取智能体列表失败' });
    }
  });

  app.get('/api/admin/studio/agents/:agentId', requireAdmin, async (req, res) => {
    try {
      const data = await getAgentView(req.params.agentId);
      res.json({ success: true, data });
    } catch (error) {
      if (error instanceof Error && /not found/i.test(error.message)) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取智能体详情失败' });
    }
  });

  app.patch('/api/admin/studio/agents/:agentId/business', requireAdmin, async (req, res) => {
    try {
      const session = (req as express.Request & { adminSession: NonNullable<ReturnType<AuthKit['currentSession']>> }).adminSession;
      const externalId = session.user.email || session.user.phone || 'admin';
      const data = await updateAgentBusinessFrame(req.params.agentId, (req.body ?? {}) as SkillBusinessFrameUpdate, externalId);
      await writeAuditLog(
        auditFromRequest(req, actorFromSession(session), {
          module: 'skills',
          action: 'update_agent_business',
          targetType: 'agent',
          targetId: req.params.agentId,
        }),
      );
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '更新业务配置失败' });
    }
  });

  app.get('/api/admin/debug/info', requireAdmin, async (_req, res) => {
    try {
      const dashboard = await getAdminDashboardStats();
      const data = await listAllSkills();
      res.json({
        success: true,
        data: {
          nodeEnv: process.env.NODE_ENV ?? 'development',
          databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
          allowInmemoryFallback: process.env.ALLOW_INMEMORY_FALLBACK === 'true',
          dashboard,
          skillLayers: data.byLayer,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : '读取调试信息失败' });
    }
  });

  registerAdminAgentRoutes(app, requireAdmin, authKit);
}
