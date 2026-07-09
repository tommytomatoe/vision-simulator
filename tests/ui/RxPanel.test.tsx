import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RxPanel } from '../../src/ui/RxPanel';
import { TOMMY_RX } from '../../src/optics/presets';

describe('RxPanel', () => {
  it('applies a preset when its chip is clicked', async () => {
    const onRx = vi.fn();
    render(<RxPanel rx={TOMMY_RX} onRx={onRx} />);
    await userEvent.click(screen.getByRole('button', { name: /^20\/40$/ }));
    expect(onRx).toHaveBeenCalledTimes(1);
    expect(onRx.mock.calls[0][0].right.sph).toBe(-1.0);
  });

  it('reveals per-eye sliders only after opening the fine-tune expander', async () => {
    const onRx = vi.fn();
    render(<RxPanel rx={TOMMY_RX} onRx={onRx} />);
    expect(screen.queryByTestId('rx-panel')).not.toBeInTheDocument();
    await userEvent.click(screen.getByTestId('finetune-toggle'));
    const slider = screen.getByLabelText(/right sphere/i) as HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
    nativeSetter.call(slider, '-10');
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    const applied = onRx.mock.calls.at(-1)![0];
    expect(applied.right.sph).toBeCloseTo(-10);
    expect(applied.left.sph).toBe(TOMMY_RX.left.sph);
  });
});
