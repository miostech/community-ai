'use client';

/**
 * Logo Dome com gradiente: azul → roxo → magenta.
 * Fonte limpa, D maiúsculo e restante minúsculo.
 */
const gradient = 'linear-gradient(90deg, #2563eb 0%, #7c3aed 35%, #ec4899 100%)';

export function DomeLogo({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`font-semibold tracking-tight ${className}`}
      style={{
        background: gradient,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
        ...style,
      }}
    >
      Dome
    </span>
  );
}
