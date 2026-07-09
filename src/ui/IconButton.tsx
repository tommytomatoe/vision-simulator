import type { ReactNode } from 'react';

export function IconButton({
  label,
  onClick,
  variant = 'chrome',
  children,
}: {
  label: string;
  onClick: () => void;
  variant?: 'chrome' | 'espresso';
  children: ReactNode;
}) {
  return (
    <button className={`icon-btn icon-btn--${variant}`} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}
