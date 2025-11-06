# 📚 poetry-source — 历朝诗词数据集与展示

![example](https://poetry.snowtraces.com/example.jpg)

> 汇聚千年诗韵，感受中华文学之美。
>  Collecting and sharing Chinese classical poetry across dynasties.

------

## 🏮 项目简介

**poetry-source** 是一个收录历代诗词曲的开源数据集与简易展示项目。
 涵盖 **三国、五代十国、南北朝、晋、秦、汉、唐、宋、金、元、明、清** 等主要朝代的诗词曲，并附有两个版本的《全唐诗》。

本项目旨在为：

- 📖 **研究者** 提供高质量、可分析的古诗词数据；
- 💻 **开发者** 提供可直接使用的语料源；
- 🎨 **爱好者** 提供简洁优美的展示页面。

------

## ✨ 特性亮点

- 📚 **全朝代覆盖**：从秦汉到清朝，含诗、词、曲等多种文学体裁
- 🔤 **标准化数据结构**：统一格式、便于索引与文本处理
- 🧩 **多版本《全唐诗》**：支持交叉研究与版本比较
- 🌐 **前端可视化展示**：静态页面快速预览诗词内容
- 💡 **开放使用**：支持自然语言处理（NLP）、数据分析与教学研究

------

## 📁 项目结构

<pre>
├─source
│  ├─<a href="https://github.com/snowtraces/poetry-source/tree/master/source/其他">其他</a>
│  ├─<a href="https://github.com/snowtraces/poetry-source/tree/master/source/曲">曲</a>
│  │  ├─元
│  │  ├─宋
│  │  ├─明
│  │  ├─清
│  │  └─金
│  ├─<a href="https://github.com/snowtraces/poetry-source/tree/master/source/词">词</a>
│  │  ├─五代十国
│  │  ├─元
│  │  ├─南北朝
│  │  ├─唐
│  │  ├─宋
│  │  ├─明
│  │  ├─清
│  │  └─金
│  └─<a href="https://github.com/snowtraces/poetry-source/tree/master/source/诗">诗</a>
│      ├─三国
│      ├─五代十国
│      ├─元
│      ├─南北朝
│      ├─唐
│      ├─宋
│      ├─明
│      ├─晋
│      ├─汉
│      ├─清
│      ├─秦
│      ├─金
│      └─隋
└─<a href="https://github.com/snowtraces/poetry-source/tree/master/全唐诗">全唐诗</a>
    ├─CText_JSON_cht
    └─ZZU_JSON_chs
</pre>

------

## 🚀 快速开始

### 1. 克隆仓库

```
git clone https://github.com/snowtraces/poetry-source.git
cd poetry-source
```

### 2. 打开展示页面

直接在浏览器中打开 `web/index.html` 即可预览古诗词展示页面。
 （如未包含展示页，可访问在线示例：https://poetry.snowtraces.com）

### 3. 加载数据

所有数据位于 `source/` 与 `全唐诗/` 文件夹中，格式化良好，适合导入数据库或脚本分析。
 示例结构如下：

```
{
  "dynasty": "唐",
  "author": "李白",
  "title": "将进酒",
  "content": [
    "君不见黄河之水天上来，奔流到海不复回。",
    "君不见高堂明镜悲白发，朝如青丝暮成雪。",
    "人生得意须尽欢，莫使金樽空对月。"
  ]
}
```

------

## 🤝 贡献

欢迎所有热爱古典文学与开源的朋友参与贡献！
 你可以：

- 优化数据结构或补充缺失诗词
- 添加诗人简介与朝代注解
- 美化展示页面或改进交互
- 编写导入或转换脚本

提交 Pull Request 前请确保数据格式一致。

------

## 📜 版权与许可

本项目数据来源于公开渠道，仅供学习与研究使用。
 如涉及版权问题，请联系仓库维护者处理。
 项目使用 **MIT License** 开源协议。

------

## 🙏 致谢

- 展示页面背景来自 [LingDong-/shan-shui-inf](https://github.com/LingDong-/shan-shui-inf)
- 感谢所有为中华诗词数字化与文化传承贡献力量的项目与开发者。

> “诗者，天地之心。” ——《文心雕龙》
