# Creative Node Editor (CNE) - 中文版

[English Version](README.md)

---

> 基于原生 JS 构建的高性能、模块化可视化节点创意编辑系统。

### 📖 简介与理念

**Creative Node Editor (CNE)** 是一款探索 Web 性能极限的实验性项目。它完全基于 **原生 JavaScript (Vanilla JS)**、**CSS** 和 **Canvas API** 构建。通过绕过重型框架的开销，CNE 实现了亚毫秒级的交互反馈，为数字艺术家和逻辑设计师提供如丝般顺滑的创作体验。

### 🚀 核心特性
- **拓扑求值引擎**：基于有向无环图 (DAG) 逻辑，自动确定计算顺序并防止循环依赖。
- **V2 渲染流水线**：通过中心化的 `RenderPool` 管理绘图指令、深度排序及离屏缓冲。
- **智能剪贴板**：通过 ID 重映射技术，在克隆节点的同时完美保留其内部连线拓扑。
- **动态表达式引擎**：支持在节点参数中直接输入 JS 数学公式（如 `Math.sin(time)`）实现程序化动画。
- **玻璃拟态 UI**：极具高级感的现代深色风格界面，兼顾美学与响应速度。

### 🏗 开发基础设施：Vite 的角色

虽然 CNE 的核心逻辑是纯原生 JS，但我们引入了 **Vite** 作为开发驱动引擎：
- **原生 ESM 支持**：开发阶段利用浏览器原生模块加载，实现“秒开”体验。
- **极速热更新 (HMR)**：修改节点逻辑或样式时，无需刷新页面即可实时生效，且不丢失当前的画布状态。
- **生产构建优化**：在发布版本中执行 Tree-shaking 和混淆压缩，确保 0KB 冗余运行时负载。

### ⌨️ 快捷键指南
| 组合键 | 按键 | 功能描述 |
| :--- | :--- | :--- |
| `Ctrl` | `C` / `V` | **智能复制/粘贴** (保留内部连线) |
| `Ctrl` | `S` / `O` | **保存/打开工程** (.cne 文件) |
| `Ctrl` | `A` | **全选节点** |
| `Delete` | `Del` | **批量删除** |
| `右键` | `拖拽` | **画布平移** |
| `中键滚动` | `滚轮` | **精准缩放** (以鼠标为中心) |
| `F11` | - | **演示模式切换** |

### 📦 安装与运行
1. `git clone https://github.com/ShenyfZero9211/creative_node_editor.git`
2. `npm install`
3. `npm run dev` (访问地址 `http://localhost:3000`)

---

## ⚖️ 许可与署名

Licensed under the **MIT License**.
**Copyright (c) 2026 Yifan Shen**

更多信息请参阅 [SOFTWARE_DOC.md](SOFTWARE_DOC.md) 或 [LICENSE](LICENSE) 文件。
