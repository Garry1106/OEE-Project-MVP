'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import EntryForm from './EntryForm'
import EntryDetails from './EntryDetails'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  BarChart3, 
  LogOut, 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText,
  Users,
  Factory,
  ArrowLeft,
  List,
  Eye,
  Calendar,
  TrendingUp
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

interface User {
  role: 'TEAM_LEADER' | 'SUPERVISOR'
  name: string
  email: string
}

export default function Dashboard({ user }: { user: User }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [activeView, setActiveView] = useState<'entries' | 'create' | 'details'>('entries')
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchEntries()
  }, [filter])

  const fetchEntries = async () => {
    try {
      const url = filter === 'all' ? '/api/entries' : `/api/entries?status=${filter.toUpperCase()}`
      const response = await fetch(url)
      const data = await response.json()
      setEntries(data)
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (entryId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/entries/${entryId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        fetchEntries()
        // If we're viewing details of the approved/rejected entry, refresh the details
        if (selectedEntry && selectedEntry.id === entryId) {
          const updatedEntry = entries.find(e => e.id === entryId)
          if (updatedEntry) {
            setSelectedEntry({ ...updatedEntry, status })
          }
        }
      }
    } catch (error) {
      console.error('Failed to update entry status:', error)
    }
  }

  const handleViewDetails = (entry: Entry) => {
    setSelectedEntry(entry)
    setActiveView('details')
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleEntrySuccess = () => {
    setActiveView('entries')
    fetchEntries()
  }

  const handleBackToEntries = () => {
    setActiveView('entries')
    setSelectedEntry(null)
  }

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

  const stats = {
    total: entries.length,
    pending: entries.filter(e => e.status === 'PENDING').length,
    approved: entries.filter(e => e.status === 'APPROVED').length,
    rejected: entries.filter(e => e.status === 'REJECTED').length
  }

  const filteredEntries = entries.filter(entry => {
    if (filter === 'all') return true
    return entry.status.toLowerCase() === filter.toLowerCase()
  })

  // If viewing entry details
  if (activeView === 'details' && selectedEntry) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Factory className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Entry Details</h1>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{user.name}</span> 
                    <Badge variant="outline" className="ml-2">
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {user.role === 'SUPERVISOR' && (
                  <Button 
                    onClick={() => router.push('/dashboard/analytics')} 
                    variant="outline"
                    className="hidden sm:flex"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                  </Button>
                )}
                <Button onClick={handleLogout} variant="outline">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6">
          <EntryDetails 
            entry={selectedEntry} 
            onClose={handleBackToEntries}
            onApprove={user.role === 'SUPERVISOR' ? handleApproval : undefined}
            showActions={user.role === 'SUPERVISOR'}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Factory className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manufacturing Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Welcome back, <span className="font-medium">{user.name}</span> 
                  <Badge variant="outline" className="ml-2">
                    {user.role.replace('_', ' ')}
                  </Badge>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {user.role === 'SUPERVISOR' && (
                <Button 
                  onClick={() => router.push('/dashboard/analytics')} 
                  variant="outline"
                  className="hidden sm:flex"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              )}
              <Button onClick={handleLogout} variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Entries</CardTitle>
              <FileText className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">All production records</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-gray-500 mt-1">Successfully approved</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-gray-500 mt-1">Requires revision</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <CardTitle className="text-xl text-gray-900">
                  {activeView === 'entries' ? 'Production Entries' : 'Create New Entry'}
                </CardTitle>
                <CardDescription>
                  {activeView === 'entries' 
                    ? user.role === 'TEAM_LEADER' 
                      ? 'Manage your production data entries and track approval status'
                      : 'Review and approve production entries from team leaders'
                    : 'Fill in the production data for supervisor approval'
                  }
                </CardDescription>
              </div>

              {user.role === 'TEAM_LEADER' && (
                <div className="flex space-x-2">
                  {activeView === 'create' && (
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveView('entries')}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Entries
                    </Button>
                  )}
                  {activeView === 'entries' && (
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setActiveView('create')}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Entry
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {activeView === 'entries' ? (
              // Entries List View
              <>
                {/* Filter Tabs */}
                <Tabs value={filter} onValueChange={setFilter} className="mb-6">
                  <TabsList className="grid grid-cols-4 w-full max-w-md">
                    <TabsTrigger value="all" className="flex items-center">
                      <List className="h-4 w-4 mr-1" />
                      All
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Pending
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approved
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="flex items-center">
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejected
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Entries Table */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading entries...</p>
                  </div>
                ) : filteredEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No entries found</p>
                    <p className="text-gray-400 mb-6">
                      {user.role === 'TEAM_LEADER' 
                        ? 'Create your first production entry to get started'
                        : 'No entries are currently pending review'
                      }
                    </p>
                    {user.role === 'TEAM_LEADER' && (
                      <Button 
                        onClick={() => setActiveView('create')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Entry
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-gray-50">
                          <TableHead className="font-semibold">Date</TableHead>
                          <TableHead className="font-semibold">Line</TableHead>
                          <TableHead className="font-semibold">Shift</TableHead>
                          <TableHead className="font-semibold">Model</TableHead>
                          <TableHead className="font-semibold">Production</TableHead>
                          <TableHead className="font-semibold">Efficiency</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Submitted By</TableHead>
                          <TableHead className="font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEntries.map((entry) => {
                          const totalParts = entry.goodParts + entry.rejects
                          const efficiency = totalParts > 0 ? Math.round((entry.goodParts / totalParts) * 100) : 0
                          
                          return (
                            <TableRow key={entry.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                  {new Date(entry.date).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                  {entry.line}
                                </Badge>
                              </TableCell>
                              <TableCell>{entry.shift}</TableCell>
                              <TableCell>{entry.model}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="flex items-center text-sm">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    <span className="text-green-600 font-medium">
                                      {entry.goodParts.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                    <span className="text-red-600">
                                      {entry.rejects.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <div className="w-12 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        efficiency >= 95 ? 'bg-green-500' : 
                                        efficiency >= 85 ? 'bg-blue-500' : 
                                        efficiency >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${efficiency}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium">{efficiency}%</span>
                                </div>
                              </TableCell>
                              <TableCell>{getStatusBadge(entry.status)}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{entry.submittedBy.name}</div>
                                  <div className="text-gray-500">
                                    {new Date(entry.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewDetails(entry)}
                                  >
                                    <Eye className="mr-1 h-3 w-3" />
                                    View
                                  </Button>
                                  {user.role === 'SUPERVISOR' && entry.status === 'PENDING' && (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => handleApproval(entry.id, 'APPROVED')}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleApproval(entry.id, 'REJECTED')}
                                      >
                                        <XCircle className="mr-1 h-3 w-3" />
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            ) : (
              // Entry Form View
              <div className="max-w-none">
                <EntryForm onSuccess={handleEntrySuccess} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}