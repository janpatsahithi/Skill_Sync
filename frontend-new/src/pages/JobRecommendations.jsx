import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ExternalLink, Loader2 } from "lucide-react";
import ProgressRing from "../components/ProgressRing";
import SkillChip from "../components/SkillChip";
import { aiEngineAPI } from "../services/api";
import { useSkills } from "../context/SkillContext";

const JobRecommendations = () => {
  const navigate = useNavigate();
  const { currentSkills } = useSkills();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const topFive = jobs.slice(0, 5);
  const avgTopFive = topFive.length > 0
    ? Math.round(topFive.reduce((sum, job) => sum + (job.match_score || 0), 0) / topFive.length)
    : 0;

  useEffect(() => {
    fetchJobRecommendations();
  }, []);

  const normalizeErrorMessage = (err) => {
    const detail = err?.response?.data?.detail;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item?.msg && item?.loc) {
            const field = Array.isArray(item.loc) ? item.loc.join(".") : String(item.loc);
            return `${field}: ${item.msg}`;
          }
          if (item?.msg) return item.msg;
          return JSON.stringify(item);
        })
        .join(" | ");
    }

    if (detail && typeof detail === "object") {
      if (detail.msg) return detail.msg;
      return JSON.stringify(detail);
    }

    return err?.message || "Failed to fetch job recommendations";
  };

  const fetchJobRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (currentSkills.length === 0) {
        setError("Please upload your resume first to get job recommendations.");
        setIsLoading(false);
        return;
      }

      const skillUris = currentSkills
        .map((s) => (typeof s === "string" ? null : s.uri || null))
        .filter(Boolean);
      const fallbackSkillNames = currentSkills.map((s) => (typeof s === "string" ? s : s.skill || s.name || s));
      const payloadSkills = skillUris.length > 0 ? skillUris : fallbackSkillNames;

      const response = await aiEngineAPI.getJobRecommendations({ skills: payloadSkills });
      setJobs(response.data?.jobs || response.data || []);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setError(normalizeErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FDF2F8 50%, #EFF6FF 100%)' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-slate-700" />
          <p className="text-slate-700">Loading job recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] animate-fade-in" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FDF2F8 50%, #EFF6FF 100%)' }}>
        <div className="container mx-auto px-4 py-10">
          <div className="text-center py-12">
            <p className="text-slate-700 mb-4">{error}</p>
            <button
              onClick={() => navigate("/app/resume-upload")}
              className="px-6 py-3 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105"
              style={{ background: 'linear-gradient(to right, #A855F7, #3B82F6)' }}
            >
              Upload Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] animate-fade-in" style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Job Recommendations
          </h1>
          <p className="text-slate-700">AI-powered role recommendations tailored to your skill profile</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border p-4 text-center animate-fade-in" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
            <p className="text-2xl font-bold text-slate-900">{jobs.length}</p>
            <p className="text-sm text-slate-700">Recommended Roles</p>
          </div>
          <div className="rounded-xl border p-4 text-center animate-fade-in" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)', animationDelay: '100ms' }}>
            <p className="text-2xl font-bold text-slate-900">
              {avgTopFive}%
            </p>
            <p className="text-sm text-slate-700">Avg Match (Top 5)</p>
          </div>
          <div className="rounded-xl border p-4 text-center animate-fade-in" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)', animationDelay: '200ms' }}>
            <p className="text-2xl font-bold text-slate-900">
              {topFive[0]?.match_score || 0}%
            </p>
            <p className="text-sm text-slate-700">Top Role Match</p>
          </div>
        </div>

        {/* Job List */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-700 mb-4">No job recommendations found. Try uploading your resume or updating your skills.</p>
              <button
                onClick={() => navigate("/app/resume-upload")}
                className="px-6 py-3 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                style={{ background: 'linear-gradient(to right, #A855F7, #3B82F6)' }}
              >
                Upload Resume
              </button>
            </div>
          ) : (
            jobs.map((job, index) => (
              <div
                key={job.id || index}
                className="rounded-xl border p-6 animate-fade-in transition-all duration-300 hover:scale-105"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* Company Logo */}
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-r from-primary to-secondary">
                        <span className="text-white font-bold">{(job.role || job.title || "J")[0]?.toUpperCase() || "J"}</span>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 text-slate-900">{job.role || job.title || job.job_title}</h3>
                        <div className="text-sm text-slate-700 mb-3 line-clamp-2">
                          {job.description || "Recommended role based on your current skill profile."}
                        </div>

                        <div className="text-xs font-semibold text-green-700 mb-2">Matched Skills</div>
                        {Array.isArray(job.matched_skills) && job.matched_skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {job.matched_skills.slice(0, 8).map((skill, idx) => (
                              <SkillChip key={idx} skill={skill} variant="success" />
                            ))}
                          </div>
                        )}

                        <div className="text-xs font-semibold text-rose-700 mb-2">Missing Skills</div>
                        {Array.isArray(job.missing_skills) && job.missing_skills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {job.missing_skills.slice(0, 10).map((skill, idx) => (
                              <SkillChip key={`m-${idx}`} skill={skill} variant="missing" />
                            ))}
                          </div>
                        )}
                        {Array.isArray(job.missing_skills) && job.missing_skills.length === 0 && (
                          <p className="text-sm text-green-700">No critical missing skills detected.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section */}
                  <div className="flex flex-col items-center justify-center gap-4 lg:border-l lg:pl-6" style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                    <ProgressRing percentage={job.match_score || job.matchScore || 0} size={80} label="Match" />
                    <div className="grid grid-cols-1 gap-2 w-full lg:w-auto">
                      <a
                        href={job.job_links?.linkedin || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center flex-1 lg:flex-none"
                        style={{ background: 'linear-gradient(to right, #A855F7, #3B82F6)' }}
                      >
                        Apply via LinkedIn
                        <ExternalLink className="w-4 h-4 ml-1" />
                      </a>
                      <a
                        href={job.job_links?.indeed || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center"
                        style={{ background: 'linear-gradient(to right, #EC4899, #A855F7)' }}
                      >
                        Search on Indeed
                        <ExternalLink className="w-4 h-4 ml-1" />
                      </a>
                      <a
                        href={job.job_links?.naukri || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center"
                        style={{ background: 'linear-gradient(to right, #3B82F6, #06B6D4)' }}
                      >
                        View on Naukri
                        <ExternalLink className="w-4 h-4 ml-1" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center animate-fade-in">
          <p className="text-slate-700 mb-4">
            Need personalized career advice?
          </p>
          <Link to="/app/ai-advisor">
            <button className="px-8 py-3 text-white rounded-lg font-semibold transition-all duration-300 hover:scale-105" style={{ backgroundColor: '#ec4899' }}>
              Chat with AI Advisor
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobRecommendations;

