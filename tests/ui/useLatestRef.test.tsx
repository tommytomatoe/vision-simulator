import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLatestRef } from '../../src/ui/useLatestRef';

describe('useLatestRef', () => {
  it('tracks the latest value across renders', () => {
    const { result, rerender } = renderHook(({ v }) => useLatestRef(v), {
      initialProps: { v: 1 },
    });
    expect(result.current.current).toBe(1);
    rerender({ v: 2 });
    expect(result.current.current).toBe(2);
  });
});
