'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Factory,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Activity
} from 'lucide-react'

interface Analytics {
  summary: {
    totalEntries: number
    pendingEntries: number
    approvedEntries: number
    rejectedEntries: number
    approvalRate: number
  }
  linePerformance: Array<{
    line: string
    totalEntries: number
    totalGoodParts: number
    totalRejects: number
    rejectRate: number
  }>
  dailyTrend: Array<{
    date: string
    goodParts: number
    rejects: number
    total: number
  }>
  shiftAnalytics: Array<{
    shift: string
    totalProduction: number
    efficiency: number
    entries: number
  }>
  modelPerformance: Array<{
    model: string
    totalProduction: number
    averageRejects: number
    entries: number
  }>
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  secondary: '#6366F1',
  accent: '#8B5CF6'
}

const PIE_COLORS = [COLORS.success, COLORS.error, COLORS.warning, COLORS.secondary]

export default function Analytics() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics')

      console.log('Analytics API Response:', response)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        console.error('Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load analytics</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Prepare data for charts
  const statusData = [
    { name: 'Approved', value: analytics.summary.approvedEntries, color: COLORS.success },
    { name: 'Rejected', value: analytics.summary.rejectedEntries, color: COLORS.error },
    { name: 'Pending', value: analytics.summary.pendingEntries, color: COLORS.warning }
  ]

  const lineEfficiencyData = analytics.linePerformance.map(line => ({
    line: line.line,
    efficiency: Math.round(100 - line.rejectRate),
    rejectRate: line.rejectRate,
    totalProduction: line.totalGoodParts + line.totalRejects,
    goodParts: line.totalGoodParts,
    rejects: line.totalRejects
  }))

  const dailyTrendData = analytics.dailyTrend.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    goodParts: day.goodParts,
    rejects: day.rejects,
    total: day.total,
    efficiency: day.total > 0 ? Math.round((day.goodParts / day.total) * 100) : 0
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Production Analytics</h1>
                <p className="text-sm text-gray-600">Comprehensive insights into manufacturing performance</p>
              </div>
            </div>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Entries</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.summary.totalEntries}</div>
              <p className="text-xs text-gray-500 mt-1">Production records</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Approval Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{analytics.summary.approvalRate}%</div>
              <div className="flex items-center mt-1">
                {analytics.summary.approvalRate >= 90 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <p className="text-xs text-gray-500">Quality indicator</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{analytics.summary.pendingEntries}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Lines</CardTitle>
              <Factory className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{analytics.linePerformance.length}</div>
              <p className="text-xs text-gray-500 mt-1">Production lines</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Efficiency</CardTitle>
              <Target className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {analytics.linePerformance.length > 0
                  ? Math.round(analytics.linePerformance.reduce((acc, line) => acc + (100 - line.rejectRate), 0) / analytics.linePerformance.length)
                  : 0}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Overall performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-1/2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Entry Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChartIcon className="mr-2 h-5 w-5 text-blue-600" />
                    Entry Status Distribution
                  </CardTitle>
                  <CardDescription>Breakdown of all production entries by approval status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value, percent }) => {
                            const percentValue = percent ? (percent * 100).toFixed(0) : '0'
                            return `${name}: ${value} (${percentValue}%)`
                          }}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Line Performance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="mr-2 h-5 w-5 text-green-600" />
                    Line Efficiency Overview
                  </CardTitle>
                  <CardDescription>Production efficiency across all manufacturing lines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={lineEfficiencyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="line" />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [`${value}%`, name === 'efficiency' ? 'Efficiency' : 'Reject Rate']} />
                        <Legend />
                        <Bar dataKey="efficiency" fill={COLORS.success} name="Efficiency %" />
                        <Bar dataKey="rejectRate" fill={COLORS.error} name="Reject Rate %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Summary Table */}
            <Card>
              <CardHeader>
                <CardTitle>Line Performance Summary</CardTitle>
                <CardDescription>Detailed metrics for each production line (Last 30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3 font-semibold">Production Line</th>
                        <th className="text-left p-3 font-semibold">Total Entries</th>
                        <th className="text-left p-3 font-semibold">Good Parts</th>
                        <th className="text-left p-3 font-semibold">Rejects</th>
                        <th className="text-left p-3 font-semibold">Reject Rate</th>
                        <th className="text-left p-3 font-semibold">Efficiency</th>
                        <th className="text-left p-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.linePerformance.map((line, index) => (
                        <tr key={line.line} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="p-3 font-medium">{line.line}</td>
                          <td className="p-3">{line.totalEntries}</td>
                          <td className="p-3 text-green-600 font-medium">{line.totalGoodParts.toLocaleString()}</td>
                          <td className="p-3 text-red-600 font-medium">{line.totalRejects.toLocaleString()}</td>
                          <td className="p-3">
                            <Badge variant={line.rejectRate > 10 ? 'destructive' : line.rejectRate > 5 ? 'secondary' : 'default'}>
                              {line.rejectRate}%
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.max(100 - line.rejectRate, 0)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{Math.round(100 - line.rejectRate)}%</span>
                            </div>
                          </td>
                          <td className="p-3">
                            {100 - line.rejectRate >= 95 ? (
                              <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                            ) : 100 - line.rejectRate >= 85 ? (
                              <Badge className="bg-blue-100 text-blue-800">Good</Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-800">Needs Attention</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Production Tab */}
          <TabsContent value="production" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Production Volume by Line */}
              <Card>
                <CardHeader>
                  <CardTitle>Production Volume by Line</CardTitle>
                  <CardDescription>Total parts produced across all lines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={lineEfficiencyData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="line" type="category" />
                        <Tooltip formatter={(value) => [value.toLocaleString(), 'Parts Produced']} />
                        <Bar dataKey="totalProduction" fill={COLORS.primary} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Good Parts vs Rejects */}
              <Card>
                <CardHeader>
                  <CardTitle>Quality Distribution by Line</CardTitle>
                  <CardDescription>Good parts vs rejects comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={lineEfficiencyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="line" />
                        <YAxis />
                        <Tooltip formatter={(value) => [value.toLocaleString(), 'Parts']} />
                        <Legend />
                        <Bar dataKey="goodParts" stackId="a" fill={COLORS.success} name="Good Parts" />
                        <Bar dataKey="rejects" stackId="a" fill={COLORS.error} name="Rejects" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Quality Tab */}
          <TabsContent value="quality" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics Analysis</CardTitle>
                <CardDescription>Detailed quality performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Best Performing Line</h4>
                    {analytics.linePerformance.length > 0 && (
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {analytics.linePerformance.reduce((prev, current) =>
                            (prev.rejectRate < current.rejectRate) ? prev : current
                          ).line}
                        </p>
                        <p className="text-sm text-green-600">
                          {Math.round(100 - analytics.linePerformance.reduce((prev, current) =>
                            (prev.rejectRate < current.rejectRate) ? prev : current
                          ).rejectRate)}% efficiency
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">Average Reject Rate</h4>
                    <p className="text-2xl font-bold text-yellow-600">
                      {analytics.linePerformance.length > 0
                        ? Math.round(analytics.linePerformance.reduce((acc, line) => acc + line.rejectRate, 0) / analytics.linePerformance.length)
                        : 0}%
                    </p>
                    <p className="text-sm text-yellow-600">Across all lines</p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Total Production</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {analytics.linePerformance.reduce((acc, line) => acc + line.totalGoodParts + line.totalRejects, 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-blue-600">Parts produced</p>
                  </div>
                </div>

                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineEfficiencyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="line" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="rejectRate" stroke={COLORS.error} strokeWidth={3} name="Reject Rate %" />
                      <Line type="monotone" dataKey="efficiency" stroke={COLORS.success} strokeWidth={3} name="Efficiency %" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-indigo-600" />
                  Daily Production Trends (Last 7 Days)
                </CardTitle>
                <CardDescription>Track daily production patterns and efficiency trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="goodParts" stackId="1" stroke={COLORS.success} fill={COLORS.success} name="Good Parts" />
                      <Area type="monotone" dataKey="rejects" stackId="1" stroke={COLORS.error} fill={COLORS.error} name="Rejects" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {dailyTrendData.map((day, index) => (
                    <div key={day.date} className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-900">{day.date}</h4>
                      <p className="text-sm text-gray-600">Production: {day.total.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Efficiency: {day.efficiency}%</p>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                        <div
                          className="bg-blue-600 h-1 rounded-full"
                          style={{ width: `${day.efficiency}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}