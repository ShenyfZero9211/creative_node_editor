/**
 * NodeRegistry — V2 with Time node, 5 categories
 */

import { ShapeNode } from './ShapeNode.js';
import { TextNode } from './TextNode.js';
import { ImageNode } from './ImageNode.js';
import { RenderPoolNode } from './RenderPoolNode.js';
import { RendererNode } from './RendererNode.js';
import { ScreenNode } from './ScreenNode.js';
import { IntegerNode } from './IntegerNode.js';
import { FloatNode } from './FloatNode.js';
import { ColorNode } from './ColorNode.js';
import { UrlNode } from './UrlNode.js';
import { TimeNode } from './TimeNode.js';
import { StringNode } from './StringNode.js';
import { TransformNode } from './TransformNode.js';
import { ContainerNode } from './ContainerNode.js';
import { CounterNode } from './CounterNode.js';

export const NODE_TYPES = [
  // 可渲染节点
  { id: 'Shape', label: '图形', icon: '◆', color: '#58a6ff', category: '可渲染节点',
    create: (x, y) => new ShapeNode(x, y) },
  { id: 'Text', label: '文本', icon: '𝐓', color: '#f778ba', category: '可渲染节点',
    create: (x, y) => new TextNode(x, y) },
  { id: 'Image', label: '图片', icon: '🖼', color: '#bc8cff', category: '可渲染节点',
    create: (x, y) => new ImageNode(x, y) },

  // 管线
  { id: 'RenderPool', label: '渲染池', icon: '📦', color: '#d29922', category: '管线',
    create: (x, y) => new RenderPoolNode(x, y) },
  { id: 'Renderer', label: '渲染', icon: '🎬', color: '#bc8cff', category: '管线',
    create: (x, y) => new RendererNode(x, y) },
  { id: 'Screen', label: '屏幕', icon: '🖥', color: '#3fb950', category: '输出',
    create: (x, y) => new ScreenNode(x, y) },

  // 参数节点
  { id: 'Integer', label: '整数', icon: '🔢', color: '#3fb950', category: '参数',
    create: (x, y) => new IntegerNode(x, y) },
  { id: 'Float', label: '小数', icon: '🔹', color: '#39d2c0', category: '参数',
    create: (x, y) => new FloatNode(x, y) },
  { id: 'Color', label: '颜色', icon: '🎨', color: '#f0883e', category: '参数',
    create: (x, y) => new ColorNode(x, y) },
  { id: 'Url', label: 'URL', icon: '🔗', color: '#f778ba', category: '参数',
    create: (x, y) => new UrlNode(x, y) },
  { id: 'String', label: '字符串', icon: '𝐒', color: '#3fb950', category: '参数',
    create: (x, y) => new StringNode(x, y) },
  { id: 'Time', label: '时间', icon: '⏱', color: '#d29922', category: '参数',
    create: (x, y) => new TimeNode(x, y) },

  // 变换
  { id: 'Transform', label: '变换', icon: '⟳', color: '#39d2c0', category: '变换',
    create: (x, y) => new TransformNode(x, y) },

  // 综合与状态
  { id: 'Container', label: '容器', icon: '📦', color: '#bc8cff', category: '演算',
    create: (x, y) => new ContainerNode(x, y) },
  { id: 'Counter', label: '计数器', icon: '🔢', color: '#3fb950', category: '状态',
    create: (x, y) => new CounterNode(x, y) },
];

export function createNode(typeId, x, y) {
  const typeDef = NODE_TYPES.find(t => t.id === typeId);
  if (!typeDef) return null;
  return typeDef.create(x, y);
}

export function getNodesByCategory() {
  const categories = new Map();
  for (const t of NODE_TYPES) {
    if (!categories.has(t.category)) categories.set(t.category, []);
    categories.get(t.category).push(t);
  }
  return categories;
}
