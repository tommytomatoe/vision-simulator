import type { ReactNode } from 'react';

export function IconButton({
  label,
  onClick,
  variant = 'chrome',
  expanded,
  hasPopup,
  children,
}: {
  label: string;
  onClick: () => void;
  variant?: 'chrome' | 'espresso';
  expanded?: boolean;
  hasPopup?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      className={`icon-btn icon-btn--${variant}`}
      aria-label={label}
      onClick={onClick}
      {...(expanded !== undefined ? { 'aria-expanded': expanded } : {})}
      {...(hasPopup ? { 'aria-haspopup': 'dialog' as const } : {})}
    >
      {children}
    </button>
  );
}
