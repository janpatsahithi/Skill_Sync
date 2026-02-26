import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Activity, Database, Server } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import api from '../services/api'

const SystemHealth = () => {
  const [health, setHealth] = useState({
    api: { status: 'checking', message: 'Checking...' },
    dataset: { status: 'checking', message: 'Checking...' },
    esco: { status: 'checking', message: 'Checking...' },
    skillIndex: { status: 'checking', message: 'Checking...' },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSystemHealth()
  }, [])

  const checkSystemHealth = async () => {
    setLoading(true)
    const checks = {
      api: { status: 'checking', message: 'Checking API...' },
      dataset: { status: 'checking', message: 'Checking datasets...' },
      esco: { status: 'checking', message: 'Checking ESCO dataset...' },
      skillIndex: { status: 'checking', message: 'Checking skill index...' },
    }

    // Check API Health
    try {
      const apiResponse = await api.get('/health')
      checks.api = {
        status: apiResponse.data.status === 'ok' ? 'healthy' : 'warning',
        message: apiResponse.data.message || 'API is operational',
      }
    } catch (error) {
      checks.api = {
        status: 'error',
        message: 'API is not responding',
      }
    }

    // Check Dataset Health
    try {
      const datasetResponse = await api.get('/health/datasets')
      const datasets = datasetResponse.data.datasets || {}
      const escoStatus = datasets['occupations_en.csv']?.status
      const relationStatus = datasets['occupationSkillRelations_en.csv']?.status
      const hasSkillIndexStats = Boolean(
        datasets['skills_en.csv'] || datasets['Skills.csv']
      )

      checks.dataset = {
        status: datasetResponse.data.status === 'healthy' ? 'healthy' : 'warning',
        message:
          datasetResponse.data.status === 'healthy'
            ? 'Datasets are available'
            : 'One or more datasets need attention',
        details: datasetResponse.data.datasets,
      }

      checks.esco = {
        status: escoStatus === 'valid' ? 'healthy' : 'warning',
        message:
          escoStatus === 'valid'
            ? 'ESCO dataset is available'
            : 'ESCO dataset needs attention',
        details: datasets['occupations_en.csv'],
      }

      checks.skillIndex = {
        status: relationStatus === 'valid' && hasSkillIndexStats ? 'healthy' : 'warning',
        message:
          relationStatus === 'valid' && hasSkillIndexStats
            ? 'Skill index prerequisites are available'
            : 'Skill index prerequisites need attention',
        details: {
          relations: datasets['occupationSkillRelations_en.csv'],
          skills: datasets['skills_en.csv'] || datasets['Skills.csv'],
        },
      }
    } catch (error) {
      checks.dataset = {
        status: 'error',
        message: 'Dataset check failed',
      }
      checks.esco = {
        status: 'error',
        message: 'ESCO dataset check failed',
      }
      checks.skillIndex = {
        status: 'error',
        message: 'Skill index check failed',
      }
    }

    setHealth(checks)
    setLoading(false)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />
      default:
        return <Activity className="w-6 h-6 text-gray-400 animate-spin" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'border-green-500 bg-green-50'
      case 'warning':
        return 'border-yellow-500 bg-yellow-50'
      case 'error':
        return 'border-red-500 bg-red-50'
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }

  const healthChecks = [
    {
      name: 'API Health',
      key: 'api',
      icon: Server,
      description: 'Backend API server status',
    },
    {
      name: 'Dataset Health',
      key: 'dataset',
      icon: Database,
      description: 'Dataset availability and integrity',
    },
    {
      name: 'ESCO Dataset',
      key: 'esco',
      icon: Database,
      description: 'ESCO occupation and skill dataset',
    },
    {
      name: 'Skill Index',
      key: 'skillIndex',
      icon: Activity,
      description: 'Skill indexing and search functionality',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">System Health</h1>
          <p className="text-text-secondary">Monitor system status and dataset health</p>
        </div>
        <Button onClick={checkSystemHealth} disabled={loading}>
          <Activity className="w-4 h-4 mr-2" />
          {loading ? 'Checking...' : 'Refresh Status'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {healthChecks.map((check) => {
          const status = health[check.key]
          const Icon = check.icon
          return (
            <Card key={check.key} className={`border-2 ${getStatusColor(status.status)}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-white">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">{check.name}</h3>
                    <p className="text-sm text-text-secondary">{check.description}</p>
                  </div>
                </div>
                {getStatusIcon(status.status)}
              </div>
              <div className="space-y-2">
                <p className={`text-sm font-medium ${
                  status.status === 'healthy' ? 'text-green-700' :
                  status.status === 'warning' ? 'text-yellow-700' :
                  status.status === 'error' ? 'text-red-700' :
                  'text-gray-700'
                }`}>
                  {status.message}
                </p>
                {status.details && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-text-secondary">
                      {typeof status.details === 'string' 
                        ? status.details 
                        : JSON.stringify(status.details, null, 2)}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Overall Status */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent mb-2">Overall System Status</h2>
            <p className="text-text-secondary">
              {Object.values(health).every(h => h.status === 'healthy')
                ? 'All systems operational'
                : Object.values(health).some(h => h.status === 'error')
                ? 'Some systems are experiencing issues'
                : 'Some systems require attention'}
            </p>
          </div>
          {getStatusIcon(
            Object.values(health).every(h => h.status === 'healthy')
              ? 'healthy'
              : Object.values(health).some(h => h.status === 'error')
              ? 'error'
              : 'warning'
          )}
        </div>
      </Card>
    </div>
  )
}

export default SystemHealth
