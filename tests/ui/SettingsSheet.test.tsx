import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsSheet } from '../../src/ui/SettingsSheet';
import { TOMMY_RX } from '../../src/optics/presets';
import { SCENES } from '../../src/sources/scenes';

function props(overrides = {}) {
  return {
    open: true,
    onClose: vi.fn(),
    kind: 'scene' as const,
    onKind: vi.fn(),
    sceneId: SCENES[0].id,
    onScene: vi.fn(),
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
    await userEvent.click(screen.getByRole('button', { name: /camera/i }));
    expect(onKind).toHaveBeenCalledWith('camera');
  });

  it('shows the scene sub-picker only when source is scenes', () => {
    const { rerender } = render(<SettingsSheet {...props({ kind: 'scene' })} />);
    expect(screen.getByRole('button', { name: /eye chart/i })).toBeInTheDocument();
    rerender(<SettingsSheet {...props({ kind: 'photo' })} />);
    expect(screen.queryByRole('button', { name: /eye chart/i })).not.toBeInTheDocument();
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
