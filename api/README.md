# poetry-source Cloudflare API

接口使用文档：[`API.md`](./API.md)

部署说明：[`DEPLOY_CLOUDFLARE.md`](./DEPLOY_CLOUDFLARE.md) · 提交前安全检查：[`SECURITY.md`](./SECURITY.md)

这是基于仓库 `source/` 数据的 Cloudflare Workers + D1 API。导入脚本只读取现有数据，并把结果写到 `api/.data/seed-cf/`；该目录已被 Git 忽略。

## 本地检查

```powershell
cd api
npm install
npm test
```

## 生成 D1 导入文件

默认每 5000 条作品生成一个 SQL 文件，避免单个导入文件过大：

```powershell
node scripts/import-source-cloudflare.mjs --source ..\source --out .data\seed-cf --format sql
```

该 Cloudflare 专用脚本会忽略 `source\其他`，并移除 D1 不允许执行的显式
`BEGIN TRANSACTION`、`COMMIT` 语句。脚本不会修改 `source/`。

如需生成通用 NDJSON，可使用：

```powershell
node scripts/import-source.mjs --source ..\source --out .data\seed-ndjson --format ndjson
```

如果输出目录已有文件，需要显式传入 `--force`。

## Cloudflare 初始化

1. 准备 `wrangler.toml`，保留现有 D1 `database_id`。
2. 如尚未创建数据库，再创建数据库：

```powershell
npx wrangler d1 create poetry-source
```

当前部署只使用 Workers + D1，不创建、不绑定、不上传 R2 源文件。

3. 应用表结构：

```powershell
npx wrangler d1 migrations apply poetry-source --remote
```

4. 按文件名顺序导入作品和作者：

```powershell
Get-ChildItem .data\seed-cf\works-*.sql | Sort-Object Name | ForEach-Object {
  npx wrangler d1 execute poetry-source --remote --file $_.FullName
}

Get-ChildItem .data\seed-cf\authors-*.sql | Sort-Object Name | ForEach-Object {
  npx wrangler d1 execute poetry-source --remote --file $_.FullName
}
```

5. 重建全文索引并核对数量：

```powershell
npx wrangler d1 execute poetry-source --remote --file .data\seed-cf\rebuild-fts.sql
npx wrangler d1 execute poetry-source --remote --file .data\seed-cf\verify.sql
```

免费 D1 每日写入额度有限，首次导入应允许断点续传；如果当天额度耗尽，第二天从未执行的 SQL 文件继续即可。

## 部署

```powershell
npx wrangler deploy
```

接口默认为 `/v1`，包括作品、作者、随机推荐、元数据和朝代列表接口。详细方案见仓库根目录的 `CLOUDFLARE_API_PLAN.md`。
