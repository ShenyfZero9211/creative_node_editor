# Creative Node Editor (CNE)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance, modular, and visually stunning node-based creative environment for real-time visual logic and rendering.

## 🚀 Features

- **Modular Node System**: Create complex visual logic using a wide variety of nodes (Transformation, Rendering, Logic, Parameters).
- **Real-time Rendering Pipeline**: V2 pipeline with RenderPool and Screen nodes for multi-output management.
- **Dynamic Transforms**: Support for both preset and custom mathematical expressions ($x, $y based) for object manipulation.
- **Advanced UI/UX**: Dark-themed, glassmorphism-inspired interface with minimap, context menus, and comprehensive hotkey support.
- **Persistence**: Save and load projects in `.cne` (JSON-based) format.
- **Local-Only Assets**: Secure and stable local image loading with path persistence.

## 🛠 Tech Stack

- **Core**: Vanilla JavaScript (ES6+ Modules)
- **Styling**: Vanilla CSS (Modern CSS properties, Flexbox/Grid)
- **Rendering**: HTML5 Canvas API

## 📦 Getting Started

### Prerequisites

- A modern web browser (Chrome/Edge recommended).
- [Node.js](https://nodejs.org/) (for development server).

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/ShenyfZero9211/creative_node_editor.git
    ```
2.  Install dependencies (if any):
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```

## ⌨️ Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + C` | Copy Selected Nodes |
| `Ctrl + V` | Paste Nodes |
| `Ctrl + S` | Save Project |
| `Ctrl + O` | Open Project |
| `Delete / Backspace` | Delete Selected Nodes |
| `Ctrl + A` | Select All |
| `F11` | Toggle Fullscreen |

## 📄 Documentation

For detailed information on architecture, development process, and research significance, please refer to the [Full Documentation](SOFTWARE_DOC.md).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
