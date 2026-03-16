import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Lightbulb,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProgressRing from "../components/ProgressRing";
import { useSkills } from "../context/SkillContext";
import { analysisAPI } from "../services/api";

const clampPct = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
};

const toTitleCase = (text) =>
  String(text || "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

const normalizeDomain = (value) => {
  const v = String(value || "").toLowerCase();
  if (v.includes("devops")) return "DevOps";
  if (v.includes("cloud")) return "Cloud";
  if (v.includes("ai")) return "AI";
  if (v.includes("data")) return "Data";
  if (v.includes("management") || v.includes("business")) return "Management";
  if (v.includes("web") || v.includes("software")) return "Web";
  return "Web";
};

const roleDescriptionFallback = (role) => {
  const title = String(role || "").toLowerCase();
  if (title.includes("data")) return "Analyze and model data for decision-making and growth.";
  if (title.includes("ai") || title.includes("machine learning")) return "Build intelligent systems and deploy AI-enabled workflows.";
  if (title.includes("devops") || title.includes("cloud") || title.includes("reliability")) return "Manage scalable infrastructure, release pipelines, and uptime.";
  if (title.includes("manager") || title.includes("analyst")) return "Drive planning, execution, and measurable business outcomes.";
  return "Design and deliver modern software systems with strong engineering practices.";
};

const insightText = (score) => {
  if (score >= 75) return "You are well prepared for this role. Focus on advanced optimization skills.";
  if (score >= 50) return "You are moderately prepared. Strengthen the missing skills to increase readiness.";
  return "You need significant improvement. Focus on high-demand skills first.";
};

const SkillGapAnalysis = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentSkills, analyzeSkillGap } = useSkills();

  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [rolesError, setRolesError] = useState("");
  const [recommendedRoles, setRecommendedRoles] = useState([]);
  const [trendingRoles, setTrendingRoles] = useState([]);
  const [allRoles, setAllRoles] = useState([]);

  const [selectedDomain, setSelectedDomain] = useState("All");
  const [browseQuery, setBrowseQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoadingRoles(true);
      setRolesError("");
      try {
        const res = await analysisAPI.getRecommendedRoles();
        const payload = res?.data || {};
        const normalizeRole = (item) => ({
          role: toTitleCase(item?.role || ""),
          uri: String(item?.uri || ""),
          category: normalizeDomain(item?.category),
          description: String(item?.description || roleDescriptionFallback(item?.role)),
          match_score: Number(item?.match_score ?? 0),
        });
        setRecommendedRoles((payload.recommended_roles || []).map(normalizeRole));
        setTrendingRoles((payload.trending_roles || []).map(normalizeRole).slice(0, 6));
        setAllRoles((payload.all_roles || []).map(normalizeRole));
      } catch {
        setRolesError("Failed to load role recommendations.");
      } finally {
        setIsLoadingRoles(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!isPanelOpen) return;
    const onEsc = (e) => {
      if (e.key === "Escape") setIsPanelOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [isPanelOpen]);

  const roleLookup = useMemo(() => {
    const map = new Map();
    [...recommendedRoles, ...trendingRoles, ...allRoles].forEach((r) => {
      if (!r.role) return;
      map.set(r.role.toLowerCase(), r);
    });
    return map;
  }, [recommendedRoles, trendingRoles, allRoles]);

  useEffect(() => {
    const roleNameFromUrl = searchParams.get("role");
    if (!roleNameFromUrl || roleLookup.size === 0) return;
    const matched = roleLookup.get(roleNameFromUrl.toLowerCase());
    if (matched) {
      selectRole(matched);
    }
  }, [searchParams, roleLookup]);

  const selectRole = async (role) => {
    setSelectedRole(role);
    setAnalysisResult(null);
    setIsPanelOpen(true);
    if (!role?.uri) return;
    try {
      setIsAnalyzing(true);
      const res = await analyzeSkillGap(role.uri);
      const readiness = clampPct(res?.readiness_score);
      const coveredSkills = Array.isArray(res?.covered_skills) ? res.covered_skills : [];
      const missingSkills = Array.isArray(res?.missing_skills)
        ? res.missing_skills.map((m) =>
            typeof m === "string"
              ? { name: m, market_demand: 0, priority_rank: 0 }
              : {
                  name: m?.name || m?.skill || "",
                  market_demand: Number(m?.market_demand ?? m?.market_demand_pct ?? 0),
                  priority_rank: Number(m?.priority_rank ?? 0),
                }
          ).filter((m) => m.name)
        : [];
      missingSkills.sort((a, b) => (a.priority_rank || 9999) - (b.priority_rank || 9999));
      setAnalysisResult({
        role_name: res?.role_name || role.role,
        readiness_score: readiness,
        matched_count: Number(res?.matched_count ?? coveredSkills.length ?? 0),
        total_required: Number(res?.total_required ?? coveredSkills.length + missingSkills.length ?? 0),
        covered_skills: coveredSkills,
        missing_skills: missingSkills,
        error: res?.error || null,
      });
    } catch (err) {
      setAnalysisResult({
        role_name: role.role,
        readiness_score: 0,
        matched_count: 0,
        total_required: 0,
        covered_skills: [],
        missing_skills: [],
        error: err?.message || "Failed to analyze role.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const recommendedOrFallback = useMemo(() => {
    if (recommendedRoles.length > 0) return recommendedRoles;
    return trendingRoles.slice(0, 3);
  }, [recommendedRoles, trendingRoles]);

  const domains = useMemo(() => {
    const set = new Set(["All"]);
    allRoles.forEach((r) => set.add(r.category || "Web"));
    return Array.from(set);
  }, [allRoles]);

  const browseResults = useMemo(() => {
    return allRoles.filter((r) => {
      if (selectedDomain !== "All" && r.category !== selectedDomain) return false;
      if (browseQuery && !r.role.toLowerCase().includes(browseQuery.toLowerCase())) return false;
      return true;
    });
  }, [allRoles, selectedDomain, browseQuery]);

  const RoleCard = ({ role, compact = false }) => (
    <button
      onClick={() => navigate(`/app/analysis/result?role=${encodeURIComponent(role.role)}`)}
      className={`rounded-xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:shadow-md ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{role.role}</p>
          <p className="mt-1 line-clamp-1 text-xs text-slate-600">{role.description}</p>
        </div>
      </div>
      <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-violet-700">
        <Briefcase className="h-3.5 w-3.5" />
        Analyze Now
      </div>
    </button>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900">Skill Gap Analysis</h1>
        <p className="mt-2 text-sm text-slate-600">
          Personalized role readiness based on your extracted skills and canonical skill matching.
        </p>

        {isLoadingRoles && (
          <div className="mt-10 flex items-center gap-2 text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading role recommendations...
          </div>
        )}

        {rolesError && <div className="mt-8 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{rolesError}</div>}

        {!isLoadingRoles && (
          <div className="mt-10 space-y-10">
            <section>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-900">Recommended Roles for You</h2>
              </div>
              {currentSkills.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  Add skills to get personalized role recommendations.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {recommendedOrFallback.slice(0, 3).map((role) => (
                    <RoleCard key={`recommended-${role.role}`} role={role} compact />
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-900">Trending Career Paths</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {trendingRoles.slice(0, 6).map((role) => (
                  <RoleCard key={`trending-${role.role}`} role={role} compact />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-900">Browse All Roles</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={browseQuery}
                    onChange={(e) => {
                      setBrowseQuery(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search role..."
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  />
                  {isDropdownOpen && (
                    <div className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                      {browseResults.length > 0 ? (
                        browseResults.slice(0, 50).map((role) => (
                          <button
                            key={`browse-${role.role}`}
                            onClick={() => {
                              setIsDropdownOpen(false);
                              navigate(`/app/analysis/result?role=${encodeURIComponent(role.role)}`);
                            }}
                            className="w-full border-b border-slate-100 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {role.role}
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-3 text-sm text-slate-500">No matching roles.</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  >
                    {domains.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {isPanelOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[1px]" onClick={() => setIsPanelOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-[520px] rounded-l-[20px] border-l border-white/40 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur-xl transition-all duration-300 ease-out lg:w-[40vw]">
            <div className="flex h-full flex-col overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200/80 bg-white/80 px-6 py-5 backdrop-blur">
                <div>
                  <h3 className="text-[23px] font-bold text-slate-900">{analysisResult?.role_name || selectedRole?.role || "Role"}</h3>
                  <p className="mt-1 text-sm text-slate-500">Readiness Analysis</p>
                </div>
                <button
                  onClick={() => setIsPanelOpen(false)}
                  className="rounded-lg p-2 text-slate-500 transition-all duration-200 hover:rotate-90 hover:bg-violet-50 hover:text-slate-900"
                  aria-label="Close analysis panel"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {(isLoadingRoles || isAnalyzing) && (
                <div className="flex items-center justify-center gap-2 px-6 py-12">
                  <Loader2 className="animate-spin text-violet-600" />
                  <span className="text-slate-600">Analyzing skill gap...</span>
                </div>
              )}

              {analysisResult?.error && (
                <div className="mx-6 mt-6 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {analysisResult.error}
                </div>
              )}

              {!isAnalyzing && analysisResult && !analysisResult.error && (
                <>
                  <div className="px-6 pt-7">
                    <div className="rounded-2xl border border-violet-200/70 bg-gradient-to-b from-white to-violet-50/40 p-6 shadow-sm">
                      <div className="flex justify-center">
                        <div className="rounded-full p-2 shadow-[0_10px_30px_rgba(124,58,237,0.18)]">
                          <ProgressRing
                            percentage={Math.round(clampPct(analysisResult.readiness_score))}
                            size={142}
                            strokeWidth={10}
                            label="Role Readiness"
                          />
                        </div>
                      </div>
                      <p className="mt-4 text-center text-sm font-semibold text-slate-900">
                        {Math.round(clampPct(analysisResult.readiness_score))}% Role Readiness
                      </p>
                      <p className="mt-1 text-center text-sm text-slate-600">
                        {analysisResult.matched_count} of {analysisResult.total_required} skills matched
                      </p>
                    </div>
                  </div>

                  <div className="space-y-5 px-6 py-6">
                    <section className="rounded-2xl border-l-4 border-l-emerald-500 bg-emerald-50/70 p-5 shadow-sm">
                      <h4 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Matched Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.covered_skills.length > 0 ? (
                          analysisResult.covered_skills.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-white/80 px-3 py-1 text-xs text-emerald-700"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">No matched skills yet.</p>
                        )}
                      </div>
                    </section>

                    <section className="rounded-2xl border-l-4 border-l-rose-500 bg-rose-50/65 p-5 shadow-sm">
                      <h4 className="mb-3 text-base font-semibold text-slate-900">Missing Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.missing_skills.length > 0 ? (
                          analysisResult.missing_skills.map((skill) => {
                            const demandPct = Math.max(0, Math.round(skill.market_demand));
                            return (
                              <span
                                key={`${skill.name}-${skill.priority_rank}`}
                                className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-white/80 px-3 py-1 text-xs text-rose-700"
                              >
                                <span>{skill.name}</span>
                                {demandPct > 0 && (
                                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700">
                                    {demandPct}% demand
                                  </span>
                                )}
                              </span>
                            );
                          })
                        ) : (
                          <p className="text-sm text-slate-500">No major gaps detected.</p>
                        )}
                      </div>
                    </section>

                    <section className="rounded-[14px] border border-violet-200 bg-violet-50/70 p-5 shadow-sm">
                      <h4 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                        <Lightbulb className="h-4 w-4 text-violet-600" />
                        Insight
                      </h4>
                      <p className="mt-2 text-sm text-slate-600">{insightText(analysisResult.readiness_score)}</p>
                    </section>
                  </div>

                  <div className="sticky bottom-0 mt-auto border-t border-slate-200/80 bg-white/85 px-6 py-4 backdrop-blur">
                    <div className="flex flex-wrap justify-end gap-3">
                      <button
                        className="inline-flex items-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-500 px-5 py-3 font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(124,58,237,0.4)]"
                        onClick={() => navigate("/app/job-recommendations")}
                      >
                        <Briefcase className="mr-2 h-4 w-4" />
                        View Jobs
                      </button>
                      <button
                        className="rounded-lg border border-violet-400 px-5 py-3 font-semibold text-violet-700 transition hover:bg-violet-50"
                        onClick={() =>
                          navigate("/app/learning-path", {
                            state: {
                              occupation: selectedRole?.uri,
                              missingSkills: analysisResult.missing_skills.map((m) => m.name),
                            },
                          })
                        }
                      >
                        View Learning Path
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default SkillGapAnalysis;
