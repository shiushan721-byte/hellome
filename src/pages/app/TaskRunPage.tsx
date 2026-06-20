import { useEffect, useState, useSyncExternalStore } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getTask, subscribeTasks, getTasks, saveTask } from '../../lib/taskStore';
import {
  runGeoTask,
  resumeGeoTaskAfterConfirmation,
  isTaskRunning,
} from '../../lib/geoTaskRunner';
import { isAgentActive } from '../../lib/agentSlotStore';
import { cancelRemoteTask, confirmRemoteTask, getRemoteTask, retryRemoteTask } from '../../lib/taskApi';
import { retryRemoteUgcTaskWithInput } from '../../lib/taskApi';
import TaskRunLayout from '../../components/app/tasks/TaskRunLayout';
import type { Task } from '../../types/workbench';

const terminalStatuses = new Set(['completed', 'failed', 'cancelled']);

export default function TaskRunPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rerunError, setRerunError] = useState('');
  const [remoteTask, setRemoteTask] = useState<Task | null>(null);
  const [remoteLoaded, setRemoteLoaded] = useState(false);

  useSyncExternalStore(subscribeTasks, getTasks, getTasks);
  const localTask = id ? getTask(id) : undefined;
  const task = localTask ?? remoteTask ?? undefined;

  useEffect(() => {
    if (!id || localTask) return;
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getRemoteTask(id);
        if (!cancelled) {
          setRemoteTask(data);
          setRemoteLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setRemoteLoaded(true);
        }
      }
    };

    void load();
    const timer = window.setInterval(async () => {
      try {
        const data = await getRemoteTask(id);
        if (!cancelled) {
          setRemoteTask(data);
          if (terminalStatuses.has(data.status)) {
            window.clearInterval(timer);
          }
        }
      } catch {
        window.clearInterval(timer);
      }
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [id, localTask]);

  useEffect(() => {
    if (!id || !localTask) return;
    if (
      localTask.status === 'running' &&
      !isTaskRunning(id) &&
      !localTask.result &&
      localTask.logs.length === 0
    ) {
      runGeoTask(id);
    }
  }, [id, localTask]);

  if (!task && remoteLoaded) {
    return (
      <div className="p-8 text-center">
        <p className="text-black/50 mb-4">任务不存在</p>
        <button
          type="button"
          onClick={() => navigate('/app/tasks')}
          className="text-sm font-bold underline"
        >
          返回任务中心
        </button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8 text-center text-sm text-black/45">
        正在读取任务详情…
      </div>
    );
  }

  const handleConfirm = async () => {
    if (!id) return;
    if (task.agentType === 'media') {
      try {
        const next = await confirmRemoteTask(id);
        setRemoteTask(next);
      } catch (error) {
        setRerunError(error instanceof Error ? error.message : '确认任务失败');
      }
      return;
    }
    resumeGeoTaskAfterConfirmation(id);
  };

  const handleCancel = () => {
    if (task.agentType === 'media') {
      if (!id) return;
      void cancelRemoteTask(id)
        .then((next) => setRemoteTask(next))
        .catch((error) => {
          setRerunError(error instanceof Error ? error.message : '取消任务失败');
        });
      return;
    }
    const current = getTask(id!)!;
    saveTask({
      ...current,
      status: 'cancelled',
      pendingConfirmation: undefined,
    });
  };

  const handleRerun = async () => {
    if (!id) return;
    if (task.agentType === 'media') {
      try {
        const next = await retryRemoteTask(id);
        setRemoteTask(next);
      } catch (error) {
        setRerunError(error instanceof Error ? error.message : '重新运行失败');
      }
      return;
    }
    if (!isAgentActive('geo')) {
      setRerunError('GEO 智能体未启用，请先在智能体市场启用后再重新运行');
      return;
    }
    setRerunError('');
    runGeoTask(id);
  };

  const handlePrimaryAction = async () => {
    if (!id) return;

    if (task.agentType === 'media') {
      try {
        setRerunError('');
        if (task.status === 'waiting_confirmation') {
          const next = await confirmRemoteTask(id);
          setRemoteTask(next);
          return;
        }
        if (
          task.recoveryState?.runState === 'interrupted' &&
          (task.recoveryState.resumeMode === 'continue' ||
            task.recoveryState.resumeMode === 'retry_step')
        ) {
          const next = await retryRemoteTask(id);
          setRemoteTask(next);
        }
      } catch (error) {
        setRerunError(error instanceof Error ? error.message : '任务继续失败');
      }
      return;
    }

    if (task.status === 'waiting_confirmation') {
      resumeGeoTaskAfterConfirmation(id);
      return;
    }

    if (task.status === 'failed') {
      if (!isAgentActive('geo')) {
        setRerunError('GEO 智能体未启用，请先在智能体市场启用后再重新运行');
        return;
      }
      setRerunError('');
      runGeoTask(id);
    }
  };

  const handleReviseAndRerun = async (input: {
    sellingPoint: string;
    platform: string;
    effectGoal: string;
    referenceUrl?: string;
  }) => {
    if (!id || task.agentType !== 'media') return;
    try {
      setRerunError('');
      const next = await retryRemoteUgcTaskWithInput(id, input);
      setRemoteTask(next);
    } catch (error) {
      setRerunError(error instanceof Error ? error.message : '修改后重新生成失败');
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#F5F5F7]">
      <div className="px-4 pt-4 sm:px-6 lg:px-8 xl:px-10">
        <button
          type="button"
          onClick={() => navigate('/app/tasks')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          返回任务中心
        </button>
        {rerunError ? (
          <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            {rerunError}
          </p>
        ) : null}
      </div>
      <div className="min-h-0 flex-1">
        <TaskRunLayout
          task={task}
          onPrimaryAction={() => {
            void handlePrimaryAction();
          }}
          onConfirm={() => {
            void handleConfirm();
          }}
          onCancel={handleCancel}
          onRerun={() => {
            void handleRerun();
          }}
          onReviseAndRerun={(input) => {
            void handleReviseAndRerun(input);
          }}
        />
      </div>
    </div>
  );
}
