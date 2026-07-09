import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CorrectionControls } from '../../src/ui/CorrectionControls';

describe('CorrectionControls', () => {
  it('emits mode changes and marks the active mode', async () => {
    const onMode = vi.fn();
    render(<CorrectionControls mode="blurred" onMode={onMode} />);
    expect(screen.getByRole('button', { name: /without glasses/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: /with glasses/i }));
    expect(onMode).toHaveBeenCalledWith('sharp');
    await userEvent.click(screen.getByRole('button', { name: /compare/i }));
    expect(onMode).toHaveBeenCalledWith('wipe');
  });
});
