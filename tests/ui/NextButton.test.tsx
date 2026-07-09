import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextButton } from '../../src/ui/NextButton';

describe('NextButton', () => {
  it('advances on click', async () => {
    const onNext = vi.fn();
    render(<NextButton onNext={onNext} />);
    await userEvent.click(screen.getByRole('button', { name: /next photo/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
