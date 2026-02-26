import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useSkills } from "../context/SkillContext";

const ExtractedSkills = () => {
  const navigate = useNavigate();
  const { currentSkills } = useSkills();
  const [displaySkills, setDisplaySkills] = useState([]);

  useEffect(() => {
    if (currentSkills.length > 0) {
      setDisplaySkills(currentSkills);
      return;
    }

    try {
      const stored = JSON.parse(localStorage.getItem("extracted_skills") || "[]");
      if (Array.isArray(stored) && stored.length > 0) {
        setDisplaySkills(stored);
        return;
      }
    } catch {
      // ignore parse issues and route user to upload page below
    }

    navigate("/app/resume-upload");
  }, [currentSkills, navigate]);

  if (displaySkills.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FDF2F8 50%, #EFF6FF 100%)' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-text-secondary">Loading extracted skills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] animate-fade-in" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FDF2F8 50%, #EFF6FF 100%)' }}>
      <div className="container mx-auto max-w-3xl px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
            <CheckCircle className="w-8 h-8" style={{ color: '#22c55e' }} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Skills Extracted
          </h1>
          <p className="text-gray-600 text-lg">
            We found {displaySkills.length} skills in your resume. Let's analyze the gap between your current skills and your target role.
          </p>
        </div>

        {/* Skills Card */}
        <div className="rounded-2xl border p-8 mb-12 animate-fade-in" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
          <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Your Extracted Skills ({displaySkills.length})
          </h2>
          <div className="flex flex-wrap gap-3">
            {displaySkills.map((skill, idx) => (
              <div
                key={idx}
                className="px-4 py-2 rounded-full text-sm font-medium border transition-all"
                style={{ 
                  backgroundColor: 'rgba(236, 72, 153, 0.2)', 
                  color: '#f472b6', 
                  borderColor: 'rgba(236, 72, 153, 0.3)' 
                }}
              >
                {typeof skill === "string" ? skill : skill.skill || skill.name || skill}
              </div>
            ))}
          </div>
        </div>

        {/* Info Boxes */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <h3 className="font-semibold mb-2" style={{ color: '#3b82f6' }}>Next Step</h3>
            <p className="text-sm text-gray-700">
              Select a target role to see which skills you need to develop to bridge the gap.
            </p>
          </div>
          <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <h3 className="font-semibold mb-2" style={{ color: '#a855f7' }}>What's Next</h3>
            <p className="text-sm text-gray-700">
              Once you identify gaps, we'll recommend personalized learning paths and job matches.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="px-6 py-3 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 flex items-center justify-center"
            onClick={() => navigate("/app/skill-gap-analysis")}
            style={{ backgroundColor: '#EC4899' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f472b6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(to right, #A855F7, #EC4899, #3B82F6)'; }}
          >
            <span>Analyze Skill Gaps</span>
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
          <button
            className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 border-2"
            onClick={() => navigate("/app/resume-upload")}
            style={{ borderColor: '#ec4899', color: '#ec4899', backgroundColor: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            Upload Different Resume
          </button>
        </div>

        {/* Tips */}
        <div className="mt-12 rounded-xl border p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
          <h3 className="font-semibold flex items-center gap-2 mb-3 text-text-primary">
            <AlertCircle className="w-5 h-5" style={{ color: '#EC4899' }} />
            What Happens Next
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• Select a target role (e.g., Senior Developer, Product Manager)</li>
            <li>• See which of your skills match the role requirements</li>
            <li>• Identify critical skills you need to learn</li>
            <li>• Get personalized recommendations to close the gap</li>
            <li>• Discover job opportunities that match your profile</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExtractedSkills;

