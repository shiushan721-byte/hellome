import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Shield } from 'lucide-react';
import {
  DEFAULT_GEO_MODELS,
  DEPTH_CONFIG,
  type DetectionDepth,
  type GeoTaskInput,
} from '../../types/workbench';
import { createGeoTask } from '../../lib/taskStore';
import { canAffordTask, getUsage } from '../../lib/usageStore';
import { runGeoTask } from '../../lib/geoTaskRunner';
import { estimateGeoTokens, formatToken, formatTokenRange } from '../../lib/tokenBilling';

export default function GeoAgentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { prompt?: string } | null;

  const [brandName, setBrandName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [keywords, setKeywords] = useState(state?.prompt || '');
  const [competitors, setCompetitors] = useState('');
  const [models, setModels] = useState<string[]>([...DEFAULT_GEO_MODELS]);
  const [depth, setDepth] = useState<DetectionDepth>('standard');
  const [error, setError] = useState('');

  const usage = getUsage();

  const draftInput = useMemo(
    (): GeoTaskInput => ({
      brandName: brandName.trim(),
      websiteUrl: websiteUrl.trim(),
      keywords: keywords.trim(),
      competitors: competitors.trim(),
      models,
      depth,
    }),
    [brandName, websiteUrl, keywords, competitors, models, depth],
  );

  const estimate = useMemo(() => estimateGeoTokens(draftInput), [draftInput]);
  const affordable = canAffordTask(estimate.max, usage);
  const remainMin = Math.max(0, usage.tokenBalance - estimate.max);
  const remainMax = Math.max(0, usage.tokenBalance - estimate.min);

  const toggleModel = (m: string) => {
    setModels((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!brandName.trim()) {
      setError('请填写品牌名');
      return;
    }
    if (!websiteUrl.trim()) {
      setError('请填写官网 URL');
      return;
    }
    if (models.length === 0) {
      setError('请至少选择一个检测模型');
      return;
    }
    if (!affordable) {
      setError('当前余额不足以启动该任务，请充值或降低检测深度');
      return;
    }

    const task = createGeoTask(draftInput);
    runGeoTask(task.id);
    navigate(`/app/tasks/${task.id}`);
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-display">GEO 智能体</h1>
        <p className="text-sm text-black/50 mt-1">收集检测参数，启动品牌 AI 可见度检测任务</p>
      </div>

      <div className="flex items-start gap-2 p-3 bg-[#F2F0ED] text-xs text-black/60 mb-6">
        <Shield className="w-4 h-4 shrink-0 mt-0.5" />
        <p>本任务将访问公开网页，不会执行发布、提交、删除等高风险动作。</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Field label="品牌名 *">
          <input
            required
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="w-full py-3 px-4 text-sm bg-white border border-black/10 outline-none focus:ring-1 focus:ring-black/20"
            placeholder="例如：HelloMe"
          />
        </Field>

        <Field label="官网 URL *">
          <input
            required
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="w-full py-3 px-4 text-sm bg-white border border-black/10 outline-none focus:ring-1 focus:ring-black/20"
            placeholder="https://example.com"
          />
        </Field>

        <Field label="核心关键词">
          <input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full py-3 px-4 text-sm bg-white border border-black/10 outline-none focus:ring-1 focus:ring-black/20"
            placeholder="智能体平台, GEO 优化"
          />
        </Field>

        <Field label="竞品名称">
          <input
            value={competitors}
            onChange={(e) => setCompetitors(e.target.value)}
            className="w-full py-3 px-4 text-sm bg-white border border-black/10 outline-none focus:ring-1 focus:ring-black/20"
            placeholder="竞品 A, 竞品 B"
          />
        </Field>

        <Field label="检测模型">
          <div className="flex flex-wrap gap-2">
            {DEFAULT_GEO_MODELS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggleModel(m)}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                  models.includes(m)
                    ? 'bg-black text-white border-black'
                    : 'border-black/15 hover:bg-[#F2F0ED]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </Field>

        <Field label="检测深度">
          <div className="space-y-2">
            {(Object.keys(DEPTH_CONFIG) as DetectionDepth[]).map((d) => {
              const cfg = DEPTH_CONFIG[d];
              return (
                <label
                  key={d}
                  className={`flex items-start gap-3 p-3 border cursor-pointer transition-colors ${
                    depth === d ? 'border-black bg-[#F2F0ED]/50' : 'border-black/10 hover:bg-[#F2F0ED]/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="depth"
                    checked={depth === d}
                    onChange={() => setDepth(d)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-bold">{cfg.label}</p>
                    <p className="text-xs text-black/50">{cfg.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </Field>

        <div className="p-4 bg-[#F2F0ED]/80 border border-black/8 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-black/50">预计消耗</span>
            <span className="font-bold font-mono">{formatTokenRange(estimate)} Token</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/50">当前余额</span>
            <span className="font-mono">{formatToken(usage.tokenBalance)} Token</span>
          </div>
          <div className="flex justify-between">
            <span className="text-black/50">预计完成后剩余</span>
            <span className="font-mono text-black/70">
              约 {formatToken(remainMin)}-{formatToken(remainMax)} Token
            </span>
          </div>
          <p className="text-[11px] text-black/40 pt-1 leading-relaxed">
            实际消耗会根据网页内容、模型调用次数和生成结果长度浮动。
          </p>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {!affordable && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDepth('quick')}
              className="px-3 py-2 text-xs font-bold border border-black/15 hover:bg-[#F2F0ED]"
            >
              降低为快速检测
            </button>
            <Link
              to="/app/usage"
              className="px-3 py-2 text-xs font-bold bg-black text-white hover:bg-black/85"
            >
              充值 Token
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={!affordable}
          className="w-full py-3.5 bg-black text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-black/85 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          开始任务
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-black/60 mb-2">{label}</label>
      {children}
    </div>
  );
}
