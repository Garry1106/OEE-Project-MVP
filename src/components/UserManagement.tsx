'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Shield, 
  BarChart3, 
  UserCheck, 
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: 'TEAM_LEADER' | 'SUPERVISOR' | 'ADMIN'
  createdAt: string
}

interface NewUser {
  name: string
  email: string
  role: string
  password: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    email: '',
    role: '',
    password: ''
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/users', {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser ? { ...newUser, id: editingUser.id } : newUser)
      })

      if (response.ok) {
        setSuccess(editingUser ? 'User updated successfully' : 'User created successfully')
        setDialogOpen(false)
        resetForm()
        fetchUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Operation failed')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('User deleted successfully')
        fetchUsers()
      } else {
        setError('Failed to delete user')
      }
    } catch (error) {
      setError('Network error occurred')
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      password: ''
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setNewUser({ name: '', email: '', role: '', password: '' })
    setEditingUser(null)
    setError('')
    setSuccess('')
  }

  const getRoleBadge = (role: string) => {
    const config = {
      ADMIN: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Shield },
      SUPERVISOR: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: BarChart3 },
      TEAM_LEADER: { color: 'bg-green-100 text-green-800 border-green-200', icon: UserCheck }
    }
    
    const { color, icon: Icon } = config[role as keyof typeof config] || config.TEAM_LEADER
    
    return (
      <Badge variant="outline" className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {role.replace('_', ' ')}
      </Badge>
    )
  }

  const roleOptions = [
    { value: 'TEAM_LEADER', label: 'Team Leader', icon: UserCheck, description: 'Can create production entries' },
    { value: 'SUPERVISOR', label: 'Supervisor', icon: BarChart3, description: 'Can approve entries and view analytics' },
    { value: 'ADMIN', label: 'Admin', icon: Shield, description: 'Full system access and user management' }
  ]

  return (
    <div className="space-y-6">
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-blue-600" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage system users and their roles
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? 'Edit User' : 'Create New User'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingUser ? 'Update user information and role' : 'Add a new user to the system'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                   <Input
                     id="email"
                     type="email"
                     value={newUser.email}
                     onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                     placeholder="Enter email address"
                     required
                   />
                 </div>
                 <div>
                   <Label>Role</Label>
                   <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                     <SelectTrigger>
                       <SelectValue placeholder="Select user role" />
                     </SelectTrigger>
                     <SelectContent>
                       {roleOptions.map((role) => {
                         const Icon = role.icon
                         return (
                           <SelectItem key={role.value} value={role.value}>
                             <div className="flex items-center space-x-2">
                               <Icon className="h-4 w-4" />
                               <div>
                                 <div className="font-medium">{role.label}</div>
                                 <div className="text-xs text-gray-500">{role.description}</div>
                               </div>
                             </div>
                           </SelectItem>
                         )
                       })}
                     </SelectContent>
                   </Select>
                 </div>
                 <div>
                   <Label htmlFor="password">
                     {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                   </Label>
                   <Input
                     id="password"
                     type="password"
                     value={newUser.password}
                     onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                     placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password'}
                     required={!editingUser}
                   />
                 </div>
                 <div className="flex justify-end space-x-2">
                   <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                     Cancel
                   </Button>
                   <Button type="submit" disabled={submitting}>
                     {submitting ? (
                       <>
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         {editingUser ? 'Updating...' : 'Creating...'}
                       </>
                     ) : (
                       editingUser ? 'Update User' : 'Create User'
                     )}
                   </Button>
                 </div>
               </form>
             </DialogContent>
           </Dialog>
         </div>
       </CardHeader>
       <CardContent>
         {loading ? (
           <div className="text-center py-8">
             <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
             <p className="text-gray-500">Loading users...</p>
           </div>
         ) : (
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Name</TableHead>
                 <TableHead>Email</TableHead>
                 <TableHead>Role</TableHead>
                 <TableHead>Created</TableHead>
                 <TableHead>Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {users.map((user) => (
                 <TableRow key={user.id}>
                   <TableCell className="font-medium">{user.name}</TableCell>
                   <TableCell>
                     <div className="flex items-center">
                       <Mail className="h-4 w-4 text-gray-400 mr-2" />
                       {user.email}
                     </div>
                   </TableCell>
                   <TableCell>{getRoleBadge(user.role)}</TableCell>
                   <TableCell>
                     <div className="flex items-center text-sm text-gray-500">
                       <Calendar className="h-4 w-4 mr-1" />
                       {new Date(user.createdAt).toLocaleDateString()}
                     </div>
                   </TableCell>
                   <TableCell>
                     <div className="flex space-x-2">
                       <Button 
                         size="sm" 
                         variant="outline" 
                         onClick={() => handleEdit(user)}
                       >
                         <Edit className="h-3 w-3 mr-1" />
                         Edit
                       </Button>
                       <Button 
                         size="sm" 
                         variant="destructive" 
                         onClick={() => handleDelete(user.id)}
                       >
                         <Trash2 className="h-3 w-3 mr-1" />
                         Delete
                       </Button>
                     </div>
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         )}
       </CardContent>
     </Card>
   </div>
 )
}