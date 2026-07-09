import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RxPanel } from '../../src/ui/RxPanel';
import { TOMMY_RX } from '../../src/optics/presets';

describe('RxPanel', () => {
  it('applies a preset when its button is clicked', async () => {
    const onRx = vi.fn();
    render(<RxPanel rx={TOMMY_RX} onRx={onRx} open onToggle={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /^Mild$/ }));
    expect(onRx).toHaveBeenCalledTimes(1);
    const applied = onRx.mock.calls[0][0];
    expect(applied.right.sph).toBe(-1.0);
  });

  it('updates a single field from a slider without mutating others', async () => {
    const onRx = vi.fn();
    render(<RxPanel rx={TOMMY_RX} onRx={onRx} open onToggle={() => {}} />);
    const slider = screen.getByLabelText(/right sphere/i) as HTMLInputElement;
    slider.focus();
    // jsdom: React patches the instance's `value` setter to track controlled-input
    // changes; assigning `.value` directly updates that tracker too, so a
    // same-tick `input` event looks like a no-op change. Go through the native
    // prototype setter (what RTL's fireEvent.change does internally) so the
    // tracker is left stale and the dispatched event is actually observed.
    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )!.set!;
    nativeSetter.call(slider, '-10');
    slider.dispatchEvent(new Event('input', { bubbles: true }));
    expect(onRx).toHaveBeenCalled();
    const applied = onRx.mock.calls.at(-1)![0];
    expect(applied.right.sph).toBeCloseTo(-10);
    expect(applied.left.sph).toBe(TOMMY_RX.left.sph);
  });
});
