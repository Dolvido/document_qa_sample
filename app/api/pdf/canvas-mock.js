// Mock canvas module for PDF.js
// This prevents the need to install the native 'canvas' dependency

// Mock CanvasRenderingContext2D
class CanvasRenderingContext2D {
  // Add minimal methods that PDF.js might call
  fillRect() {}
  beginPath() {}
  moveTo() {}
  lineTo() {}
  fill() {}
  stroke() {}
  measureText() { return { width: 0 }; }
  // Add any other methods you see in errors
}

// Mock canvas element
class Canvas {
  constructor(width, height) {
    this.width = width || 0;
    this.height = height || 0;
  }
  
  getContext() {
    return new CanvasRenderingContext2D();
  }
  
  // Add a static method that PDF.js might use
  static createCanvas(width, height) {
    return new Canvas(width, height);
  }
}

// Mock image class
class Image {
  constructor() {
    this.src = '';
    this.width = 0;
    this.height = 0;
  }
  
  get onload() {
    return this._onload;
  }
  
  set onload(fn) {
    this._onload = fn;
  }
}

// Export what PDF.js might expect from canvas package
module.exports = {
  Canvas,
  Image,
  createCanvas: Canvas.createCanvas
}; 