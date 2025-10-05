/**
 * Loading Spinner Component
 * From Iraq Compass
 */
export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  fullScreen = false 
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colors = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    accent: 'border-accent',
    white: 'border-white',
  };

  const spinner = (
    <div
      className={`
        ${sizes[size]}
        border-4 ${colors[color]} border-t-transparent
        rounded-full
        animate-spin
      `}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-dark/50 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
