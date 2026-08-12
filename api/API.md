# poetry-source API 文档

## 1. 基本信息

当前线上地址：

```text
https://poetry-api.snowtraces.com
```

接口版本前缀：`/v1`

完整示例：

```text
https://poetry-api.snowtraces.com/v1/works?page_size=20
```

接口为只读 API，不需要登录、不需要 API Key。当前部署使用 Cloudflare Workers + D1，不依赖 R2。

直接访问根地址 `/` 会打开浏览器调试页。调试页汇总本文档中的全部请求示例，每项都可以点击“调试”查看实时状态码、耗时和响应内容。

## 2. 通用约定

### 请求方法

- `GET`：查询数据；
- `OPTIONS`：CORS 预检；
- 其他方法返回 `405 METHOD_NOT_ALLOWED`。

### 响应格式

成功响应统一为：

```json
{
  "data": {},
  "meta": {},
  "error": null
}
```

错误响应统一为：

```json
{
  "data": null,
  "meta": {},
  "error": {
    "code": "NOT_FOUND",
    "message": "work not found"
  }
}
```

响应头：

```text
Content-Type: application/json; charset=utf-8
Access-Control-Allow-Origin: *
```

### 分页

作品列表、作者列表和作者作品列表使用游标分页：

| 参数 | 类型 | 默认值 | 限制 | 说明 |
|---|---|---:|---|---|
| `page_size` | integer | `20` | `1～50` | 每页数量 |
| `cursor` | string | 空 | 不透明字符串 | 使用上一次响应中的 `meta.next_cursor` |

示例：

```text
GET /v1/works?page_size=50
GET /v1/works?page_size=50&cursor=eyJyb3dfaWQiOjUwfQ
```

分页响应：

```json
{
  "data": [],
  "meta": {
    "page_size": 50,
    "next_cursor": "eyJyb3dfaWQiOjUwfQ",
    "count": 50
  },
  "error": null
}
```

当 `next_cursor` 为 `null` 时，表示没有下一页。客户端不要解析或自行生成 cursor。

## 3. 接口列表

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/` | 浏览器调试页 |
| `GET` | `/v1/health` | 健康检查 |
| `GET` | `/v1/meta` | 数据集统计 |
| `GET` | `/v1/dynasties` | 朝代列表 |
| `GET` | `/v1/works` | 查询作品 |
| `GET` | `/v1/works/:id` | 查询作品详情 |
| `GET` | `/v1/works/random` | 随机获取作品 |
| `GET` | `/v1/authors` | 查询作者 |
| `GET` | `/v1/authors/:id` | 查询作者详情 |
| `GET` | `/v1/authors/:id/works` | 查询作者作品 |

## 4. 健康检查

### `GET /v1/health`

请求：

```bash
curl https://poetry-api.snowtraces.com/v1/health
```

响应：

```json
{
  "data": {
    "status": "ok"
  },
  "meta": {},
  "error": null
}
```

## 5. 数据集统计

### `GET /v1/meta`

响应：

```json
{
  "data": {
    "works": 125000,
    "authors": 25454,
    "by_type": [
      { "type": "poetry", "count": 70327 },
      { "type": "ci", "count": 53869 },
      { "type": "qu", "count": 804 }
    ],
    "by_dynasty": [
      { "dynasty": "唐", "count": 590 }
    ],
    "manifest": null
  },
  "meta": {},
  "error": null
}
```

`works`、`authors` 和统计数量会随 D1 导入进度变化。`manifest` 在未写入数据集清单时为 `null`。

## 6. 朝代列表

### `GET /v1/dynasties`

响应：

```json
{
  "data": ["五代十国", "元", "南北朝", "唐", "宋"],
  "meta": {},
  "error": null
}
```

## 7. 作品接口

### 7.1 查询作品列表

#### `GET /v1/works`

查询参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `type` | string | 否 | `poetry`、`ci`、`qu`、`other` |
| `dynasty` | string | 否 | 精确匹配朝代，例如 `唐`、`宋` |
| `author_id` | string | 否 | 精确匹配作者 ID |
| `q` | string | 否 | 搜索标题或作者 |
| `page_size` | integer | 否 | 默认 20，最大 50 |
| `cursor` | string | 否 | 游标分页 |

示例：

```text
GET /v1/works?type=poetry&dynasty=唐&page_size=2
GET /v1/works?q=静夜思&page_size=20
GET /v1/works?author_id=4cf43776293040fcb4a5289506997f04
```

`q` 最长 64 个字符。中文搜索会进行分词，多个搜索词按同时满足处理。`dynasty` 最长 32 个字符，`author_id` 最长 128 个字符。

列表中的作品摘要字段：

```json
{
  "id": "9c41898501e1b55003d67772f7612e48",
  "type": "ci",
  "title": "木兰花令·鹤儿每每常相聚",
  "authorName": "王喆",
  "authorId": "9c41898501e1b550570998c28ad4c723",
  "dynasty": "金",
  "content": ["鹤儿每每常相聚，点点苍苔啄食觑。"]
}
```

### 7.2 查询作品详情

#### `GET /v1/works/:id`

示例：

```text
GET /v1/works/9c41898501e1b55003d67772f7612e48
GET /v1/works/9c41898501e1b55003d67772f7612e48?include=pinyin
```

详情会返回数据源中的完整作品字段，并追加：

| 字段 | 说明 |
|---|---|
| `type` | `poetry`、`ci`、`qu` 或 `other` |
| `sourceFile` | 对应的源数据文件 |
| `pinyin` | 使用 `include=pinyin` 且存在拼音数据时返回 |

`include` 支持逗号分隔，当前识别的值为 `pinyin`。

### 7.3 随机作品

#### `GET /v1/works/random`

支持作品列表中的筛选参数：`type`、`dynasty`、`author_id`、`q`；不使用 `page_size` 和 `cursor`。

示例：

```text
GET /v1/works/random
GET /v1/works/random?type=poetry&dynasty=唐
```

响应的 `data` 是单个作品详情对象；没有匹配数据时返回 `404 NOT_FOUND`。

## 8. 作者接口

### 8.1 查询作者列表

#### `GET /v1/authors`

查询参数：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `q` | string | 否 | 作者名前缀匹配，例如 `李` |
| `page_size` | integer | 否 | 默认 20，最大 50 |
| `cursor` | string | 否 | 游标分页 |

示例：

```text
GET /v1/authors?q=李&page_size=20
```

列表字段：

```json
{
  "id": "dc5616e999928c1e2cfd45600e095e05",
  "name": "马钰",
  "dynasty": "上古",
  "birthYear": "1123",
  "deathYear": "1183"
}
```

### 8.2 查询作者详情

#### `GET /v1/authors/:id`

示例：

```text
GET /v1/authors/dc5616e999928c1e2cfd45600e095e05
```

详情会返回作者原始字段，并统一提供 `id`、`name`、`dynasty`、`birthYear`、`deathYear` 和 `desc`。

### 8.3 查询作者作品

#### `GET /v1/authors/:id/works`

示例：

```text
GET /v1/authors/dc5616e999928c1e2cfd45600e095e05/works?page_size=20
GET /v1/authors/dc5616e999928c1e2cfd45600e095e05/works?type=ci&cursor=...
```

支持作品列表的筛选参数：`type`、`dynasty`、`q`、`page_size`、`cursor`。路径中的作者 ID 会自动作为筛选条件。

## 9. 错误码

| HTTP | code | 说明 |
|---:|---|---|
| 400 | `INVALID_PAGE_SIZE` | `page_size` 不在 1～50 |
| 400 | `INVALID_TYPE` | `type` 不支持 |
| 400 | `INVALID_CURSOR` | cursor 无效 |
| 400 | `QUERY_TOO_LONG` | `q` 超过 64 个字符 |
| 400 | `INVALID_DYNASTY` | 朝代参数过长 |
| 400 | `INVALID_AUTHOR_ID` | 作者 ID 参数过长 |
| 404 | `NOT_FOUND` | 资源或匹配数据不存在 |
| 405 | `METHOD_NOT_ALLOWED` | 只允许 GET |
| 500 | `CORRUPT_PAYLOAD` | D1 中的 JSON 数据损坏 |
| 500 | `INTERNAL_ERROR` | 服务内部错误 |

## 10. JavaScript 调用示例

```js
const baseUrl = "https://poetry-api.snowtraces.com";

async function getWorks() {
  const url = new URL(`${baseUrl}/v1/works`);
  url.searchParams.set("type", "poetry");
  url.searchParams.set("dynasty", "唐");
  url.searchParams.set("page_size", "20");

  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const result = await response.json();
  if (result.error) throw new Error(result.error.message);
  return result.data;
}
```

## 11. 缓存说明

接口返回了适合 CDN 的 `Cache-Control`：

- 健康检查：约 30 秒；
- 作品列表：约 60 秒；
- 随机作品：约 30 秒；
- 作者列表：约 5 分钟；
- 详情、元数据、朝代列表：约 1 小时。

客户端不应依赖缓存时间作为业务逻辑的一部分。
