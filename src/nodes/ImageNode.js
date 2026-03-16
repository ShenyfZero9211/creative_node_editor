/**
 * ImageNode — V2 renderable node with reasonable value ranges
 */

import { Node } from '../core/Node.js';

export class ImageNode extends Node {
  constructor(x, y) {
    super('Image', x, y);
    this.title = '图片';
    this.icon = '🖼';
    this.color = '#bc8cff';
    this.category = '可渲染节点';
    this.width = 170;

    this.addOutput('渲染源', 'renderSource');

    this.addParam('elementId', { type: 'text', label: 'ID', default: 'img_1', noInputToggle: true });
    this.addParam('imageUrl', { type: 'url', label: '本地文件路径', default: '', inputDataType: 'string' });
    this.addParam('x', { type: 'number', label: 'X', default: 400, min: 0, max: 800, step: 1, inputDataType: 'number' });
    this.addParam('y', { type: 'number', label: 'Y', default: 300, min: 0, max: 600, step: 1, inputDataType: 'number' });
    this.addParam('width', { type: 'number', label: '宽', default: 200, min: 1, max: 800, step: 1, inputDataType: 'number' });
    this.addParam('height', { type: 'number', label: '高', default: 200, min: 1, max: 600, step: 1, inputDataType: 'number' });
    this.addParam('rotation', { type: 'number', label: '旋转', default: 0, min: 0, max: 360, step: 1, inputDataType: 'number' });
    this.addParam('opacity', { type: 'number', label: '透明度', default: 1, min: 0, max: 1, step: 0.05, inputDataType: 'number' });

    this._image = null;
    this._imageUrl = null; // Volatile system Blob URL
    this._lastSrc = null;
    this._isLoading = false;
    this._loadFailed = false;
  }

  loadImageFromFile(file) {
    if (this._imageUrl) URL.revokeObjectURL(this._imageUrl);
    this._imageUrl = URL.createObjectURL(file);
    
    // Auto-update the path field with the file name (as a hint)
    // If the field is empty or already starts with local://, update it.
    if (!this.paramValues.imageUrl || this.paramValues.imageUrl.startsWith('local://')) {
      this.paramValues.imageUrl = `local://${file.name}`;
    }
    
    this._loadSrc(this._imageUrl);
  }

  _loadSrc(src) {
    if (!src) return;
    
    // In local-only mode, we still allow:
    // 1. Blobs (from file picker or other nodes)
    // 2. Data URLs
    // 3. Absolute/Relative paths (if the user manually entered them and they are available via dev server)
    
    // We ignore remote http/https for now as per V8.3 request
    if (src.startsWith('http')) {
      console.warn('ImageNode is currently in Local-Only mode. Ignoring remote resource:', src);
      return;
    }

    if (src === this._lastSrc && (this._image?.complete || this._loadFailed || this._isLoading)) return;
    
    this._lastSrc = src;
    this._isLoading = true;
    this._loadFailed = false;

    const img = new Image();
    // IMPORTANT: No crossOrigin set here to allow "tainted" mode (widest compatibility)
    
    img.onload = () => {
      console.log('Image load success:', src.startsWith('blob:') ? '(Internal Memory)' : src);
      this._image = img;
      this._isLoading = false;
      this._loadFailed = false;
      this.markDirty();
    };
    
    img.onerror = () => {
      console.warn('Image load error:', src);
      this._isLoading = false;
      this._loadFailed = true;
      this._image = null;
      this.markDirty();
    };

    img.src = src;
  }

  evaluate(inputValues) {
    this._applyInputOverrides(inputValues);

    let srcToLoad = null;

    // Priority: 
    // 1. External connection to imageUrl
    const urlPortIdx = this.inputs.findIndex(p => p.paramKey === 'imageUrl');
    const hasConnection = urlPortIdx >= 0 && inputValues[urlPortIdx];

    if (hasConnection) {
      srcToLoad = inputValues[urlPortIdx];
    } else if (this.paramValues.imageUrl && !this.paramValues.imageUrl.startsWith('local://')) {
      // 2. Manual URL parameter
      srcToLoad = this.paramValues.imageUrl;
    } else if (this._imageUrl) {
      // 3. Local file blob URL
      srcToLoad = this._imageUrl;
    }

    if (srcToLoad) {
      this._loadSrc(srcToLoad);
    }

    const p = this.paramValues;
    const img = this._image;

    if (!img || !img.complete || img.naturalWidth === 0) {
      return {
        type: 'renderSource',
        elementId: p.elementId,
        zIndex: 0,
        draw: (ctx) => {
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#333';
          ctx.fillRect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);
          ctx.fillStyle = '#888';
          ctx.font = '14px Inter';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('📷 无图片', p.x, p.y);
        },
      };
    }

    return {
      type: 'renderSource',
      elementId: p.elementId,
      zIndex: 0,
      draw: (ctx) => {
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.drawImage(img, -p.width / 2, -p.height / 2, p.width, p.height);
      },
    };
  }
}
