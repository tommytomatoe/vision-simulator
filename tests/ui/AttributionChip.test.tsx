import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AttributionChip } from '../../src/ui/AttributionChip';

describe('AttributionChip', () => {
  it('shows the Unsplash credit with photographer and Unsplash links', () => {
    render(
      <AttributionChip
        photo={{
          id: '1',
          src: '/photos/1.jpg',
          creator: 'Jane Doe',
          creatorUrl: 'https://unsplash.com/@jane',
          unsplashUrl: 'https://unsplash.com/photos/abc-1',
          alt: 'a scene',
        }}
      />,
    );
    expect(screen.getByText(/Photo by/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jane Doe' })).toHaveAttribute('href', 'https://unsplash.com/@jane');
    expect(screen.getByRole('link', { name: 'Unsplash' })).toHaveAttribute('href', 'https://unsplash.com/photos/abc-1');
  });
});
