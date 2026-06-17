# gpt-image-2 API 参考

文档来源：[gpt-image-2接口](https://qmy27nhsd9.apifox.cn/452409160e0) · [异步结果查询](https://qmy27nhsd9.apifox.cn/452409577e0)

## 节点

| 节点 | base_url |
|------|----------|
| 全球 | `https://grsaiapi.com` |
| 国内 | `https://grsai.dakka.com.cn` |

## 生成

`POST {base_url}/v1/api/generate`

Header: `Authorization: Bearer {GRSAI_API_KEY}`

Body:

```json
{
  "model": "gpt-image-2",
  "prompt": "提示词",
  "images": [],
  "aspectRatio": "16:9",
  "replyType": "json"
}
```

### model

- `gpt-image-2`：支持比例（如 `16:9`）或 1K 像素（如 `1024x1024`）
- `gpt-image-2-vip`：支持 1–4K 像素，**不支持比例字符串**；须用像素值

### replyType

- `json`：同步返回（适合大多数产品配图）
- `async`：返回 `id`，需轮询 result
- `stream`：流式（脚本未实现，按需扩展）

### 响应 status

`running` · `succeeded` · `failed` · `violation`

成功时：`results[].url` 为图片地址。

## 异步轮询

`GET {base_url}/v1/api/result?id={task_id}`

同上 Authorization。轮询间隔建议 2–5 秒，直到 `succeeded` 或 `failed`/`violation`。

## gpt-image-2 常用比例 → 像素

| 比例 | 像素 |
|------|------|
| 1:1 | 1024x1024 |
| 16:9 | 1672x941 |
| 9:16 | 941x1672 |
| 4:3 | 1443x1090 |
| 3:4 | 1090x1443 |
| 3:2 | 1536x1024 |
| 2:3 | 1024x1536 |
| 21:9 | 1920x832 |

也可用 `auto`。

## gpt-image-2-vip 约束

- 最大边长 ≤ 3840px
- 两边均为 16 的倍数
- 长边:短边 ≤ 3:1
- 总像素 655,360 – 8,294,400

示例 1K 16:9：`1280x720`（见官方文档完整表）。
