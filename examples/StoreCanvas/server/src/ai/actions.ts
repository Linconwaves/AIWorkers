import sharp from 'sharp';
import { randomUUID } from 'crypto';

const PALETTE = [
  { r: 34, g: 197, b: 94 },
  { r: 59, g: 130, b: 246 },
  { r: 236, g: 72, b: 153 },
  { r: 245, g: 158, b: 11 },
  { r: 99, g: 102, b: 241 },
];

export async function generatePlaceholder(label: string, width = 1200, height = 1600) {
  const color = PALETTE[Math.abs(hash(label)) % PALETTE.length];
  const buffer = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { ...color },
    },
  })
    .png()
    .composite([
      {
        input: Buffer.from(
          `<svg width="${width}" height="${height}">
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.15)"/>
            <text x="50%" y="50%" font-size="48" font-family="Helvetica, Arial, sans-serif" fill="white" text-anchor="middle" alignment-baseline="middle" opacity="0.9">
              ${escapeSvg(label)}
            </text>
          </svg>`
        ),
        gravity: 'center',
      },
    ])
    .png()
    .toBuffer();

  return buffer;
}

export function escapeSvg(text: string) {
  return text.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return c;
    }
  });
}

function hash(str: string) {
  return [...str].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

export const ACTION_ID = () => randomUUID();
