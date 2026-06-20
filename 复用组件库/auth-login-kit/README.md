# 复用组件库 / Auth Login Kit

这个目录是给后续项目直接复制使用的登录注册能力库。

## 已包含能力

- 手机号验证码登录
- 动态 6 位验证码
- 测试环境自动回填验证码
- 服务端 Session Cookie
- 首次登录自动注册
- `user / creator / admin` 角色分流
- 可接 `Postgres + Prisma`

## 文件说明

- `auth-types.ts`
  - 通用类型
- `frontend-auth-core.ts`
  - 前端登录 SDK 核心逻辑
- `login-modal-core.tsx`
  - 通用登录弹窗组件
- `server-auth-kit.ts`
  - Express 服务端接入套件

## 推荐复用方式

1. 复制整个 `复用组件库/auth-login-kit` 到新项目
2. 按需保留或覆盖文案、默认手机号、角色策略
3. 前端直接引入 `frontend-auth-core.ts` 和 `login-modal-core.tsx`
4. 服务端调用 `createAuthKit().registerRoutes(app)`

## 当前 HelloMe 的接线方式

- [src/lib/auth.ts](/Users/feihong/Documents/hellome/src/lib/auth.ts)
- [src/components/LoginModal.tsx](/Users/feihong/Documents/hellome/src/components/LoginModal.tsx)
- [server.ts](/Users/feihong/Documents/hellome/server.ts)
