# Creative Node Editor (CNE)

[中文版 (Chinese Version)](README_CN.md)

---

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

## ⚖️ License & Attribution

Licensed under the **MIT License**.
**Copyright (c) 2026 Yifan Shen**

For more information, see the [SOFTWARE_DOC.md](SOFTWARE_DOC.md) or [LICENSE](LICENSE) file.
