import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trash2, Eye, Copy, RefreshCw } from 'lucide-react';
import { deleteTask, duplicateTask, getTasks, subscribeTasks } from '../../lib/taskStore';
import { runGeoTask } from '../../lib/geoTaskRunner';
import { isAgentActive } from '../../lib/agentSlotStore';
import { deleteRemoteTask, listRemoteTasks, retryRemoteTask } from '../../lib/taskApi';
import { getAgentById } from '../../data/agentsCatalog';
import TaskStatusBadge, {
  agentLabel,
  formatDuration,
  formatTime,
} from '../../components/app/tasks/TaskStatusBadge';
import { formatTokenRange } from '../../lib/tokenBilling';
import type { Task, TaskStatus } from '../../types/workbench';

const filters: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'queued', label: '排队中' },
  { value: 'running', label: '执行中' },
  { value: 'waiting_confirmation', label: '等待确认' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
];

export default function TasksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const agentFilter = searchParams.get('agent');
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all');
  const [actionError, setActionError] = useState('');
  const localTasks = useSyncExternalStore(subscribeTasks, getTasks, getTasks);
  const [remoteTasks, setRemoteTasks] = useState<Task[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await listRemoteTasks();
        if (!cancelled) {
          setRemoteTasks(data);
        }
      } catch {
        if (!cancelled) {
          setRemoteTasks([]);
        }
      }
    };

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const tasks = useMemo(() => {
    const merged = [...remoteTasks, ...localTasks.filter((task) => task.agentType !== 'media')];
    return merged.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [localTasks, remoteTasks]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (agentFilter) {
      list = list.filter((task) => task.agentType === agentFilter);
    }
    if (filter !== 'all') {
      list = list.filter((task) => task.status === filter);
    }
    return list;
  }, [tasks, agentFilter, filter]);

  const agentName = agentFilter ? getAgentById(agentFilter)?.name : null;

  const handleRerun = async (id: string) => {
    const original = tasks.find((task) => task.id === id);
    if (!original) return;

    try {
      if (original.agentType === 'media') {
        setActionError('');
        await retryRemoteTask(id);
        navigate(`/app/tasks/${id}`);
        return;
      }

      if (original.agentType === 'geo' && !isAgentActive('geo')) {
        setActionError('GEO 智能体未启用，请先在智能体市场启用后再重新运行');
        return;
      }

      setActionError('');
      const dup = duplicateTask(id);
      if (dup) {
        runGeoTask(dup.id);
        navigate(`/app/tasks/${dup.id}`);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '重新运行失败');
    }
  };

  const handleDelete = async (task: Task) => {
    try {
      if (task.agentType === 'media') {
        await deleteRemoteTask(task.id);
        setRemoteTasks((current) => current.filter((item) => item.id !== task.id));
        return;
      }
      deleteTask(task.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : '删除任务失败');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">任务中心</h1>
        {agentName ? <p className="mt-2 text-sm text-black/40">当前筛选：{agentName}</p> : null}
      </div>

      {actionError && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2">
          {actionError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`px-3 py-1.5 text-xs font-bold transition-colors ${
              filter === item.value
                ? 'bg-black text-white'
                : 'bg-[#F2F0ED] text-black/60 hover:text-black'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-black/40 py-12 text-center">暂无任务记录</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-black/40 border-b border-black/10">
                <th className="pb-3 pr-4">任务名称</th>
                <th className="pb-3 pr-4">智能体</th>
                <th className="pb-3 pr-4">状态</th>
                <th className="pb-3 pr-4 hidden md:table-cell">创建时间</th>
                <th className="pb-3 pr-4 hidden lg:table-cell">耗时</th>
                <th className="pb-3 pr-4 hidden lg:table-cell">Token 消耗</th>
                <th className="pb-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/8">
              {filtered.map((task) => (
                <tr key={task.id} className="group">
                  <td className="py-3 pr-4 font-medium">{task.name}</td>
                  <td className="py-3 pr-4 text-black/55 text-xs">{agentLabel(task.agentType)}</td>
                  <td className="py-3 pr-4">
                    <TaskStatusBadge status={task.status} />
                  </td>
                  <td className="py-3 pr-4 text-xs text-black/45 hidden md:table-cell">
                    {formatTime(task.createdAt)}
                  </td>
                  <td className="py-3 pr-4 text-xs text-black/45 hidden lg:table-cell">
                    {formatDuration(task.durationMs)}
                  </td>
                  <td className="py-3 pr-4 text-xs text-black/45 hidden lg:table-cell font-mono">
                    {task.tokenUsed > 0
                      ? task.tokenUsed.toLocaleString('zh-CN')
                      : formatTokenRange({ min: task.estimatedTokenMin, max: task.estimatedTokenMax })}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <IconBtn
                        icon={Eye}
                        title="查看"
                        onClick={() => navigate(`/app/tasks/${task.id}`)}
                      />
                      {(task.agentType === 'geo' || task.agentType === 'media') && (
                        <IconBtn
                          icon={RefreshCw}
                          title="重新运行"
                          onClick={() => {
                            void handleRerun(task.id);
                          }}
                        />
                      )}
                      {task.input && task.agentType === 'geo' && (
                        <IconBtn
                          icon={Copy}
                          title="复制任务"
                          onClick={() => {
                            void handleRerun(task.id);
                          }}
                        />
                      )}
                      <IconBtn
                        icon={Trash2}
                        title="删除"
                        onClick={() => {
                          void handleDelete(task);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function IconBtn({
  icon: Icon,
  title,
  onClick,
}: {
  icon: typeof Eye;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="p-1.5 text-black/40 hover:text-black hover:bg-[#F2F0ED] transition-colors"
    >
      <Icon className="w-3.5 h-3.5" />
    </button>
  );
}
