import clsx from 'clsx'

const Card = ({
  children,
  className = '',
  hover = false,
  onClick,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-gray-100 p-6',
        hover && 'hover:shadow-sm hover:border-gray-200 transition-all duration-200 cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card

