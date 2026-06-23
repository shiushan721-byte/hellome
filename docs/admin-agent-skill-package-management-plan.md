# HelloMe 后台智能体技能包管理方案

## 一、调整目标

当前后台智能体管理页面要从：

```text
业务 Skill / Skill 清单
```

调整为：

```text
智能体列表
手动上传技能包
编辑智能体资料
上架 / 下架
技能包版本迭代
```

核心规则：

> 智能体由后台手动上传技能包创建。智能体图标、名称、简介都可以编辑。智能体上架后前台可使用；下架后不可使用，且只有下架状态才允许编辑资料和上传新技能包版本。

## 二、页面定位

后台页面名称：

```text
智能体管理
```

页面说明：

```text
管理前台可使用的智能体、技能包版本、上架状态和展示资料。
```

去掉当前页面概念：

```text
业务 Skill
Skill 清单
工程 Skill
层级统计
```

改成普通运营能理解的概念：

```text
智能体
技能包
版本
上架
下架
```

## 三、核心对象关系

### 3.1 智能体

智能体是前台展示和用户使用的入口。

包含：

```text
智能体图标
智能体名称
智能体简介
分类
状态
当前线上技能包版本
更新时间
```

### 3.2 技能包

技能包是智能体真正执行能力的载体。

技能包可以迭代。

一个智能体可以有多个技能包版本：

```text
智能体 A
  v1 技能包
  v2 技能包
  v3 技能包
```

前台用户实际使用：

```text
当前已上架版本
```

### 3.3 上架版本

一个智能体同一时间只能有一个线上版本。

规则：

```text
上架智能体 = 前台可见、可使用
下架智能体 = 前台不可使用、可编辑、可上传新版本
```

## 四、智能体状态

状态只保留：

```text
上架
下架
```

内部可选辅助状态：

```text
草稿，首次创建但未上架
上传中，技能包上传过程
校验失败，技能包不可用
```

对运营展示时建议统一为：

```text
上架
下架
```

状态规则：

```text
上架：前台展示，可使用，不允许编辑基础资料，不允许上传新技能包
下架：前台不展示或显示不可用，允许编辑资料，允许上传新技能包
```

## 五、智能体列表页

### 5.1 顶部操作

页面顶部：

```text
智能体管理
管理智能体资料、技能包版本和上下架状态

[上传新智能体]
```

### 5.2 列表字段

列表字段：

```text
智能体图标
智能体名称
智能体简介
分类
状态
当前版本
技能包数量
更新时间
操作
```

第一版字段：

```text
图标
名称
简介
状态
当前版本
更新时间
操作
```

### 5.3 状态标签

```text
上架：绿色标签
下架：灰色标签
校验失败：红色提示，作为异常提示
```

### 5.4 列表操作

上架状态操作：

```text
查看
下架
```

下架状态操作：

```text
编辑
上传新版本
上架
删除，谨慎，后置
```

校验失败操作：

```text
查看错误
重新上传
```

## 六、新建智能体流程

入口：

```text
上传新智能体
```

流程：

```text
1. 上传技能包
2. 填写智能体图标
3. 填写智能体名称
4. 填写智能体简介
5. 系统校验技能包
6. 保存为下架状态
7. 点击上架后前台可使用
```

### 6.1 上传技能包

支持格式：

```text
.zip
.tar.gz，后置
```

大小限制：

```text
第一版建议 100MB 以内
```

上传字段：

```text
技能包文件
版本号
版本说明
```

版本号示例：

```text
1.0.0
1.1.0
2.0.0
```

### 6.2 技能包校验

上传后系统校验：

```text
文件格式是否正确
manifest 是否存在
入口文件是否存在
技能 ID 是否合法
版本号是否合法
依赖声明是否完整
执行配置是否完整
输出结果声明是否完整
```

技能包建议包含：

```text
manifest.json
skill/
README.md
assets/
```

manifest 示例：

```json
{
  "skillId": "geo-visibility",
  "version": "1.0.0",
  "name": "GEO 智能体",
  "description": "检测品牌在 AI 回答中的可见度",
  "entry": "skill/index.js",
  "inputSchema": {},
  "outputSchema": {},
  "runtime": {
    "type": "hermes",
    "minVersion": "0.2.3"
  }
}
```

### 6.3 智能体资料

必填：

```text
智能体图标
智能体名称
智能体简介
```

可选：

```text
分类
标签
预计 Token
详情说明
```

图标限制：

```text
JPG / PNG / WebP
建议 512x512
最大 5MB
```

名称限制：

```text
2-30 个字符
不可重复
```

简介限制：

```text
10-120 个字符
```

## 七、编辑规则

### 7.1 只有下架才能编辑

智能体处于上架状态时：

```text
不能修改图标
不能修改名称
不能修改简介
不能上传新技能包
不能修改当前线上版本
```

页面提示：

```text
当前智能体已上架。请先下架后再编辑资料或上传新版本。
```

按钮：

```text
下架后编辑
```

### 7.2 下架后可编辑

下架状态可编辑：

```text
智能体图标
智能体名称
智能体简介
分类
标签
预计 Token
技能包版本
```

保存后仍保持下架。

需要点击上架才会重新出现在前台。

## 八、上下架规则

### 8.1 上架

上架前校验：

```text
智能体图标已填写
智能体名称已填写
智能体简介已填写
至少有一个校验通过的技能包版本
当前版本已选择
技能包 manifest 校验通过
```

上架后：

```text
前台智能体市场展示
首页推荐位可选择
用户可点击使用智能体
工作台可打开该智能体
```

上架确认：

```text
确认上架该智能体？

上架后用户可以在前台看到并使用该智能体。
上架状态下不能编辑资料或上传新技能包。
```

### 8.2 下架

下架后：

```text
前台不再展示该智能体
用户不能发起新任务
历史任务仍可查看
历史成果仍可查看
后台可以继续查看任务和版本
```

下架确认：

```text
确认下架该智能体？

下架后用户将不能发起该智能体的新任务。
历史任务和成果仍会保留。
下架后你可以编辑资料或上传新技能包版本。
```

### 8.3 执行中任务处理

如果有执行中任务：

```text
允许下架
不影响已创建任务继续执行
下架只阻止新任务
```

后台提示：

```text
当前有 X 个执行中任务。下架后不会影响这些任务继续执行，但用户不能再创建新任务。
```

## 九、技能包版本迭代

### 9.1 版本列表

每个智能体详情页有版本 Tab。

字段：

```text
版本号
上传时间
上传人
校验状态
是否当前版本
版本说明
技能包大小
Checksum
操作
```

版本状态：

```text
校验中
校验通过
校验失败
已废弃
```

### 9.2 上传新版本

只有下架状态允许上传新版本。

流程：

```text
点击上传新版本
选择技能包文件
填写版本号
填写版本说明
上传
系统校验
校验通过后可设为当前版本
点击上架
```

### 9.3 设置当前版本

只有下架状态允许切换当前版本。

规则：

```text
只能选择校验通过的版本
设置后仍保持下架
点击上架后该版本成为线上版本
```

### 9.4 版本回滚

回滚方式：

```text
先下架
选择历史校验通过版本
设为当前版本
重新上架
```

不提供上架状态直接回滚。

## 十、智能体详情页

详情页结构：

```text
顶部：智能体名称 + 状态 + 当前版本 + 操作按钮

Tab：
基础信息
技能包版本
校验记录
前台预览
操作日志
```

### 10.1 基础信息 Tab

字段：

```text
智能体图标
智能体名称
智能体简介
分类
标签
预计 Token
状态
当前版本
```

上架状态：

```text
所有字段只读
显示“下架后可编辑”
```

下架状态：

```text
字段可编辑
可保存
```

### 10.2 技能包版本 Tab

展示：

```text
版本列表
上传新版本按钮
设置当前版本
下载技能包
查看 manifest
```

### 10.3 校验记录 Tab

展示：

```text
校验时间
校验状态
错误类型
错误详情
manifest 解析结果
```

### 10.4 前台预览 Tab

展示：

```text
智能体市场卡片预览
智能体详情页预览
工作台入口预览
```

预览不等于上架。

### 10.5 操作日志 Tab

记录：

```text
创建智能体
上传技能包
校验技能包
编辑资料
设置当前版本
上架
下架
```

## 十一、数据模型建议

可以继续复用现有：

```text
Skill
SkillVersion
```

但需要补充更符合“手动技能包”的字段。

### 11.1 Agent

建议新增独立 Agent 表，作为前台智能体展示主体。

```prisma
model Agent {
  id              String   @id @default(cuid())
  slug            String   @unique
  name            String
  description     String
  iconUrl         String
  category        String?
  tags            Json?
  status          String   @default("offline")
  currentPackageVersionId String?
  sortOrder       Int      @default(0)
  createdBy       String?
  updatedBy       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

status：

```text
online
offline
```

### 11.2 AgentSkillPackage

```prisma
model AgentSkillPackage {
  id            String   @id @default(cuid())
  agentId       String
  version       String
  fileName      String
  fileUrl       String
  fileSize      Int
  checksum      String
  manifest      Json?
  validationStatus String @default("pending")
  validationErrors Json?
  releaseNote   String?
  uploadedBy    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([agentId, version])
  @@index([agentId, createdAt])
}
```

validationStatus：

```text
pending
valid
invalid
deprecated
```

### 11.3 Skill / SkillVersion 的关系

第一版可以这样映射：

```text
Agent = 前台智能体展示主体
AgentSkillPackage = 上传的技能包文件和版本
Skill / SkillVersion = 运行时解析后的执行配置
```

上传技能包校验通过后：

```text
解析 manifest
生成或更新 Skill
生成新的 SkillVersion
将 AgentSkillPackage 关联 SkillVersion
```

## 十二、接口设计

后台接口：

```text
GET    /api/admin/agents
POST   /api/admin/agents
GET    /api/admin/agents/:agentId
PUT    /api/admin/agents/:agentId
POST   /api/admin/agents/:agentId/online
POST   /api/admin/agents/:agentId/offline
```

技能包接口：

```text
POST   /api/admin/agents/:agentId/packages
GET    /api/admin/agents/:agentId/packages
GET    /api/admin/agents/:agentId/packages/:packageId
POST   /api/admin/agents/:agentId/packages/:packageId/validate
POST   /api/admin/agents/:agentId/packages/:packageId/set-current
GET    /api/admin/agents/:agentId/packages/:packageId/download
```

上传新智能体：

```text
POST /api/admin/agents/upload
```

请求：

```text
multipart/form-data

icon: File
package: File
name: string
description: string
version: string
releaseNote?: string
category?: string
```

## 十三、前台读取规则

前台智能体市场只读取上架智能体。

接口：

```text
GET /api/published-market/agents
```

返回：

```text
status = online 的 Agent
currentPackageVersionId 对应的版本信息
智能体图标、名称、简介
工作台路由
预计 Token
```

下架智能体：

```text
不在前台市场展示
不能新建任务
历史任务可继续查看
历史成果可继续查看
```

## 十四、权限要求

权限：

```text
agent.view
agent.create
agent.edit
agent.upload_package
agent.online
agent.offline
agent.view_versions
agent.download_package
```

角色建议：

```text
超级管理员：全部
技术管理员：上传技能包、校验、上下架
运营管理员：编辑图标、名称、简介，申请上架
只读观察员：仅查看
```

第一版可以简化：

```text
管理员都可操作
所有操作记录审计日志
```

## 十五、操作日志

必须记录：

```text
创建智能体
编辑资料
上传技能包
校验失败
校验通过
设置当前版本
上架
下架
下载技能包
```

日志字段：

```text
操作人
操作时间
操作类型
智能体 ID
版本 ID
修改前
修改后
IP
备注
```

## 十六、页面改造建议

### 16.1 当前列表页改造

当前：

```text
业务 Skill / Skill 清单
```

改为：

```text
智能体列表
```

顶部按钮：

```text
上传新智能体
```

列表字段：

```text
图标
名称
简介
状态
当前版本
更新时间
操作
```

### 16.2 当前详情页改造

当前：

```text
概览
业务配置
版本
调试
```

改为：

```text
基础信息
技能包版本
校验记录
前台预览
操作日志
```

### 16.3 调试功能

调试功能第一版可以后置。

如果保留，入口放在技能包版本详情中：

```text
选择某个校验通过版本
点击调试
```

## 十七、第一版实现范围

第一版必做：

```text
智能体列表
上传新智能体
上传技能包
填写图标、名称、简介
技能包基础校验
下架状态可编辑
上架状态只读
上架
下架
版本列表
上传新版本
设置当前版本
前台只展示上架智能体
操作日志
```

第一版后置：

```text
在线调试
复杂 manifest 可视化
依赖安全扫描
灰度上架
多环境发布
版本差异对比
自动回滚
批量上传
```

## 十八、最终定义

> 后台智能体管理不再是 Skill 清单，而是面向运营和技术的智能体上架系统。管理员手动上传技能包，填写可编辑的智能体图标、名称和简介；智能体下架后才能编辑和迭代技能包，上架后前台用户才能使用。
