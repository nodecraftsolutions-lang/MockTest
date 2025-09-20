const LoadingSpinner = ({ size = 'medium' }) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'w-4 h-4';
      case 'large':
        return 'w-12 h-12';
      default:
        return 'w-8 h-8';
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`${getSizeClass()} border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin`}></div>
    </div>
  );
};

export default LoadingSpinner;