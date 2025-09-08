'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Factory, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn,
  Shield,
  Users,
  BarChart3,
  Loader2,
  User,
  Settings,
  Zap
} from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })
      
      if (response.ok) {
        const data = await response.json()
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 100)
      } else {
        const data = await response.json()
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const roles = [
    {
      value: 'admin',
      label: 'System Administrator',
      email: 'admin@company.com',
      icon: Shield,
      description: 'Full system access'
    },
    {
      value: 'supervisor',
      label: 'Production Supervisor', 
      email: 'supervisor@company.com',
      icon: BarChart3,
      description: 'Review entries & analytics'
    },
    {
      value: 'teamleader',
      label: 'Team Leader',
      email: 'teamleader@company.com', 
      icon: Users,
      description: 'Enter hourly production data'
    }
  ]

  const handleRoleSelect = (value: string) => {
    setSelectedRole(value)
    const selectedRoleData = roles.find(role => role.value === value)
    if (selectedRoleData) {
      setEmail(selectedRoleData.email)
      setPassword('password123')
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:20px_20px]"></div>
      </div>
      
      {/* Geometric Elements */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl"></div>
      
      <div className="min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 relative">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-2xl">
                  <Factory className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">
                    OEE Tracker
                  </h1>
                  <p className="text-blue-200 text-lg font-medium">Overall Equipment Effectiveness Platform</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6 max-w-md">
              <h2 className="text-3xl font-bold leading-tight">
                Maximize Efficiency on the Shop Floor
              </h2>
              <p className="text-blue-100 text-lg leading-relaxed">
                Record production data, approve shifts, and track OEE in real time — empowering smarter decisions for manufacturing teams.
              </p>
              
              <div className="space-y-4 pt-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">OEE Analytics</p>
                    <p className="text-blue-200 text-sm">Track Availability, Performance & Quality</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Settings className="h-5 w-5 text-orange-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Approval Workflow</p>
                    <p className="text-blue-200 text-sm">Supervisors review & validate shift data</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-green-300" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Automated Insights</p>
                    <p className="text-blue-200 text-sm">Generate efficiency reports instantly</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8 relative z-10">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="h-12 w-12  rounded-lg flex items-center justify-center shadow-lg">
                  <Factory className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold text-white">OEE Tracker</h1>
                  <p className="text-sm text-slate-400">Monitor & Improve Production Efficiency</p>
                </div>
              </div>
            </div>

            <Card className="shadow-2xl border-0 bg-white">
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</CardTitle>
                <CardDescription className="text-slate-600 text-base">
                  Sign in to access your OEE dashboard
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6 pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-12 border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-slate-900 bg-white"
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 pr-11 h-12 border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-slate-900 bg-white"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-semibold text-slate-700">
                      Access Level
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 z-10" />
                      <Select value={selectedRole} onValueChange={handleRoleSelect}>
                        <SelectTrigger className="pl-11 h-12 border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white">
                          <SelectValue placeholder="Select your access level" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => {
                            return (
                              <SelectItem key={role.value} value={role.value} className="py-3">
                                <p className="font-medium">{role.label}</p>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="p-4 rounded-lg bg-red-50 border-2 border-red-200">
                      <p className="text-sm font-medium text-red-700">{error}</p>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-5 w-5" />
                        Sign In 
                      </>
                    )}
                  </Button>
                </form>
                
                {/* Footer */}
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-center text-xs text-slate-500">
                    Secure OEE tracking & manufacturing insights
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
