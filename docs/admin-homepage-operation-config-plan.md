# HelloMe 首页运营配置方案

## 一、配置目标

首页运营配置用于让后台控制首页核心展示内容。

本次首页先做 3 类运营配置：

```text
1. 首页广告位
2. 智能体推荐位
3. 智能体展示页：标签及其对应的智能体
```

目标：

> 首页不再把展示内容写死在前端组件中，运营可以在后台配置标题、图片、按钮、推荐智能体、标签和展示顺序。

当前项目对应前端：

```text
src/pages/MarketingPage.tsx
src/components/HeroPortal.tsx
src/components/AgentsShowcase.tsx
```

后续建议：

```text
后台配置
  ↓
GET /api/public/configs/home
  ↓
前台首页渲染
  ↓
接口失败时使用本地兜底配置
```

## 二、首页运营配置结构

首页配置建议统一放在：

```text
FrontendConfig.scope = home
```

配置拆为 3 个 key：

```text
home.hero_ads
home.agent_recommendations
home.agent_showcase
```

后台页面：

```text
后台 / 前台配置 / 首页配置
```

页面 Tab：

```text
首页广告位
智能体推荐位
智能体展示页
发布记录
```

## 三、与智能体管理的职责边界

智能体管理负责智能体资产本身。

```text
上传技能包
维护智能体图标
维护智能体名称
维护智能体简介
维护智能体上下架状态
维护技能包版本
```

首页运营配置负责首页展示编排。

```text
选择哪些智能体展示在首页
配置首页标签
把智能体放到对应标签下
调整智能体在标签里的排序
控制首页卡片展示 / 隐藏
配置首页模块标题、副标题和按钮文案
```

首页运营配置不编辑智能体本身信息。

```text
不编辑智能体图标
不编辑智能体名称
不编辑智能体简介
不上传技能包
不修改智能体上下架状态
```

## 四、首页广告位

### 4.1 定位

首页广告位是用户进入 HelloMe 后第一眼看到的运营内容。

用于配置：

```text
首屏主广告
活动广告
主推智能体
算力充值活动
新功能上线
第三方平台入口
```

当前前端对应：

```text
HeroPortal
```

### 4.2 展示形式

第一版建议只做一个主广告位。

展示结构：

```text
品牌名
主标题
副标题
主按钮
副按钮，后置
背景图/视频，后置
```

前台示例：

```text
HelloMe
让智能体完成复杂任务
选择场景，输入目标。过程看得见，结果可交付。
按钮：立即使用
```

### 4.3 后台字段

广告位字段：

```text
广告位名称
展示状态
排序
品牌文案
主标题
副标题
主按钮文案
主按钮动作
主按钮跳转
副按钮文案
副按钮动作
副按钮跳转
背景类型
背景图片
背景视频
开始时间
结束时间
备注
```

状态：

```text
草稿
已发布
已下线
```

按钮动作：

```text
login
use_agent
open_market
open_workbench
open_url
open_gnomic
open_agentsyun
```

### 4.4 配置数据结构

```ts
type HomeHeroAdConfig = {
  id: string;
  name: string;
  enabled: boolean;
  sortOrder: number;
  brandText: string;
  title: string;
  subtitle: string;
  primaryButton: {
    label: string;
    action: 'login' | 'use_agent' | 'open_market' | 'open_workbench' | 'open_url' | 'open_gnomic' | 'open_agentsyun';
    target?: string;
    agentId?: string;
  };
  secondaryButton?: {
    label: string;
    action: string;
    target?: string;
    agentId?: string;
  };
  media?: {
    type: 'none' | 'image' | 'video';
    url?: string;
    posterUrl?: string;
  };
  startAt?: string;
  endAt?: string;
};
```

### 4.5 前台点击逻辑

点击按钮时统一走首页功能判断：

```text
未登录：弹登录
已登录未配对：如果动作需要执行任务，弹 Hz-Hermes 配对引导
已登录已配对：执行动作
```

动作规则：

```text
login：弹登录
use_agent：打开智能体工作台
open_market：进入智能体市场
open_workbench：进入我的工作台
open_url：打开外链
open_gnomic：走 Gnomic SSO
open_agentsyun：走 AgentYun SSO
```

## 五、智能体推荐位

### 5.1 定位

智能体推荐位用于在首页快速推荐运营想让用户使用的智能体。

适合配置：

```text
主推智能体
热门智能体
新上线智能体
内测智能体
按业务场景推荐的智能体
```

### 5.2 展示形式

推荐位可以放在首页首屏下方或智能体展示页上方。

第一版建议展示 3-6 个推荐卡片。

卡片结构：

```text
智能体图标
智能体名称
智能体简介
推荐标签
预计 Token
按钮：使用智能体
```

智能体图标、名称、简介来自智能体管理，推荐位不编辑智能体本身信息。

状态：

```text
开放
即将开放
内测中
隐藏
```

### 5.3 后台字段

推荐位字段：

```text
推荐位名称
关联智能体
推荐标签
推荐理由
预计 Token 文案
按钮文案
按钮动作
排序
展示状态
开始时间
结束时间
```

推荐标签示例：

```text
官网主推
新上线
热门
适合新手
内测中
GEO 首选
内容创作
```

### 5.4 配置数据结构

```ts
type HomeAgentRecommendationConfig = {
  id: string;
  enabled: boolean;
  sortOrder: number;
  agentId: string;
  badge?: string;
  reason?: string;
  tokenHint?: string;
  status: 'open' | 'coming_soon' | 'beta' | 'hidden';
  cta: {
    label: string;
    action: 'use_agent' | 'view_agent' | 'apply_beta';
  };
  startAt?: string;
  endAt?: string;
};
```

### 5.5 点击逻辑

```text
开放：点击使用智能体
即将开放：展示即将开放提示
内测中：展示申请内测提示
隐藏：前台不展示
```

开放智能体点击后：

```text
未登录：弹登录
已登录未配对：弹 Hz-Hermes 配对引导
已登录已配对：打开智能体工作台
```

## 六、智能体展示页配置

### 6.1 定位

智能体展示页是首页中展示智能体卡片的核心模块，对应前台首页里的智能体卡片网格区域。

当前前端对应：

```text
AgentsShowcase
```

当前写死内容：

```text
GEO 智能体
自媒体小助手
销售获客智能体
```

后续由后台配置：

```text
展示页标题
展示页副标题
标签列表
标签下展示哪些智能体
智能体卡片顺序
按钮文案
```

智能体图标、名称、简介统一来自“智能体管理”，首页配置不编辑智能体本身信息。

### 6.2 展示结构

前台结构：

```text
模块标题
模块副标题
分类标签
智能体卡片网格
```

示例：

```text
标签：
全部 / GEO 营销 / 内容创作 / 销售获客 / 办公协同

卡片：
GEO 智能体
新品种草视频
测评讲解视频
带货转化视频
品牌宣传视频
产品演示视频
客户提案视频
销售获客智能体
```

### 6.3 后台字段：展示页整体

```text
模块名称
展示状态
模块标题
模块副标题
默认选中标签
排序
按钮文案
每行展示数量，前端可按屏幕宽度自适应
```

### 6.4 后台字段：标签

每个标签对应一组智能体卡片。

字段：

```text
标签名称
标签编码
排序
展示状态
标签下关联智能体列表
```

标签示例：

```text
全部
GEO 营销
内容创作
销售获客
办公协同
品牌增长
```

### 6.5 后台字段：智能体卡片

每个标签下可以配置多个智能体卡片。

卡片字段：

```text
关联智能体 ID
按钮文案，默认使用“使用智能体”
排序
展示状态
更新时间
```

展示状态：

```text
展示
隐藏
```

卡片展示规则：

```text
只展示已上架智能体
同一个智能体可以出现在多个标签下
“全部”标签可以手动配置，也可以汇总所有已展示卡片
卡片排序由后台配置控制
卡片图标、名称、简介统一读取智能体管理里的基础信息
首页配置不允许修改智能体图标、名称、简介
```

### 6.6 配置数据结构

```ts
type HomeAgentShowcaseConfig = {
  enabled: boolean;
  title: string;
  subtitle: string;
  defaultAgentId: string;
  tabs: HomeAgentShowcaseTab[];
};

type HomeAgentShowcaseTab = {
  id: string;
  tabLabel: string;
  tabKey: string;
  enabled: boolean;
  sortOrder: number;
  agents: HomeAgentShowcaseCard[];
};

type HomeAgentShowcaseCard = {
  id: string;
  agentId: string;
  buttonLabel: string;
  visible: boolean;
  sortOrder: number;
};
```

### 6.7 前台交互

标签点击：

```text
切换当前标签下的智能体卡片列表
不触发登录
不触发配对
不进入工作台
```

点击按钮：

```text
未登录：弹登录
已登录未配对：弹 Hz-Hermes 配对引导
已登录已配对：打开对应智能体工作台标签
```

点击卡片非按钮区域：

```text
第一版可以与按钮一致，打开对应智能体工作台标签
后续可扩展为打开智能体详情页
```

## 七、后台页面设计

后台路径：

```text
/admin/frontend/home
```

页面结构：

```text
首页配置

Tab:
首页广告位
智能体推荐位
智能体展示页
发布记录
```

### 7.1 首页广告位后台

列表字段：

```text
名称
主标题
按钮动作
状态
排序
生效时间
更新时间
操作
```

操作：

```text
新增广告
编辑
预览
上移/下移
发布
下线
删除草稿
```

### 7.2 智能体推荐位后台

列表字段：

```text
推荐标题
关联智能体
标签
状态
排序
更新时间
操作
```

操作：

```text
新增推荐
编辑
预览
排序
发布
隐藏
```

### 7.3 智能体展示页后台

分为两层：

```text
展示页整体配置
标签智能体配置
```

整体配置：

```text
标题
副标题
默认标签
模块开关
卡片按钮默认文案
```

标签配置列表：

```text
标签名称
标签编码
状态
排序
已配置卡片数
更新时间
操作
```

标签编辑页：

```text
标签基础信息
智能体卡片列表
添加智能体卡片
调整卡片排序
隐藏/展示卡片
预览
```

智能体卡片列表字段：

```text
关联智能体
智能体图标，只读
智能体名称，只读
智能体简介，只读
展示状态
排序
更新时间
操作
```

## 八、发布规则

首页配置必须支持草稿和发布。

状态：

```text
草稿
已发布
已下线
```

发布规则：

```text
后台编辑先生成草稿
点击发布后写入 published 配置
前台只读取已发布配置
发布时记录操作人、发布时间、配置快照
支持回滚到上一个发布版本，P1
```

配置校验：

```text
广告位必须有标题和按钮
推荐位必须关联有效智能体
展示页至少有一个启用标签
默认标签必须在启用标签中
所有外链必须通过白名单校验
```

## 九、前台读取逻辑

接口：

```text
GET /api/public/configs/home
```

返回：

```ts
type HomePageOperationConfig = {
  heroAds: HomeHeroAdConfig[];
  agentRecommendations: HomeAgentRecommendationConfig[];
  agentShowcase: HomeAgentShowcaseConfig;
  version: number;
  updatedAt: string;
};
```

前台逻辑：

```text
请求后台配置
有已发布配置：使用后台配置
没有配置或请求失败：使用本地默认配置
```

本地默认配置来源：

```text
HeroPortal 当前写死内容
AgentsShowcase 当前写死内容
```

## 十、数据模型建议

可以复用通用前台配置表：

```prisma
model FrontendConfig {
  id          String   @id @default(cuid())
  key         String
  name        String
  scope       String
  version     Int      @default(1)
  status      String   @default("draft")
  payload     Json
  publishedAt DateTime?
  createdBy   String?
  updatedBy   String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([key, version])
  @@index([scope, status])
}
```

本模块使用：

```text
scope = home

key = home.hero_ads
key = home.agent_recommendations
key = home.agent_showcase
```

第一版也可以用一个 key 存整页：

```text
key = home.page_config
```

推荐第一版：

```text
使用 home.page_config 存整页配置
后台编辑时按 Tab 拆表单
发布时整体发布
```

## 十一、接口建议

后台接口：

```text
GET  /api/admin/frontend-configs?scope=home
POST /api/admin/frontend-configs
POST /api/admin/frontend-configs/:id/publish
```

首页专用接口，后置：

```text
GET  /api/admin/home-config
PUT  /api/admin/home-config
POST /api/admin/home-config/publish
POST /api/admin/home-config/preview
```

前台接口：

```text
GET /api/public/configs/home
```

## 十二、第一版实现范围

第一版必做：

```text
首页广告位配置
智能体推荐位配置
智能体展示页标签配置
配置草稿保存
配置发布
前台读取已发布配置
本地默认配置兜底
后台预览
```

第一版暂不做：

```text
AB 测试
按用户分群展示
定时上下线
多语言配置
复杂素材库
回滚版本
操作 diff 对比
```

## 十三、最终定义

> 智能体管理负责智能体本身，包括技能包、图标、名称、简介和上下架；首页运营配置负责把已上架智能体选择到首页、放入对应标签、调整排序和控制展示。首页只做展示编排，不编辑智能体本身信息。
