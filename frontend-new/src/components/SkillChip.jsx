const SkillChip = ({ skill, variant = "default" }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          color: '#22c55e',
          borderColor: 'rgba(34, 197, 94, 0.3)',
        };
      case "missing":
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          borderColor: 'rgba(239, 68, 68, 0.3)',
        };
      case "warning":
        return {
          backgroundColor: 'rgba(234, 179, 8, 0.2)',
          color: '#eab308',
          borderColor: 'rgba(234, 179, 8, 0.3)',
        };
      default:
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          color: '#3B82F6',
          borderColor: 'rgba(59, 130, 246, 0.3)',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <span
      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-all hover:scale-105"
      style={styles}
    >
      {variant === "success" && <span className="mr-1">✓</span>}
      {variant === "missing" && <span className="mr-1">✗</span>}
      {skill}
    </span>
  );
};

export default SkillChip;


