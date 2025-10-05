import { motion } from 'framer-motion';

/**
 * Glassmorphic Card Component
 * Reused from Iraq Compass design system
 */
export default function GlassCard({
  children,
  className = '',
  hover = true,
  glow = false,
  glowColor = 'primary',
  onClick,
  ...props
}) {
  // Design system constants (inline to avoid import issues)
  const designSystem = {
    glass: {
      background: 'bg-white/10',
      backdropBlur: 'backdrop-blur-md',
      border: 'border-white/20',
      borderRadius: 'rounded-glass',
      shadow: 'shadow-glass',
    },
    glow: {
      primary: 'hover:shadow-glow-primary',
      secondary: 'hover:shadow-glow-secondary',
      accent: 'hover:shadow-glow-accent',
      success: 'hover:shadow-glow-success',
      warning: 'hover:shadow-glow-warning',
      danger: 'hover:shadow-glow-danger',
    }
  };

  const glowClasses = designSystem.glow;

  return (
    <motion.div
      className={`
        ${designSystem.glass.background}
        ${designSystem.glass.backdropBlur}
        ${designSystem.glass.border}
        ${designSystem.glass.borderRadius}
        ${designSystem.glass.shadow}
        ${hover ? 'hover:bg-white/15 transition-all duration-300' : ''}
        ${glow ? glowClasses[glowColor] : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
