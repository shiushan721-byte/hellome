import { FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ResultsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#f0f0f2] flex items-center justify-center shrink-0">
          <FolderOpen className="w-6 h-6 text-black/55" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-display">成果中心</h1>
          <p className="text-sm text-black/55 leading-relaxed">
            这里将汇总智能体任务产出的文件、报告与可下载交付物。当前版本请先在
            <Link to="/app/tasks" className="text-black font-medium mx-1 hover:underline">
              任务中心
            </Link>
            查看各任务的执行结果。
          </p>
        </div>
      </div>
    </div>
  );
}
