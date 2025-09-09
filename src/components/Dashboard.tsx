'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import EntryForm from './EntryForm'
import EntryDetails from './EntryDetails'
import { useRouter } from 'next/navigation'
import { Entry, User } from '@/types'
import {
  Plus,
  BarChart3,
  LogOut,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Factory,
  ArrowLeft,
  Eye,
  Calendar,
  Edit,
  Loader2,
  AlertTriangle,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Timer,
  TrendingUp,
  Target,
  RefreshCw
} from 'lucide-react'
import { calculateHourlyOEE } from '@/lib/oee'

interface DashboardProps {
  user: User
}

interface Filters {
  status: string
  shift: string
  line: string
  teamLeader: string
  productionType: string
  searchTerm: string
}

interface GroupedEntries {
  [date: string]: {
    [shift: string]: Entry[]
  }
}

export default function Dashboard({ user }: DashboardProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([])
  const [groupedEntries, setGroupedEntries] = useState<GroupedEntries>({})
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'entries' | 'create' | 'details'>('entries')
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
  const [pendingRejectionId, setPendingRejectionId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({})

  // Filters state
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    shift: 'all',
    line: 'all',
    teamLeader: 'all',
    productionType: 'all',
    searchTerm: ''
  })

  const router = useRouter()

  useEffect(() => {
    fetchEntries()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [entries, filters, selectedDate])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/entries')
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      } else {
        setNotification({ type: 'error', message: 'Failed to fetch entries' })
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error)
      setNotification({ type: 'error', message: 'Failed to fetch entries' })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to calculate totals based on production type
  const calculateTotals = (entry: Entry) => {
    if (entry.productionType === 'BOTH') {
      return {
        totalGood: (entry.goodPartsLH || 0) + (entry.goodPartsRH || 0),
        totalSpd: (entry.spdPartsLH || 0) + (entry.spdPartsRH || 0),
        totalRejects: (entry.rejectsLH || 0) + (entry.rejectsRH || 0),
        totalTarget: (entry.ppcTargetLH || 0) + (entry.ppcTargetRH || 0)
      }
    } else {
      return {
        totalGood: entry.goodParts || 0,
        totalSpd: entry.spdParts || 0,
        totalRejects: entry.rejects || 0,
        totalTarget: entry.ppcTarget || 0
      }
    }
  }

  // Helper function to calculate OEE for an entry using the new hourly calculation
  const calculateEntryOEE = (entry: Entry) => {
    const totals = calculateTotals(entry)

    return calculateHourlyOEE(
      entry.lossTime || 0,
      entry.lineCapacity,
      totals.totalGood,
      totals.totalSpd,
      totals.totalRejects
    )
  }

  const applyFilters = () => {
    let filtered = entries

    // Date filter for selected date - default to today
    if (selectedDate) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.date).toISOString().split('T')[0]
        return entryDate === selectedDate
      })
    }

    // Apply other filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status.toLowerCase() === filters.status.toLowerCase())
    }

    if (filters.shift !== 'all') {
      filtered = filtered.filter(entry => entry.shift === filters.shift)
    }

    if (filters.line !== 'all') {
      filtered = filtered.filter(entry => entry.line === filters.line)
    }

    if (filters.teamLeader !== 'all') {
      filtered = filtered.filter(entry => entry.teamLeader === filters.teamLeader)
    }

    if (filters.productionType !== 'all') {
      filtered = filtered.filter(entry => entry.productionType === filters.productionType)
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(entry =>
        entry.model.toLowerCase().includes(searchLower) ||
        entry.teamLeader.toLowerCase().includes(searchLower) ||
        entry.line.toLowerCase().includes(searchLower) ||
        entry.problemHead.toLowerCase().includes(searchLower) ||
        entry.description.toLowerCase().includes(searchLower) ||
        entry.hour.toLowerCase().includes(searchLower)
      )
    }

    setFilteredEntries(filtered)
    groupEntriesByDateAndShift(filtered)
  }

  const groupEntriesByDateAndShift = (entries: Entry[]) => {
    const grouped: GroupedEntries = {}

    entries.forEach(entry => {
      const dateKey = new Date(entry.date).toISOString().split('T')[0]
      const shiftKey = entry.shift

      if (!grouped[dateKey]) {
        grouped[dateKey] = {}
      }

      if (!grouped[dateKey][shiftKey]) {
        grouped[dateKey][shiftKey] = []
      }

      grouped[dateKey][shiftKey].push(entry)
    })

    // Sort entries within each shift by hour
    Object.keys(grouped).forEach(date => {
      Object.keys(grouped[date]).forEach(shift => {
        grouped[date][shift].sort((a, b) => {
          const hourA = parseInt(a.hour.split(':')[0])
          const hourB = parseInt(b.hour.split(':')[0])
          return hourA - hourB
        })
      })
    })

    setGroupedEntries(grouped)
  }

  const toggleGroupExpansion = (dateShiftKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [dateShiftKey]: !prev[dateShiftKey]
    }))
  }

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      status: 'all',
      shift: 'all',
      line: 'all',
      teamLeader: 'all',
      productionType: 'all',
      searchTerm: ''
    })
  }

  // Get unique values for filter dropdowns
  const getUniqueValues = (field: keyof Entry) => {
    return Array.from(new Set(entries.map(entry => entry[field] as string))).filter(Boolean).sort()
  }

  // Get available dates for quick selection
  const getAvailableDates = () => {
    const dates = Array.from(new Set(entries.map(entry =>
      new Date(entry.date).toISOString().split('T')[0]
    ))).sort().reverse()
    return dates.slice(0, 5) // Show last 5 days
  }

  // Rest of the existing functions remain the same...
  const handleApproval = async (entryId: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      setSubmitting(true)
      const response = await fetch(`/api/entries/${entryId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          rejectionReason: status === 'REJECTED' ? reason : undefined
        })
      })

      if (response.ok) {
        await fetchEntries()
        setNotification({
          type: 'success',
          message: `Entry ${status.toLowerCase()} successfully!`
        })

        if (selectedEntry && selectedEntry.id === entryId) {
          const updatedEntry = entries.find(e => e.id === entryId)
          if (updatedEntry) {
            setSelectedEntry({ ...updatedEntry, status })
          }
        }
      } else {
        const errorData = await response.json()
        setNotification({
          type: 'error',
          message: errorData.error || 'Failed to update entry status'
        })
      }
    } catch (error) {
      console.error('Failed to update entry status:', error)
      setNotification({ type: 'error', message: 'Network error occurred' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRejectClick = (entryId: string) => {
    setPendingRejectionId(entryId)
    setRejectionDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (pendingRejectionId && rejectionReason.trim()) {
      await handleApproval(pendingRejectionId, 'REJECTED', rejectionReason.trim())
      setRejectionDialogOpen(false)
      setPendingRejectionId(null)
      setRejectionReason('')
    }
  }

  const handleRejectCancel = () => {
    setRejectionDialogOpen(false)
    setPendingRejectionId(null)
    setRejectionReason('')
  }

  const handleViewDetails = (entry: Entry) => {
    setSelectedEntry(entry)
    setActiveView('details')
  }

  const handleEditEntry = async (entryId: string) => {
    try {
      const response = await fetch(`/api/entries/${entryId}`)
      if (response.ok) {
        const entry: Entry = await response.json()
        const normalizedEntry: Entry = {
          ...entry,
          operatorNames: entry.operatorNames || [],
          stationNames: entry.stationNames || []
        }
        setEditingEntry(normalizedEntry)
        setSelectedEntry(null)
        setActiveView('create')
      } else {
        setNotification({ type: 'error', message: 'Failed to fetch entry for editing' })
      }
    } catch (error) {
      console.error('Failed to fetch entry for editing:', error)
      setNotification({ type: 'error', message: 'Failed to fetch entry for editing' })
    }
  }

  const handleEditFromDetails = (entry: Entry) => {
    const normalizedEntry: Entry = {
      ...entry,
      operatorNames: entry.operatorNames || [],
      stationNames: entry.stationNames || []
    }
    setEditingEntry(normalizedEntry)
    setSelectedEntry(null)
    setActiveView('create')
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
    setEditingEntry(null)
    fetchEntries()
    setNotification({
      type: 'success',
      message: editingEntry ? 'Entry updated successfully!' : 'Entry submitted successfully!'
    })
  }

  const handleBackToEntries = () => {
    setActiveView('entries')
    setSelectedEntry(null)
    setEditingEntry(null)
  }

  const handleCreateNew = () => {
    setEditingEntry(null)
    setSelectedEntry(null)
    setActiveView('create')
  }

  const getStatusBadge = (status: string) => {
    const config = {
      PENDING: {
        variant: 'secondary' as const,
        icon: Clock,
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200'
      },
      APPROVED: {
        variant: 'default' as const,
        icon: CheckCircle,
        className: 'bg-green-50 text-green-700 border-green-200'
      },
      REJECTED: {
        variant: 'destructive' as const,
        icon: XCircle,
        className: 'bg-red-50 text-red-700 border-red-200'
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
    total: filteredEntries.length,
    pending: filteredEntries.filter(e => e.status === 'PENDING').length,
    approved: filteredEntries.filter(e => e.status === 'APPROVED').length,
    rejected: filteredEntries.filter(e => e.status === 'REJECTED').length
  }

  // Calculate daily metrics using the new OEE calculation
  const dailyMetrics = Object.values(groupedEntries).reduce((acc, shifts) => {
    const allEntries = Object.values(shifts).flat()
    const totalProduction = allEntries.reduce((sum, entry) => {
      const totals = calculateTotals(entry)
      return sum + totals.totalGood + totals.totalSpd + totals.totalRejects
    }, 0)

    const avgOEE = allEntries.length > 0 ? allEntries.reduce((sum, entry) => {
      const oeeData = calculateEntryOEE(entry)

      const { availability, performance, quality, oee } = oeeData
      return sum + oeeData.oee
    }, 0) / allEntries.length : 0

    return {
      totalProduction: acc.totalProduction + totalProduction,
      avgOEE: avgOEE
    }
  }, { totalProduction: 0, avgOEE: 0 })

  // If viewing entry details
  if (activeView === 'details' && selectedEntry) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Factory className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Entry Details</h1>
                  <p className="text-sm text-gray-600">
                    {user.name} • {user.role.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-6">
          <EntryDetails
            entry={selectedEntry}
            onClose={handleBackToEntries}
            onEdit={handleEditFromDetails}
            onApprove={user.role === 'SUPERVISOR' ? handleApproval : undefined}
            showActions={user.role === 'SUPERVISOR'}
            userRole={user.role}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Factory className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Manufacturing Dashboard</h1>
                <p className="text-sm text-gray-600">
                  {user.name} • {user.role.replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {user.role === 'SUPERVISOR' && (
                <Button
                  onClick={() => router.push('/dashboard/analytics')}
                  variant="outline"
                  size="sm"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              )}
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Notification */}
        {notification && (
          <Alert className={`mb-6 ${notification.type === 'success'
            ? 'border-green-200 bg-green-50'
            : 'border-red-200 bg-red-50'
            }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={
              notification.type === 'success' ? 'text-green-800' : 'text-red-800'
            }>
              {notification.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-medium text-gray-600">Today's Entries</CardTitle>
                <FileText className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-xs text-gray-500">Total records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-medium text-gray-600">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-gray-500">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-medium text-gray-600">Production</CardTitle>
                <Target className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{dailyMetrics.totalProduction.toLocaleString()}</div>
              <p className="text-xs text-gray-500">Units produced</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-medium text-gray-600">Avg OEE</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{dailyMetrics.avgOEE.toFixed(1)}%</div>
              <p className="text-xs text-gray-500">Overall efficiency</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {activeView === 'entries'
                    ? 'Production Monitoring'
                    : editingEntry
                      ? 'Edit Entry'
                      : 'Create Entry'
                  }
                </CardTitle>
                <CardDescription>
                  {activeView === 'entries'
                    ? `Hourly production data for ${new Date(selectedDate).toLocaleDateString()}`
                    : editingEntry
                      ? 'Modify production entry'
                      : 'Create new production entry'
                  }
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeView === 'create' && (
                  <Button variant="outline" onClick={handleBackToEntries} size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                )}
                {activeView === 'entries' && (
                  <>
                    <Button variant="outline" onClick={() => fetchEntries()} size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)} size="sm">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                    <Button onClick={handleCreateNew} size="sm" className='bg-blue-600 hover:bg-blue-700'>
                      <Plus className="mr-2 h-4 w-4" />
                      New Entry
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {activeView === 'entries' ? (
              <>
                {/* Date Selection */}
                <div className="mb-4 inline-block p-4 bg-blue-50 rounded-lg border">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Select Date
                      </Label>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-48 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Filters */}
                {showFilters && (
                  <Card className="mb-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium">Filters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Shift</Label>
                          <Select value={filters.shift} onValueChange={(value) => updateFilter('shift', value)}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Shifts</SelectItem>
                              {getUniqueValues('shift').map((shift) => (
                                <SelectItem key={shift} value={shift}>{shift}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Line</Label>
                          <Select value={filters.line} onValueChange={(value) => updateFilter('line', value)}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Lines</SelectItem>
                              {getUniqueValues('line').map((line) => (
                                <SelectItem key={line} value={line}>{line}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Production Type</Label>
                          <Select value={filters.productionType} onValueChange={(value) => updateFilter('productionType', value)}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="LH">LH</SelectItem>
                              <SelectItem value="RH">RH</SelectItem>
                              <SelectItem value="BOTH">Both</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Team Leader</Label>
                          <Select value={filters.teamLeader} onValueChange={(value) => updateFilter('teamLeader', value)}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Leaders</SelectItem>
                              {getUniqueValues('teamLeader').map((leader) => (
                                <SelectItem key={leader} value={leader}>{leader}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">Search</Label>
                          <div className="relative">
                            <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                            <Input
                              value={filters.searchTerm}
                              onChange={(e) => updateFilter('searchTerm', e.target.value)}
                              placeholder="Search..."
                              className="pl-8 h-8"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end mt-3">
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Entries by Shift */}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading production data...</p>
                  </div>
                ) : Object.keys(groupedEntries).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No entries found</h3>
                    <p className="text-gray-600 mb-6">
                      {Object.values(filters).some(f => f && f !== 'all') || filters.searchTerm
                        ? 'No entries match your filters. Try adjusting them or create a new entry.'
                        : `No production entries for ${new Date(selectedDate).toLocaleDateString()}. Create the first entry.`
                      }
                    </p>
                    <div className="flex justify-center gap-3">
                      {(Object.values(filters).some(f => f && f !== 'all') || filters.searchTerm) && (
                        <Button variant="outline" onClick={clearFilters} size="sm">
                          Clear Filters
                        </Button>
                      )}
                      <Button onClick={handleCreateNew} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Entry
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedEntries)
                      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                      .map(([date, shifts]) => (
                        <div key={date} className="space-y-3">
                          {Object.entries(shifts)
                            .sort(([shiftA], [shiftB]) => shiftA.localeCompare(shiftB))
                            .map(([shift, shiftEntries]) => {
                              const groupKey = `${date}-${shift}`
                              const isExpanded = expandedGroups[groupKey] !== false // Default to expanded

                              // Calculate shift summary stats using the new OEE calculation
                              const shiftStats = {
                                totalEntries: shiftEntries.length,
                                pending: shiftEntries.filter(e => e.status === 'PENDING').length,
                                approved: shiftEntries.filter(e => e.status === 'APPROVED').length,
                                rejected: shiftEntries.filter(e => e.status === 'REJECTED').length,

                                totalProduction: shiftEntries.reduce((sum, entry) => {
                                  const totals = calculateTotals(entry)
                                  return sum + totals.totalGood + totals.totalSpd + totals.totalRejects
                                }, 0),

                                avgOEE: shiftEntries.length > 0 ? shiftEntries.reduce((sum, entry) => {
                                  const oeeData = calculateEntryOEE(entry)
                                  return sum + oeeData.oee
                                }, 0) / shiftEntries.length : 0,

                                avgAvailability: shiftEntries.length > 0 ? shiftEntries.reduce((sum, entry) => {
                                  const oeeData = calculateEntryOEE(entry)
                                  return sum + oeeData.availability
                                }, 0) / shiftEntries.length : 0,

                                avgPerformance: shiftEntries.length > 0 ? shiftEntries.reduce((sum, entry) => {
                                  const oeeData = calculateEntryOEE(entry)
                                  return sum + oeeData.performance
                                }, 0) / shiftEntries.length : 0,

                                avgQuality: shiftEntries.length > 0 ? shiftEntries.reduce((sum, entry) => {
                                  const oeeData = calculateEntryOEE(entry)
                                  return sum + oeeData.quality
                                }, 0) / shiftEntries.length : 0
                              }

                              return (
                                <Card key={groupKey} className="border-gray-200">
                                  <Collapsible
                                    open={isExpanded}
                                    onOpenChange={() => toggleGroupExpansion(groupKey)}
                                  >
                                    <CollapsibleTrigger className="w-full">
                                      <CardHeader className="hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-4 mb-3">
                                            <div className="flex items-center space-x-3 ">
                                              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                                <Timer className="h-4 w-4 text-white" />
                                              </div>
                                              <div className="text-left">
                                                <h4 className="text-base font-bold text-gray-900">
                                                  {shift} Shift
                                                </h4>
                                                <p className="text-sm text-gray-500">
                                                  {shiftStats.totalEntries} hours • {shiftStats.totalProduction.toLocaleString()} units • {shiftStats.avgOEE.toFixed(1)}% OEE
                                                </p>
                                                <div className="text-xs text-gray-400 mt-1">
                                                  A: {shiftStats.avgAvailability.toFixed(1)}% • P: {shiftStats.avgPerformance.toFixed(1)}% • Q: {shiftStats.avgQuality.toFixed(1)}%
                                                </div>
                                              </div>
                                            </div>

                                            <div className="hidden md:flex items-center space-x-4">
                                              <div className="text-center">
                                                <div className="text-lg font-bold text-gray-900">{shiftStats.totalProduction.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500">Production</div>
                                              </div>
                                              <div className="text-center">
                                                <div className={`text-lg font-bold ${shiftStats.avgOEE >= 85 ? 'text-green-600' :
                                                    shiftStats.avgOEE >= 60 ? 'text-blue-600' :
                                                      shiftStats.avgOEE >= 40 ? 'text-yellow-600' : 'text-red-600'
                                                  }`}>
                                                  {shiftStats.avgOEE.toFixed(1)}%
                                                </div>
                                                <div className="text-xs text-gray-500">Avg OEE</div>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center space-x-3">
                                            <div className="flex gap-2">
                                              {shiftStats.pending > 0 && (
                                                <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                  <Clock className="w-3 h-3 mr-1" />
                                                  {shiftStats.pending}
                                                </Badge>
                                              )}
                                              {shiftStats.approved > 0 && (
                                                <Badge className="bg-green-50 text-green-700 border-green-200">
                                                  <CheckCircle className="w-3 h-3 mr-1" />
                                                  {shiftStats.approved}
                                                </Badge>
                                              )}
                                              {shiftStats.rejected > 0 && (
                                                <Badge className="bg-red-50 text-red-700 border-red-200">
                                                  <XCircle className="w-3 h-3 mr-1" />
                                                  {shiftStats.rejected}
                                                </Badge>
                                              )}
                                            </div>

                                            {isExpanded ? (
                                              <ChevronUp className="h-6 w-6 text-gray-400" />
                                            ) : (
                                              <ChevronDown className="h-6 w-6 text-gray-400" />
                                            )}
                                          </div>
                                        </div>
                                      </CardHeader>
                                    </CollapsibleTrigger>

                                    <CollapsibleContent>
                                      <CardContent className="pt-0">
                                        <div className="border rounded-lg overflow-hidden">
                                          <Table>
                                            <TableHeader>
                                              <TableRow className="bg-gray-50">
                                                <TableHead className="text-xs font-medium text-gray-700">Hour</TableHead>
                                                <TableHead className="text-xs font-medium text-gray-700">Line</TableHead>
                                                <TableHead className="text-xs font-medium text-gray-700">Model</TableHead>
                                                <TableHead className="text-xs font-medium text-gray-700">Type</TableHead>
                                                <TableHead className="text-xs font-medium text-gray-700">Production</TableHead>
                                                <TableHead className="text-xs font-medium text-gray-700">OEE</TableHead>
                                                <TableHead className="text-xs font-medium text-gray-700">Status</TableHead>
                                                <TableHead className="text-xs font-medium text-gray-700">Team Leader</TableHead>
                                                <TableHead className="text-xs font-medium text-gray-700">Actions</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {shiftEntries.map((entry) => {
                                                const totals = calculateTotals(entry)

                                                // Use the new OEE calculation
                                                const oeeData = calculateEntryOEE(entry)

                                                return (
                                                  <TableRow key={entry.id} className="hover:bg-gray-50">
                                                    <TableCell>
                                                      <Badge variant="outline" className="font-mono text-xs">
                                                        {entry.hour}
                                                      </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                        {entry.line}
                                                      </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                      <span className="text-sm font-medium text-gray-900">{entry.model}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                      <Badge variant="secondary" className="text-xs">
                                                        {entry.productionType || 'LH'}
                                                      </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                      <div className="space-y-1">
                                                        <div className="flex items-center text-xs">
                                                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                                          <span className="text-green-600 font-medium">
                                                            {totals.totalGood.toLocaleString()}
                                                          </span>
                                                          <span className="text-gray-500 ml-1">Good</span>
                                                        </div>
                                                        <div className="flex items-center text-xs">
                                                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                                          <span className="text-blue-600 font-medium">
                                                            {totals.totalSpd.toLocaleString()}
                                                          </span>
                                                          <span className="text-gray-500 ml-1">SPD</span>
                                                        </div>
                                                        <div className="flex items-center text-xs">
                                                          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                                          <span className="text-red-600 font-medium">
                                                            {totals.totalRejects.toLocaleString()}
                                                          </span>
                                                          <span className="text-gray-500 ml-1">Rejects</span>
                                                        </div>
                                                        {entry.productionType === 'BOTH' && (
                                                          <div className="text-xs text-gray-500 mt-1 pt-1 border-t">
                                                            LH: {((entry.goodPartsLH || 0) + (entry.spdPartsLH || 0) + (entry.rejectsLH || 0)).toLocaleString()} |
                                                            RH: {((entry.goodPartsRH || 0) + (entry.spdPartsRH || 0) + (entry.rejectsRH || 0)).toLocaleString()}
                                                          </div>
                                                        )}
                                                      </div>
                                                    </TableCell>
                                                    <TableCell>
                                                      <div className="flex items-center space-x-2">
                                                        <div className={`text-sm font-bold ${oeeData.oee >= 85 ? 'text-green-600' :
                                                            oeeData.oee >= 60 ? 'text-blue-600' :
                                                              oeeData.oee >= 40 ? 'text-yellow-600' : 'text-red-600'
                                                          }`}>
                                                          {oeeData.oee}%
                                                        </div>
                                                        <div className="w-12 bg-gray-200 rounded-full h-2">
                                                          <div
                                                            className={`h-2 rounded-full ${oeeData.oee >= 85 ? 'bg-green-500' :
                                                                oeeData.oee >= 60 ? 'bg-blue-500' :
                                                                  oeeData.oee >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                                              }`}
                                                            style={{ width: `${Math.min(oeeData.oee, 100)}%` }}
                                                          ></div>
                                                        </div>
                                                      </div>
                                                    </TableCell>
                                                    <TableCell>
                                                      {getStatusBadge(entry.status)}
                                                    </TableCell>
                                                    <TableCell>
                                                      <div className="text-xs">
                                                        <div className="font-medium text-gray-900">{entry.submittedBy.name}</div>
                                                        <div className="text-gray-500">
                                                          {new Date(entry.createdAt).toLocaleDateString()}
                                                        </div>
                                                      </div>
                                                    </TableCell>
                                                    <TableCell>
                                                      <div className="flex flex-wrap gap-1">
                                                        <Button
                                                          size="sm"
                                                          variant="outline"
                                                          onClick={() => handleViewDetails(entry)}
                                                        >
                                                          <Eye className="mr-1 h-3 w-3" />
                                                          View
                                                        </Button>

                                                        {/* Edit button for Team Leaders (only pending entries) */}
                                                        {user.role === 'TEAM_LEADER' && entry.status === 'PENDING' && (
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditEntry(entry.id)}
                                                          >
                                                            <Edit className="mr-1 h-3 w-3" />
                                                            Edit
                                                          </Button>
                                                        )}

                                                        {/* Edit button for Supervisors (all entries) */}
                                                        {user.role === 'SUPERVISOR' && (
                                                          <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditEntry(entry.id)}
                                                          >
                                                            <Edit className="mr-1 h-3 w-3" />
                                                            Edit
                                                          </Button>
                                                        )}
                                                      </div>
                                                    </TableCell>
                                                  </TableRow>
                                                )
                                              })}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </CardContent>
                                    </CollapsibleContent>
                                  </Collapsible>
                                </Card>
                              )
                            })}
                        </div>
                      ))}
                  </div>
                )}
              </>
            ) : (
              // Entry Form View
              <div className="max-w-none">
                <EntryForm
                  onSuccess={handleEntrySuccess}
                  onClose={user.role === 'SUPERVISOR' ? handleBackToEntries : undefined}
                  editingEntry={editingEntry}
                  isEditing={!!editingEntry}
                  showCloseButton={user.role === 'SUPERVISOR'}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={handleRejectCancel}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-700 text-lg font-semibold">
              <XCircle className="mr-2 h-5 w-5" />
              Reject Entry
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Provide a reason for rejecting this entry. The team leader will receive this feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason" className="text-sm font-medium">
                Rejection Reason *
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="mt-1 min-h-[100px]"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleRejectCancel} disabled={submitting} size="sm">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectConfirm}
                disabled={!rejectionReason.trim() || submitting}
                size="sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Reject Entry'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}