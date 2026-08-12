# Cloudflare 部署说明

当前 Worker 使用仓库中的 `wrangler.toml` 配置。真实配置文件包含 Cloudflare 资源 ID，已被 `.gitignore` 忽略，不应提交。

## 准备配置

首次部署时复制示例配置：

```powershell
cd api
Copy-Item wrangler.toml.example wrangler.toml
notepad wrangler.toml
```

填写实际的 `database_id`。已经存在并可用的本地 `wrangler.toml` 不要覆盖，以免丢失现有配置。

当前代码声明 Worker、D1 和 Rate Limiting binding，不上传 `source` 原始文件，也不要求提交任何 Cloudflare 凭据。

配置中的 `IP_RATE_LIMITER` 会按来源 IP 限制为每 60 秒 60 次请求。`namespace_id` 必须是当前 Cloudflare 账号内唯一的正整数；如该值已被其他 Worker 使用，请替换为其他唯一值。

## 初始化数据库

```powershell
npx wrangler d1 migrations apply poetry-source --remote
```

## 生成导入文件

专用导入脚本会忽略 `source/其他`，并移除 D1 不接受的显式事务语句：

```powershell
node scripts/import-source-cloudflare.mjs `
  --source ..\source `
  --out .data\seed-cf `
  --format sql
```

`.data/` 已被忽略，生成的 SQL 不会进入 Git。

## 导入 D1

```powershell
Get-ChildItem .data\seed-cf\works-*.sql | Sort-Object Name | ForEach-Object {
  npx wrangler d1 execute poetry-source --remote --file="$($_.FullName)"
  if ($LASTEXITCODE -ne 0) { throw "Import failed: $($_.Name)" }
}

Get-ChildItem .data\seed-cf\authors-*.sql | Sort-Object Name | ForEach-Object {
  npx wrangler d1 execute poetry-source --remote --file="$($_.FullName)"
  if ($LASTEXITCODE -ne 0) { throw "Import failed: $($_.Name)" }
}

npx wrangler d1 execute poetry-source --remote --file=.data\seed-cf\rebuild-fts.sql
npx wrangler d1 execute poetry-source --remote --file=.data\seed-cf\dataset-meta.sql
npx wrangler d1 execute poetry-source --remote --file=.data\seed-cf\verify.sql
```

`dataset-meta.sql` 会把导入时生成的作品、作者、类型和朝代统计写入
`dataset_meta`。Worker 优先读取这份摘要，不再为每次 `/v1/meta` 和
`/v1/dynasties` 请求扫描 `works` 表。

## 部署

```powershell
npx wrangler deploy
```

部署后，超过限额的请求会返回 `429 RATE_LIMITED`。修改限流参数后需要重新部署 Worker。

## 提交前检查

```powershell
git status --short --ignored
git check-ignore -v wrangler.toml .data\seed-cf .wrangler node_modules
git diff --check
```

确认真实 `wrangler.toml`、`.data/`、`.wrangler/`、`node_modules/` 和任何 `.env` / `.dev.vars` 文件均未出现在待提交文件中。
