import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SourceChip } from '../../src/ui/SourceChip';

describe('SourceChip', () => {
  it('shows the current source label and opens settings on click', async () => {
    const onOpen = vi.fn();
    render(<SourceChip kind="photo" onOpen={onOpen} />);
    expect(screen.getByRole('button', { name: /photos/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /photos/i }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('labels the scene source as "Eye Test"', () => {
    render(<SourceChip kind="scene" onOpen={() => {}} />);
    expect(screen.getByRole('button', { name: /eye test/i })).toBeInTheDocument();
  });

  it('exposes aria-expanded when the expanded prop is passed', () => {
    render(<SourceChip kind="scene" onOpen={() => {}} expanded={true} />);
    expect(screen.getByRole('button', { name: /eye test/i })).toHaveAttribute('aria-expanded', 'true');
  });
});
