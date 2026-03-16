import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Don't override Content-Type for FormData (multipart/form-data)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// Auth API
export const authAPI = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
}

// User Context API
export const userContextAPI = {
  get: () => api.get('/user-context'),
  create: (data) => api.post('/user-context', data),
  update: (data) => api.put('/user-context', data),
}

// Guidance API
export const guidanceAPI = {
  getGuidance: (data) => api.post('/guidance', data),
  explainRecommendation: (id) => api.get(`/guidance/explain/${id}`),
}

// Planning API
export const planningAPI = {
  getGoals: (params) => api.get('/planning/goals', { params }),
  createGoal: (data) => api.post('/planning/goals', data),
  updateGoal: (id, data) => api.put(`/planning/goals/${id}`, data),
  deleteGoal: (id) => api.delete(`/planning/goals/${id}`),
  getTasks: (params) => api.get('/planning/tasks', { params }),
  createTask: (data) => api.post('/planning/tasks', data),
  updateTask: (id, data) => api.put(`/planning/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/planning/tasks/${id}`),
}

// Community API
export const communityAPI = {
  getPosts: (params) => api.get('/community/posts', { params }),
  createPost: (data) => api.post('/community/posts', data),
  getPost: (id) => api.get(`/community/posts/${id}`),
  updatePost: (id, data) => api.put(`/community/posts/${id}`, data),
  deletePost: (id) => api.delete(`/community/posts/${id}`),
  votePost: (id, vote_type) => api.post(`/community/posts/${id}/vote`, { vote_type }),
  upvotePost: (id) => api.post(`/community/posts/${id}/upvote`),
  getComments: (postId) => api.get(`/community/posts/${postId}/comments`),
  createComment: (postId, data) => api.post(`/community/posts/${postId}/comment`, data),
  createReply: (postId, data) => api.post(`/community/posts/${postId}/reply`, data),
  updateComment: (id, data) => api.put(`/community/comments/${id}`, data),
  deleteComment: (id) => api.delete(`/community/comments/${id}`),
  upvoteComment: (id) => api.post(`/community/comments/${id}/upvote`),
  getSkillTags: (params) => api.get('/community/skill-tags', { params }),
}

// Collaborate API
export const collaborateAPI = {
  getOverview: () => api.get('/collaborate/overview'),
  getProjects: (params) => api.get('/collaborate/projects', { params }),
  createProject: (data) => api.post('/collaborate/projects', data),
  getProject: (id) => api.get(`/collaborate/projects/${id}`),
  updateProject: (id, data) => api.put(`/collaborate/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/collaborate/projects/${id}`),
  requestToJoin: (projectId, data) => api.post(`/collaborate/projects/${projectId}/request`, data || {}),
  getProjectRequests: (projectId, params) => api.get(`/collaborate/projects/${projectId}/requests`, { params }),
  updateRequest: (requestId, data) => api.put(`/collaborate/requests/${requestId}`, data),
  getOpportunities: (params) => api.get('/collaborate/opportunities', { params }),
  getExternalOpportunities: (type) => api.get('/collaborate/external-opportunities', { params: { type } }),
  createOpportunity: (data) => api.post('/collaborate/opportunities', data),
  getMyTeams: () => api.get('/collaborate/my-teams'),
  getSkillMatches: () => api.get('/collaborate/projects/matches/me'),
}

// Resources API
export const resourcesAPI = {
  getResources: (params) => api.get('/resources', { params }),
  createResource: (data) => api.post('/resources', data),
  getResource: (id) => api.get(`/resources/${id}`),
  updateResource: (id, data) => api.put(`/resources/${id}`, data),
  deleteResource: (id) => api.delete(`/resources/${id}`),
  getTags: () => api.get('/resources/tags/list'),
}

// Feedback API
export const feedbackAPI = {
  createFeedback: (data) => api.post('/feedback', data),
  getFeedback: (params) => api.get('/feedback', { params }),
  getStats: () => api.get('/feedback/stats'),
}

// Resume API
export const resumeAPI = {
  upload: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  getResumes: () => api.get('/resume/list'),
  getResume: (resumeId) => api.get(`/resume/${resumeId}`),
  deleteResume: (resumeId) => api.delete(`/resume/${resumeId}`),
}

// Skills API (DB-backed)
export const skillsAPI = {
  getMySkills: () => api.get('/skills/me'),
}

// Existing AI Engine APIs (for integration)
export const aiEngineAPI = {
  extractSkills: (data) => api.post('/skills/extract', data),
  analyzeGap: (data) => api.post('/skills/gap', data),
  getJobRecommendations: (data) => api.post('/jobs/recommend', data),
  getRoleConstrainedRecommendations: (params) => api.get('/jobs/recommendations', { params }),
  getLearningPath: (data) => api.post('/learning/path', data),
  getOccupations: () => api.get('/skills/occupations'),
}

export const analysisAPI = {
  getRecommendedRoles: () => api.get('/analysis/recommended-roles'),
}

// RAG API
export const ragAPI = {
  ask: (query) => api.post('/rag/ask', null, { params: { query } }),
}

// Projects API (using community posts with category="project")
export const projectsAPI = {
  getProjects: (params) => api.get('/community/posts', { params: { ...params, category: 'project' } }),
  createProject: (data) => api.post('/community/posts', { ...data, category: 'project' }),
  getProject: (id) => api.get(`/community/posts/${id}`),
  updateProject: (id, data) => api.put(`/community/posts/${id}`, { ...data, category: 'project' }),
  deleteProject: (id) => api.delete(`/community/posts/${id}`),
}

// Messaging API (using community comments as conversations)
export const messagingAPI = {
  getConversations: () => api.get('/community/private/conversations'),
  getMessages: (otherUserId) => api.get(`/community/private/messages/${otherUserId}`),
  sendMessage: (otherUserId, data) => api.post(`/community/private/messages/${otherUserId}`, data),
}

// Profile/Settings API
export const profileAPI = {
  getProfile: () => api.get('/api/profile'),
  getUserContext: () => api.get('/user-context'),
  updateUserContext: (data) => api.put('/user-context', data),
}

export default api



