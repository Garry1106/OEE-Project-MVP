'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  CheckCircle,
  ArrowRight,
  Loader2
} from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  const demoCredentials = [
    {
      role: 'Admin',
      email: 'admin@company.com',
      description: 'Full system access & user management',
      icon: Shield,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      features: ['User Management', 'System Analytics', 'All Permissions']
    },
    {
      role: 'Supervisor',
      email: 'supervisor@company.com',
      description: 'Entry approval & analytics access',
      icon: BarChart3,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      features: ['Approve Entries', 'View Analytics', 'Quality Control']
    },
    {
      role: 'Team Leader',
      email: 'teamleader@company.com',
      description: 'Production data entry specialist',
      icon: Users,
      color: 'bg-green-100 text-green-800 border-green-200',
      features: ['Create Entries', 'Track Status', 'Production Data']
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] -z-10" />
      
      <div className="min-h-screen flex">
        {/* Left Side - Branding & Info */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white relative overflow-hidden">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full translate-y-24 -translate-x-24" />
          
          <div className="relative z-10 flex flex-col justify-center max-w-lg">
            <div className="flex items-center space-x-3 mb-8">
              <div className="h-12 w-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <Factory className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold">ManufacturingPro</h1>
            </div>
            
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Streamline Your Manufacturing Operations
            </h2>
            
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Advanced production data management with intelligent workflow automation, 
              real-time analytics, and comprehensive quality control systems.
            </p>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="text-blue-100">Real-time production monitoring</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="text-blue-100">Intelligent approval workflows</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="text-blue-100">Advanced analytics & reporting</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-300" />
                <span className="text-blue-100">Enterprise-grade security</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center space-x-3 mb-8">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Factory className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ManufacturingPro</h1>
            </div>

            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
                <CardDescription className="text-gray-600">
                  Sign in to access your manufacturing dashboard
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>

                {/* Demo Credentials */}
                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {demoCredentials.map((cred) => {
                      const IconComponent = cred.icon
                      return (
                        <div key={cred.role} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
                          <div className="flex items-start space-x-3">
                            <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <IconComponent className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="text-sm font-semibold text-gray-900">{cred.role}</h4>
                                <Badge variant="outline" className={cred.color}>
                                  {cred.role}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 mb-2">{cred.description}</p>
                              <div className="flex items-center justify-between">
                                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">
                                  {cred.email}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEmail(cred.email)
                                    setPassword('password123')
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center"
                                >
                                  Use <ArrowRight className="h-3 w-3 ml-1" />
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {cred.features.map((feature) => (
                                  <Badge key={feature} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800 text-center">
                      <strong>Password:</strong> <code className="bg-amber-100 px-1 rounded">password123</code> for all demo accounts
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                © 2024 ManufacturingPro. Enterprise manufacturing management solution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}