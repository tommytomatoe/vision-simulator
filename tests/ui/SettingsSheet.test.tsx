import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsSheet } from '../../src/ui/SettingsSheet';
import { TOMMY_RX } from '../../src/optics/presets';

function props(overrides = {}) {
  return {
    open: true,
    onClose: vi.fn(),
    kind: 'scene' as const,
    onKind: vi.fn(),
    selection: 'both' as const,
    onSelection: vi.fn(),
    rx: TOMMY_RX,
    onRx: vi.fn(),
    ...overrides,
  };
}

describe('SettingsSheet', () => {
  it('renders nothing when closed', () => {
    render(<SettingsSheet {...props({ open: false })} />);
    expect(screen.queryByTestId('settings-sheet')).not.toBeInTheDocument();
  });

  it('switches source', async () => {
    const onKind = vi.fn();
    render(<SettingsSheet {...props({ onKind })} />);
    // the three sources are Camera / Eye Test / Photos
    expect(screen.getByRole('button', { name: /^eye test$/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /camera/i }));
    expect(onKind).toHaveBeenCalledWith('camera');
  });

  it('changes eye selection and applies a preset', async () => {
    const onSelection = vi.fn();
    const onRx = vi.fn();
    render(<SettingsSheet {...props({ onSelection, onRx })} />);
    await userEvent.click(screen.getByRole('button', { name: /^left$/i }));
    expect(onSelection).toHaveBeenCalledWith('left');
    await userEvent.click(screen.getByRole('button', { name: /^20\/40$/ }));
    expect(onRx).toHaveBeenCalledTimes(1);
  });

  it('closes on Done and on scrim click', async () => {
    const onClose = vi.fn();
    render(<SettingsSheet {...props({ onClose })} />);
    await userEvent.click(screen.getByRole('button', { name: /^done$/i }));
    fireEvent.click(screen.getByTestId('settings-scrim'));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
