import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../../lib/adminApi';
import type { SkillDebugResult, SkillRecord, SkillVersionRecord } from '../../types/skills';
import {
  AdminCard,
  AdminPageHeader,
  AdminTable,
  StatusBadge,
  adminBtnPrimaryClass,
  adminInputClass,
  adminLinkClass,
  adminTabClass,
} from '../../components/admin/AdminUi';

type DetailTab = 'overview' | 'business' | 'versions' | 'debug';

export default function AdminSkillDetailPage() {
  const { skillId = '' } = useParams();
  const [tab, setTab] = useState<DetailTab>('overview');
  const [skill, setSkill] = useState<SkillRecord | null>(null);
  const [versions, setVersions] = useState<SkillVersionRecord[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goalSummary, setGoalSummary] = useState('');
  const [promiseLine, setPromiseLine] = useState('');
  const [understandingPrompt, setUnderstandingPrompt] = useState('');

  const [debugInput, setDebugInput] = useState({
    sellingPoint: '轻薄防晒，通勤不闷汗',
    platform: '抖音',
    effectGoal: '更像真人种草',
    referenceDirection: '',
  });
  const [debugResult, setDebugResult] = useState<SkillDebugResult | null>(null);

  const load = async () => {
    if (!skillId) return;
    const [nextSkill, nextVersions] = await Promise.all([
      adminApi.studioSkill(skillId),
      adminApi.studioSkillVersions(skillId),
    ]);
    setSkill(nextSkill);
    setVersions(nextVersions);
    setName(nextSkill.name);
    setDescription(nextSkill.description ?? '');
    setGoalSummary(nextSkill.latestVersion.businessFrame.goal.summary);
    setPromiseLine(nextSkill.latestVersion.businessFrame.result.promiseLine);
    setUnderstandingPrompt(nextSkill.latestVersion.understandingConfig.prompt);
  };

  useEffect(() => {
    void load().catch((error) => {
      setMessage(error instanceof Error ? error.message : '加载失败');
    });
  }, [skillId]);

  const runAction = async (label: string, action: () => Promise<void>) => {
    setBusy(true);
    setMessage('');
    try {
      await action();
      setMessage(label);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '操作失败');
    } finally {
      setBusy(false);
    }
  };

  if (!skill) {
    return (
      <div>
        <AdminPageHeader title="Skill 详情" desc={skillId || '—'} />
        <p className="text-sm text-black/45">{message || '加载中…'}</p>
      </div>
    );
  }

  const latest = skill.latestVersion;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={skill.name}
        desc={`${skill.slug} · v${skill.currentVersion}`}
        action={
          <div className="flex items-center gap-2">
            <Link to="/admin/skills" className="text-xs text-black/45 hover:text-[#111111]">
              ← 返回列表
            </Link>
            <StatusBadge value={skill.status} />
            <button
              type="button"
              disabled={busy || skill.status === 'published'}
              onClick={() =>
                void runAction('已发布', async () => {
                  await adminApi.publishStudioSkill(skill.id);
                })
              }
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              发布
            </button>
          </div>
        }
      />

      {message ? <p className="text-xs text-black/45">{message}</p> : null}

      <div className="flex gap-2 flex-wrap">
        {(
          [
            { id: 'overview' as const, label: '概览' },
            { id: 'business' as const, label: '业务配置' },
            { id: 'versions' as const, label: '版本' },
            { id: 'debug' as const, label: '调试' },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={adminTabClass(tab === item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="grid grid-cols-2 gap-4">
          <AdminCard className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">基础信息</h3>
            <dl className="text-sm space-y-2 text-[#333333]">
              <div className="flex justify-between gap-4">
                <dt className="text-black/45">ID</dt>
                <dd className="text-right break-all">{skill.id}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-black/45">分类</dt>
                <dd>{skill.category}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-black/45">更新时间</dt>
                <dd>{new Date(skill.updatedAt).toLocaleString('zh-CN')}</dd>
              </div>
              {skill.publishedAt ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-black/45">发布时间</dt>
                  <dd>{new Date(skill.publishedAt).toLocaleString('zh-CN')}</dd>
                </div>
              ) : null}
            </dl>
          </AdminCard>
          <AdminCard className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">当前版本</h3>
            <dl className="text-sm space-y-2 text-[#333333]">
              <div className="flex justify-between gap-4">
                <dt className="text-black/45">版本标签</dt>
                <dd>{latest.versionLabel}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-black/45">Checksum</dt>
                <dd className="text-right break-all text-xs font-mono">{latest.checksum ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-black/45">执行模式</dt>
                <dd>{latest.executionConfig.mode}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-black/45">阶段数</dt>
                <dd>{latest.businessFrame.executionPlan.stages.length}</dd>
              </div>
            </dl>
          </AdminCard>
        </div>
      ) : null}

      {tab === 'business' ? (
        <AdminCard className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-black/45">名称</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
            <label className="block text-sm">
              <span className="text-black/45">描述</span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-black/45">目标摘要（goal.summary）</span>
            <textarea
              value={goalSummary}
              onChange={(event) => setGoalSummary(event.target.value)}
              rows={3}
              className={`mt-1 ${adminInputClass}`}
            />
          </label>
          <label className="block text-sm">
            <span className="text-black/45">交付承诺（result.promiseLine）</span>
            <textarea
              value={promiseLine}
              onChange={(event) => setPromiseLine(event.target.value)}
              rows={2}
              className={`mt-1 ${adminInputClass}`}
            />
          </label>
          <label className="block text-sm">
            <span className="text-black/45">理解 Prompt</span>
            <textarea
              value={understandingPrompt}
              onChange={(event) => setUnderstandingPrompt(event.target.value)}
              rows={4}
              className={`mt-1 ${adminInputClass} font-mono text-xs`}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void runAction('业务配置已保存', async () => {
                const nextLatest: SkillVersionRecord = {
                  ...latest,
                  understandingConfig: {
                    ...latest.understandingConfig,
                    prompt: understandingPrompt,
                  },
                  businessFrame: {
                    ...latest.businessFrame,
                    goal: { ...latest.businessFrame.goal, summary: goalSummary },
                    result: { ...latest.businessFrame.result, promiseLine },
                  },
                };
                await adminApi.updateStudioSkill(skill.id, {
                  name: name.trim(),
                  description: description.trim() || undefined,
                  latestVersion: nextLatest,
                });
              })
            }
            className={adminBtnPrimaryClass}
          >
            保存配置
          </button>
        </AdminCard>
      ) : null}

      {tab === 'versions' ? (
        <AdminCard>
          <AdminTable
            rows={versions as unknown as Array<Record<string, unknown>>}
            columns={[
              { key: 'versionLabel', label: '版本' },
              { key: 'versionNumber', label: '序号' },
              {
                key: 'status',
                label: '状态',
                render: (row) => <StatusBadge value={String(row.status)} />,
              },
              {
                key: 'checksum',
                label: 'Checksum',
                render: (row) => (
                  <span className="font-mono text-xs max-w-[180px] truncate inline-block">
                    {String(row.checksum ?? '—')}
                  </span>
                ),
              },
              {
                key: 'createdAt',
                label: '创建时间',
                render: (row) => new Date(String(row.createdAt)).toLocaleString('zh-CN'),
              },
              {
                key: 'id',
                label: '操作',
                render: (row) => (
                  <button
                    type="button"
                    disabled={busy || row.id === latest.id}
                    onClick={() =>
                      void runAction('已回滚到所选版本（新建草稿）', async () => {
                        await adminApi.rollbackStudioSkill(skill.id, String(row.id));
                      })
                    }
                    className={`${adminLinkClass} disabled:opacity-40`}
                  >
                    回滚到此版本
                  </button>
                ),
              },
            ]}
          />
        </AdminCard>
      ) : null}

      {tab === 'debug' ? (
        <div className="grid grid-cols-2 gap-4">
          <AdminCard className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">调试输入</h3>
            <label className="block text-sm">
              <span className="text-black/45">卖点</span>
              <input
                value={debugInput.sellingPoint}
                onChange={(event) => setDebugInput((prev) => ({ ...prev, sellingPoint: event.target.value }))}
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
            <label className="block text-sm">
              <span className="text-black/45">平台</span>
              <input
                value={debugInput.platform}
                onChange={(event) => setDebugInput((prev) => ({ ...prev, platform: event.target.value }))}
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
            <label className="block text-sm">
              <span className="text-black/45">风格目标</span>
              <input
                value={debugInput.effectGoal}
                onChange={(event) => setDebugInput((prev) => ({ ...prev, effectGoal: event.target.value }))}
                className={`mt-1 ${adminInputClass}`}
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction('调试完成', async () => {
                  const result = await adminApi.debugStudioSkill(skill.id, debugInput);
                  setDebugResult(result);
                })
              }
              className="text-sm px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40"
            >
              运行调试
            </button>
          </AdminCard>
          <AdminCard className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">调试输出</h3>
            {!debugResult ? (
              <p className="text-sm text-black/45">运行调试后在此查看理解结果与日志</p>
            ) : (
              <div className="text-sm space-y-3 text-[#333333]">
                <p>
                  <span className="text-black/45">模型：</span>
                  {debugResult.provider} / {debugResult.model} ({debugResult.source})
                </p>
                <p>
                  <span className="text-black/45">目标用户：</span>
                  {debugResult.understanding.targetAudience}
                </p>
                <p>
                  <span className="text-black/45">视频风格：</span>
                  {debugResult.understanding.videoStyle}
                </p>
                <p>
                  <span className="text-black/45">脚本草案：</span>
                  {debugResult.understanding.draftScript}
                </p>
                <ul className="space-y-1 text-xs">
                  {debugResult.logs.map((log, index) => (
                    <li key={index} className="text-black/50">
                      [{log.level}] {log.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AdminCard>
        </div>
      ) : null}
    </div>
  );
}
