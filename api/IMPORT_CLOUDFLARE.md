# Cloudflare D1 导入入口

Cloudflare 当前的 `wrangler d1 execute --file` 不接受 SQL 文件中的显式 `BEGIN TRANSACTION` / `COMMIT`。请使用专用入口：

```powershell
cd api
node scripts/import-source-cloudflare.mjs --source ..\source --out .data\seed-cf --format sql
```

该入口同时忽略 `source/其他`，并把 SQL 分块生成为可直接交给 `wrangler d1 execute --remote --file` 的文件。
生成的 `dataset-meta.sql` 保存导入时生成的静态统计，执行完作品和作者文件后再执行该文件。
