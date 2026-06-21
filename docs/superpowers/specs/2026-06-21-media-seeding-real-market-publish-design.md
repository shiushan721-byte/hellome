# Media-Seeding Real Market Publish Design

## Goal

把 `media-seeding` 从“前端静态展示的智能体卡片”改成“真正通过 Skill 创建与发布流程上架的智能体”，并且在上架后能在广场、详情页、工作台案例区看到同一份真实案例视频。

这次只做一个真实样板智能体：

- `media-seeding`

其他视频智能体继续保持现状，等这个样板验证通过后再批量迁移。

## Current Problem

当前仓库里有两套并行机制：

1. 真实 Skill 链路  
   `createAgentFromSpec` / `updateSkill` / `publishSkill` / `getSkillExperienceConfig`

2. 广场展示链路  
   `src/data/agentsCatalog.ts`  
   `src/data/agentsMarketHome.ts`  
   `src/lib/agentsPageData.ts`

结果是：

- 智能体广场主要读静态前端数据
- 详情页也主要读静态 agent/profile 配置
- 案例区是文案示意，不是发布态真实素材
- “创建 skill 并发布”不会真正驱动广场上线

这不符合我们要的“按照创建 Skill 上架逻辑上线”。

## Scope

本次范围只覆盖 `media-seeding`：

- 用真实已发布 `Skill` 驱动广场卡片
- 用真实已发布 `Skill` 驱动详情页主要内容
- 为 `media-seeding` 绑定 1 个真实案例视频
- 在工作台默认案例区和详情页复用同一份案例视频

本次不做：

- 6 个视频智能体全部迁移
- 通用多案例库管理后台
- 案例视频上传工作流
- 静态配置的彻底删除

## Recommended Approach

### Approach A: Full Dynamic Market For One Skill

新增一层“已发布 Skill -> 广场视图”的后端投影，只让 `media-seeding` 先走真实上架数据，前端优先读取这个动态结果，读不到时再回退静态配置。

优点：

- 真正打通创建 / 发布 / 上架链路
- 风险可控，只影响一个智能体
- 后续可复制到其他智能体

缺点：

- 需要新增 market view 数据装配层
- 前端需要支持静态 + 动态混合读取

### Approach B: Publish Writes Back Into Static Market Data

发布 Skill 时把结果同步写回静态映射，让广场“看起来”是上架的。

优点：

- 改动小

缺点：

- 仍然不是单一事实源
- 后续维护成本高
- 不符合这次目标

### Decision

采用 **Approach A**。

## Architecture

### 1. Published Skill Becomes The Source Of Truth

对 `media-seeding` 来说，“是否已上架”“标题/摘要/标签”“案例视频是什么”都应来自已发布 Skill，而不是前端静态表。

静态表在本次中保留，只作为：

- 其他未迁移智能体的显示来源
- `media-seeding` 的回退来源

### 2. Add A Market Projection Layer

新增一个服务层，把已发布 Skill 投影成广场和详情页需要的结构，例如：

- card title
- description
- token range
- published status
- CTA 文案
- case video

这层负责把 Skill 的业务配置、发布版本、案例素材组装成“前端可直接渲染”的 market view。

### 3. Store One Showcase Video On The Published Skill Path

先给 `media-seeding` 绑定一个案例视频元数据。第一版不做复杂上传管理，直接采用可持久化、可被详情页与工作台同时读取的结构。

推荐放在 SkillVersion 的业务配置扩展字段附近，而不是散落在单独前端配置里。核心原因：

- 案例视频属于“上架展示内容”
- 应该跟随版本或至少跟随发布内容读取
- 前端不应该再手写一份案例定义

### 4. Reuse The Same Showcase Asset In Two Places

同一份案例视频要在两个界面复用：

- 广场详情页
- `media-seeding` 工作台默认案例区

这样用户从广场进入智能体后，看到的是一致的案例表达。

## Data Design

### Published Market View

新增一个 server-side view model，最小先支持：

- `agentId`
- `skillId`
- `name`
- `summary`
- `description`
- `status`
- `entryLabel`
- `tokenRange`
- `category`
- `showcaseVideo`

### Showcase Video Shape

第一版只做一个案例视频，字段最小化：

- `title`
- `summary`
- `videoUrl`
- `coverUrl`
- `posterText`

如果 `media-seeding` 没配置案例视频：

- 详情页不显示视频播放器
- 工作台回退为当前默认示意态

## Frontend Changes

### Agents Page

广场卡片列表对 `media-seeding` 优先读取动态 market view。

行为：

- 已发布且存在动态 view：显示动态内容
- 否则：回退静态 `AGENTS`

### Public Agent Detail Page

详情页对 `media-seeding` 优先读取动态详情数据。

新增内容：

- 案例视频区
- 案例摘要

### UgcVideoAgentPage

默认案例区改成：

- 优先显示真实上架案例视频
- 否则回退现有示意案例文案

这样业务端仍然看到“案例”，但来源已经是真实发布态素材。

## Backend Changes

### Market Read API

新增只读 API，返回已发布智能体的 market view。

至少需要：

- 列表接口：供广场读取 `media-seeding`
- 详情接口：供详情页 / 工作台读取单个智能体的案例视频

### Seed Data

为 `media-seeding` 写入一条真实案例视频素材，确保本地启动即可看到首个样板流程。

第一版允许素材 URL 指向本地 `public/media/` 下的固定文件。

## End-To-End Flow

`create/edit skill -> publish -> market projection reads published version -> agents page shows published media-seeding -> public/app detail can render showcase video -> workbench default case block reuses same showcase video`

## Error Handling

### If Published Skill Exists But Showcase Video Missing

- 广场卡片继续显示
- 详情页与工作台不报错
- 案例区回退文案示意

### If Dynamic Market API Fails

- 前端回退静态配置
- 只影响 `media-seeding` 的真实性，不影响页面可用性

## Testing

至少覆盖：

1. `media-seeding` 已发布 Skill 能生成 market view
2. market view 包含案例视频字段时，前端模型正确消费
3. API 失败或案例缺失时回退静态数据 / 默认示意内容
4. 发布后广场读取的是 published version，而不是草稿 version

## Rollout

第一步只上线 `media-seeding`。

验收通过后，再把同样机制复制到：

- `media-review`
- `media-conversion`
- `media-showcase`
- `media-demo`
- `media-proposal`

## Acceptance Criteria

- `media-seeding` 能通过真实 Skill 发布流程上架
- 广场中 `media-seeding` 不再只依赖静态前端数据
- 详情页能看到真实案例视频
- 工作台默认案例区能看到同一份真实案例视频
- 整体失败时页面仍可回退，不影响其他智能体使用
