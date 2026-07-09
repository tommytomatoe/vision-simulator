import { describe, it, expect, vi } from 'vitest';
import { VisionRenderer } from '../../src/render/VisionRenderer';

describe('VisionRenderer', () => {
  it('throws a clear error when WebGL2 is unavailable', () => {
    const canvas = { getContext: vi.fn().mockReturnValue(null) } as unknown as HTMLCanvasElement;
    expect(() => new VisionRenderer(canvas)).toThrow('WebGL2 not supported');
  });
});
