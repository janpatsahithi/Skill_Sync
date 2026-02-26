import { createContext, useContext, useState, useEffect } from "react";
import { aiEngineAPI, skillsAPI } from "../services/api";

const SkillContext = createContext(null);

export const SkillProvider = ({ children }) => {
  const [currentSkills, setCurrentSkills] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("extracted_skills")) || [];
    } catch {
      return [];
    }
  });

  const [occupations, setOccupations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const setExtractedSkills = (skills) => {
    const normalized = Array.isArray(skills) ? skills : [];
    setCurrentSkills(normalized);
    localStorage.setItem("extracted_skills", JSON.stringify(normalized));
  };

  // Load skills from database on mount (primary source of truth)
  useEffect(() => {
    skillsAPI
      .getMySkills()
      .then((res) => {
        const skills = res.data?.skills || [];
        if (skills.length > 0) {
          setExtractedSkills(skills);
        }
      })
      .catch(() => {});
  }, []);

  // ✅ EXTRACT SKILLS - Only call with actual resume text, never with empty string (saves to DB via API)
  const extractSkills = async (resumeText) => {
    if (!resumeText) {
      return currentSkills;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await aiEngineAPI.extractSkills({ resume_text: resumeText });
      const skills = response.data?.skills || [];
      setExtractedSkills(skills);
      return skills;
    } catch (err) {
      setError("Failed to extract skills");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FETCH OCCUPATIONS
  const fetchOccupations = async () => {
    const response = await aiEngineAPI.getOccupations();
    const occupations = response.data || [];
    setOccupations(occupations);
    return occupations;
  };

  // ✅ SKILL GAP
  const analyzeSkillGap = async (occupationUri) => {
    const response = await aiEngineAPI.analyzeGap({ occupation_uri: occupationUri });
    return response.data;
  };

  return (
    <SkillContext.Provider
      value={{
        currentSkills,
        occupations,
        isLoading,
        error,
        extractSkills,
        fetchOccupations,
        analyzeSkillGap,
        setExtractedSkills,
      }}
    >
      {children}
    </SkillContext.Provider>
  );
};

export const useSkills = () => {
  const ctx = useContext(SkillContext);
  if (!ctx) {
    throw new Error("useSkills must be used inside SkillProvider");
  }
  return ctx;
};
