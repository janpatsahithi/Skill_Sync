const ProcessStep = ({ step, title, description, isLast = false }) => {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold font-display shadow-soft">
          {step}
        </div>

        {!isLast && (
          <div className="w-0.5 h-full bg-gradient-to-b from-primary/50 to-transparent min-h-[60px]" />
        )}
      </div>

      <div className="pb-8">
        <h3 className="font-display font-semibold text-lg mb-1">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm">
          {description}
        </p>
      </div>
    </div>
  );
};

export default ProcessStep;


