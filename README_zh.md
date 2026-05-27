# 石化公文排版工具 (SINOPEC Document Formatter)

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-blue?logo=react&logoColor=white&style=flat-square" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8.0-purple?logo=vite&logoColor=white&style=flat-square" alt="Vite" />
  <img src="https://img.shields.io/badge/PizZip-3.2-orange?style=flat-square" alt="PizZip" />
  <img src="https://img.shields.io/badge/开源协议-MIT-green?style=flat-square" alt="License" />
</p>

<p align="center">
  <a href="README.md">English</a> | <b>简体中文</b>
</p>

石化公文排版工具是一款专为中国石化企业及各级行政机关定制的**高品质、100% 纯本地离线的单页 Web 应用 (SPA)**。它能够自动将日常杂乱、标点格式混乱的草稿文本，一键清洗、重排并规范化为完全符合国家标准及石化企业公文规范的高清排版文件。

本工具通过将传统的 Word VBA 排版宏算法完整移植并重构到前端浏览器沙箱中运行，**彻底消除了敏感文件在上传服务器解析时的数据外泄隐患**，为您提供一款现代、极速、安全的公文排版新方案。

---

## ✨ 核心特色

*   **VBA 排版算法前端深度重构**：
    *   **标点与格式清洗**：自动将中文语境下误用的半角括号、逗号等规范为全角，清除多余不可见字符和多余空格，并对列表进行悬挂缩进整理。
    *   **5级标题自动树形重编号**：深度解析并自动顺序累加重新计算多达5层嵌套标题（例如：`一、` $\rightarrow$ `（一）` $\rightarrow$ `1.` $\rightarrow$ `（1）` $\rightarrow$ `①`），自动修正点号与顿号的混用。
    *   **落款与日期自动格式化**：智能推导并右缩进落款单位与日期，自动将如 `2026/05/27` 等非标准日期字段大写规范化为符合公文标准的中文传统大写日期。
*   **同步联动双列标准管理器**：
    *   并排提供 **“公文标准：”** 与 **“公文类型：”** 两列联动选择框。内置标准包含 **中石化企业标准 (Q/SH 0758—2019)** 和 **国家通用公文标准 (GB/T 9704—2012)**。
    *   与 **“模板管理页”** 实现 100% 数据打通。您在模板编辑器里克隆、新建或导入的任何自定义排版模板，都会动态同步到左侧的标准下拉列表中，并实时支配右侧的 A4 实时预览排版与纸张样式。
*   **“其他”类型普通正文模板（空白模板）**：
    *   非常适用于书写普通的随笔、长文、纪要或自定义段落。在该模式下启动“扁平正文模式”，跳过发文字号、主送机关、落款日期等法定公文特定要素的硬性拆分与红线警告校验（避免红色红叉报错，提供绿色温馨诊断），默认以当前标准的“默认正文格式”（仿宋三号，27磅行距，两端对齐）优雅平铺。
    *   **保留大纲重编号**：即便在空白模板下，只要段落中出现了 `一、` 或 `（一）` 等，系统依然会自动对其进行标点校正和 1-5 级标题树重新顺序编号，保障极高的实用性。
*   **100% 彻底杜绝乱码的 Word 导出引擎**：
    *   **自适应容错回退**：若宿主服务器上缺少预置的 Word `.docx` 模板文件，导出引擎会自动平滑回退至纯前端从零构建模式，利用 OOXML 架构重新从头绘制标准页面配置。
    *   **纯二进制无损打包**：所有 XML 压缩包的字节流写入全部通过 `TextEncoder` 编译为 `Uint8Array` 并强制使用二进制模式写入 `PizZip`，**100% 根治了导出 Word 文档双字节中文字符显示为黑块或符号的乱码 bug**，实测在任何版本的 MS Word 或 WPS 下打开均完美呈现。
*   **100% 离线运行，安全合规**：
    *   **零 API 调用与网络请求**。所有 mammoth 文档解析、正则规则清洗和 docx 二进制文件压缩全部在您本机的浏览器沙箱中本地执行，断网可完美运行，100% 阻断一切泄密链路。

---

## 📸 运行快照与效果

### 1. 新版双列并排标准/类型选择器
![标准并排](review-screenshots/01_new_parallel_selectors.png)

### 2. A4 纸张实时预览与自动排版效果
![A4预览](review-screenshots/04_parsed_a4_preview.png)

### 3. 多维度格式诊断报告面板
![诊断面板](review-screenshots/05_diagnose_report_panel.png)

---

## 🚀 快速启动

### 准备环境
- Node.js (建议 v18.0.0 或更高版本，本测试在 v24.14.1 下通过)
- npm (v9.0.0 或更高版本)

### 安装依赖
克隆本项目仓库并安装依赖包：
```bash
git clone https://github.com/Superhedgehoger/shihuaGW.git
cd shihua-doc-formatter
npm install
```

### 开发模式运行
在本地启动 Vite 开发服务器：
```bash
npm run dev
```
打开浏览器访问 `http://localhost:5173/` 即可直接使用。

### 生产环境打包
将应用编译为轻量级、高度压缩的纯静态单页发布包：
```bash
npm run build
```
编译好的静态文件将被存放在 `dist/` 目录下，您可以将其部署在任何内网 Web 服务器或静态文件服务器上。

---

## ⌨️ 全局快捷键

使用快捷键可以成倍提高公文排版处理效率：
-   **`Ctrl + Enter`**：一键自动执行文本解析、标点清洗与自动排版。
-   **`Ctrl + S`**：一键自动校验并触发标准公文 `.docx` 文档的导出下载。

---

## 🛡️ 开源协议

本项目基于 MIT 协议开源 - 详情请参阅 [LICENSE](LICENSE) 文件。
