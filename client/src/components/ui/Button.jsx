import { motion } from 'framer-motion';

/**
 * Glassmorphic Button Component
 * Adapted from Iraq Compass
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const variants = {
    primary: 'bg-primary hover:bg-primary/90 text-white shadow-glow-primary',
    secondary: 'bg-secondary hover:bg-secondary/90 text-white shadow-glow-secondary',
    accent: 'bg-accent hover:bg-accent/90 text-white shadow-glow-accent',
    success: 'bg-success hover:bg-success-dark text-white shadow-glow-success',
    warning: 'bg-warning hover:bg-warning-dark text-white shadow-glow-warning',
    danger: 'bg-danger hover:bg-danger-dark text-white shadow-glow-danger',
    glass: 'bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white',
    outline: 'bg-transparent hover:bg-white/10 border-2 border-primary text-primary hover:text-white',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  return (
    <motion.button
      type={type}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        rounded-lg font-medium
        transition-all duration-300
        flex items-center justify-center gap-2
        ${className}
      `}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.05 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </motion.button>
  );
}
