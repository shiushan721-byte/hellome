# HelloMe UGC 三层架构与 Creator Studio 方案

## 1. 背景结论

当前 HelloMe 的主产品线已经明确为：

- `UGC 视频广告交付`
- `结果导向`
- `反向索取输入`
- `普通用户不理解 Agent，也不需要理解 Agent`

这意味着 HelloMe 不能走传统对话框产品逻辑，也不应该把创作者工作台做成一个独立后台产品。

正确结构应为三层：

1. `用户前台`
2. `创作者前台工作台`
3. `Boss 后台`

其中：

- 用户前台和创作者前台共用同一套 HelloMe Web 壳
- 创作者只是权限更高，能看到额外入口与页面
- Boss 后台不是重交付平台，只负责数据、权限、异常处理、协助运营

## 2. 产品原则

### 2.1 用户前台原则

用户前台必须坚持：

- 不是聊天框
- 不是工作流编辑器
- 不是让用户先理解 Skill
- 不是让用户先定义参数结构

而是：

- 我想要什么结果
- 系统告诉我还缺什么
- 我补最少必要信息
- 系统理解并执行
- 我拿交付结果

### 2.2 创作者前台原则

创作者前台不是“搭建任意页面”，而是：

- 在固定结果导向页面范式里
- 配置某个任务包的输入、提示、执行策略、交付结构
- 进行调试、回放、发布

创作者配置的是：

- 内容
- 参数
- 执行逻辑
- 交付模板

不是：

- 任意拖拽页面
- 任意生成 GUI
- 通用低代码平台

### 2.3 Boss 后台原则

Boss 后台不承担重交付。

Boss 后台只负责：

- 账号与角色管理
- Skill 发布审核
- 成本、余额、毛利、订单数据
- 调试失败时的协助处理
- 日志追踪、运行审计、异常重试

Boss 后台不负责：

- 创作者日常配置 Skill
- 调整用户任务页面
- 日常调试 Prompt
- 重度交付操作

## 3. 三层结构定义

### 3.1 用户前台

目标角色：

- 小白商家
- 视频服务商客户
- 业务方
- 普通交付需求发起者

关键页面：

- `/app/agents`
- `/app/agents/media`
- `/app/tasks`
- `/app/tasks/:id`
- `/app/results`
- `/app/usage`

页面特征：

- 固定结果导向结构
- 极简输入
- 系统理解
- 执行进度
- 交付物预览
- 成本确认

### 3.2 创作者前台工作台

目标角色：

- UGC Skill 创作者
- 视频服务商内部运营
- 高级调试人员

关键原则：

- 仍然在当前 HelloMe 前台中
- 不单独维护第二套产品壳
- 通过角色权限显示入口

建议页面：

- `/app/studio`
- `/app/studio/skills`
- `/app/studio/skills/:skillId`
- `/app/studio/skills/:skillId/debug`
- `/app/studio/skills/:skillId/versions`

页面功能：

- Skill 列表
- Skill 基本信息配置
- 结果导向页面内容配置
- Prompt / 执行参数配置
- 调试运行
- 中间产物查看
- 版本管理与发布

### 3.3 Boss 后台

目标角色：

- 老板
- 运营管理
- 平台管理员

建议独立入口：

- `/admin`

建议页面：

- `/admin/dashboard`
- `/admin/users`
- `/admin/skills`
- `/admin/tasks`
- `/admin/billing`
- `/admin/incidents`

页面功能：

- 用户数据看板
- 订单与任务数据
- Skill 发布记录
- 成本与毛利分析
- 调试失败协助
- 事故排查

## 4. 为什么创作者工作台必须放在当前前台

原因如下：

1. `避免维护两套重产品`
当前阶段研发资源有限，创作者如果还要进入另一套产品，会让结构分裂。

2. `创作者本质上仍在使用同一个任务产品`
只是权限更高，不是另一个产品用户。

3. `更符合 Skill 即前台任务包 的产品逻辑`
创作者调的不是“后台配置项”，而是用户真正看到和使用的任务包。

4. `更利于快速验证`
创作者改完之后，可以直接切换到用户视角验证结果。

## 5. 为什么 Boss 后台不能承载创作者主流程

因为 Boss 后台的天然心智是：

- 管理
- 查询
- 审核
- 协助

而不是：

- 重复调 Prompt
- 重复调输入范式
- 重复跑 Skill Debug
- 做交付逻辑设计

如果把创作者逻辑放进 Boss 后台，会让后台变成另一个重产品，最终导致：

- 角色混乱
- 页面越来越重
- 研发复杂度提高
- 数据后台和交付后台混在一起

## 6. 当前 UGC Creator Studio 的最小实现建议

### 6.1 Demo 阶段要做什么

只做固定页面范式下的 Skill 配置与调试。

#### 用户任务页结构固定

例如 UGC 视频广告 Skill 固定包含：

- 输入区
- 系统理解区
- 执行步骤区
- 交付物区
- 调试日志区

#### 创作者可改内容

- Skill 名称
- Skill 简介
- 输入项标题与说明
- 示例文案
- 默认值
- Prompt
- 执行模式
- 高成本确认节点
- 交付物模板

#### 创作者暂时不能改

- 任意页面布局
- 任意字段结构生成
- AI 自动生成前台页面
- 拖拽式通用低代码能力

### 6.2 Demo 阶段不做什么

- 通用 Skill Builder
- AI 生成前台 GUI
- 多行业通用编排器
- 面向普通用户的 Prompt Playground

## 7. Creator Studio 信息架构

### 7.1 Skill 列表页

入口：

- 仅 `creator` / `admin` 可见

展示：

- Skill 名称
- 状态：草稿 / 已发布 / 已停用
- 最近调试时间
- 最近发布时间
- 当前线上版本

操作：

- 进入编辑
- 进入调试
- 复制 Skill
- 发布新版本

### 7.2 Skill 编辑页

分区建议：

1. `基本信息`
- Skill 名称
- 描述
- 分类
- 封面

2. `用户输入配置`
- 一句话卖点文案
- 产品图提示
- 人物图提示
- 平台选项
- 示例链接

3. `系统理解配置`
- understanding prompt
- 用户画像生成规则
- 风格推断规则

4. `执行配置`
- 执行模式
- Hermes 是否参与
- 高成本确认点
- 可选 provider

5. `交付配置`
- 输出文件
- 标签
- 客户交付包结构

### 7.3 Skill 调试页

结构建议：

- 左侧：测试输入
- 中间：系统理解 / 中间结果 / 执行步骤
- 右侧：运行日志 / 成本 / 错误 / 产物预览

调试动作：

- 仅跑 understanding
- 跑 script
- 跑完整样片任务
- 切换 backend_silent / local_debug
- 查看 Hermes 调试输出

### 7.4 Skill 版本页

最小功能：

- 草稿版本
- 当前线上版本
- 发布记录
- 回滚到上一个版本

## 8. 权限模型建议

当前代码里还没有角色体系，需要补。

### 8.1 用户角色

建议先定义：

- `user`
- `creator`
- `admin`

说明：

- `user`：普通用户，只能使用任务
- `creator`：可配置和调试前台 Skill
- `admin`：可访问 Boss 后台

### 8.2 前台可见性

#### `user`

可见：

- 智能体市场
- UGC 工作台
- 任务中心
- 成果中心
- 算力中心

不可见：

- Studio
- Admin

#### `creator`

可见：

- 用户前台全部内容
- Creator Studio 入口
- Skill 调试能力

不可见：

- Boss 后台管理页面

#### `admin`

可见：

- 用户前台
- Creator Studio
- Boss 后台

## 9. 技术架构建议

### 9.1 当前前台继续沿用

保留：

- `AppShell`
- 当前 `/app` 视觉规范
- 当前侧边栏和顶栏结构

新增路由：

- `/app/studio`
- `/app/studio/skills`
- `/app/studio/skills/:skillId`
- `/app/studio/skills/:skillId/debug`
- `/app/studio/skills/:skillId/versions`

### 9.2 Boss 后台分开

Boss 后台建议独立路由：

- `/admin`

可以复用当前服务端和数据库，但不与前台工作台共用交互心智。

### 9.3 数据模型建议

在 Prisma 中新增：

- `Skill`
- `SkillVersion`
- `SkillFieldConfig`
- `SkillExecutionConfig`
- `SkillArtifactTemplate`
- `SkillDebugRun`
- `SkillPublishRecord`
- `UserRole` 或 `UserMembershipRole`

## 10. 与当前项目的关系

### 10.1 不需要推翻现有 UGC 页面

现有：

- `/app/agents/media`

仍然作为用户任务工作台。

未来 Creator Studio 配置发布后：

- 用户页继续读“当前线上 SkillVersion”
- 创作者页负责配置与调试

### 10.2 不需要把后台做重

Boss 后台只保留：

- 数据
- 审核
- 风险控制
- 协助处理

不要让 Boss 后台承担：

- 日常 Prompt 调试
- Skill 页面配置
- 交付工作台

## 11. 推荐开发顺序

### Phase 1

- 增加角色字段
- 增加前台 Creator Studio 路由占位
- 前台按角色显示入口

### Phase 2

- 建 Skill / SkillVersion 数据模型
- 做 UGC Skill 列表页
- 做 Skill 编辑页

### Phase 3

- 做 Skill 调试页
- 打通 `/api/llm/generate`
- 打通 Hermes 调试输出

### Phase 4

- 做发布与版本切换
- 用户 UGC 页读取线上版本配置

### Phase 5

- 做轻量 Boss 后台
- 只接数据与协助处理能力

## 12. 最终判断

HelloMe 当前最合理的结构不是：

- 通用 Agent 工作流产品
- 通用 GUI Skill Builder
- 把所有配置塞进 Boss 后台

而是：

- `用户前台`：结果导向任务产品
- `创作者前台`：在当前前台中按权限开放的 Skill 配置与调试工作台
- `Boss 后台`：轻量管理与协助处理平台

这最符合当前 UGC 视频广告产品线的目标，也最符合后续可持续演进方向。
