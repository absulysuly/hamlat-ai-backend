/**
 * Glassmorphic Badge Component
 * Adapted from Iraq Compass
 */
export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  glow = false,
}) {
  const variants = {
    primary: 'bg-primary/20 text-primary border-primary/30',
    secondary: 'bg-secondary/20 text-secondary border-secondary/30',
    accent: 'bg-accent/20 text-accent border-accent/30',
    success: 'bg-success/20 text-success border-success/30',
    warning: 'bg-warning/20 text-warning border-warning/30',
    danger: 'bg-danger/20 text-danger border-danger/30',
    glass: 'bg-white/10 text-white border-white/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const glowStyles = {
    primary: 'shadow-glow-primary',
    secondary: 'shadow-glow-secondary',
    accent: 'shadow-glow-accent',
    success: 'shadow-glow-success',
    warning: 'shadow-glow-warning',
    danger: 'shadow-glow-danger',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        ${variants[variant]}
        ${sizes[size]}
        ${glow ? glowStyles[variant] : ''}
        border backdrop-blur-md
        rounded-full font-medium
        ${className}
      `}
    >
      {children}
    </span>
  );
}
