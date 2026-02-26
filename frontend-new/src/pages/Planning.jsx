import { useState, useEffect } from 'react'
import { planningAPI } from '../services/api'
import { Plus, Check, X, Calendar } from 'lucide-react'

const Planning = () => {
  const [goals, setGoals] = useState([])
  const [tasks, setTasks] = useState([])
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    goal_type: 'short_term',
    target_date: '',
  })
  const [newTask, setNewTask] = useState({
    goal_id: '',
    title: '',
    description: '',
    due_date: '',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [goalsRes, tasksRes] = await Promise.all([
        planningAPI.getGoals(),
        planningAPI.getTasks(),
      ])
      setGoals(Array.isArray(goalsRes?.data) ? goalsRes.data : [])
      setTasks(Array.isArray(tasksRes?.data) ? tasksRes.data : [])
    } catch (error) {
      console.error('Error loading data:', error)
      setGoals([])
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async (e) => {
    e.preventDefault()
    try {
      await planningAPI.createGoal({
        ...newGoal,
        target_date: newGoal.target_date || null,
      })
      setShowGoalForm(false)
      setNewGoal({ title: '', description: '', goal_type: 'short_term', target_date: '' })
      loadData()
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    try {
      await planningAPI.createTask(newTask)
      setShowTaskForm(false)
      setNewTask({ goal_id: '', title: '', description: '', due_date: '' })
      loadData()
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleUpdateTask = async (taskId, status) => {
    try {
      await planningAPI.updateTask(taskId, { status })
      loadData()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleDeleteGoal = async (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await planningAPI.deleteGoal(goalId)
        loadData()
      } catch (error) {
        console.error('Error deleting goal:', error)
      }
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-text-secondary">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Planning & Progress
          </h1>
          <p className="mt-2 text-text-secondary">Set goals and track your progress</p>
        </div>
        <button
          onClick={() => setShowGoalForm(true)}
          className="flex items-center px-4 py-2 text-white rounded-md bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </button>
      </div>

      {showGoalForm && (
        <div className="bg-white rounded-lg border border-primary-100 shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Create New Goal
          </h2>
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Title</label>
              <input
                type="text"
                required
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Description</label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Type</label>
                <select
                  value={newGoal.goal_type}
                  onChange={(e) => setNewGoal({ ...newGoal, goal_type: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="short_term">Short Term</option>
                  <option value="long_term">Long Term</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Target Date</label>
                <input
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 text-white rounded-md bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90"
              >
                Create Goal
              </button>
              <button
                type="button"
                onClick={() => setShowGoalForm(false)}
                className="px-4 py-2 bg-primary-50 text-text-primary rounded-md hover:bg-primary-100"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-white rounded-lg border border-primary-100 shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary">{goal.title}</h3>
                <p className="text-sm text-text-secondary mt-1">{goal.description}</p>
              </div>
              <button
                onClick={() => handleDeleteGoal(goal.id)}
                className="text-accent hover:text-accent-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Progress</span>
                <span className="font-medium text-text-primary">{goal.progress_percentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-primary-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-primary via-secondary to-accent h-2 rounded-full"
                  style={{ width: `${goal.progress_percentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-text-secondary capitalize">{goal.goal_type.replace('_', ' ')}</span>
              {goal.target_date && (
                <span className="text-xs text-text-secondary flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(goal.target_date).toLocaleDateString()}
                </span>
              )}
            </div>

            <button
              onClick={() => {
                setNewTask({ ...newTask, goal_id: goal.id })
                setShowTaskForm(true)
              }}
              className="w-full text-sm text-primary hover:text-primary-700"
            >
              + Add Task
            </button>

            <div className="mt-4 space-y-2">
              {tasks
                .filter((t) => t.goal_id === goal.id)
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 bg-primary-50 rounded"
                  >
                    <span
                      className={`text-sm ${
                        task.status === 'completed' ? 'line-through text-text-secondary' : 'text-text-primary'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => handleUpdateTask(task.id, 'completed')}
                        className="text-primary hover:text-primary-700"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {showTaskForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg border border-primary-100 shadow-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Create New Task
            </h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Title</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Due Date</label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-md bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90"
                >
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="px-4 py-2 bg-primary-50 text-text-primary rounded-md hover:bg-primary-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Planning
