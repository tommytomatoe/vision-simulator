export interface Scene {
  id: string;
  label: string;
  render: () => HTMLCanvasElement;
}

export function renderEyeChart(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 1600;
  c.height = 1200;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const rows = [
    { size: 300, text: 'E' },
    { size: 200, text: 'F P' },
    { size: 140, text: 'T O Z' },
    { size: 100, text: 'L P E D' },
    { size: 70, text: 'P E C F D' },
    { size: 50, text: 'E D F C Z P' },
    { size: 36, text: 'F E L O P Z D' },
  ];
  let y = 130;
  for (const r of rows) {
    ctx.font = `bold ${r.size}px Arial, sans-serif`;
    ctx.fillText(r.text, c.width / 2, y);
    y += r.size * 0.9 + 30;
  }
  return c;
}

export function renderFanChart(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 1200;
  c.height = 1200;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  const cx = c.width / 2;
  const cy = c.height / 2;
  const R = 520;
  for (let deg = 0; deg < 180; deg += 10) {
    const a = (deg * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(a) * R, cy - Math.sin(a) * R);
    ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
    ctx.stroke();
  }
  return c;
}

export function renderTextPage(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 1600;
  c.height = 1200;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#111111';
  ctx.textBaseline = 'top';
  const words = 'The quick brown fox jumps over the lazy dog. '.repeat(60).split(' ');
  const sizes = [56, 44, 34, 26, 20, 16];
  let y = 60;
  let wi = 0;
  for (const size of sizes) {
    ctx.font = `${size}px Georgia, serif`;
    const lineH = size * 1.4;
    for (let line = 0; line < 3 && wi < words.length; line++) {
      let text = '';
      while (wi < words.length) {
        const next = text ? text + ' ' + words[wi] : words[wi];
        if (ctx.measureText(next).width > c.width - 120) break;
        text = next;
        wi++;
      }
      ctx.fillText(text, 60, y);
      y += lineH;
    }
    y += 20;
  }
  return c;
}

export const SCENES: Scene[] = [
  { id: 'eye-chart', label: 'Eye chart', render: renderEyeChart },
  { id: 'fan', label: 'Astigmatism dial', render: renderFanChart },
  { id: 'text', label: 'Text', render: renderTextPage },
];
