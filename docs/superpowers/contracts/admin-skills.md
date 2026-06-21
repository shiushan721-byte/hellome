# /api/admin/skills — Skill 全景契约

> 跨三层 skill 总览接口（engineering / business / generation）。
> 前端可用于 ops / debug / 高级 admin 视图。

---

## 1. 端点

### GET /api/admin/skills

**用途**：列出所有 skill（跨三层），支持 `layer` 过滤和关键字搜索。

**Query 参数**：
- `layer` (可选) — `engineering` / `business` / `generation`
- `q` (可选) — 关键字（id / name / description 模糊匹配，大小写不敏感）

**请求**：
```bash
# 全部
curl http://localhost:3000/api/admin/skills

# 只看 business 层
curl 'http://localhost:3000/api/admin/skills?layer=business'

# 搜索
curl 'http://localhost:3000/api/admin/skills?q=video'
```

**响应 200**：
```json
{
  "success": true,
  "data": {
    "total": 29,
    "byLayer": {
      "engineering": 24,
      "business": 7,
      "generation": 4
    },
    "skills": [
      {
        "id": "media-seeding",
        "name": "为 消费品商家 提供 产品种草 类型的视频表达",
        "layer": "business",
        "description": "我想做一个服务于 消费品商家 的视频智能体，它要帮我完成 产品种草。",
        "triggers": ["media"],
        "configured": true,
        "meta": {
          "status": "published",
          "slug": "media-seeding",
          "currentVersion": 1,
          "publishedAt": "2026-06-18T09:00:00.000Z"
        }
      },
      {
        "id": "z-image-turbo",
        "name": "local-comfyui · txt2img",
        "layer": "generation",
        "description": "txt2img via local-comfyui",
        "triggers": ["txt2img"],
        "configured": true,
        "meta": {
          "provider": "local-comfyui",
          "task": "txt2img"
        }
      }
    ]
  }
}
```

---

## 2. 数据模型

```ts
export type AdminSkillLayer = 'engineering' | 'business' | 'generation';

export interface AdminSkill {
  id: string;                       // 唯一 ID
  name: string;                     // 显示名
  layer: AdminSkillLayer;           // 所属层
  description: string;              // 一句话描述
  triggers: string[];               // 触发条件（设计稿用于触发 agent）
  configured: boolean;              // 是否已配置 / 可用
  meta: Record<string, unknown>;    // 层特定的额外元数据
}
```

### 2.1 layer-specific meta 字段

| layer | meta 字段 |
|---|---|
| `engineering` | `path: string` — SKILL.md 文件路径 |
| `business` | `status: 'draft' \| 'published' \| 'archived'`<br>`slug: string`<br>`currentVersion: number`<br>`publishedAt?: string` |
| `generation` | `provider: 'gemini' \| 'grsai' \| 'local-comfyui' \| 'mock'`<br>`task: 'txt2img' \| 'txt2video' \| 'img2video' \| 'edit'` |

---

## 3. 三层 skill 来源

| layer | 来源 | 文件 |
|---|---|---|
| `engineering` | `.cursor/agent-skills/skills/*/SKILL.md`（24 个）| 项目根目录 |
| `business` | Postgres `Skill` + `SkillVersion` 表 | 数据库 |
| `generation` | `MEDIA_PROVIDER` env 配置 + 本地 workflow 注册 | env + `.comfyui-skill/` |

---

## 4. 前端使用场景

- **Admin / Ops 面板**：可视化所有 skill 一览
- **调试面板**：确认某个 generation skill 是否真的 configured
- **集成测试**：根据 `business` 层 skill 自动生成 UGC 任务测试
- **展示**：在某个调试或市场页面陈列所有 generation 能力

---

## 5. 与其他端点的关系

```
GET /api/admin/skills?layer=business
  → 列业务侧 skill（含 4 对象元数据）
  ↘ 详情：GET /api/studio/orchestrator/agents/:agentId
        → 返回完整 4 业务对象
        ↘ 修改：PATCH /api/studio/orchestrator/agents/:agentId/business

GET /api/admin/skills?layer=generation
  → 列底层 generation skill
  ↘ 实际调用：通过 MEDIA_PROVIDER + modelAdapter 走，无需额外端点

GET /api/admin/skills?layer=engineering
  → 列 .cursor/agent-skills/skills/ 下的方法论 skill
  ↘ 实际触发：在 agent 的 system prompt 里 enumerate
```

---

## 6. 实现注意

1. **`byLayer` 字段**：永远返回 3 个 key，即使对应 layer 为 0。便于前端聚合展示。
2. **`triggers` 字段**：business 层取自 `category`，generation 层取自 `task`，engineering 层从 description 里 regex 抽 `Use when ...` 句。
3. **`meta` 是开放字段**：用 `Record<string, unknown>` 容纳层特定信息，前端需要按 `layer` switch。
4. **空结果**：`total: 0` 也返回 200，不要用 404。

---

## 7. 相关文档

- `README.md` §1 — 数据模型
- `api-reference.md` §3.5 — 端点位置
- `data-types.md` — 类型定义