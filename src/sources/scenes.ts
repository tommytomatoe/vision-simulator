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

export const SCENES: Scene[] = [{ id: 'eye-chart', label: 'Eye chart', render: renderEyeChart }];
