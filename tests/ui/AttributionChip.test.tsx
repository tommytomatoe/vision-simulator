import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttributionChip } from '../../src/ui/AttributionChip';

describe('AttributionChip', () => {
  it('shows creator, license, and a link to the source', () => {
    render(
      <AttributionChip
        photo={{
          id: '1',
          url: 'x',
          thumbUrl: 'x-thumb',
          creator: 'Jane Doe',
          license: 'CC BY 4.0',
          licenseUrl: 'https://cc/by',
          sourceUrl: 'https://src/photo',
          title: 'A View',
        }}
      />,
    );
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText(/CC BY 4.0/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /^source$/i });
    expect(link).toHaveAttribute('href', 'https://src/photo');
  });
});
