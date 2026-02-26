import { useState, useEffect } from 'react'
import { Plus, Users, Calendar, MapPin, Search, Filter } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import SkillChip from '../components/SkillChip'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'
import { projectsAPI } from '../services/api'

const Projects = () => {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    requiredSkills: [],
    location: '',
    status: 'open',
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await projectsAPI.getProjects()
      const projectsData = Array.isArray(response?.data)
        ? response.data.map(project => ({
            id: project.id,
            title: project.title,
            description: project.content || project.description,
            requiredSkills: project.tags || [],
            location: project.preferences?.location || 'Remote',
            status: 'open',
            collaborators: project.comment_count || 0,
            maxCollaborators: project.preferences?.maxCollaborators || 5,
            createdAt: project.created_at || new Date().toISOString(),
          }))
        : []
      setProjects(projectsData)
    } catch (err) {
      setError('Failed to load projects')
      console.error('Error fetching projects:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = async () => {
    try {
      const projectData = {
        title: newProject.title,
        content: newProject.description,
        tags: newProject.requiredSkills,
        category: 'project',
        preferences: {
          location: newProject.location,
          maxCollaborators: 5,
        },
      }
      const response = await projectsAPI.createProject(projectData)
      const createdProject = {
        id: response.data.id,
        title: response.data.title,
        description: response.data.content,
        requiredSkills: response.data.tags || [],
        location: response.data.preferences?.location || 'Remote',
        status: 'open',
        collaborators: 0,
        maxCollaborators: response.data.preferences?.maxCollaborators || 5,
        createdAt: response.data.created_at || new Date().toISOString(),
      }
      setProjects([createdProject, ...projects])
      setIsCreateModalOpen(false)
      setNewProject({
        title: '',
        description: '',
        requiredSkills: [],
        location: '',
        status: 'open',
      })
    } catch (err) {
      setError('Failed to create project')
      console.error('Error creating project:', err)
    }
  }

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          <h1 className="text-3xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">Projects & Collaboration</h1>
          <p className="text-text-secondary">Join or create collaborative projects</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        </Card>
      )}

      {/* Search & Filter */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No Projects Found"
            description={searchQuery ? "Try adjusting your search" : "Create your first project to get started"}
            actionLabel="Create Project"
            onAction={() => setIsCreateModalOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} hover>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">{project.title}</h3>
                  <p className="text-sm text-text-secondary line-clamp-2">{project.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {project.requiredSkills.map((skill, idx) => (
                    <SkillChip key={idx} skill={skill} variant="default" />
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-text-secondary">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {project.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {project.collaborators}/{project.maxCollaborators}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={async () => {
                      try {
                        // Create a comment/request to join
                        await projectsAPI.createProject({
                          title: `Request to join: ${project.title}`,
                          content: `I would like to join this project.`,
                          category: 'project',
                          tags: project.requiredSkills,
                        })
                        alert('Request to join sent! The project owner will be notified.')
                      } catch (error) {
                        console.error('Error requesting to join:', error)
                        alert('Failed to send request. Please try again.')
                      }
                    }}
                  >
                    Request to Join
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Project"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>
              Create Project
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Project Title
            </label>
            <input
              type="text"
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter project title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Description
            </label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              placeholder="Describe your project..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Required Skills (comma-separated)
            </label>
            <input
              type="text"
              value={newProject.requiredSkills.join(', ')}
              onChange={(e) => {
                const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s)
                setNewProject({ ...newProject, requiredSkills: skills })
              }}
              className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., React, Node.js, MongoDB"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Location
            </label>
            <select
              value={newProject.location}
              onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
              className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select location</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Projects


