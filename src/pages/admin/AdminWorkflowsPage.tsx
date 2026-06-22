import { useEffect, useState } from 'react';
import { adminApi } from '../../lib/adminApi';
import { AdminCard, AdminPageHeader, AdminTable, StatusBadge, adminLinkClass } from '../../components/admin/AdminUi';

export default function AdminWorkflowsPage() {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [message, setMessage] = useState('');

  const load = async () => setRows(await adminApi.workflowTemplates());

  useEffect(() => {
    void load();
  }, []);

  const toggleRecommend = async (row: Record<string, unknown>) => {
    try {
      await adminApi.updateWorkflowTemplate(String(row.templateId), {
        recommended: !row.recommended,
      });
      setMessage('已更新推荐状态');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '更新失败');
    }
  };

  return (
    <div>
      <AdminPageHeader title="工作流模板" desc="管理 Gnomic 模板市场展示与推荐位" />
      {message ? <p className="text-xs text-black/45 mb-3">{message}</p> : null}
      <AdminCard>
        <AdminTable
          rows={rows}
          columns={[
            { key: 'title', label: '标题' },
            { key: 'templateId', label: 'Template ID' },
            { key: 'category', label: '分类' },
            { key: 'pricePerRun', label: '单次价格' },
            { key: 'status', label: '状态', render: (row) => <StatusBadge value={String(row.status)} /> },
            { key: 'recommended', label: '推荐', render: (row) => (row.recommended ? '是' : '否') },
            {
              key: 'id',
              label: '操作',
              render: (row) => (
                <button
                  type="button"
                  onClick={() => void toggleRecommend(row)}
                  className={adminLinkClass}
                >
                  切换推荐
                </button>
              ),
            },
          ]}
        />
      </AdminCard>
    </div>
  );
}
