# poetry-source

中国古典诗词曲数据集，以及用于浏览数据的静态页面和只读 API。

项目将原始数据、静态展示和接口服务放在同一个仓库中，适合用于文本检索、数据分析、教学演示和相关应用开发。

## 在线入口

| 入口 | 地址 |
|---|---|
| 静态展示页面 | <https://poetry.snowtraces.com> |
| API 在线调试页 | <https://poetry-api.snowtraces.com> |
| API 基础地址 | <https://poetry-api.snowtraces.com/v1> |
| API 健康检查 | <https://poetry-api.snowtraces.com/v1/health> |
| API 文档 | [`api/API.md`](./api/API.md) |

API 根地址会打开调试页面，列出接口示例、参数说明和实时响应。接口当前为公开只读服务，不需要登录或 API Key。

## 项目内容

- `source/诗/`：按朝代组织的诗歌数据；
- `source/词/`：按朝代组织的词数据；
- `source/曲/`：按朝代组织的曲数据；
- `source/作者.json`：作者信息；
- `source/其他/`：其他来源或结构不同的资料，当前 API 导入时不读取此目录；
- `全唐诗/`：两个版本的《全唐诗》数据；
- `index.html`、`css/`、`js/`：静态展示页面；
- `api/`：Cloudflare Workers + D1 API、导入脚本、迁移文件和测试。

## 数据概览

| 类型 | 数量 |
|---|---:|
| 诗 | 476,333 |
| 词 | 53,369 |
| 曲 | 804 |
| **合计** | **530,506** |

## 快速开始

### 浏览静态页面

```bash
git clone https://github.com/snowtraces/poetry-source.git
cd poetry-source
python -m http.server 8000
```

然后访问 <http://localhost:8000>。项目为静态页面，不需要前端构建步骤。

### 调用在线 API

```bash
curl "https://poetry-api.snowtraces.com/v1/works?q=静夜思&page_size=20"
```

常用请求：

```text
GET /v1/works                 作品列表
GET /v1/works/:id             作品详情
GET /v1/works/random          随机作品
GET /v1/authors               作者列表
GET /v1/authors/:id           作者详情
GET /v1/authors/:id/works     作者作品
GET /v1/meta                  数据集统计
GET /v1/dynasties             朝代列表
```

完整参数、响应格式、错误码和可调试示例见 [`api/API.md`](./api/API.md)。

## 数据格式

作品记录以 JSON 数组保存。不同来源的字段并不完全相同，下面示例包含项目中常见的完整作品字段：

```json
{
  "id": "4cf43776293040fc04bd64e72e48f935",
  "title": "静夜思",
  "authorName": "李白",
  "authorId": "4cf43776293040fcb4a5289506997f04",
  "dynasty": "唐",
  "appreciation": "作品赏析文本。",
  "content": [
    "床前明月光，疑是地上霜。",
    "举头望明月，低头思故乡。"
  ],
  "comment": [
    "历代评注文本。"
  ],
  "translation": "明亮的月光洒在窗前，好像地上泛起了一层霜。",
  "intro": "作品简介。",
  "annotation": [
    "静夜思：安静的夜晚产生的思绪。"
  ]
}
```

其中 `id`、`title`、`authorName`、`authorId`、`dynasty` 和 `content` 是常见核心字段；`appreciation`、`comment`、`translation`、`intro`、`annotation` 等字段按数据来源提供。部分数据同时提供 `base.json` 和 `pinyin.json`。API 作品详情会保留源记录字段，并可通过 `include=pinyin` 请求拼音数据。

## API 开发与部署

API 使用 Cloudflare Workers + D1，Worker 代码不携带原始数据；数据通过导入脚本写入 D1。当前部署不依赖 R2。

本地检查：

```powershell
cd api
npm install
npm test
```

生成 Cloudflare 可执行的 D1 导入文件：

```powershell
npm run import -- `
  --source ..\source `
  --out .data\seed-cf `
  --format sql
```

部署和导入细节见 [`api/DEPLOY_CLOUDFLARE.md`](./api/DEPLOY_CLOUDFLARE.md)。

## 参与贡献

欢迎通过 Issue 或 Pull Request 改进项目。适合贡献的内容包括：

- 修正或补充数据；
- 改进数据转换、检索和导入脚本；
- 改进静态展示页面；
- 完善 API 文档、测试和错误处理。

提交数据变更时，请尽量保留现有字段名和 ID，说明数据来源及变更范围。API 代码变更请在 `api/` 目录运行测试：

```powershell
cd api
npm test
```

不要提交本地 `api/wrangler.toml`、`.data/`、`.wrangler/`、`node_modules/`、`.env` 或 `.dev.vars`。提交前安全检查见 [`api/SECURITY.md`](./api/SECURITY.md)。

## 许可与数据来源

仓库中的项目代码和相关配置采用 [MIT License](./LICENSE)。`source/` 和 `全唐诗/` 中的资料来自公开渠道，具体作品、整理版本和附加说明可能具有不同的来源与使用条件；使用数据时请根据实际来源进行核查和署名。

静态页面背景素材来源于 [LingDong-/shan-shui-inf](https://github.com/LingDong-/shan-shui-inf)。

> “诗者，天地之心。” ——《文心雕龙》
