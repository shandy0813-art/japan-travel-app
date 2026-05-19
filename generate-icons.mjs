import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#dc2626';
  const r = size * 0.12;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // White circle (Japanese flag inspired)
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.28, 0, Math.PI * 2);
  ctx.fill();

  // Plane icon in circle
  ctx.fillStyle = '#dc2626';
  const fs = size * 0.22;
  ctx.font = `bold ${fs}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JP', size / 2, size / 2);

  return canvas.toBuffer('image/png');
}

try {
  writeFileSync('public/icon-192.png', generateIcon(192));
  writeFileSync('public/icon-512.png', generateIcon(512));
  console.log('Icons generated successfully');
} catch (e) {
  console.error('canvas module not available, skipping icon generation:', e.message);
}
