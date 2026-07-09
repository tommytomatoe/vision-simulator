import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CameraIcon, ShapesIcon, ImageIcon, SettingsIcon, ChevronRight, ChevronDown } from '../../src/ui/icons';

describe('icons', () => {
  it('render as sized svg elements using currentColor', () => {
    for (const Icon of [CameraIcon, ShapesIcon, ImageIcon, SettingsIcon, ChevronRight, ChevronDown]) {
      const { container } = render(<Icon size={20} />);
      const svg = container.querySelector('svg')!;
      expect(svg).toBeInTheDocument();
      expect(svg.getAttribute('width')).toBe('20');
      expect(svg.getAttribute('stroke')).toBe('currentColor');
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    }
  });
});
