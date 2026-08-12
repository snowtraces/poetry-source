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

当前代码只声明 Worker 和 D1 binding，不上传 `source` 原始文件，也不要求提交任何 Cloudflare 凭据。

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
npx wrangler d1 execute poetry-source --remote --file=.data\seed-cf\verify.sql
```

## 部署

```powershell
npx wrangler deploy
```

## 提交前检查

```powershell
git status --short --ignored
git check-ignore -v wrangler.toml .data\seed-cf .wrangler node_modules
git diff --check
```

确认真实 `wrangler.toml`、`.data/`、`.wrangler/`、`node_modules/` 和任何 `.env` / `.dev.vars` 文件均未出现在待提交文件中。
