const zlib = require('zlib');
const fs = require('fs');

function createPNG(size, r, g, b) {
  // Scanline: filter byte (0) + RGB pixels
  const row = Buffer.alloc(1 + size * 3);
  row[0] = 0; // filter none
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r;
    row[1 + x * 3 + 1] = g;
    row[1 + x * 3 + 2] = b;
  }
  const raw = Buffer.concat(Array(size).fill(row));
  const compressed = zlib.deflateSync(raw);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (const b of buf) {
      crc ^= b;
      for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const t = Buffer.from(type);
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc32(Buffer.concat([t, data])));
    return Buffer.concat([len, t, data, c]);
  }

  const sig = Buffer.from([137,80,78,71,13,10,26,10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Red: #dc2626 = 220, 38, 38
fs.writeFileSync('public/icon-192.png', createPNG(192, 220, 38, 38));
fs.writeFileSync('public/icon-512.png', createPNG(512, 220, 38, 38));
console.log('Icons generated: icon-192.png, icon-512.png');
