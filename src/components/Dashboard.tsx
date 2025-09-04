'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  List,
  Eye,
  Calendar,
  Edit,
  Loader2,
  AlertTriangle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  TrendingUp,
  Award
} from 'lucide-react'
import { calculateOEE, getOEECategory } from '@/lib/oee'

interface DashboardProps {
  user: User
}

interface Filters {
  status: string
  shift: string
  line: string
  teamLeader: string
  productionType: string
  dateFrom: string
  dateTo: string
  searchTerm: string
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

export default function Dashboard({ user }: DashboardProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([])
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

  // Filters state
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    shift: 'all',
    line: 'all',
    teamLeader: 'all',
    productionType: 'all',
    dateFrom: '',
    dateTo: '',
    searchTerm: ''
  })

  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 24
  })

  const router = useRouter()

  useEffect(() => {
    fetchEntries()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [entries, filters])

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

  const applyFilters = () => {
    let filtered = entries

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status.toLowerCase() === filters.status.toLowerCase())
    }

    // Shift filter
    if (filters.shift !== 'all') {
      filtered = filtered.filter(entry => entry.shift === filters.shift)
    }

    // Line filter
    if (filters.line !== 'all') {
      filtered = filtered.filter(entry => entry.line === filters.line)
    }

    // Team leader filter
    if (filters.teamLeader !== 'all') {
      filtered = filtered.filter(entry => entry.teamLeader === filters.teamLeader)
    }

    // Production type filter
    if (filters.productionType !== 'all') {
      filtered = filtered.filter(entry => entry.productionType === filters.productionType)
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(entry => new Date(entry.date) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      filtered = filtered.filter(entry => new Date(entry.date) <= new Date(filters.dateTo))
    }

    // Search filter
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

    // Update pagination
    const totalPages = Math.ceil(filtered.length / pagination.itemsPerPage)
    setPagination(prev => ({
      ...prev,
      totalPages,
      totalItems: filtered.length,
      currentPage: Math.min(prev.currentPage, totalPages || 1)
    }))
  }

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, currentPage: 1 })) // Reset to first page
  }

  const clearFilters = () => {
    setFilters({
      status: 'all',
      shift: 'all',
      line: 'all',
      teamLeader: 'all',
      productionType: 'all',
      dateFrom: '',
      dateTo: '',
      searchTerm: ''
    })
  }

  const getPaginatedEntries = () => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage
    const endIndex = startIndex + pagination.itemsPerPage
    return filteredEntries.slice(startIndex, endIndex)
  }

  const changePage = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }))
  }

  // Get unique values for filter dropdowns
  const getUniqueValues = (field: keyof Entry) => {
    return Array.from(new Set(entries.map(entry => entry[field] as string))).filter(Boolean).sort()
  }

  // Existing functions remain unchanged
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
    total: filteredEntries.length,
    pending: filteredEntries.filter(e => e.status === 'PENDING').length,
    approved: filteredEntries.filter(e => e.status === 'APPROVED').length,
    rejected: filteredEntries.filter(e => e.status === 'REJECTED').length
  }

  const paginatedEntries = getPaginatedEntries()

  // If viewing entry details
  if (activeView === 'details' && selectedEntry) {
    return (
      <div className="min-h-screen bg-gray-50">
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
              <Button onClick={handleLogout} variant="outline">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Filtered Total</CardTitle>
              <FileText className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">Matching filters</p>
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
                  {activeView === 'entries'
                    ? 'Hourly Production Entries'
                    : editingEntry
                      ? 'Edit Production Entry'
                      : 'Create New Entry'
                  }
                </CardTitle>
                <CardDescription>
                  {activeView === 'entries'
                    ? user.role === 'TEAM_LEADER'
                      ? 'Manage hourly production entries and track approval status'
                      : 'Review and approve hourly production entries from team leaders'
                    : editingEntry
                      ? 'Modify hourly production data'
                      : 'Enter hourly production data for supervisor approval'
                  }
                </CardDescription>
              </div>

              <div className="flex space-x-2">
                {activeView === 'create' && (
                  <Button
                    variant="outline"
                    onClick={handleBackToEntries}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Entries
                  </Button>
                )}
                {activeView === 'entries' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="mr-2 h-4 w-4" />
                      {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={handleCreateNew}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Entry
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {activeView === 'entries' ? (
              <>
                {/* Enhanced Filters */}
                {showFilters && (
                  <Card className="mb-6 border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {/* Status Filter */}
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                            <SelectTrigger className="h-8 text-xs">
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

                        {/* Shift Filter */}
                        <div>
                          <Label className="text-sm font-medium">Shift</Label>
                          <Select value={filters.shift} onValueChange={(value) => updateFilter('shift', value)}>
                            <SelectTrigger className="h-8 text-xs">
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

                        {/* Line Filter */}
                        <div>
                          <Label className="text-sm font-medium">Line</Label>
                          <Select value={filters.line} onValueChange={(value) => updateFilter('line', value)}>
                            <SelectTrigger className="h-8 text-xs">
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

                        {/* Production Type Filter */}
                        <div>
                          <Label className="text-sm font-medium">Production Type</Label>
                          <Select value={filters.productionType} onValueChange={(value) => updateFilter('productionType', value)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="LH">LH</SelectItem>
                              <SelectItem value="RH">RH</SelectItem>
                              <SelectItem value="BOTH">LH & RH</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Team Leader Filter */}
                        <div>
                          <Label className="text-sm font-medium">Team Leader</Label>
                          <Select value={filters.teamLeader} onValueChange={(value) => updateFilter('teamLeader', value)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Team Leaders</SelectItem>
                              {getUniqueValues('teamLeader').map((leader) => (
                                <SelectItem key={leader} value={leader}>{leader}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Date From */}
                        <div>
                          <Label className="text-sm font-medium">Date From</Label>
                          <Input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => updateFilter('dateFrom', e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>

                        {/* Date To */}
                        <div>
                          <Label className="text-sm font-medium">Date To</Label>
                          <Input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => updateFilter('dateTo', e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>

                        {/* Search */}
                        <div>
                          <Label className="text-sm font-medium">Search</Label>
                          <Input
                            value={filters.searchTerm}
                            onChange={(e) => updateFilter('searchTerm', e.target.value)}
                            placeholder="Model, Leader, Hour..."
                            className="h-8 text-xs"
                          />
                        </div>

                        {/* Clear Filters */}
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="h-8 text-xs"
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Filter Summary */}
                {(filters.status !== 'all' || filters.shift !== 'all' || filters.line !== 'all' ||
                  filters.teamLeader !== 'all' || filters.productionType !== 'all' || 
                  filters.dateFrom || filters.dateTo || filters.searchTerm) && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-blue-800">
                          <Search className="h-4 w-4 inline mr-1" />
                          Showing {stats.total} of {entries.length} entries
                        </div>
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-blue-600 text-xs">
                          Clear Filters
                        </Button>
                      </div>
                    </div>
                  )}

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
                      {Object.values(filters).some(f => f && f !== 'all')
                        ? 'Try adjusting your filters or create a new entry'
                        : user.role === 'TEAM_LEADER'
                          ? 'Create your first hourly entry to get started'
                          : 'No entries are currently available for review'
                      }
                    </p>
                    <div className="flex justify-center space-x-3">
                      {Object.values(filters).some(f => f && f !== 'all') && (
                        <Button variant="outline" onClick={clearFilters}>
                          Clear Filters
                        </Button>
                      )}
                      <Button
                        onClick={handleCreateNew}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Entry
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-gray-50">
                            <TableHead className="font-semibold">Date</TableHead>
                            <TableHead className="font-semibold">Line</TableHead>
                            <TableHead className="font-semibold">Shift</TableHead>
                            <TableHead className="font-semibold">Hour</TableHead>
                            <TableHead className="font-semibold">Model</TableHead>
                            <TableHead className="font-semibold">Production Type</TableHead>
                            <TableHead className="font-semibold">Production</TableHead>
                            <TableHead className="font-semibold">OEE</TableHead> 
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Team Leader</TableHead>
                            <TableHead className="font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedEntries.map((entry) => {
                            const totals = calculateTotals(entry)
                            const totalProduction = totals.totalGood + totals.totalSpd + totals.totalRejects
                            
                            const oeeData = calculateOEE(
                              entry.availableTime,
                              entry.lossTime,
                              entry.lineCapacity,
                              totals.totalGood + totals.totalSpd,
                              totals.totalRejects
                            )

                            const oeeCategory = getOEECategory(oeeData.oee)

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
                                <TableCell>
                                  <Badge variant="outline">
                                    {entry.shift}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-gray-100 text-gray-700 font-mono text-xs">
                                    {entry.hour}
                                  </Badge>
                                </TableCell>
                                <TableCell>{entry.model}</TableCell>
                                <TableCell>
                                  <Badge variant={entry.productionType === 'BOTH' ? 'default' : 'secondary'}>
                                    {entry.productionType || 'LH'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex items-center text-sm">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                      <span className="text-green-600 font-medium">
                                        {totals.totalGood.toLocaleString()}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-1">Good</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                      <span className="text-blue-600 font-medium">
                                        {totals.totalSpd.toLocaleString()}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-1">SPD</span>
                                    </div>
                                    <div className="flex items-center text-sm">
                                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                      <span className="text-red-600">
                                        {totals.totalRejects.toLocaleString()}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-1">Rejects</span>
                                    </div>
                                    {entry.productionType === 'BOTH' && (
                                      <div className="text-xs text-gray-500 mt-1 border-t pt-1">
                                        LH: {((entry.goodPartsLH || 0) + (entry.spdPartsLH || 0) + (entry.rejectsLH || 0)).toLocaleString()} | 
                                        RH: {((entry.goodPartsRH || 0) + (entry.spdPartsRH || 0) + (entry.rejectsRH || 0)).toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-center flex-col">
                                    <div className="text-right">
                                      <div className={`text-sm font-bold ${oeeCategory.color}`}>
                                        {oeeData.oee}%
                                      </div>
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
                                  <div className="space-y-1">
                                    {getStatusBadge(entry.status)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="font-medium">{entry.submittedBy.name}</div>
                                    <div className="text-gray-500">
                                      {new Date(entry.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-2">
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

                                    {/* Approval buttons for Supervisors */}
                                    {user.role === 'SUPERVISOR' && entry.status === 'PENDING' && (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => handleApproval(entry.id, 'APPROVED')}
                                          className="bg-green-600 hover:bg-green-700"
                                          disabled={submitting}
                                        >
                                          <CheckCircle className="mr-1 h-3 w-3" />
                                          Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleRejectClick(entry.id)}
                                          disabled={submitting}
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

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                          Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                          {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                          {pagination.totalItems} entries
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => changePage(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="h-8"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>

                          <div className="flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                              let pageNum: number

                              if (pagination.totalPages <= 5) {
                                pageNum = i + 1
                              } else {
                                if (pagination.currentPage <= 3) {
                                  pageNum = i + 1
                                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                                  pageNum = pagination.totalPages - 4 + i
                                } else {
                                  pageNum = pagination.currentPage - 2 + i
                                }
                              }

                              return (
                                <Button
                                  key={pageNum}
                                  variant={pagination.currentPage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => changePage(pageNum)}
                                  className="h-8 w-8 p-0"
                                >
                                  {pageNum}
                                </Button>
                              )
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => changePage(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="h-8"
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
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
            <DialogTitle className="flex items-center text-red-700">
              <XCircle className="mr-2 h-5 w-5" />
              Reject Entry
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this production entry. The team leader will see this feedback.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter detailed reason for rejection..."
                className="mt-1 min-h-[100px]"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleRejectCancel} disabled={submitting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectConfirm}
                disabled={!rejectionReason.trim() || submitting}
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