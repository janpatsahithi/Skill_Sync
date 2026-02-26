import { useState, useEffect } from 'react'
import { resourcesAPI } from '../services/api'
import { Plus, ExternalLink, Tag, BookOpen, Video, FileText, Wrench, Search, X } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import SkillChip from '../components/SkillChip'

const Resources = () => {
  const [resources, setResources] = useState([])
  const [allTags, setAllTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [tagSearch, setTagSearch] = useState('')

  const [newResource, setNewResource] = useState({
    title: '',
    url: '',
    description: '',
    resource_type: 'article',
    tags: [],
    notes: '',
  })

  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    loadResources()
    loadTags()
  }, [filter])

  const loadTags = async () => {
    try {
      const response = await resourcesAPI.getTags()
      setAllTags(Array.isArray(response?.data) ? response.data : [])
    } catch (error) {
      console.error('Error loading tags:', error)
      setAllTags([])
    }
  }

  const loadResources = async () => {
    try {
      const params = filter !== 'all' ? { resource_type: filter } : {}
      const response = await resourcesAPI.getResources(params)
      setResources(Array.isArray(response?.data) ? response.data : [])
    } catch (error) {
      console.error('Error loading resources:', error)
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateResource = async (e) => {
    e.preventDefault()
    try {
      await resourcesAPI.createResource(newResource)
      setShowForm(false)
      setNewResource({
        title: '',
        url: '',
        description: '',
        resource_type: 'article',
        tags: [],
        notes: '',
      })
      loadResources()
    } catch (error) {
      console.error('Error creating resource:', error)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !newResource.tags.includes(newTag.trim())) {
      setNewResource({
        ...newResource,
        tags: [...newResource.tags, newTag.trim()],
      })
      setNewTag('')
    }
  }

  const removeTag = (tag) => {
    setNewResource({
      ...newResource,
      tags: newResource.tags.filter((t) => t !== tag),
    })
  }

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video':
        return Video
      case 'course':
        return BookOpen
      case 'tool':
        return Wrench
      default:
        return FileText
    }
  }

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const filteredResources = resources.filter((resource) => {
    if (selectedTags.length > 0) {
      return resource.tags && resource.tags.some((tag) => selectedTags.includes(tag))
    }
    return true
  })

  const availableTags = allTags.filter((tag) =>
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12">Loading resources...</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">Resource Library</h1>
          <p className="text-text-secondary">Browse and organize learning resources</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Type Filter */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {['all', 'article', 'video', 'course', 'book', 'tool'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                filter === type
                  ? 'bg-primary text-white'
                  : 'bg-primary-50 text-text-primary hover:bg-primary-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </Card>

      {/* Tag Discovery System */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Tag Discovery
          </h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search tags..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {availableTags.slice(0, 20).map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-primary text-white'
                    : 'bg-primary-50 text-text-primary hover:bg-primary-100'
                }`}
              >
                {tag}
                {selectedTags.includes(tag) && (
                  <X className="w-3 h-3 inline ml-1" />
                )}
              </button>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t border-primary-100">
              <span className="text-sm text-text-secondary">Filtered by:</span>
              {selectedTags.map((tag) => (
                <SkillChip key={tag} skill={tag} variant="default" />
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTags([])}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </Card>

      {showForm && (
        <Card>
          <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Add New Resource</h2>
          <form onSubmit={handleCreateResource} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Title</label>
              <input
                type="text"
                required
                value={newResource.title}
                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">URL</label>
              <input
                type="url"
                required
                value={newResource.url}
                onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Type</label>
              <select
                value={newResource.resource_type}
                onChange={(e) => setNewResource({ ...newResource, resource_type: e.target.value })}
                className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="course">Course</option>
                <option value="book">Book</option>
                <option value="tool">Tool</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Description</label>
              <textarea
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag"
                  className="flex-1 px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button type="button" onClick={addTag} size="sm">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {newResource.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-primary hover:text-primary-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Notes</label>
              <textarea
                value={newResource.notes}
                onChange={(e) => setNewResource({ ...newResource, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Personal notes about this resource..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">
                Save Resource
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => {
          const Icon = getResourceIcon(resource.resource_type)
          return (
            <Card key={resource.id} hover>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-xs text-text-secondary capitalize">{resource.resource_type}</span>
                </div>
                {resource.is_ai_recommended && (
                  <span className="px-2 py-1 bg-primary-100 text-primary text-xs rounded-full">
                    AI Recommended
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-text-primary mb-2">{resource.title}</h3>
              {resource.description && (
                <p className="text-sm text-text-secondary mb-3">{resource.description}</p>
              )}
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-primary hover:text-primary-700 mb-3 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Open Resource
              </a>
              {resource.tags && resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {resource.tags.map((tag, idx) => (
                    <SkillChip key={idx} skill={tag} variant="default" />
                  ))}
                </div>
              )}
              {resource.notes && (
                <div className="mt-3 pt-3 border-t border-primary-100">
                  <p className="text-xs text-text-secondary italic">{resource.notes}</p>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {filteredResources.length === 0 && (
        <Card>
          <div className="text-center py-12 text-text-secondary">
            {selectedTags.length > 0
              ? 'No resources found with selected tags. Try adjusting your filters.'
              : 'No resources found. Add your first resource to get started!'}
          </div>
        </Card>
      )}
    </div>
  )
}

export default Resources

