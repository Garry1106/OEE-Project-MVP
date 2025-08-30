'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Users,
  Factory,
  ArrowLeft,
  List,
  Eye,
  Calendar,
  Edit,
  Loader2,
  AlertTriangle
} from 'lucide-react'

interface DashboardProps {
  user: User
}

export default function Dashboard({ user }: DashboardProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [activeView, setActiveView] = useState<'entries' | 'create' | 'details'>('entries')
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
  const [pendingRejectionId, setPendingRejectionId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    fetchEntries()
  }, [filter])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const fetchEntries = async () => {
    try {
      const url = filter === 'all' ? '/api/entries' : `/api/entries?status=${filter.toUpperCase()}`
      const response = await fetch(url)
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
        
        // If we're viewing details of the approved/rejected entry, refresh the details
        if (selectedEntry && selectedEntry.id === entryId) {
          const updatedEntry = entries.find(e => e.id === entryId)
          if (updatedEntry) {
            setSelectedEntry({ ...updatedEntry, status, rejectionReason: reason })
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
        // Ensure operatorNames is always an array
        const normalizedEntry: Entry = {
          ...entry,
          operatorNames: entry.operatorNames || []
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
    // Ensure operatorNames is always an array
    const normalizedEntry: Entry = {
      ...entry,
      operatorNames: entry.operatorNames || []
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
          <Alert className={`mb-6 ${
            notification.type === 'success' 
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
                  {activeView === 'entries' 
                    ? 'Production Entries' 
                    : editingEntry 
                      ? 'Edit Production Entry'
                      : 'Create New Entry'
                  }
                </CardTitle>
                <CardDescription>
                  {activeView === 'entries' 
                    ? user.role === 'TEAM_LEADER' 
                      ? 'Manage your production data entries and track approval status'
                      : 'Review and approve production entries from team leaders'
                    : editingEntry
                      ? 'Modify production data details'
                      : 'Fill in the production data for supervisor approval'
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
                    Back 
                  </Button>
                )}
                {activeView === 'entries' && (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleCreateNew}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Entry
                  </Button>
                )}
              </div>
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
                        : 'No entries are currently available for review'
                      }
                    </p>
                    <Button 
                      onClick={handleCreateNew}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Entry
                    </Button>
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
                              <TableCell>
                                <div className="space-y-1">
                                  {getStatusBadge(entry.status)}
                                  {entry.status === 'REJECTED' && entry.rejectionReason && (
                                    <div className="text-xs text-red-600 max-w-48 truncate">
                                      Reason: {entry.rejectionReason}
                                    </div>
                                  )}
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
          