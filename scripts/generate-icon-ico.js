const fs = require('fs');
const width = 256;
const height = 256;
const pixelCount = width * height;
const pixels = Buffer.alloc(pixelCount * 4);

// iPOS Zen Palette: Elite Olive (#AFB42B)
// RGB: 175, 180, 43
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 4;
    
    // Background color: Deep Navy (#0F172A)
    let r = 0x0F;
    let g = 0x17;
    let b = 0x2A;

    // Simple stylized "Z" shape in Elite Olive
    // This is a programmatic representation for the taskbar icon
    const isTopBar = y > 60 && y < 100 && x > 60 && x < 196;
    const isBottomBar = y > 156 && y < 196 && x > 60 && x < 196;
    const isDiagonal = Math.abs((width - x) - y) < 25 && y >= 100 && y <= 156;

    if (isTopBar || isBottomBar || isDiagonal) {
      r = 175;
      g = 180;
      b = 43;
    }

    pixels[offset + 0] = b; // Blue
    pixels[offset + 1] = g; // Green
    pixels[offset + 2] = r; // Red
    pixels[offset + 3] = 0xff; // Alpha
  }
}

const maskRowSize = Math.ceil(width / 32) * 4;
const mask = Buffer.alloc(maskRowSize * height, 0xff);
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);

const entry = Buffer.alloc(16);
entry.writeUInt8(width === 256 ? 0 : width, 0);
entry.writeUInt8(height === 256 ? 0 : height, 1);
entry.writeUInt8(0, 2);
entry.writeUInt8(0, 3);
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);

const imageDataOffset = 6 + 16;
const imageSize = 40 + pixels.length + mask.length;
entry.writeUInt32LE(imageSize, 8);
entry.writeUInt32LE(imageDataOffset, 12);

const dib = Buffer.alloc(40);
dib.writeUInt32LE(40, 0);
dib.writeInt32LE(width, 4);
dib.writeInt32LE(height * 2, 8);
dib.writeUInt16LE(1, 12);
dib.writeUInt16LE(32, 14);
dib.writeUInt32LE(0, 16);
dib.writeUInt32LE(pixels.length + mask.length, 20);
dib.writeInt32LE(0, 24);
dib.writeInt32LE(0, 28);
dib.writeUInt32LE(0, 32);
dib.writeUInt32LE(0, 36);

const out = Buffer.concat([header, entry, dib, pixels, mask]);
fs.mkdirSync('public/icons', { recursive: true });
fs.writeFileSync('public/icons/icon.ico', out);
console.log('Created high-fidelity iPOS Zen icon.ico', out.length);
