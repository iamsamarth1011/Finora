const Button = ({ children, variant = 'primary', className = '', disabled = false, ...props }) => {
  const baseClasses = 'relative px-5 py-2.5 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background active:scale-95';

  const variants = {
    primary: 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-500 hover:to-secondary-500 hover:shadow-lg hover:shadow-primary-500/25 border border-transparent',
    secondary: 'bg-surface text-gray-200 hover:bg-surface/80 border border-white/10 hover:border-white/20',
    danger: 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-500 hover:to-orange-500 hover:shadow-lg hover:shadow-red-500/25',
    success: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 hover:shadow-lg hover:shadow-emerald-500/25',
    outline: 'bg-transparent border border-white/20 text-gray-300 hover:text-white hover:border-white/40 hover:bg-white/5',
    ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

