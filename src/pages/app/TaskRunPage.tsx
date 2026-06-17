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
import TaskRunLayout from '../../components/app/tasks/TaskRunLayout';

export default function TaskRunPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [rerunError, setRerunError] = useState('');

  useSyncExternalStore(subscribeTasks, getTasks, getTasks);
  const task = id ? getTask(id) : undefined;

  useEffect(() => {
    if (!id || !task) return;
    if (task.status === 'running' && !isTaskRunning(id) && !task.result && task.logs.length === 0) {
      runGeoTask(id);
    }
  }, [id, task?.status, task?.logs.length, task?.result]);

  if (!task) {
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

  const current = getTask(id!)!;

  const handleConfirm = () => {
    if (id) resumeGeoTaskAfterConfirmation(id);
  };

  const handleCancel = () => {
    saveTask({
      ...current,
      status: 'cancelled',
      pendingConfirmation: undefined,
    });
  };

  const handleRerun = () => {
    if (!id) return;
    if (current.agentType === 'geo' && !isAgentActive('geo')) {
      setRerunError('GEO 智能体未启用，请先在智能体广场启用后再重新运行');
      return;
    }
    setRerunError('');
    runGeoTask(id);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="px-6 py-3 border-b border-black/8">
        <button
          type="button"
          onClick={() => navigate('/app/tasks')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-black/50 hover:text-black"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          任务中心
        </button>
        {rerunError && (
          <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2">
            {rerunError}
          </p>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <TaskRunLayout
          task={current}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onRerun={handleRerun}
        />
      </div>
    </div>
  );
}
