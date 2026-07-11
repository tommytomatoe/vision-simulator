import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RxChip } from '../../src/ui/RxChip';
import { TOMMY_RX, PRESETS } from '../../src/optics/presets';

describe('RxChip', () => {
  it("shows Tommy's spheres and opens settings on click", async () => {
    const onOpen = vi.fn();
    render(<RxChip rx={TOMMY_RX} onOpen={onOpen} />);
    const btn = screen.getByRole('button', { name: /prescription/i });
    expect(btn).toHaveTextContent('R −13.25 · L −15.00');
    await userEvent.click(btn);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('shows the preset label when an acuity preset is active', () => {
    const p2070 = PRESETS.find((p) => p.id === '20-70')!;
    render(<RxChip rx={p2070.rx} onOpen={() => {}} />);
    expect(screen.getByRole('button', { name: /prescription/i })).toHaveTextContent('20/70 vision');
  });
});
