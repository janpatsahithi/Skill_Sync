const LoadingSkeleton = ({ 
  variant = 'text', 
  width = '100%', 
  height = '1rem',
  className = '',
  count = 1 
}) => {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`bg-primary-100 animate-pulse ${variants[variant]} ${className}`}
          style={{ width, height }}
        />
      ))}
    </>
  )
}

export default LoadingSkeleton


