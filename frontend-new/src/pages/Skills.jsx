import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Upload, CheckCircle, XCircle, TrendingUp, ArrowRight, FileText, BarChart3 } from 'lucide-react'
import { useSkills } from '../context/SkillContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import SkillChip from '../components/SkillChip'
import EmptyState from '../components/ui/EmptyState'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'

const Skills = () => {
  const { currentSkills, isLoading } = useSkills()
  const navigate = useNavigate()
  const [skillStats, setSkillStats] = useState({
    total: 0,
    strong: [],
    weak: [],
    missing: [],
  })

  useEffect(() => {
    // Categorize skills based on currentSkills
    // In a real app, this could come from API skill analysis
    setSkillStats({
      total: currentSkills.length,
      strong: currentSkills.slice(0, Math.ceil(currentSkills.length * 0.4)),
      weak: currentSkills.slice(Math.ceil(currentSkills.length * 0.4), Math.ceil(currentSkills.length * 0.7)),
      missing: [], // Would come from skill gap analysis API
    })
  }, [currentSkills])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton variant="rectangular" height="200px" />
        <LoadingSkeleton variant="rectangular" height="300px" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">Skills Intelligence</h1>
          <p className="text-text-secondary">Manage and analyze your skills profile</p>
        </div>
        <Link to="/app/resume-upload">
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Upload Resume
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Skills</p>
              <p className="text-2xl font-bold text-text-primary">{skillStats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-primary" />
          </div>
        </Card>
        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Strong Skills</p>
              <p className="text-2xl font-bold text-text-primary">{skillStats.strong.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Weak Skills</p>
              <p className="text-2xl font-bold text-text-primary">{skillStats.weak.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
        <Card hover>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Missing Skills</p>
              <p className="text-2xl font-bold text-text-primary">{skillStats.missing.length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card hover onClick={() => navigate('/app/resume-upload')}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary-50">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Upload Resume</h3>
              <p className="text-sm text-text-secondary">Extract skills from your resume</p>
            </div>
          </div>
        </Card>
        <Card hover onClick={() => navigate('/app/extracted-skills')}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary-50">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">View Extracted Skills</h3>
              <p className="text-sm text-text-secondary">See all your extracted skills</p>
            </div>
          </div>
        </Card>
        <Card hover onClick={() => navigate('/app/skill-gap-analysis')}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-secondary-50">
              <BarChart3 className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Skill Gap Analysis</h3>
              <p className="text-sm text-text-secondary">Analyze gaps for target roles</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Skills Display */}
      {currentSkills.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No Skills Yet"
            description="Upload your resume or manually add skills to get started"
            actionLabel="Upload Resume"
            onAction={() => navigate('/app/resume-upload')}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strong Skills */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Strong Skills
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillStats.strong.length > 0 ? (
                skillStats.strong.map((skill, idx) => (
                  <SkillChip key={idx} skill={typeof skill === 'string' ? skill : skill.skill || skill.name || skill} variant="success" />
                ))
              ) : (
                <p className="text-text-secondary text-sm">No strong skills identified yet</p>
              )}
            </div>
          </Card>

          {/* Weak Skills */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
                Skills to Improve
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillStats.weak.length > 0 ? (
                skillStats.weak.map((skill, idx) => (
                  <SkillChip key={idx} skill={typeof skill === 'string' ? skill : skill.skill || skill.name || skill} variant="warning" />
                ))
              ) : (
                <p className="text-text-secondary text-sm">No skills to improve identified</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* CTA */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">Ready to analyze your skill gaps?</h3>
            <p className="text-text-secondary">Compare your skills with target roles and get personalized recommendations</p>
          </div>
          <Link to="/app/skill-gap-analysis">
            <Button>
              Analyze Skill Gaps
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default Skills


