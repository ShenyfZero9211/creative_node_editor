# Creative Node Editor (CNE)

[English](#english) | [中文](#中文)

---

<a name="english"></a>

## 🌟 English Version

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Active](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()
[![Build Framework: Vanilla JS](https://img.shields.io/badge/Build%20Framework-Vanilla%20JS-blue.svg)]()

> A high-performance, modular, and visually stunning node-based creative environment for real-time visual logic and rendering.

### 📖 Introduction & Philosophy

**Creative Node Editor (CNE)** is an experiment in Web performance. Built entirely on **Vanilla JavaScript**, **CSS**, and the **Canvas API**, CNE follows a "zero-dependency" core philosophy. By bypassing heavy frameworks, it achieves ultra-low latency and sub-millisecond feedback loops, providing a seamless "flow state" for digital artists and logic designers.

### 🚀 Key Features
- **Topological Evaluation Engine**: Automatically determines execution order and prevents circular dependencies using DAG logic.
- **V2 Rendering Pipeline**: A centralized `RenderPool` that manages drawing instructions, z-indexing, and offscreen buffering.
- **Smart Clipboard**: Clone complex node networks while maintaining their internal connection topology via ID remapping.
- **Expression Engine**: Input raw JavaScript math (e.g., `Math.sin(time)`) directly into node parameters for procedural animation.
- **Glassmorphism UI**: A premium, modern dark-themed interface with high responsiveness.

### 🏗 Technical Infrastructure: The Role of Vite

While CNE is a pure **Vanilla JS** project at its core, we utilize **Vite** as our development and build engine. This provides several critical advantages:
- **Native ESM**: Loads modules directly in the browser during development for instant startup.
- **HMR (Hot Module Replacement)**: Update node logic or styles without refreshing the page or losing your graph state.
- **Optimized Bundling**: Uses Rollup for production builds, ensuring tree-shaking and minification for a 0KB redundant runtime.

### ⌨️ Hotkeys
| Modifier | Key | Action |
| :--- | :--- | :--- |
| `Ctrl` | `C` / `V` | **Smart Copy / Paste** (Preserves connections) |
| `Ctrl` | `S` / `O` | **Save / Open Project** (.cne files) |
| `Ctrl` | `A` | **Select All Nodes** |
| `Delete` | `Del` | **Batch Delete** |
| `Right-Click` | `Drag` | **Fast Pan** |
| `Scroll` | `Wheel` | **Precision Zoom** |
| `F11` | - | **Presentation Mode** |

### 📦 Installation
1. `git clone https://github.com/ShenyfZero9211/creative_node_editor.git`
2. `npm install`
3. `npm run dev` (Access at `http://localhost:3000`)

---

<a name="中文"></a>

## 🌟 中文版本

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

## ⚖️ License & Attribution / 许可与署名

Licensed under the **MIT License**.
**Copyright (c) 2026 Yifan Shen**

For more information, see the [SOFTWARE_DOC.md](SOFTWARE_DOC.md) or [LICENSE](LICENSE) file.
