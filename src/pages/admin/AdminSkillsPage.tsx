import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../lib/adminApi';
import type { SkillRecord } from '../../types/skills';
import { AdminCard, AdminPageHeader, AdminTable, StatusBadge, adminLinkClass, adminTabClass } from '../../components/admin/AdminUi';

type Tab = 'studio' | 'inventory';

export default function AdminSkillsPage() {
  const [tab, setTab] = useState<Tab>('studio');
  const [studioSkills, setStudioSkills] = useState<SkillRecord[]>([]);
  const [inventorySkills, setInventorySkills] = useState<Array<Record<string, unknown>>>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    void Promise.all([adminApi.studioSkills(), adminApi.skills()])
      .then(([studio, inventory]) => {
        setStudioSkills(studio);
        setInventorySkills(inventory.skills);
        setSummary(inventory.byLayer);
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : '加载失败');
      });
  }, []);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="智能体管理"
        desc="管理可执行业务 Skill（版本 / 发布 / 调试）与工程 Skill 清单"
      />

      {message ? <p className="text-xs text-rose-600">{message}</p> : null}

      <div className="flex gap-2">
        {(
          [
            { id: 'studio' as const, label: '业务 Skill' },
            { id: 'inventory' as const, label: 'Skill 清单' },
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

      {tab === 'studio' ? (
        <AdminCard>
          <AdminTable
            rows={studioSkills as unknown as Array<Record<string, unknown>>}
            empty="暂无业务 Skill"
            columns={[
              { key: 'name', label: '名称' },
              { key: 'slug', label: 'Slug' },
              { key: 'category', label: '分类' },
              {
                key: 'status',
                label: '状态',
                render: (row) => <StatusBadge value={String(row.status)} />,
              },
              { key: 'currentVersion', label: '当前版本' },
              {
                key: 'updatedAt',
                label: '更新时间',
                render: (row) => new Date(String(row.updatedAt)).toLocaleString('zh-CN'),
              },
              {
                key: 'id',
                label: '操作',
                render: (row) => (
                  <Link to={`/admin/skills/${row.id}`} className={adminLinkClass}>
                    管理
                  </Link>
                ),
              },
            ]}
          />
        </AdminCard>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(summary).map(([layer, count]) => (
              <AdminCard key={layer} className="p-4">
                <p className="text-xs text-black/45">{layer}</p>
                <p className="text-2xl font-bold mt-2">{count}</p>
              </AdminCard>
            ))}
          </div>
          <AdminCard>
            <AdminTable
              rows={inventorySkills}
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'name', label: '名称' },
                { key: 'layer', label: '层级' },
                { key: 'description', label: '说明' },
                { key: 'configured', label: '已配置', render: (row) => (row.configured ? '是' : '否') },
              ]}
            />
          </AdminCard>
        </>
      )}
    </div>
  );
}
