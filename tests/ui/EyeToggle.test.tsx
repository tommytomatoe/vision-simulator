import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EyeToggle } from '../../src/ui/EyeToggle';

describe('EyeToggle', () => {
  it('marks the active option and emits changes', async () => {
    const onChange = vi.fn();
    render(<EyeToggle value="both" onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'Both' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Left' }));
    expect(onChange).toHaveBeenCalledWith('left');
  });
});
