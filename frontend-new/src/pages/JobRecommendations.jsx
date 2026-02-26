import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, Building, DollarSign, Clock, ExternalLink, Bookmark, TrendingUp, Loader2 } from "lucide-react";
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

      const skillNames = currentSkills.map(s => typeof s === 'string' ? s : s.skill || s.name || s);
      const response = await aiEngineAPI.getJobRecommendations({ skills: skillNames });
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
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-white" />
          <p className="text-white">Loading job recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] animate-fade-in" style={{ background: 'linear-gradient(135deg, #FAF5FF 0%, #FDF2F8 50%, #EFF6FF 100%)' }}>
        <div className="container mx-auto px-4 py-10">
          <div className="text-center py-12">
            <p className="text-white/80 mb-4">{error}</p>
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
          <p className="text-white/80">
            Curated job opportunities based on your skills and experience
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl border p-4 text-center animate-fade-in" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }}>
            <p className="text-2xl font-bold text-white">{jobs.length}</p>
            <p className="text-sm text-white/80">Matching Jobs</p>
          </div>
          <div className="rounded-xl border p-4 text-center animate-fade-in" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)', animationDelay: '100ms' }}>
            <p className="text-2xl font-bold text-white">
              {jobs.length > 0 ? Math.round(jobs.reduce((a, j) => a + (j.matchScore || 0), 0) / jobs.length) : 0}%
            </p>
            <p className="text-sm text-white/80">Avg. Match Score</p>
          </div>
          <div className="rounded-xl border p-4 text-center animate-fade-in" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)', animationDelay: '200ms' }}>
            <p className="text-2xl font-bold text-white">
              {jobs.filter(j => j.location?.toLowerCase().includes('remote')).length}
            </p>
            <p className="text-sm text-white/80">Remote Options</p>
          </div>
          <div className="rounded-xl border p-4 text-center animate-fade-in" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)', animationDelay: '300ms' }}>
            <div className="flex items-center justify-center gap-1" style={{ color: '#22c55e' }}>
              <TrendingUp className="w-5 h-5" />
              <span className="text-2xl font-bold">+12</span>
            </div>
            <p className="text-sm text-white/80">New This Week</p>
          </div>
        </div>

        {/* Job List */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/80 mb-4">No job recommendations found. Try uploading your resume or updating your skills.</p>
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
                        <span className="text-white font-bold">
                          {job.company?.[0]?.toUpperCase() || 'J'}
                        </span>
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 text-white">{job.title || job.job_title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-white/80 mb-3">
                          <span className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {job.company || 'Company'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location || 'Location'}
                          </span>
                          {job.salary && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {job.salary}
                            </span>
                          )}
                          {job.postedDays && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {job.postedDays === 1 ? "Posted today" : `${job.postedDays} days ago`}
                            </span>
                          )}
                        </div>

                        {/* Required Skills */}
                        {job.requiredSkills && job.requiredSkills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {job.requiredSkills.map((skill, idx) => (
                              <SkillChip
                                key={idx}
                                skill={skill}
                                variant={job.matchedSkills?.includes(skill) ? "success" : "missing"}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section */}
                  <div className="flex flex-col items-center justify-center gap-4 lg:border-l lg:pl-6" style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}>
                    <ProgressRing percentage={job.matchScore || 0} size={80} label="Match" />
                    <div className="flex gap-2 w-full lg:w-auto">
                      <button className="px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all duration-300 hover:scale-105 flex-1 lg:flex-none" style={{ borderColor: '#EC4899', color: '#EC4899', backgroundColor: 'transparent' }}>
                        <Bookmark className="w-4 h-4 mr-1 inline" />
                        Save
                      </button>
                      <a
                        href={job.url || job.apply_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 text-white rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 flex items-center justify-center flex-1 lg:flex-none"
                        style={{ background: 'linear-gradient(to right, #A855F7, #3B82F6)' }}
                      >
                        Apply
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
          <p className="text-white/80 mb-4">
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

