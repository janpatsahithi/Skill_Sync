import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Briefcase, Loader2 } from "lucide-react";
import SkillChip from "../components/SkillChip";
import ProgressRing from "../components/ProgressRing";
import { useSkills } from "../context/SkillContext";
import { useNavigate } from "react-router-dom";

/* ---------------- COMPONENT ---------------- */

const SkillGapAnalysis = () => {
  const navigate = useNavigate();

  const {
    currentSkills,
    occupations,
    fetchOccupations,
    analyzeSkillGap,
    isLoading,
    error,
  } = useSkills();

  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [roleQuery, setRoleQuery] = useState("");

  /* ---------- Fetch occupations ---------- */
  useEffect(() => {
    fetchOccupations();
  }, []);

  /* ---------- Run analysis when role selected ---------- */
  useEffect(() => {
    if (selectedOccupation && currentSkills.length > 0) {
      runAnalysis();
    }
  }, [selectedOccupation, currentSkills]);

  /* ---------- Skill Gap Analysis ---------- */
  const runAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      const res = await analyzeSkillGap(selectedOccupation);

      // Handle both array and object formats for missing_skills
      let missingSkillsArray = [];
      if (Array.isArray(res?.missing_skills)) {
        missingSkillsArray = res.missing_skills
          .map((m) => {
            if (typeof m === "string") {
              return m;
            }
            return m?.skill || "";
          })
          .filter(Boolean);
      } else if (Array.isArray(res?.missing_essential)) {
        missingSkillsArray = res.missing_essential;
      }

      const normalized = {
        match_score: Math.round((res?.readiness_score || 0) * 100),
        current_skills: Array.isArray(res?.covered_skills)
          ? res.covered_skills
          : [],
        missing_skills: missingSkillsArray,
        data_source: res?.data_source || (String(selectedOccupation || "").startsWith("fallback://role/") ? "fallback" : "esco"),
        error: res?.error || null,
      };

      setAnalysisResult(normalized);
    } catch (err) {
      console.error("Skill gap analysis failed:", err);
      setAnalysisResult({
        match_score: 0,
        current_skills: [],
        missing_skills: [],
        error: err.message || "Failed to analyze skill gap",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Prefer curated fallback roles so ESCO long-tail labels don't clutter the UI.
  const fallbackOccupations = occupations.filter((o) =>
    String(o.uri || "").startsWith("fallback://role/")
  );
  const baseDisplayedOccupations =
    fallbackOccupations.length > 0 ? fallbackOccupations : occupations.slice(0, 20);
  const displayedOccupations = baseDisplayedOccupations
    .filter((o) => o.label?.toLowerCase().includes(roleQuery.toLowerCase()))
    .sort((a, b) => a.label.localeCompare(b.label));

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-[calc(100vh-4rem)] animate-fade-in" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FDF2F8 50%, #EFF6FF 100%)' }}>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Skill Gap Analysis
        </h1>

        {/* ---------- ERROR ---------- */}
        {error && (
          <div className="mb-6 p-4 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#dc2626' }}>
            {error}
          </div>
        )}

        {/* ---------- LOADING ---------- */}
        {(isLoading || isAnalyzing) && (
          <div className="flex justify-center py-10 items-center gap-2">
            <Loader2 className="animate-spin text-primary" />
            <span className="text-text-primary">Analyzing skills…</span>
          </div>
        )}

        {/* ---------- NO SKILLS ---------- */}
        {currentSkills.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="mb-4 text-text-secondary">
              Upload your resume to begin analysis
            </p>
            <button
              onClick={() => navigate("/app/resume-upload")}
              className="px-6 py-3 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105"
              style={{ background: 'linear-gradient(to right, #A855F7, #3B82F6)' }}
            >
              Upload Resume
            </button>
          </div>
        )}

        {/* ---------- MAIN CONTENT ---------- */}
        {currentSkills.length > 0 && (
          <>
            {/* -------- OCCUPATION SELECTION -------- */}
            <div className="mb-10">
              <h2 className="text-lg font-semibold mb-4 text-text-primary">
                Select Target Occupation
              </h2>

              <div className="mb-6">
                <div className="mb-3 flex flex-col md:flex-row md:items-center gap-3">
                  <input
                    type="text"
                    value={roleQuery}
                    onChange={(e) => setRoleQuery(e.target.value)}
                    placeholder="Search roles..."
                    className="w-full md:max-w-sm px-3 py-2 rounded-lg border border-primary-200 bg-white/70 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-xs text-text-secondary">
                    {displayedOccupations.length} roles
                  </span>
                </div>
                <h3 className="text-sm mb-2 text-text-secondary">Suggested Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {displayedOccupations.map((o) => (
                    <button
                      key={o.uri}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                        selectedOccupation === o.uri
                          ? 'text-white'
                          : 'border-2 text-text-primary'
                      }`}
                      onClick={() => setSelectedOccupation(o.uri)}
                      style={
                        selectedOccupation === o.uri
                          ? { background: 'linear-gradient(to right, #A855F7, #EC4899, #3B82F6)', borderColor: '#EC4899' }
                          : { borderColor: '#f472b6', backgroundColor: 'rgba(255, 255, 255, 0.6)' }
                      }
                      onMouseEnter={(e) => {
                        if (selectedOccupation !== o.uri) {
                          e.currentTarget.style.backgroundColor = 'rgba(244, 114, 182, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedOccupation !== o.uri) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {displayedOccupations.length === 0 && (
                  <p className="text-sm text-text-secondary mt-2">No roles matched your search.</p>
                )}
              </div>
            </div>

            {/* -------- RESULTS -------- */}
            {analysisResult && (
              <>
                {/* -------- ANALYSIS ERROR -------- */}
                {analysisResult.error && (
                  <div className="mb-6 p-4 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#dc2626' }}>
                    {analysisResult.error}
                  </div>
                )}

                {!analysisResult.error && (
                  <>
                <div className="mb-10 flex items-center gap-6">
                  <ProgressRing
                    percentage={analysisResult.match_score}
                    size={90}
                  />
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">
                      Role Match Score
                    </h2>
                    <p className="text-text-secondary">
                      {analysisResult.match_score}% readiness for this role
                    </p>
                    <p className="text-xs mt-1 text-text-secondary">
                      Matching source: {analysisResult.data_source === "fallback" ? "Fallback dataset" : "ESCO dataset"}
                    </p>
                  </div>
                </div>

                {/* -------- SKILLS -------- */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="border rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.55)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                    <h3 className="flex items-center gap-2 mb-4 font-semibold text-text-primary">
                      <CheckCircle style={{ color: '#22c55e' }} />
                      Skills You Have
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.current_skills.length > 0 ? (
                        analysisResult.current_skills.map((skill) => (
                          <SkillChip
                            key={skill}
                            skill={skill}
                            variant="success"
                          />
                        ))
                      ) : (
                        <p className="text-sm text-text-secondary">
                          No matching skills found
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-xl p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.55)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                    <h3 className="flex items-center gap-2 mb-4 font-semibold text-text-primary">
                      <XCircle style={{ color: '#ef4444' }} />
                      Skills to Learn
                    </h3>

                    {analysisResult.missing_skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.missing_skills.map((skill) => (
                          <SkillChip
                            key={skill}
                            skill={skill}
                            variant="missing"
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-text-secondary">
                        No major skill gaps detected 🎉
                      </p>
                    )}
                  </div>
                </div>

                {/* -------- CTA -------- */}
                <div className="mt-10 flex gap-4">
                  <button
                    className="px-6 py-3 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105 flex items-center"
                    onClick={() => navigate("/app/job-recommendations")}
                    style={{ background: 'linear-gradient(to right, #A855F7, #3B82F6)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f472b6'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'linear-gradient(to right, #A855F7, #3B82F6)'; }}
                  >
                    <Briefcase className="mr-2 w-4 h-4" />
                    View Job Matches
                  </button>

                  <button
                    className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 border-2"
                    onClick={() =>
                      navigate("/app/learning-path", {
                        state: {
                          occupation: selectedOccupation,
                          missingSkills: analysisResult.missing_skills,
                        },
                      })
                    }
                    style={{ borderColor: '#EC4899', color: '#EC4899', backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(236, 72, 153, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    View Learning Path
                  </button>
                </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SkillGapAnalysis;

