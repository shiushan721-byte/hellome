import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  generateText,
  listAvailableModels,
  listAvailableMediaModels,
  type GenerateTextInput,
} from './src/server/adapters/modelAdapter';
import {
  getUsageLedgerForExternalId,
  getUsageSummaryForExternalId,
} from './src/server/billingService';
import {
  getSkillExperienceConfig,
  getSkillRuntimeConfig,
  getSkill,
  getSkillVersions,
  listSkills,
  publishSkill,
  runSkillDebug,
  updateSkill,
} from './src/server/skillStudioService';
import { listAllSkills } from './src/server/adminSkillService';
import {
  cancelUgcTask,
  createUgcTask,
  deleteUgcTask,
  getHermesRuntimeStatus,
  getUgcTask,
  getUgcTaskEvents,
  isMediaTaskId,
  listUgcTasks,
  retryUgcTask,
  runHermesDebug,
  confirmUgcTask,
} from './src/server/ugcTaskService';
import {
  createExecutionGrant,
  revokeExecutionGrant,
  ExecutionGrantError,
} from './src/server/executionGrantService';
import { ingestHermesTaskEvent, HermesEventIngestError } from './src/server/hermesEventIngestService';
import {
  getPublishedSkillRuntimeSnapshot,
  PublishedSkillVersionRequiredError,
} from './src/server/skillStudioService';
import {
  getHermesPairingStatus,
  pairHermesLocally,
  revokeHermesPairing,
} from './src/server/hermesPairingService';
import { createAuthKit } from './复用组件库/auth-login-kit/server-auth-kit';
import { registerDbHealthRoute } from './src/server/bootstrap/dbHealth';
import { assertDatabaseReady, isFallbackAllowed } from './src/server/db/runtime';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const uploadDir = path.join(process.cwd(), 'public', 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({ storage });

app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(uploadDir));
const authKit = createAuthKit();

const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('GoogleGenAI initialized successfully with backend API key.');
  } catch (error) {
    console.error('Failed to initialize GoogleGenAI:', error);
  }
} else {
  console.log('No valid GEMINI_API_KEY found. Using high-fidelity local simulator fallback.');
}
authKit.registerRoutes(app);
registerDbHealthRoute(app);

app.get('/api/billing/usage', async (req, res) => {
  try {
    const externalId = authKit.getCurrentExternalId(req);
    const data = await getUsageSummaryForExternalId(externalId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '读取算力余额失败',
    });
  }
});

app.get('/api/billing/ledger', async (req, res) => {
  try {
    const externalId = authKit.getCurrentExternalId(req);
    const data = await getUsageLedgerForExternalId(externalId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '读取算力账本失败',
    });
  }
});

app.get('/api/studio/skills', async (req, res) => {
  const session = authKit.requireCreatorSession(req, res);
  if (!session) return;
  try {
    const data = await listSkills();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '读取 Skill 列表失败',
    });
  }
});

app.get('/api/studio/skills/:skillId', async (req, res) => {
  const session = authKit.requireCreatorSession(req, res);
  if (!session) return;
  try {
    const data = await getSkill(req.params.skillId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '读取 Skill 详情失败',
    });
  }
});

app.put('/api/studio/skills/:skillId', async (req, res) => {
  const session = authKit.requireCreatorSession(req, res);
  if (!session) return;
  try {
    const payload = req.body as {
      name?: string;
      description?: string;
      latestVersion?: Parameters<typeof updateSkill>[2]['latestVersion'];
    };
    if (!payload.name?.trim() || !payload.latestVersion) {
      res.status(400).json({ success: false, error: 'Skill 名称和版本配置不能为空' });
      return;
    }
    const externalId = session.user.email || session.user.phone || 'local-user';
    const data = await updateSkill(externalId, req.params.skillId, {
      name: payload.name.trim(),
      description: payload.description?.trim() || undefined,
      latestVersion: payload.latestVersion,
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '保存 Skill 配置失败',
    });
  }
});

app.get('/api/studio/skills/:skillId/versions', async (req, res) => {
  const session = authKit.requireCreatorSession(req, res);
  if (!session) return;
  try {
    const data = await getSkillVersions(req.params.skillId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '读取 Skill 版本失败',
    });
  }
});

app.post('/api/studio/skills/:skillId/publish', async (req, res) => {
  const session = authKit.requireCreatorSession(req, res);
  if (!session) return;
  try {
    const externalId = session.user.email || session.user.phone || 'local-user';
    const data = await publishSkill(externalId, req.params.skillId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '发布 Skill 失败',
    });
  }
});

app.post('/api/studio/skills/:skillId/debug', async (req, res) => {
  const session = authKit.requireCreatorSession(req, res);
  if (!session) return;
  try {
    const externalId = session.user.email || session.user.phone || 'local-user';
    const input = req.body as {
      sellingPoint?: string;
      platform?: string;
      effectGoal?: string;
      referenceDirection?: string;
    };
    if (!input.sellingPoint?.trim()) {
      res.status(400).json({ success: false, error: '调试卖点不能为空' });
      return;
    }
    const data = await runSkillDebug(externalId, req.params.skillId, {
      sellingPoint: input.sellingPoint.trim(),
      platform: input.platform?.trim() || '抖音',
      effectGoal: input.effectGoal?.trim() || '更像真人种草',
      referenceDirection: input.referenceDirection?.trim() || undefined,
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Skill 调试失败',
    });
  }
});

app.get('/api/models', (_req, res) => {
  res.json({ success: true, data: listAvailableModels() });
});

/**
 * GET /api/admin/skills
 *   Aggregate inventory of every skill this project exposes across all
 *   three layers (engineering / business / generation). Introspection-only
 *   endpoint — no DB writes, no auth required. Powering ops/dev tooling
 *   and a future admin dashboard.
 *
 * Query params:
 *   layer  filter to one of: engineering | business | generation
 *   q      substring match against id / name / description
 */
app.get('/api/admin/skills', async (req, res) => {
  try {
    const data = await listAllSkills();
    let skills = data.skills;
    const layer = String(req.query.layer ?? '').trim();
    if (layer && ['engineering', 'business', 'generation'].includes(layer)) {
      skills = skills.filter((s) => s.layer === layer);
    }
    const q = String(req.query.q ?? '').trim().toLowerCase();
    if (q) {
      skills = skills.filter((s) =>
        s.id.toLowerCase().includes(q)
        || s.name.toLowerCase().includes(q)
        || s.description.toLowerCase().includes(q),
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
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'skill inventory failed',
    });
  }
});

app.get('/api/skills/:skillId/runtime', async (req, res) => {
  try {
    const data = await getSkillRuntimeConfig(req.params.skillId);
    res.json({ success: true, data });
  } catch (error) {
    if (error instanceof PublishedSkillVersionRequiredError) {
      res.status(409).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '读取 Skill 执行配置失败',
    });
  }
});

app.get('/api/skills/:skillId/experience', async (req, res) => {
  try {
    const data = await getSkillExperienceConfig(req.params.skillId);
    res.json({ success: true, data });
  } catch (error) {
    if (error instanceof PublishedSkillVersionRequiredError) {
      res.status(409).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '读取 Skill 前台配置失败',
    });
  }
});

app.get('/api/skills/:skillId/published-runtime', async (req, res) => {
  try {
    const data = await getPublishedSkillRuntimeSnapshot(req.params.skillId);
    res.json({ success: true, data });
  } catch (error) {
    if (error instanceof PublishedSkillVersionRequiredError) {
      res.status(409).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '读取已发布 Skill 快照失败',
    });
  }
});

app.post('/api/execution-grants', async (req, res) => {
  try {
    const taskId = String(req.body?.taskId ?? '').trim();
    const skillId = String(req.body?.skillId ?? '').trim();
    const skillVersionId = String(req.body?.skillVersionId ?? '').trim();
    const deviceId = String(req.body?.deviceId ?? '').trim() || undefined;

    if (!taskId || !skillId || !skillVersionId) {
      res.status(400).json({ success: false, error: 'taskId、skillId、skillVersionId 不能为空' });
      return;
    }

    const grant = await createExecutionGrant({ taskId, skillId, skillVersionId, deviceId });
    res.status(201).json({
      success: true,
      data: {
        grantId: grant.grantId,
        token: grant.token,
        expiresAt: grant.expiresAt,
        allowedProviders: grant.allowedProviders,
        allowedModels: grant.allowedModels,
        tokenBudgetMax: grant.tokenBudgetMax,
      },
    });
  } catch (error) {
    if (error instanceof ExecutionGrantError) {
      res.status(error.code === 'UNAVAILABLE' ? 503 : 400).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建 execution grant 失败',
    });
  }
});

app.post('/api/execution-grants/:id/revoke', async (req, res) => {
  try {
    const data = await revokeExecutionGrant(req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    if (error instanceof ExecutionGrantError) {
      res.status(error.code === 'NOT_FOUND' ? 404 : 400).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '撤销 execution grant 失败',
    });
  }
});

app.post('/api/tasks/:id/events', async (req, res) => {
  try {
    const grantToken = String(req.body?.grantToken ?? req.headers['x-execution-grant'] ?? '').trim() || undefined;
    const envelope = req.body?.envelope ?? req.body;
    const data = await ingestHermesTaskEvent({
      taskId: req.params.id,
      envelope,
      grantToken,
    });
    res.status(202).json({ success: true, data });
  } catch (error) {
    if (error instanceof HermesEventIngestError) {
      const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'GRANT' ? 401 : 400;
      res.status(status).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Hermes 事件回传失败',
    });
  }
});

async function handleModelGenerate(req: express.Request, res: express.Response) {
  const prompt = String(req.body?.prompt ?? '').trim();
  const system = String(req.body?.system ?? '').trim() || undefined;

  if (!prompt) {
    res.status(400).json({ success: false, error: 'prompt 不能为空' });
    return;
  }

  try {
    const data = await generateText({ prompt, system } satisfies GenerateTextInput);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '模型生成失败',
    });
  }
}

app.post('/api/llm/generate', handleModelGenerate);
app.post('/api/llm/chat', handleModelGenerate);

app.get('/api/runtime/hermes', async (_req, res) => {
  try {
    const runtime = await getHermesRuntimeStatus();
    res.json({ success: true, data: runtime });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '无法读取 Hermes 运行时状态',
    });
  }
});

app.get('/api/hermes/pairing/status', async (req, res) => {
  try {
    const accountId = String(req.query.accountId ?? '').trim();
    const data = await getHermesPairingStatus(accountId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '读取 Hermes 配对状态失败',
    });
  }
});

app.post('/api/hermes/pairing/local-pair', async (req, res) => {
  try {
    const accountId = String(req.body?.accountId ?? '').trim();
    const displayName = String(req.body?.displayName ?? '').trim();
    const data = await pairHermesLocally({ accountId, displayName });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Hermes 本机配对失败',
    });
  }
});

app.post('/api/hermes/pairing/disconnect', async (req, res) => {
  try {
    const accountId = String(req.body?.accountId ?? '').trim();
    const data = await revokeHermesPairing(accountId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '解除 Hermes 配对失败',
    });
  }
});

app.post('/api/uploads', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: '未收到上传文件' });
    return;
  }

  res.json({
    success: true,
    data: {
      url: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
  });
});

app.post('/api/tasks/ugc', async (req, res) => {
  try {
    const { input, user } = req.body as {
      input?: {
        skillId?: string;
        productImageUrl?: string;
        productImageName?: string;
        talentImageUrl?: string;
        talentImageName?: string;
        sellingPoint?: string;
        platform?: string;
        effectGoal?: string;
        referenceUrl?: string;
      };
      user?: {
        externalId?: string;
        displayName?: string;
        email?: string;
        phone?: string;
        workspaceName?: string;
      };
    };

    if (!input?.sellingPoint?.trim()) {
      res.status(400).json({ success: false, error: '一句话卖点不能为空' });
      return;
    }

    const task = await createUgcTask({
      input: {
        skillId: input.skillId?.trim() || 'media-ugc',
        productImageUrl: input.productImageUrl,
        productImageName: input.productImageName,
        talentImageUrl: input.talentImageUrl,
        talentImageName: input.talentImageName,
        sellingPoint: input.sellingPoint.trim(),
        platform: input.platform?.trim() || '抖音',
        effectGoal: input.effectGoal?.trim() || '更像真人种草',
        referenceUrl: input.referenceUrl?.trim() || undefined,
      },
      userExternalId: user?.externalId?.trim() || 'local-user',
      displayName: user?.displayName?.trim(),
      email: user?.email?.trim(),
      phone: user?.phone?.trim(),
      workspaceName: user?.workspaceName?.trim() || '个人空间',
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    if (error instanceof PublishedSkillVersionRequiredError) {
      res.status(409).json({ success: false, error: error.message });
      return;
    }
    console.error('Failed to create UGC task:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '创建 UGC 任务失败',
    });
  }
});

app.get('/api/tasks', async (_req, res) => {
  try {
    const tasks = await listUgcTasks();
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '读取任务列表失败',
    });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    if (!isMediaTaskId(req.params.id)) {
      res.status(404).json({ success: false, error: '仅支持 UGC 任务详情' });
      return;
    }

    const task = await getUgcTask(req.params.id);
    if (!task) {
      res.status(404).json({ success: false, error: '任务不存在' });
      return;
    }
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '读取任务详情失败',
    });
  }
});

app.get('/api/tasks/:id/events', async (req, res) => {
  try {
    const events = await getUgcTaskEvents(req.params.id);
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '读取任务事件失败',
    });
  }
});

app.post('/api/tasks/:id/confirm', async (req, res) => {
  try {
    const task = await confirmUgcTask(req.params.id);
    if (!task) {
      res.status(404).json({ success: false, error: '任务不存在' });
      return;
    }
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '确认任务失败',
    });
  }
});

app.post('/api/tasks/:id/retry', async (req, res) => {
  try {
    const input = req.body?.input as
      | {
          productImageUrl?: string;
          productImageName?: string;
          talentImageUrl?: string;
          talentImageName?: string;
          sellingPoint?: string;
          platform?: string;
          effectGoal?: string;
          referenceUrl?: string;
        }
      | undefined;
    const task = await retryUgcTask(req.params.id, input);
    if (!task) {
      res.status(404).json({ success: false, error: '任务不存在' });
      return;
    }
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '重试任务失败',
    });
  }
});

app.post('/api/tasks/:id/cancel', async (req, res) => {
  try {
    const task = await cancelUgcTask(req.params.id);
    if (!task) {
      res.status(404).json({ success: false, error: '任务不存在' });
      return;
    }
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '取消任务失败',
    });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await deleteUgcTask(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '删除任务失败',
    });
  }
});

app.post('/api/hermes/debug-run', async (req, res) => {
  try {
    const result = await runHermesDebug({
      prompt: req.body?.prompt,
      recipe: req.body?.recipe,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Hermes 本地调试失败',
    });
  }
});

app.post('/api/check-brand', async (req, res) => {
  const { brandName, category, competitor } = req.body;

  if (!brandName) {
    res.status(400).json({ error: 'Brand name is required.' });
    return;
  }

  const normalizedCategory = category || '通用行业';
  const normalizedCompetitor = competitor || '行业竞品';

  if (aiClient) {
    try {
      const prompt = `You are HelloMe's Hz-Hermes GEO (Generative Engine Optimization) Check engine.
Analyze the brand "${brandName}" in the industry "${normalizedCategory}" relative to its competitor "${normalizedCompetitor}".
Provide a authentic or high-fidelity simulation of SEO & GEO visibility based on how modern AI Search Engines (like Gemini, Perplexity, OpenAI Search/ChatGPT, SearchGPT) render and recommend this brand in user queries in 2026.
Return complete data matching the required schema. Ensure values are realistic (e.g. large brands like Tesla/Lululemon get high scores, small unknown brands get reasonable values with optimization priorities).`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert market analyst specializing in AI Search visibility (GEO). You calculate exact search metrics, sentiment, mentions contexts, and suggest prioritized actions.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visibilityRate: {
                type: Type.NUMBER,
                description: 'Brand visibility rate in percentage (0 to 100).',
              },
              recommendationRate: {
                type: Type.NUMBER,
                description: 'Brand recommendation rate in user answers (0 to 100).',
              },
              competitorShare: {
                type: Type.NUMBER,
                description: 'The share of voice of competitor or major peer in answers (0 to 100).',
              },
              visibilityDetails: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    modelName: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                  },
                },
              },
              keyCompetitors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              brandMentions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    context: { type: Type.STRING },
                    sentiment: { type: Type.STRING },
                  },
                },
              },
              dynamicAnalysis: {
                type: Type.STRING,
                description: 'A summary analysis (1-2 sentences in Chinese) of why current visibility is at this level and what the core issue is in AI systems.',
              },
              actionableSuggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    priority: { type: Type.STRING },
                  },
                },
              },
            },
            required: [
              'visibilityRate',
              'recommendationRate',
              'competitorShare',
              'visibilityDetails',
              'keyCompetitors',
              'brandMentions',
              'dynamicAnalysis',
              'actionableSuggestions',
            ],
          },
        },
      });

      if (response?.text) {
        const result = JSON.parse(response.text.trim());
        res.json({ success: true, source: 'gemini', data: result });
        return;
      }
    } catch (error) {
      console.error('Gemini GEO check failed, executing high-fidelity fallback:', error);
    }
  }

  const hash = (brandName + normalizedCategory).split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const baseScore = 30 + (hash % 50);
  const recScore = Math.max(10, Math.min(95, Math.floor(baseScore * 0.9 + (hash % 15))));
  const compScore = Math.max(15, Math.min(90, Math.floor(100 - baseScore - (hash % 10))));

  const simulatedData = {
    visibilityRate: baseScore,
    recommendationRate: recScore,
    competitorShare: compScore,
    visibilityDetails: [
      { modelName: 'ChatGPT (Search)', score: Math.max(20, baseScore + (hash % 8) - 4) },
      { modelName: 'Gemini / Google AI Overviews', score: Math.max(20, baseScore + (hash % 12) - 6) },
      { modelName: 'Perplexity AI', score: Math.max(20, baseScore + (hash % 10) - 5) },
      { modelName: 'SearchGPT / Claude', score: Math.max(20, baseScore + (hash % 6) - 3) },
    ],
    keyCompetitors: [
      normalizedCompetitor !== '行业竞品' ? normalizedCompetitor : `${brandName} 同类产品A`,
      `行业领先品牌-${(hash % 3) + 1}`,
    ],
    brandMentions: [
      {
        context: `在查询“推荐优质的 ${normalizedCategory} 是什么”时，${brandName} 被列为前三提及。`,
        sentiment: baseScore > 50 ? 'positive' : 'neutral',
      },
      {
        context: `关于“${brandName} 怎么样，好用吗”的问答中，大模型重点引用了知乎用户评测。`,
        sentiment: 'positive',
      },
      {
        context: `当提及“${normalizedCategory} 的高性价比平替”或“主要缺点”时，竞品被优先列举。`,
        sentiment: 'neutral',
      },
    ],
    dynamicAnalysis: `通过对各大 AI 系统的语料和召回情况进行实时模拟，当前大模型在回答 ${normalizedCategory} 相关问题时，对 ${brandName} 的提及率为 ${baseScore}%。推荐率保持在 ${recScore}%，在特定技术社区和大众种草媒体中的可信度提及较高，但在结构化参考链接及核心竞品对比中仍有优化空间。`,
    actionableSuggestions: [
      {
        title: '优化第三方高权重科技、众测文章和论坛声量',
        description: `Perplexity 等 AI 搜索高度信赖知乎、小红书和专业评测平台的优质深度长尾讨论。建议增加关于 ${brandName} 真实反馈的内容铺设。`,
        priority: 'High',
      },
      {
        title: '结构化数据标签规范与品牌百科优化',
        description: '优化官网 Schema 标记，并丰富维基数据源的权威客观沉淀。',
        priority: 'High',
      },
      {
        title: '针对竞品对比矩阵的专项“反差推荐”话术',
        description: `在应对用户追问“${brandName} 相比 ${normalizedCompetitor} 的优势”时，强化差异化场景表达。`,
        priority: 'Medium',
      },
    ],
  };

  setTimeout(() => {
    res.json({ success: true, source: 'simulation', data: simulatedData });
  }, 1000);
});

async function startServer() {
  await assertDatabaseReady()
    .then(() => {
      console.log('[persistence] mode=database');
    })
    .catch((error) => {
      if (!isFallbackAllowed()) throw error;
      console.warn(
        '[persistence] mode=fallback reason=%s',
        error instanceof Error ? error.message : 'unknown',
      );
    });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HelloMe] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
