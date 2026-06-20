import type { GeoResultData } from '../types';
import type { GeoTaskInput, Task } from '../types/workbench';
import { getTask, saveTask } from './taskStore';
import {
  computeActualTokenUsage,
  distributeStepTokens,
} from './tokenBilling';
import { settleTaskTokens } from './usageStore';
import { recordAgentTaskCompletion } from './agentSlotStore';

function nowTime(): string {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function addLog(task: Task, message: string, level: Task['logs'][0]['level'] = 'info'): void {
  task.logs.push({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowTime(),
    message,
    level,
  });
}

function isGeoTask(task: Task): boolean {
  return Boolean(
    task.agentType === 'geo' &&
      task.input &&
      'brandName' in task.input &&
      'models' in task.input,
  );
}

function setStepStatus(
  task: Task,
  stepIndex: number,
  status: Task['steps'][0]['status'],
  tokenUsed?: number,
): void {
  task.steps = task.steps.map((s, i) => {
    if (i < stepIndex) return { ...s, status: 'completed' as const };
    if (i === stepIndex) {
      return { ...s, status, ...(tokenUsed != null ? { tokenUsed } : {}) };
    }
    return s;
  });
}

async function fetchGeoResult(task: Task): Promise<GeoResultData> {
  if (!isGeoTask(task)) {
    throw new Error('当前任务不是 GEO 任务');
  }
  const input = task.input as GeoTaskInput;
  const res = await fetch('/api/check-brand', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brandName: input.brandName,
      category: input.keywords || '通用行业',
      competitor: input.competitors.split(/[,，、]/)[0]?.trim() || '行业竞品',
    }),
  });
  if (!res.ok) throw new Error('GEO 检测请求失败');
  const json = await res.json();
  return json.data as GeoResultData;
}

function finalizeTask(task: Task, startMs: number, actualTotal: number, stepTokens: number[]): void {
  task.steps = task.steps.map((s, i) => ({
    ...s,
    tokenUsed: stepTokens[i] ?? s.tokenUsed,
  }));
  task.tokenUsed = actualTotal;
  task.currentTokenUsed = actualTotal;
  task.completedAt = new Date().toISOString();
  task.durationMs = Date.now() - startMs;
  task.status = 'completed';
  addLog(task, `任务完成，实际消耗 ${actualTotal.toLocaleString('zh-CN')} Token`, 'success');
  saveTask(task);
  settleTaskTokens({
    taskId: task.id,
    taskName: task.name,
    agent: 'GEO 智能体',
    estimatedTokenMin: task.estimatedTokenMin,
    estimatedTokenMax: task.estimatedTokenMax,
    tokenUsed: actualTotal,
  });
  recordAgentTaskCompletion('geo', actualTotal);
}

const running = new Set<string>();

export function isTaskRunning(id: string): boolean {
  return running.has(id);
}

export async function runGeoTask(taskId: string): Promise<void> {
  if (running.has(taskId)) return;
  running.add(taskId);

  const startMs = Date.now();
  let task = getTask(taskId);
  if (!task || !isGeoTask(task)) {
    running.delete(taskId);
    return;
  }
  const geoInput = task.input as GeoTaskInput;

  const actualTotal = computeActualTokenUsage(
    taskId,
    task.estimatedTokenMin,
    task.estimatedTokenMax,
  );
  const stepTokens = distributeStepTokens(actualTotal, task.steps.length);
  let accumulated = 0;

  task.status = 'running';
  task.logs = [];
  task.result = undefined;
  task.pendingConfirmation = undefined;
  task.tokenUsed = 0;
  task.currentTokenUsed = 0;
  task.steps = task.steps.map((s) => ({ ...s, status: 'pending' as const, tokenUsed: undefined }));
  saveTask(task);

  const stepMessages: string[][] = [
    ['已生成 24 个检测问题', '已根据关键词扩展长尾问法'],
    geoInput.models.map((m) => `正在检测 ${m}`),
    ['正在统计品牌出现率', '发现部分高价值问法未覆盖品牌'],
    ['正在分析 AI 推荐率', '推荐率与出现率存在差异'],
    ['正在分析竞品占位', '发现竞品出现率较高'],
    ['正在生成内容缺口清单', '已识别 6 个内容缺口'],
    ['正在生成优化建议', '已按优先级排序 8 条建议'],
    ['正在汇总 GEO 报告', '报告生成中…'],
  ];

  try {
    addLog(task, 'Hz-Hermes 已接收任务，开始编排执行流程', 'info');
    saveTask(task);

    let apiPromise: Promise<GeoResultData> | null = null;

    for (let i = 0; i < task.steps.length; i++) {
      task = getTask(taskId)!;
      setStepStatus(task, i, 'active');
      addLog(task, `开始：${task.steps[i].name}`, 'info');
      saveTask(task);

      if (i === 1) {
        apiPromise = fetchGeoResult(task);
      }

      const messages = stepMessages[i] || [`执行 ${task.steps[i].name}`];
      for (const msg of messages) {
        await delay(i === 1 ? 600 : 450);
        task = getTask(taskId)!;
        accumulated = stepTokens.slice(0, i).reduce((a, b) => a + b, 0);
        const partial = Math.round(accumulated + stepTokens[i] * 0.6);
        task.currentTokenUsed = partial;
        addLog(task, msg, 'info');
        saveTask(task);
      }

      if (i === 4) {
        task = getTask(taskId)!;
        accumulated = stepTokens.slice(0, i + 1).reduce((a, b) => a + b, 0);
        task.currentTokenUsed = accumulated;
        setStepStatus(task, i, 'completed', stepTokens[i]);
        task.status = 'waiting_confirmation';
        task.pendingConfirmation = {
          title: '访问公开网页确认',
          message:
            '本任务将访问公开网页进行分析，不会执行发布、提交、删除等高风险动作。是否继续深度分析？',
          action: 'confirm_web_access',
        };
        addLog(task, '等待用户确认：公开网页访问', 'warning');
        saveTask(task);
        running.delete(taskId);
        return;
      }

      task = getTask(taskId)!;
      accumulated = stepTokens.slice(0, i + 1).reduce((a, b) => a + b, 0);
      task.currentTokenUsed = accumulated;
      setStepStatus(task, i, 'completed', stepTokens[i]);
      addLog(task, `${task.steps[i].name}：${stepTokens[i].toLocaleString('zh-CN')} Token`, 'info');
      saveTask(task);
    }

    const result = apiPromise ? await apiPromise : await fetchGeoResult(task);
    task = getTask(taskId)!;
    task.result = result;
    finalizeTask(task, startMs, actualTotal, stepTokens);
  } catch (err) {
    task = getTask(taskId)!;
    task.status = 'failed';
    addLog(task, err instanceof Error ? err.message : '任务执行失败', 'error');
    saveTask(task);
    if (task.currentTokenUsed && task.currentTokenUsed > 0) {
      settleTaskTokens({
        taskId: task.id,
        taskName: task.name,
        agent: 'GEO 智能体',
        estimatedTokenMin: task.estimatedTokenMin,
        estimatedTokenMax: task.estimatedTokenMax,
        tokenUsed: task.currentTokenUsed,
        status: 'failed',
      });
      recordAgentTaskCompletion('geo', task.currentTokenUsed);
    }
  } finally {
    running.delete(taskId);
  }
}

export async function resumeGeoTaskAfterConfirmation(taskId: string): Promise<void> {
  const task = getTask(taskId);
  if (!task || task.status !== 'waiting_confirmation') return;

  const actualTotal = computeActualTokenUsage(
    taskId,
    task.estimatedTokenMin,
    task.estimatedTokenMax,
  );
  const stepTokens = distributeStepTokens(actualTotal, task.steps.length);

  task.pendingConfirmation = undefined;
  task.status = 'running';
  addLog(task, '用户已确认，继续执行', 'success');
  saveTask(task);

  const startMs = Date.now() - (task.durationMs || 0);
  running.add(taskId);

  try {
    for (let i = 5; i < task.steps.length; i++) {
      let current = getTask(taskId)!;
      setStepStatus(current, i, 'active');
      addLog(current, `开始：${current.steps[i].name}`, 'info');
      saveTask(current);

      await delay(500);
      current = getTask(taskId)!;
      const accumulated = stepTokens.slice(0, i + 1).reduce((a, b) => a + b, 0);
      current.currentTokenUsed = accumulated;
      setStepStatus(current, i, 'completed', stepTokens[i]);
      addLog(current, `${current.steps[i].name}：${stepTokens[i].toLocaleString('zh-CN')} Token`, 'info');
      saveTask(current);
      await delay(300);
    }

    const result = await fetchGeoResult(task);
    let final = getTask(taskId)!;
    final.result = result;
    finalizeTask(final, startMs, actualTotal, stepTokens);
  } catch (err) {
    const failed = getTask(taskId)!;
    failed.status = 'failed';
    addLog(failed, err instanceof Error ? err.message : '任务执行失败', 'error');
    saveTask(failed);
  } finally {
    running.delete(taskId);
  }
}
