# HelloMe 个人资料修改功能方案

## 1. 功能目标

个人资料功能只用于修改用户在 HelloMe 内的基础展示信息。

第一版只支持：

```text
头像
昵称
```

不包含：

```text
公司
职位
行业
简介
邮箱登录
手机号修改
账号安全
```

核心目标：

```text
用户可以修改头像
用户可以修改昵称
系统为新用户生成默认头像和默认昵称
头像和昵称会同步到顶部用户菜单、任务创建人和基础展示位置
修改头像和昵称不影响 Hz-Hermes 配对
```

## 2. 页面入口

推荐入口：

```text
顶部用户菜单 -> 个人资料
设置 -> 个人资料
```

推荐路由：

```text
/app/settings/profile
```

如果设置页第一版较轻，也可以直接放在：

```text
/app/settings
```

## 3. 页面结构

```text
个人资料
管理你的头像和昵称

头像
[当前头像] [上传头像] [恢复默认头像]

昵称
[哈啰蜜abcdef              ]

[保存修改]
```

页面只需要一个模块：

```text
基础资料
```

不展示：

```text
公司
职位
行业
简介
邮箱
手机号
```

## 4. 默认资料规则

### 4.1 默认昵称

新用户注册后，如果没有设置昵称，系统自动生成：

```text
哈啰蜜 + 6 个随机英文字母
```

示例：

```text
哈啰蜜xqprta
哈啰蜜mnkzbf
哈啰蜜lwepoc
```

规则：

```text
前缀固定为“哈啰蜜”
后缀为 6 个小写英文字母
生成后保存到用户资料
同一个用户保持不变
如果用户手动修改昵称，不再自动覆盖
```

建议生成逻辑：

```ts
function generateDefaultNickname() {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const suffix = Array.from({ length: 6 }, () =>
    letters[Math.floor(Math.random() * letters.length)]
  ).join('');
  return `哈啰蜜${suffix}`;
}
```

### 4.2 默认头像

新用户默认头像使用系统默认头像。

推荐规则：

```text
未上传头像时展示默认头像
默认头像可以是 HelloMe/Hz-Hermes 风格图标
也可以是固定的哈啰蜜默认头像
用户上传头像后展示用户头像
用户删除头像后恢复默认头像
```

不建议用邮箱首字母，因为当前没有邮箱登录前提。

## 5. 头像修改

支持：

```text
上传头像
预览头像
删除头像 / 恢复默认头像
```

MVP 可以先不做裁剪。

上传限制：

```text
支持 jpg / png / webp
建议小于 5MB
展示时裁成正方形或圆形
```

头像使用位置：

```text
顶部用户菜单
个人资料页
任务创建人
团队成员展示，可后置
```

上传成功提示：

```text
头像已更新
```

上传失败提示：

```text
头像上传失败，请稍后重试
```

## 6. 昵称修改

昵称使用位置：

```text
顶部用户菜单
个人资料页
任务创建人
通知展示
```

昵称规则：

```text
2-20 个字符
支持中文、英文、数字
不允许纯空格
不允许明显违规词
```

保存时处理：

```text
去掉首尾空格
校验长度
校验是否为空
保存成功后刷新顶部用户菜单
```

如果用户把昵称清空：

```text
提示“昵称不能为空”
```

不自动重新生成默认昵称，除非用户点击：

```text
恢复默认昵称
```

可选功能：

```text
恢复默认昵称
```

恢复后重新生成一个新的：

```text
哈啰蜜 + 6 个随机英文字母
```

## 7. Hz-Hermes 配对影响

头像和昵称只是展示信息。

修改它们不会影响：

```text
Hz-Hermes 配对
Token 余额
已启用智能体
任务历史
登录状态
```

提示文案可不展示，或在说明中轻量表达：

```text
修改头像和昵称不会影响 Hz-Hermes 配对。
```

## 8. 保存逻辑

保存流程：

```text
用户修改头像或昵称
点击保存
前端校验昵称
上传头像或提交头像 URL
更新用户 profile
刷新本地用户信息
刷新顶部用户菜单
显示保存成功
```

保存成功：

```text
个人资料已更新
```

保存失败：

```text
保存失败，请稍后重试
```

离开页面时如果有未保存修改：

```text
你有未保存的修改，确定离开吗？
```

## 9. 数据结构建议

用户资料：

```ts
interface UserProfile {
  id: string;
  avatarUrl?: string;
  nickname: string;
  isDefaultAvatar: boolean;
  isDefaultNickname: boolean;
}
```

更新资料请求：

```ts
interface UpdateProfileRequest {
  avatarUrl?: string | null;
  nickname: string;
}
```

## 10. API 建议

获取资料：

```text
GET /api/me/profile
```

更新昵称和头像：

```text
PATCH /api/me/profile
```

上传头像：

```text
POST /api/me/avatar
```

恢复默认头像：

```text
DELETE /api/me/avatar
```

生成或恢复默认昵称：

```text
POST /api/me/profile/default-nickname
```

返回结构：

```ts
interface MeProfileResponse {
  id: string;
  avatarUrl?: string;
  nickname: string;
  isDefaultAvatar: boolean;
  isDefaultNickname: boolean;
}
```

## 11. MVP 范围

### P0

```text
个人资料页面
展示当前头像
展示当前昵称
上传头像
恢复默认头像
修改昵称
默认昵称生成规则：哈啰蜜 + 6 个随机英文字母
默认头像展示
保存成功/失败提示
顶部用户菜单同步更新
```

### P1

```text
头像裁剪
恢复默认昵称
昵称违规词校验
头像压缩
```

### P2

```text
更多默认头像样式
团队内展示名
头像历史记录
```

## 12. 验收标准

完成后应满足：

```text
新用户会自动拥有默认昵称，例如“哈啰蜜xqprta”
新用户会展示默认头像
用户可以进入个人资料页面
用户可以上传头像
用户可以恢复默认头像
用户可以修改昵称
昵称不能为空
保存后顶部用户菜单立即同步
修改头像和昵称不会影响 Hz-Hermes 配对
页面中不出现公司、职位、行业、简介、邮箱、手机号字段
```

## 13. 最终表达

> 个人资料第一版只做头像和昵称。新用户默认昵称为“哈啰蜜 + 6 个随机英文字母”，默认展示系统头像；用户可自行修改头像和昵称，这些修改只影响展示，不影响 Hz-Hermes 配对和智能体使用。
