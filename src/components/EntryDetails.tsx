'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar,
  Factory,
  Clock,
  Users,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  BarChart3,
  Info,
  Award,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface Entry {
  id: string
  date: string
  line: string
  shift: string
  teamLeader: string
  shiftInCharge: string
  model: string
  numOfOperators: number
  availableTime: string
  lineCapacity: string
  ppcTarget: number
  goodParts: number
  rejects: number
  problemHead: string
  description: string
  lossTime: number
  responsibility: string
  rejectionPhenomena: string | null
  rejectionCause: string | null
  rejectionCorrectiveAction: string | null
  rejectionCount: number | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedBy: { name: string; email: string }
  approvedBy?: { name: string; email: string }
  createdAt: string
  updatedAt: string
}

interface EntryDetailsProps {
  entry: Entry
  onClose: () => void
  onApprove?: (id: string, status: 'APPROVED' | 'REJECTED') => void
  showActions?: boolean
}

export default function EntryDetails({ entry, onClose, onApprove, showActions = true }: EntryDetailsProps) {
  const totalProduction = entry.goodParts + entry.rejects
  const efficiency = totalProduction > 0 ? Math.round((entry.goodParts / totalProduction) * 100) : 0
  const rejectRate = totalProduction > 0 ? Math.round((entry.rejects / totalProduction) * 100) : 0
  const targetAchievement = entry.ppcTarget > 0 ? Math.round((totalProduction / entry.ppcTarget) * 100) : 0

  const getStatusBadge = (status: string) => {
    const config = {
      PENDING: { 
        variant: 'secondary' as const, 
        icon: Clock, 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300' 
      },
      APPROVED: { 
        variant: 'default' as const, 
        icon: CheckCircle, 
        className: 'bg-green-100 text-green-800 border-green-300' 
      },
      REJECTED: { 
        variant: 'destructive' as const, 
        icon: XCircle, 
        className: 'bg-red-100 text-red-800 border-red-300' 
      }
    }
    
    const statusConfig = config[status as keyof typeof config]
    const Icon = statusConfig.icon
    
    return (
      <Badge variant={statusConfig.variant} className={statusConfig.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getPerformanceIndicator = (value: number, type: 'efficiency' | 'rejectRate' | 'targetAchievement') => {
    let color = 'text-gray-600'
    let icon = Info
    
    if (type === 'efficiency') {
      if (value >= 95) { color = 'text-green-600'; icon = Award }
      else if (value >= 85) { color = 'text-blue-600'; icon = TrendingUp }
      else if (value >= 75) { color = 'text-yellow-600'; icon = AlertTriangle }
      else { color = 'text-red-600'; icon = TrendingDown }
    } else if (type === 'rejectRate') {
      if (value <= 2) { color = 'text-green-600'; icon = Award }
      else if (value <= 5) { color = 'text-blue-600'; icon = CheckCircle }
      else if (value <= 10) { color = 'text-yellow-600'; icon = AlertTriangle }
      else { color = 'text-red-600'; icon = XCircle }
    } else if (type === 'targetAchievement') {
      if (value >= 100) { color = 'text-green-600'; icon = Award }
      else if (value >= 90) { color = 'text-blue-600'; icon = TrendingUp }
      else if (value >= 80) { color = 'text-yellow-600'; icon = AlertTriangle }
      else { color = 'text-red-600'; icon = TrendingDown }
    }

    const Icon = icon
    return { color, Icon }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Factory className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-900">Production Entry Details</CardTitle>
                <CardDescription className="text-gray-600">
                  Entry ID: {entry.id.slice(-8)} • Created: {new Date(entry.createdAt).toLocaleString()}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(entry.status)}
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-purple-600" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{totalProduction.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Production</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold flex items-center justify-center ${getPerformanceIndicator(efficiency, 'efficiency').color}`}>
                {(() => {
                  const { Icon } = getPerformanceIndicator(efficiency, 'efficiency')
                  return <Icon className="w-5 h-5 mr-1" />
                })()}
                {efficiency}%
              </div>
              <div className="text-sm text-gray-600">Efficiency</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    efficiency >= 95 ? 'bg-green-500' : 
                    efficiency >= 85 ? 'bg-blue-500' : 
                    efficiency >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${efficiency}%` }}
                />
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold flex items-center justify-center ${getPerformanceIndicator(rejectRate, 'rejectRate').color}`}>
                {(() => {
                  const { Icon } = getPerformanceIndicator(rejectRate, 'rejectRate')
                  return <Icon className="w-5 h-5 mr-1" />
                })()}
                {rejectRate}%
              </div>
              <div className="text-sm text-gray-600">Reject Rate</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    rejectRate <= 2 ? 'bg-green-500' : 
                    rejectRate <= 5 ? 'bg-blue-500' : 
                    rejectRate <= 10 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(rejectRate, 100)}%` }}
                />
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl font-bold flex items-center justify-center ${getPerformanceIndicator(targetAchievement, 'targetAchievement').color}`}>
                {(() => {
                  const { Icon } = getPerformanceIndicator(targetAchievement, 'targetAchievement')
                  return <Icon className="w-5 h-5 mr-1" />
                })()}
                {targetAchievement}%
              </div>
              <div className="text-sm text-gray-600">Target Achievement</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full ${
                    targetAchievement >= 100 ? 'bg-green-500' : 
                    targetAchievement >= 90 ? 'bg-blue-500' : 
                    targetAchievement >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(targetAchievement, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-blue-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Date</label>
                <div className="text-sm text-gray-900">{new Date(entry.date).toLocaleDateString()}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Production Line</label>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">{entry.line}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Shift</label>
                <div className="text-sm text-gray-900">{entry.shift}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Model</label>
                <div className="text-sm text-gray-900">{entry.model}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-green-600" />
              Team Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Team Leader</label>
                <div className="text-sm text-gray-900">{entry.teamLeader}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Shift InCharge</label>
                <div className="text-sm text-gray-900">{entry.shiftInCharge}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Number of Operators</label>
                <div className="text-sm text-gray-900">{entry.numOfOperators}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Submitted By</label>
                <div className="text-sm text-gray-900">{entry.submittedBy.name}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Production Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5 text-purple-600" />
              Production Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Available Time</label>
                <div className="text-sm text-gray-900">{entry.availableTime} minutes</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Line Capacity</label>
                <div className="text-sm text-gray-900">{entry.lineCapacity} units/hr</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">PPC Target</label>
                <div className="text-sm text-gray-900">{entry.ppcTarget.toLocaleString()}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Loss Time</label>
                <div className="text-sm text-gray-900">{entry.lossTime} minutes</div>
              </div>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <label className="text-sm font-medium text-green-800">Good Parts</label>
                <div className="text-lg font-bold text-green-600">{entry.goodParts.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <label className="text-sm font-medium text-red-800">Rejects</label>
                <div className="text-lg font-bold text-red-600">{entry.rejects.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Problem Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-orange-600" />
              Problem Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Problem Head</label>
                <div className="text-sm text-gray-900">{entry.problemHead}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <div className="text-sm text-gray-900">{entry.description}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Responsibility</label>
                <Badge variant="outline" className="bg-orange-50 text-orange-700">{entry.responsibility}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rejection Details */}
      {(entry.rejects > 0 || entry.rejectionPhenomena) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <XCircle className="mr-2 h-5 w-5 text-red-600" />
              Rejection Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Rejection Phenomena</label>
                <div className="text-sm text-gray-900">{entry.rejectionPhenomena || 'Not specified'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Root Cause</label>
                <div className="text-sm text-gray-900">{entry.rejectionCause || 'Not specified'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Corrective Action</label>
                <div className="text-sm text-gray-900">{entry.rejectionCorrectiveAction || 'Not specified'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Rejection Count</label>
                <div className="text-sm text-gray-900">{entry.rejectionCount || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Section */}
      {showActions && entry.status === 'PENDING' && onApprove && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5 text-blue-600" />
              Approval Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => onApprove(entry.id, 'APPROVED')}
                className="bg-green-600 hover:bg-green-700 min-w-[120px]"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Entry
              </Button>
              <Button
                onClick={() => onApprove(entry.id, 'REJECTED')}
                variant="destructive"
                className="min-w-[120px]"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="mr-2 h-5 w-5 text-gray-600" />
            Status Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-600">Current Status</label>
              <div className="mt-1">{getStatusBadge(entry.status)}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Last Updated</label>
              <div className="text-sm text-gray-900">{new Date(entry.updatedAt).toLocaleString()}</div>
            </div>
            {entry.approvedBy && (
              <div>
                <label className="text-sm font-medium text-gray-600">
                  {entry.status === 'APPROVED' ? 'Approved By' : 'Reviewed By'}
                </label>
                <div className="text-sm text-gray-900">{entry.approvedBy.name}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}