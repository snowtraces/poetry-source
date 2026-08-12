# 忽略 `source/其他` 的导入入口

由于 `source/其他` 内的资料不是统一作品结构，当前正式导入使用独立入口：

```powershell
cd api
node scripts/import-source-ignore-other.mjs --source ..\source --out .data\seed --format sql
```

此入口只把 `诗`、`词`、`曲` 和 `作者.json` 放入临时硬链接视图，再复用 SQL/NDJSON 导入逻辑；原始 `source/其他` 不会被读取或修改。
