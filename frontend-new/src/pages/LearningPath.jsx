import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock,
  Star,
  ExternalLink,
  CheckCircle,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { aiEngineAPI, userContextAPI } from "../services/api";

export default function LearningPath() {
  const location = useLocation();
  const navigate = useNavigate();

  const [learningPath, setLearningPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Resolve input data: 1) Router state, 2) DB (user_context.last_skill_gap), 3) localStorage
   */
  const resolveData = async () => {
    const stateData = location.state;
    if (stateData?.occupation && stateData?.missingSkills?.length) {
      try {
        await userContextAPI.update({ last_skill_gap: stateData });
      } catch {
        // no context yet; keep localStorage as fallback
      }
      localStorage.setItem("skill_gap_result", JSON.stringify(stateData));
      return stateData;
    }
    try {
      const res = await userContextAPI.get();
      const gap = res.data?.last_skill_gap;
      if (gap?.occupation && gap?.missingSkills?.length) return gap;
    } catch {
      // ignore
    }
    const stored = localStorage.getItem("skill_gap_result");
    if (stored) return JSON.parse(stored);
    return null;
  };

  useEffect(() => {
    fetchLearningPath();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLearningPath = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await resolveData();

      if (!data) {
        setError("Please complete skill gap analysis first");
        setLoading(false);
        return;
      }

      const { occupation, missingSkills } = data;

      const response = await aiEngineAPI.getLearningPath({
        occupation,
        missing_skills: missingSkills,
      });

      setLearningPath(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to generate learning path. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fallback UI-safe structure
   */
  const learningLevels = learningPath?.levels || [];

  return (
    <div className="min-h-[calc(100vh-4rem)] animate-fade-in" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FDF2F8 50%, #EFF6FF 100%)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* ERROR */}
        {error && (
          <div className="mb-8 p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444' }}>
            <AlertCircle style={{ color: '#dc2626' }} size={20} />
            <div>
              <p className="font-semibold" style={{ color: '#dc2626' }}>{error}</p>
              <p className="text-sm mt-1" style={{ color: '#dc2626' }}>
                <Link to="/app/skill-gap-analysis" className="underline">
                  Go back to skill gap analysis
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin mb-4 text-text-primary" size={40} />
            <p className="text-text-secondary">
              Generating your personalized learning path…
            </p>
          </div>
        )}

        {/* CONTENT */}
        {!loading && !error && learningPath && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Your Learning Path
              </h1>
              <p className="text-text-secondary">
                Personalized roadmap for your target role
              </p>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Stat label="Total Duration" value={`${learningPath.total_weeks || 12} weeks`} />
              <Stat label="Skills" value={learningLevels.reduce((a, l) => a + l.skills.length, 0)} />
              <Stat
                label="Resources"
                value={learningLevels.reduce(
                  (a, l) =>
                    a +
                    l.skills.reduce(
                      (s, sk) =>
                        s + (sk.resources?.length || sk.courses?.length || 0),
                      0
                    ),
                  0
                )}
              />
              <Stat label="Levels" value={learningLevels.length} />
            </div>

            {/* LEVELS */}
            <div className="space-y-8">
              {learningLevels.map((level, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-4 mb-4 p-4 rounded-xl border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.55)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                    <div className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold bg-gradient-to-r from-primary to-secondary">
                      {idx + 1}
                    </div>
                    <div>
                      <h2 className="font-bold text-xl text-text-primary">{level.level}</h2>
                      <p className="text-sm text-text-secondary">
                        {level.skills.length} skills • {level.weeks || 0} weeks
                      </p>
                    </div>
                  </div>

                  <div className="ml-6 pl-6 border-l space-y-6" style={{ borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                    {level.skills.map((skill, sidx) => (
                      <div key={sidx} className="border rounded-xl p-5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.55)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                        <div className="flex justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-text-primary">{skill.name}</h3>
                            <p className="text-sm text-text-secondary flex items-center gap-1">
                              <Clock size={14} />
                              {skill.weeks || skill.duration || "1 week"}
                            </p>
                            {skill.why && (
                              <p className="text-sm text-text-secondary mt-1">
                                {skill.why}
                              </p>
                            )}
                          </div>
                          <button className="px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-300 hover:scale-105" style={{ borderColor: '#ec4899', color: '#ec4899', backgroundColor: 'transparent' }}>
                            <CheckCircle className="w-4 h-4 mr-2 inline" />
                            Complete
                          </button>
                        </div>

                        <div className="space-y-2">
                          {(skill.resources || skill.courses || []).map(
                            (res, ridx) => (
                              <a
                                key={ridx}
                                href={res.url || "#"}
                                target="_blank"
                                rel="noreferrer"
                                className="flex justify-between items-center p-3 rounded-lg transition-all duration-300 hover:scale-105"
                                style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
                              >
                                <div className="flex gap-3">
                                  <BookOpen className="w-5 h-5" style={{ color: '#ec4899' }} />
                                  <div>
                                    <p className="font-medium text-sm text-text-primary">
                                      {res.title || res.name}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                      {res.platform}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {res.rating && (
                                    <>
                                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                      <span className="text-text-secondary">{res.rating}</span>
                                    </>
                                  )}
                                  <ExternalLink className="w-4 h-4 text-text-secondary" />
                                </div>
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-12 text-center">
              <Link to="/app/job-recommendations">
                <button className="px-8 py-3 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 flex items-center mx-auto bg-gradient-to-r from-primary via-secondary to-accent">
                  View Job Recommendations
                  <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* Small stat card */
function Stat({ label, value }) {
  return (
    <div className="rounded-xl border p-4 text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.55)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  );
}


