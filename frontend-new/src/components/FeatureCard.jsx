const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => {
  return (
    <div
      className="group p-6 rounded-2xl bg-card border border-border card-hover"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-soft group-hover:shadow-glow transition-shadow">
        <Icon className="w-7 h-7 text-primary-foreground" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
};

export default FeatureCard;


