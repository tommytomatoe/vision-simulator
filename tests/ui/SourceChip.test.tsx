import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourceChip } from '../../src/ui/SourceChip';

describe('SourceChip', () => {
  it('shows the current source label and opens settings on click', async () => {
    const onOpen = vi.fn();
    render(<SourceChip kind="photo" sceneLabel="Eye chart" onOpen={onOpen} />);
    expect(screen.getByRole('button', { name: /photos/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /photos/i }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('shows the scene label when source is scenes', () => {
    render(<SourceChip kind="scene" sceneLabel="Astigmatism dial" onOpen={() => {}} />);
    expect(screen.getByRole('button', { name: /astigmatism dial/i })).toBeInTheDocument();
  });
});
