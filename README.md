# Creative Node Editor (CNE)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Active](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()
[![Build Framework: Vanilla JS](https://img.shields.io/badge/Build%20Framework-Vanilla%20JS-blue.svg)]()

> A high-performance, modular, and visually stunning node-based creative environment for real-time visual logic and rendering.

---

## 🌟 Introduction & Philosophy

**Creative Node Editor (CNE)** is more than just a tool; it's an experiment in the power of the web. Built entirely on **Vanilla JavaScript**, **CSS**, and the **Canvas API**, CNE represents a "zero-dependency" philosophy for creative tools. By bypassing heavy frameworks, CNE achieves a level of responsiveness and startup speed that traditional web apps often lack, providing a seamless "flow state" for digital artists and logic designers.

The primary goal of CNE is to democratize high-end creative programming by providing a visual, low-code interface that doesn't compromise on technical depth. Whether you are building complex rendering pipelines or simple geometric animations, CNE provides the building blocks.

---

## 🚀 Key Features

### 1. Advanced Modular Engine
- **Graph-Based Logic**: Build complex systems by connecting independent functional units.
- **Topological Evaluation**: An intelligent engine that automatically determines the correct execution order of your graph, preventing race conditions and ensuring deterministic results.
- **Dynamic Port Rebuilding**: Nodes like `ContainerNode` and `TransformNode` dynamically react to parameter changes by adding or removing ports on the fly.

### 2. High-Fidelity Rendering Pipeline (V2)
- **RenderPool System**: A centralized hub that collects multiple rendering sources, handles z-indexing, and manages drawing priorities.
- **Multi-Output Strategy**: Use `Screen` nodes to define specific resolutions and output windows, allowing for professional multi-monitor or partitioned displays.
- **Real-time Feedback**: Every change in the graph is evaluated instantly, providing a sub-millisecond feedback loop on the canvas.

### 3. Reactive Transformation & Math
- **Expression-Engine**: Don't settle for static values. Input raw JavaScript expressions into transformation ports to create procedurally animated objects.
- **Coordinate Mapping**: Built-in support for relative and global coordinate conversions, essential for complex motion graphics.

### 4. Pro-Grade UX & Interface
- **Glassmorphism Design**: A sleek, modern dark-themed UI that puts your project in the center.
- **Integrated Minimap**: Navigate vast node topologies with ease using the interactive vision-map.
- **Rich Contextual Interaction**: Full right-click support for both the canvas and specific nodes, providing quick access to deep functionality.
- **Intelligent Clipboard**: Copy not just nodes, but entire snapshots of visual logic—including the internal connections that define their relationship.

---

## 🏗 Technical Architecture

CNE is designed with a strictly layered approach to ensure scalability and maintainability:

### **The Core Layer**
- **NodeCanvas**: The rendering and interaction heart. It handles high-precision object picking, multi-selection algorithms, and geometric viewport transformations.
- **ConnectionManager**: A specialized library for managing the DAG (Directed Acyclic Graph). It handles type validation (e.g., preventing a 'Number' from outputting to a 'RenderSource') and lifecycle management.
- **RenderEngine**: The execution heart. It runs a optimized loop that prioritizes dirty-flagged nodes to minimize CPU overhead.

### **The Node Layer**
- **Base `Node` Class**: Defines the standard interface for serialization, port management, and UI representation.
- **Specialized Node Registry**: A factory-based system that allows for easy extension. If you want a new effect, just drop a new class into `src/nodes/`.

### **The UI Layer**
- **ParamPanel**: A context-aware property inspector. It listens to the selected node type and dynamically generates a control suite, including color pickers, sliders, and file selectors.
- **Toolbar & Windows**: Flexbox-based panels that manage global state and view toggles.

---

## 🛠 Tech Stack Deep Dive

- **Language**: JavaScript (ES6+). Strictly modular architecture.
- **Graphics**: HTML5 Canvas 2D API. Chosen for its balance of performance and universal compatibility across devices.
- **Layout**: CSS Variables & Grid. Zero CSS-in-JS libraries used to maintain raw performance and CSS-cache efficiency.
- **Build System**: Vite. Used for lightning-fast HMR (Hot Module Replacement) during the intensive design process.

---

## 📦 Getting Started

### Prerequisites
- A modern web browser with ES6 Module support.
- [Node.js](https://nodejs.org/) (Version 16+ recommended).

### Installation & Run
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/ShenyfZero9211/creative_node_editor.git
    cd creative_node_editor
    ```
2.  **Initialize**:
    ```bash
    npm install
    ```
3.  **Start Development**:
    ```bash
    npm run dev
    ```
    Access the editor at `http://localhost:3000`.

---

## ⌨️ Productivity Powerhouse: Hotkeys

CNE is designed for power users. Master these to speed up your workflow:

| Modifier | Key | Action |
| :--- | :--- | :--- |
| `Ctrl` | `C` | **Smart Copy** (Remembers connections within selection) |
| `Ctrl` | `V` | **Smart Paste** (Restores nodes and their internal links) |
| `Ctrl` | `S` | **Save Project** (.cne export) |
| `Ctrl` | `O` | **Open Project** (.cne import) |
| `Ctrl` | `A` | **Select All Nodes** |
| `Delete` | `Del` | **Batch Delete** (Optimized removal) |
| `Middle-Click` | `Drag` | **Fast Pan** (Viewport navigation) |
| `Scroll` | `Wheel` | **Precision Zoom** (Centered on cursor) |
| `F11` | - | **Toggle Presentation Mode** |

---

## 📄 Documentation & Research

For a deep academic analysis of the system architecture, performance benchmarks, and the research significance of this work, please see the full paper:

👉 **[SOFTWARE_DOC.md (10,000-word Software Thesis)](SOFTWARE_DOC.md)**

---

## 🗺 Roadmap

- [ ] **GPU Acceleration**: Migrating the render core to WebGL/WebGPU.
- [ ] **Node Grouping**: The ability to encapsulate logic into reusable sub-graphs.
- [ ] **History Stack**: Full Undo/Redo support for all graph operations.
- [ ] **Extension API**: A public plugin system for developers to add third-party nodes.

---

## 🤝 Contributing & Support

We welcome developers, artists, and researchers to contribute to CNE. 
- **Bug Reports**: Open an issue on GitHub.
- **Feature Requests**: We are always looking for new node ideas!
- **Pull Requests**: please ensure code follows the existing modular style.

---

## ⚖️ License

Creative Node Editor is open-source software licensed under the **MIT License**. 
Built with ❤️ by the CNE Development Team.
