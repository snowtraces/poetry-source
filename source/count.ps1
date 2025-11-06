# 根目录路径（请修改为你的实际路径）
$root = "C:\Users\snow\code\project\poetry-source\source"

# 获取所有 .base.json 文件
$files = Get-ChildItem -Path $root -Recurse -Filter "*.base.json"

# 创建一个哈希表用于存储结果
$result = @{}

foreach ($file in $files) {
    try {
        # 获取相对路径（例如：曲\宋\xxx.base.json）
        $relativePath = $file.FullName.Substring($root.Length + 1)

        # 提取二级目录（例如 "曲\宋"）
        $parts = $relativePath.Split([IO.Path]::DirectorySeparatorChar)
        if ($parts.Count -ge 2) {
            $level2Dir = Join-Path $parts[0] $parts[1]
        } else {
            $level2Dir = $parts[0]
        }

        # 读取 JSON 文件并计算数组长度
        $jsonData = Get-Content -Raw -Path $file.FullName | ConvertFrom-Json
        $count = $jsonData.Count

        # 累加到对应目录
        if ($result.ContainsKey($level2Dir)) {
            $result[$level2Dir] += $count
        } else {
            $result[$level2Dir] = $count
        }
    } catch {
        Write-Warning "解析文件失败：$($file.FullName)：$($_.Exception.Message)"
    }
}

# 输出结果表格
$result.GetEnumerator() | Sort-Object Name | Format-Table Name, Value -AutoSize
