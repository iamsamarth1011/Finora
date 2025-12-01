const Button = ({ children, variant = 'primary', className = '', disabled = false, ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-blue-600 to-blue-700 dark:from-black dark:to-gray-900 text-white hover:from-blue-700 hover:to-blue-800 dark:hover:from-gray-900 dark:hover:to-black focus:ring-blue-500 dark:focus:ring-gray-600 shadow-md hover:shadow-lg',
    secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500',
    danger: 'bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800 focus:ring-red-500 shadow-md hover:shadow-lg',
    success: 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-800 focus:ring-green-500 shadow-md hover:shadow-lg',
    outline: 'border-2 border-blue-600 dark:border-gray-700 text-blue-600 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-800 focus:ring-blue-500 dark:focus:ring-gray-600',
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

