'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Factory, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Calendar,
  Users,
  Target,
  XCircle,
  Info,
  BarChart3,
  Zap
} from 'lucide-react'

interface Parameters {
  [key: string]: string[]
}

interface FormData {
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
  rejectionPhenomena: string
  rejectionCause: string
  rejectionCorrectiveAction: string
  rejectionCount: number
}

interface FormErrors {
  [key: string]: string
}

export default function EntryForm({ onSuccess }: { onSuccess?: () => void }) {
  const [parameters, setParameters] = useState<Parameters>({})
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    line: '',
    shift: '',
    teamLeader: '',
    shiftInCharge: '',
    model: '',
    numOfOperators: 0,
    availableTime: '',
    lineCapacity: '',
    ppcTarget: 0,
    goodParts: 0,
    rejects: 0,
    problemHead: '',
    description: '',
    lossTime: 0,
    responsibility: '',
    rejectionPhenomena: '',
    rejectionCause: '',
    rejectionCorrectiveAction: '',
    rejectionCount: 0
  })

  useEffect(() => {
    fetchParameters()
  }, [])

  const fetchParameters = async () => {
    try {
      const response = await fetch('/api/parameters')
      const data = await response.json()
      setParameters(data)
    } catch (error) {
      console.error('Failed to fetch parameters:', error)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Required field validation
    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.line) newErrors.line = 'Production line is required'
    if (!formData.shift) newErrors.shift = 'Shift is required'
    if (!formData.teamLeader) newErrors.teamLeader = 'Team leader is required'
    if (!formData.shiftInCharge) newErrors.shiftInCharge = 'Shift in-charge is required'
    if (!formData.model) newErrors.model = 'Model is required'
    if (!formData.availableTime) newErrors.availableTime = 'Available time is required'
    if (!formData.lineCapacity) newErrors.lineCapacity = 'Line capacity is required'
    if (!formData.problemHead) newErrors.problemHead = 'Problem head is required'
    if (!formData.description) newErrors.description = 'Description is required'
    if (!formData.responsibility) newErrors.responsibility = 'Responsibility is required'

    // Numeric validation
    if (formData.numOfOperators <= 0) newErrors.numOfOperators = 'Must be greater than 0'
    if (formData.ppcTarget <= 0) newErrors.ppcTarget = 'Must be greater than 0'
    if (formData.goodParts < 0) newErrors.goodParts = 'Cannot be negative'
    if (formData.rejects < 0) newErrors.rejects = 'Cannot be negative'
    if (formData.lossTime < 0) newErrors.lossTime = 'Cannot be negative'

    // Business logic validation
    // Business logic validation
   const totalParts = formData.goodParts + formData.rejects
   if (totalParts === 0) newErrors.goodParts = 'Total production must be greater than 0'
   
   if (formData.rejects > 0) {
     if (!formData.rejectionPhenomena.trim()) newErrors.rejectionPhenomena = 'Required when rejects > 0'
     if (!formData.rejectionCause.trim()) newErrors.rejectionCause = 'Required when rejects > 0'
     if (!formData.rejectionCorrectiveAction.trim()) newErrors.rejectionCorrectiveAction = 'Required when rejects > 0'
     if (formData.rejectionCount <= 0) newErrors.rejectionCount = 'Must be greater than 0 when rejects exist'
     if (formData.rejectionCount > formData.rejects) newErrors.rejectionCount = 'Cannot exceed total rejects'
   }

   // Date validation
   const selectedDate = new Date(formData.date)
   const today = new Date()
   today.setHours(23, 59, 59, 999) // End of today
   if (selectedDate > today) {
     newErrors.date = 'Date cannot be in the future'
   }

   setErrors(newErrors)
   return Object.keys(newErrors).length === 0
 }

 const updateField = (field: keyof FormData, value: string | number) => {
   setFormData(prev => ({ ...prev, [field]: value }))
   // Clear error for this field when user starts typing
   if (errors[field]) {
     setErrors(prev => ({ ...prev, [field]: '' }))
   }
 }

 const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault()
   
   if (!validateForm()) {
     setSubmitStatus('error')
     return
   }

   setLoading(true)
   setSubmitStatus('idle')

   try {
     const response = await fetch('/api/entries', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(formData)
     })

     if (response.ok) {
       setSubmitStatus('success')
       resetForm()
       onSuccess?.()
     } else {
       const errorData = await response.json()
       setSubmitStatus('error')
       if (errorData.error) {
         setErrors({ general: errorData.error })
       }
     }
   } catch (error) {
     setSubmitStatus('error')
     setErrors({ general: 'Network error occurred. Please try again.' })
   } finally {
     setLoading(false)
   }
 }

 const resetForm = () => {
   setFormData({
     date: new Date().toISOString().split('T')[0],
     line: '',
     shift: '',
     teamLeader: '',
     shiftInCharge: '',
     model: '',
     numOfOperators: 0,
     availableTime: '',
     lineCapacity: '',
     ppcTarget: 0,
     goodParts: 0,
     rejects: 0,
     problemHead: '',
     description: '',
     lossTime: 0,
     responsibility: '',
     rejectionPhenomena: '',
     rejectionCause: '',
     rejectionCorrectiveAction: '',
     rejectionCount: 0
   })
   setErrors({})
   setSubmitStatus('idle')
 }

 const getFieldError = (field: string) => errors[field]
 const hasError = (field: string) => !!errors[field]

 // Calculate real-time metrics
 const totalProduction = formData.goodParts + formData.rejects
 const efficiency = totalProduction > 0 ? Math.round((formData.goodParts / totalProduction) * 100) : 0
 const rejectRate = totalProduction > 0 ? Math.round((formData.rejects / totalProduction) * 100) : 0
 const targetAchievement = formData.ppcTarget > 0 ? Math.round((totalProduction / formData.ppcTarget) * 100) : 0

 return (
   <div className="max-w-7xl mx-auto">
     <Card className="shadow-xl border-0 bg-white">
       <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b">
         <div className="flex items-center justify-between">
           <div className="flex items-center space-x-4">
             <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
               <Factory className="h-6 w-6 text-white" />
             </div>
             <div>
               <CardTitle className="text-3xl font-bold text-gray-900">Production Data Entry</CardTitle>
               <CardDescription className="text-lg text-gray-600 mt-1">
                 Complete the form below to submit production data for supervisor approval
               </CardDescription>
             </div>
           </div>
           <Badge variant="outline" className="bg-white/80 text-blue-700 border-blue-200 px-4 py-2">
             <Info className="h-4 w-4 mr-2" />
             All fields required unless noted
           </Badge>
         </div>
       </CardHeader>

       <CardContent className="p-8">
         {/* Status Messages */}
         {submitStatus === 'success' && (
           <Alert className="mb-8 border-green-200 bg-green-50 shadow-sm">
             <CheckCircle className="h-5 w-5 text-green-600" />
             <AlertDescription className="text-green-800 font-medium">
               🎉 Entry submitted successfully! Your production data is now pending supervisor approval.
             </AlertDescription>
           </Alert>
         )}

         {(submitStatus === 'error' && Object.keys(errors).length > 0) && (
           <Alert className="mb-8 border-red-200 bg-red-50 shadow-sm">
             <AlertTriangle className="h-5 w-5 text-red-600" />
             <AlertDescription className="text-red-800 font-medium">
               Please correct the highlighted errors below before submitting.
             </AlertDescription>
           </Alert>
         )}

         {/* Real-time Analytics */}
         {totalProduction > 0 && (
           <Card className="mb-8 bg-gradient-to-r from-gray-50 to-blue-50 border-blue-200">
             <CardHeader className="pb-4">
               <CardTitle className="flex items-center text-lg">
                 <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                 Live Production Metrics
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-white p-4 rounded-lg shadow-sm border">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-sm font-medium text-gray-600">Total Production</span>
                     <Zap className="h-4 w-4 text-blue-500" />
                   </div>
                   <div className="text-2xl font-bold text-blue-600">{totalProduction.toLocaleString()}</div>
                 </div>
                 <div className="bg-white p-4 rounded-lg shadow-sm border">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-sm font-medium text-gray-600">Efficiency</span>
                     <CheckCircle className="h-4 w-4 text-green-500" />
                   </div>
                   <div className="text-2xl font-bold text-green-600">{efficiency}%</div>
                   <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                     <div 
                       className="bg-green-500 h-1 rounded-full transition-all duration-500" 
                       style={{ width: `${efficiency}%` }}
                     />
                   </div>
                 </div>
                 <div className="bg-white p-4 rounded-lg shadow-sm border">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-sm font-medium text-gray-600">Reject Rate</span>
                     <XCircle className="h-4 w-4 text-red-500" />
                   </div>
                   <div className="text-2xl font-bold text-red-600">{rejectRate}%</div>
                   <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                     <div 
                       className="bg-red-500 h-1 rounded-full transition-all duration-500" 
                       style={{ width: `${rejectRate}%` }}
                     />
                   </div>
                 </div>
                 <div className="bg-white p-4 rounded-lg shadow-sm border">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-sm font-medium text-gray-600">Target Achievement</span>
                     <Target className="h-4 w-4 text-purple-500" />
                   </div>
                   <div className="text-2xl font-bold text-purple-600">{targetAchievement}%</div>
                   <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                     <div 
                       className="bg-purple-500 h-1 rounded-full transition-all duration-500" 
                       style={{ width: `${Math.min(targetAchievement, 100)}%` }}
                     />
                   </div>
                 </div>
               </div>
             </CardContent>
           </Card>
         )}

         <form onSubmit={handleSubmit} className="space-y-8">
           {/* Section 1: Basic Information */}
           <div className="space-y-6">
             <div className="flex items-center space-x-3 pb-2 border-b border-gray-200">
               <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                 <Calendar className="h-4 w-4 text-blue-600" />
               </div>
               <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                 <Label htmlFor="date" className="text-sm font-semibold text-gray-700">
                   Production Date *
                 </Label>
                 <Input
                   id="date"
                   type="date"
                   value={formData.date}
                   onChange={(e) => updateField('date', e.target.value)}
                   max={new Date().toISOString().split('T')[0]}
                   className={`h-11 ${hasError('date') ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}`}
                 />
                 {hasError('date') && (
                   <p className="text-sm text-red-600 flex items-center mt-1">
                     <AlertTriangle className="h-3 w-3 mr-1" />
                     {getFieldError('date')}
                   </p>
                 )}
               </div>

               <div className="space-y-2">
                 <Label className="text-sm font-semibold text-gray-700">Production Line *</Label>
                 <Select value={formData.line} onValueChange={(value) => updateField('line', value)}>
                   <SelectTrigger className={`h-11 ${hasError('line') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                     <SelectValue placeholder="Select production line" />
                   </SelectTrigger>
                   <SelectContent>
                     {parameters.LINE?.map((line) => (
                       <SelectItem key={line} value={line}>
                         <div className="flex items-center">
                           <Factory className="h-4 w-4 mr-2 text-blue-500" />
                           {line}
                         </div>
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 {hasError('line') && (
                   <p className="text-sm text-red-600 flex items-center mt-1">
                     <AlertTriangle className="h-3 w-3 mr-1" />
                     {getFieldError('line')}
                   </p>
                 )}
               </div>

               <div className="space-y-2">
                 <Label className="text-sm font-semibold text-gray-700">Shift *</Label>
                 <Select value={formData.shift} onValueChange={(value) => updateField('shift', value)}>
                   <SelectTrigger className={`h-11 ${hasError('shift') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                     <SelectValue placeholder="Select shift" />
                   </SelectTrigger>
                   <SelectContent>
                     {parameters.SHIFT?.map((shift) => (
                       <SelectItem key={shift} value={shift}>{shift}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 {hasError('shift') && (
                   <p className="text-sm text-red-600 flex items-center mt-1">
                     <AlertTriangle className="h-3 w-3 mr-1" />
                     {getFieldError('shift')}
                   </p>
                 )}
               </div>
             </div>
           </div>

           <Separator className="my-8" />

           {/* Section 2: Team & Setup */}
           <div className="space-y-6">
             <div className="flex items-center space-x-3 pb-2 border-b border-gray-200">
               <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                 <Users className="h-4 w-4 text-green-600" />
               </div>
               <h3 className="text-xl font-semibold text-gray-900">Team & Production Setup</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="space-y-2">
                 <Label className="text-sm font-semibold text-gray-700">Team Leader *</Label>
                 <Select value={formData.teamLeader} onValueChange={(value) => updateField('teamLeader', value)}>
                   <SelectTrigger className={`h-11 ${hasError('teamLeader') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                     <SelectValue placeholder="Select team leader" />
                   </SelectTrigger>
                   <SelectContent>
                     {parameters.TEAM_LEADER?.map((leader) => (
                       <SelectItem key={leader} value={leader}>{leader}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 {hasError('teamLeader') && (
                   <p className="text-sm text-red-600">{getFieldError('teamLeader')}</p>
                 )}
               </div>

               <div className="space-y-2">
                 <Label className="text-sm font-semibold text-gray-700">Shift InCharge *</Label>
                 <Select value={formData.shiftInCharge} onValueChange={(value) => updateField('shiftInCharge', value)}>
                   <SelectTrigger className={`h-11 ${hasError('shiftInCharge') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                     <SelectValue placeholder="Select shift incharge" />
                   </SelectTrigger>
                   <SelectContent>
                     {parameters.SHIFT_INCHARGE?.map((incharge) => (
                       <SelectItem key={incharge} value={incharge}>{incharge}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 {hasError('shiftInCharge') && (
                   <p className="text-sm text-red-600">{getFieldError('shiftInCharge')}</p>
                 )}
               </div>

               <div className="space-y-2">
                 <Label className="text-sm font-semibold text-gray-700">Model *</Label>
                 <Select value={formData.model} onValueChange={(value) => updateField('model', value)}>
                   <SelectTrigger className={`h-11 ${hasError('model') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                     <SelectValue placeholder="Select model" />
                   </SelectTrigger>
                   <SelectContent>
                     {parameters.MODEL?.map((model) => (
                       <SelectItem key={model} value={model}>{model}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 {hasError('model') && (
                   <p className="text-sm text-red-600">{getFieldError('model')}</p>
                 )}
               </div>

               <div className="space-y-2">
                 <Label htmlFor="operators" className="text-sm font-semibold text-gray-700">Number of Operators *</Label>
                 <Input
                   id="operators"
                   type="number"
                   min="1"
                   value={formData.numOfOperators || ''}
                   onChange={(e) => updateField('numOfOperators', parseInt(e.target.value) || 0)}
                   className={`h-11 ${hasError('numOfOperators') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                   placeholder="Enter number"
                 />
                 {hasError('numOfOperators') && (
                   <p className="text-sm text-red-600">{getFieldError('numOfOperators')}</p>
                 )}
               </div>
             </div>
           </div>

           <Separator className="my-8" />

           {/* Section 3: Production Metrics */}
           <div className="space-y-6">
             <div className="flex items-center space-x-3 pb-2 border-b border-gray-200">
               <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                 <Target className="h-4 w-4 text-purple-600" />
               </div>
               <h3 className="text-xl font-semibold text-gray-900">Production Metrics</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="space-y-2">
                 <Label className="text-sm font-semibold text-gray-700">Available Time *</Label>
                 <Select value={formData.availableTime} onValueChange={(value) => updateField('availableTime', value)}>
                   <SelectTrigger className={`h-11 ${hasError('availableTime') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                     <SelectValue placeholder="Select time" />
                   </SelectTrigger>
                   <SelectContent>
                     {parameters.AVAILABLE_TIME?.map((time) => (
                       <SelectItem key={time} value={time}>{time} minutes</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 {hasError('availableTime') && (
                   <p className="text-sm text-red-600">{getFieldError('availableTime')}</p>
                 )}
               </div>

               <div className="space-y-2">
                 <Label className="text-sm font-semibold text-gray-700">Line Capacity *</Label>
                 <Select value={formData.lineCapacity} onValueChange={(value) => updateField('lineCapacity', value)}>
                   <SelectTrigger className={`h-11 ${hasError('lineCapacity') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                     <SelectValue placeholder="Select capacity" />
                   </SelectTrigger>
                   <SelectContent>
                     {parameters.LINE_CAPACITY?.map((capacity) => (
                       <SelectItem key={capacity} value={capacity}>{capacity} units/hr</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 {hasError('lineCapacity') && (
                   <p className="text-sm text-red-600">{getFieldError('lineCapacity')}</p>
                 )}
               </div>

               <div className="space-y-2">
                 <Label htmlFor="ppcTarget" className="text-sm font-semibold text-gray-700">PPC Target *</Label>
                 <Input
                   id="ppcTarget"
                   type="number"
                   min="1"
                   value={formData.ppcTarget || ''}
                   onChange={(e) => updateField('ppcTarget', parseInt(e.target.value) || 0)}
                   className={`h-11 ${hasError('ppcTarget') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                   placeholder="Enter target"
                 />
                 {hasError('ppcTarget') && (
                   <p className="text-sm text-red-600">{getFieldError('ppcTarget')}</p>
                 )}
               </div>

               <div className="space-y-2">
                 <Label htmlFor="lossTime" className="text-sm font-semibold text-gray-700">Loss Time (min) *</Label>
                 <Input
                   id="lossTime"
                   type="number"
                   min="0"
                   value={formData.lossTime || ''}
                   onChange={(e) => updateField('lossTime', parseInt(e.target.value) || 0)}
                   className={`h-11 ${hasError('lossTime') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                   placeholder="Enter loss time"
                 />
                 {hasError('lossTime') && (
                   <p className="text-sm text-red-600">{getFieldError('lossTime')}</p>
                 )}
               </div>
             </div>

             {/* Production Results */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="bg-green-50 border-green-200">
                 <CardContent className="p-6">
                   <div className="flex items-center justify-between mb-3">
                     <Label htmlFor="goodParts" className="text-sm font-semibold text-green-800">Good Parts Produced *</Label>
                     <CheckCircle className="h-5 w-5 text-green-600" />
                   </div>
                   <Input
                     id="goodParts"
                     type="number"
                     min="0"
                     value={formData.goodParts || ''}
                     onChange={(e) => updateField('goodParts', parseInt(e.target.value) || 0)}
                     className={`h-12 text-lg font-semibold ${hasError('goodParts') ? 'border-red-500 bg-red-50' : 'border-green-300 bg-white'}`}
                     placeholder="Enter good parts count"
                   />
                   {hasError('goodParts') && (
                     <p className="text-sm text-red-600 mt-1">{getFieldError('goodParts')}</p>
                   )}
                 </CardContent>
               </Card>

               <Card className="bg-red-50 border-red-200">
                 <CardContent className="p-6">
                   <div className="flex items-center justify-between mb-3">
                     <Label htmlFor="rejects" className="text-sm font-semibold text-red-800">Rejected Parts *</Label>
                     <XCircle className="h-5 w-5 text-red-600" />
                   </div>
                   <Input
                     id="rejects"
                     type="number"
                     min="0"
                     value={formData.rejects || ''}
                     onChange={(e) => updateField('rejects', parseInt(e.target.value) || 0)}
                     className={`h-12 text-lg font-semibold ${hasError('rejects') ? 'border-red-500 bg-red-100' : 'border-red-300 bg-white'}`}
                     placeholder="Enter rejects count"
                   />
                   {hasError('rejects') && (
                     <p className="text-sm text-red-600 mt-1">{getFieldError('rejects')}</p>
                   )}
                 </CardContent>
               </Card>
             </div>
           </div>

           <Separator className="my-8" />

           {/* Section 4: Problem Analysis */}
           <div className="space-y-6">
             <div className="flex items-center space-x-3 pb-2 border-b border-gray-200">
               <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                 <AlertTriangle className="h-4 w-4 text-orange-600" />
               </div>
               <h3 className="text-xl font-semibold text-gray-900">Problem Analysis</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                 <Label className="text-sm font-semibold text-gray-700">Problem Head *</Label>
                 <Select value={formData.problemHead} onValueChange={(value) => updateField('problemHead', value)}>
                   <SelectTrigger className={`h-11 ${hasError('problemHead') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                     <SelectValue placeholder="Select problem category" />
                   </SelectTrigger>
                   <SelectContent>
                     {parameters.PROBLEM_HEAD?.map((problem) => (
                       <SelectItem key={problem} value={problem}>{problem}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 {hasError('problemHead') && (
                   <p className="text-sm text-red-600">{getFieldError('problemHead')}</p>
                 )}
               </div>

               <div className="space-y-2">
                 <Label className="text-sm font-semibold text-gray-700">Description *</Label>
                 <Select value={formData.description} onValueChange={(value) => updateField('description', value)}>
                   <SelectTrigger className={`h-11 ${hasError('description') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                     <SelectValue placeholder="Select description" />
                   </SelectTrigger>
                   <SelectContent>
                     {parameters.DESCRIPTION?.map((desc) => (
                       <SelectItem key={desc} value={desc}>{desc}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 {hasError('description') && (
                   <p className="text-sm text-red-600">{getFieldError('description')}</p>
                 )}
               </div>

               <div className="space-y-2">
                 <Label className="text-sm font-semibold text-gray-700">Responsibility *</Label>
                 <Select value={formData.responsibility} onValueChange={(value) => updateField('responsibility', value)}>
                   <SelectTrigger className={`h-11 ${hasError('responsibility') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                     <SelectValue placeholder="Select department" />
                   </SelectTrigger>
                   <SelectContent>
                     {parameters.RESPONSIBILITY?.map((resp) => (
                       <SelectItem key={resp} value={resp}>{resp}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 {hasError('responsibility') && (
                   <p className="text-sm text-red-600">{getFieldError('responsibility')}</p>
                 )}
               </div>
             </div>
           </div>

           <Separator className="my-8" />

           {/* Section 5: Quality Control */}
           <div className="space-y-6">
             <div className="flex items-center justify-between pb-2 border-b border-gray-200">
               <div className="flex items-center space-x-3">
                 <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                   <XCircle className="h-4 w-4 text-red-600" />
                 </div>
                 <h3 className="text-xl font-semibold text-gray-900">Quality Control & Rejection Details</h3>
               </div>
               {formData.rejects > 0 && (
                 <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                   Required - Rejects detected
                 </Badge>
               )}
             </div>

             {formData.rejects === 0 ? (
               <Card className="bg-green-50 border-green-200">
                 <CardContent className="p-6 text-center">
                   <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                   <h4 className="text-lg font-semibold text-green-800 mb-2">Excellent Quality!</h4>
                   <p className="text-green-700">No rejects reported - Quality control section is optional.</p>
                 </CardContent>
               </Card>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <Label htmlFor="rejectionPhenomena" className="text-sm font-semibold text-gray-700">
                     Rejection Phenomena *
                   </Label>
                   <Input
                     id="rejectionPhenomena"
                     value={formData.rejectionPhenomena}
                     onChange={(e) => updateField('rejectionPhenomena', e.target.value)}
                     className={`h-11 ${hasError('rejectionPhenomena') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                     placeholder="Describe rejection phenomena"
                   />
                   {hasError('rejectionPhenomena') && (
                     <p className="text-sm text-red-600">{getFieldError('rejectionPhenomena')}</p>
                   )}
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="rejectionCause" className="text-sm font-semibold text-gray-700">
                     Root Cause *
                   </Label>
                   <Input
                     id="rejectionCause"
                     value={formData.rejectionCause}
                     onChange={(e) => updateField('rejectionCause', e.target.value)}
                     className={`h-11 ${hasError('rejectionCause') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                     placeholder="Enter root cause analysis"
                   />
                   {hasError('rejectionCause') && (
                     <p className="text-sm text-red-600">{getFieldError('rejectionCause')}</p>
                   )}
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="rejectionCorrectiveAction" className="text-sm font-semibold text-gray-700">
                     Corrective Action *
                   </Label>
                   <Input
                     id="rejectionCorrectiveAction"
                     value={formData.rejectionCorrectiveAction}
                     onChange={(e) => updateField('rejectionCorrectiveAction', e.target.value)}
                     className={`h-11 ${hasError('rejectionCorrectiveAction') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                     placeholder="Describe corrective action taken"
                   />
                   {hasError('rejectionCorrectiveAction') && (
                     <p className="text-sm text-red-600">{getFieldError('rejectionCorrectiveAction')}</p>
                   )}
                 </div>

                 <div className="space-y-2">
                   <Label htmlFor="rejectionCount" className="text-sm font-semibold text-gray-700">
                     Rejection Count *
                   </Label>
                   <Input
                     id="rejectionCount"
                     type="number"
                     min="0"
                     max={formData.rejects}
                     value={formData.rejectionCount || ''}
                     onChange={(e) => updateField('rejectionCount', parseInt(e.target.value) || 0)}
                     className={`h-11 ${hasError('rejectionCount') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                     placeholder="Enter rejection count"
                   />
                   <p className="text-xs text-gray-500">Maximum: {formData.rejects}</p>
                   {hasError('rejectionCount') && (
                     <p className="text-sm text-red-600">{getFieldError('rejectionCount')}</p>
                   )}
                 </div>
               </div>
             )}
           </div>

           {/* General Error */}
           {errors.general && (
             <Alert className="border-red-200 bg-red-50">
               <AlertTriangle className="h-4 w-4 text-red-600" />
               <AlertDescription className="text-red-800">{errors.general}</AlertDescription>
             </Alert>
           )}

           {/* Action Buttons */}
           <div className="flex justify-between items-center pt-8 border-t border-gray-200">
             <Button
               type="button"
               variant="outline"
               onClick={resetForm}
               disabled={loading}
               className="px-6 py-3"
             >
               Reset Form
             </Button>

             <Button
               type="submit"
               disabled={loading}
               className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-semibold min-w-[200px]"
             >
               {loading ? (
                 <>
                   <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                   Submitting Entry...
                 </>
               ) : (
                 <>
                   <CheckCircle className="mr-2 h-5 w-5" />
                   Submit for Approval
                 </>
               )}
             </Button>
           </div>
         </form>
       </CardContent>
     </Card>
   </div>
 )
}