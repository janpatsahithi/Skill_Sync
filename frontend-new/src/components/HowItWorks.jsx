import { Upload, Brain, BarChart3, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    id: 1,
    title: "Upload Your Resume",
    description:
      "Upload your resume in PDF or DOC format. We support all standard resume formats.",
    icon: Upload,
  },
  {
    id: 2,
    title: "AI Extracts Skills",
    description:
      "Our AI analyzes your resume to identify technical skills, soft skills, and tools.",
    icon: Brain,
  },
  {
    id: 3,
    title: "Skill Gap Analysis",
    description:
      "We compare your skills with industry requirements and highlight gaps.",
    icon: BarChart3,
  },
  {
    id: 4,
    title: "Get Recommendations",
    description:
      "Receive personalized learning paths and job recommendations.",
    icon: Sparkles,
  },
];

export default function HowItWorks() {
  return (
<section className="py-10 md:py-14">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
            How <span className="gradient-text">SkillSync</span> Works
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            A simple 4-step process to transform your career
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className="flex items-start gap-5 p-5 rounded-xl bg-card border border-border hover:shadow-soft transition"
              >
                {/* Step Number */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full gradient-primary text-white flex items-center justify-center font-bold">
                  {step.id}
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-lg md:text-xl font-semibold mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {step.description}
                  </p>
                </div>

                {/* Icon */}
                <Icon className="ml-auto w-6 h-6 text-primary opacity-70" />
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link to="/app/resume-upload">
            <button className="gradient-primary text-white px-8 py-3 rounded-lg font-medium shadow-soft hover:shadow-glow transition">
              Upload Resume Now
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
} 


