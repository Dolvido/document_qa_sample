const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

// Create SVG icon
function generateSvgIcon(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="4" fill="#6366F1"/>
  <text 
    x="${size/2}" 
    y="${size*0.625}" 
    text-anchor="middle" 
    fill="white" 
    font-family="Arial Black, Arial, sans-serif" 
    font-weight="900" 
    font-size="${size*0.5625}"
    style="font-family: Arial Black, Arial, sans-serif; font-weight: 900;"
  >LP</text>
</svg>`;
}

// Generate icons
async function generateIcons() {
  try {
    const publicDir = path.join(__dirname, '..', 'public');
    
    // Generate and save SVG
    const svg = generateSvgIcon(32);
    fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg);
    
    // Generate ICO from SVG
    const tempPngPath = path.join(__dirname, 'temp-favicon.png');
    await sharp(Buffer.from(svg))
      .resize(32, 32)
      .png()
      .toFile(tempPngPath);
    
    // Convert PNG to ICO
    const icoBuffer = await pngToIco([tempPngPath]);
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
    
    // Clean up temporary PNG
    fs.unlinkSync(tempPngPath);
    
    console.log('Icons generated successfully in public directory!');
  } catch (error) {
    console.error('Error:', error);
  }
}

generateIcons(); 