'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Entry, FormData, FormErrors, Parameters, ShiftInfo } from '@/types'
import { getCurrentShift, getCurrentHour, SHIFT_SCHEDULES, getNextHour } from '@/lib/shifts'
import {
  Factory,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Plus,
  Minus,
  Save,
  RotateCcw,
  X,
  Clock,
  AlertCircle
} from 'lucide-react'
import { calculateOEE, getOEECategory } from '@/lib/oee'

interface EntryFormProps {
  onSuccess?: () => void
  onClose?: () => void
  editingEntry?: Entry | null
  isEditing?: boolean
  showCloseButton?: boolean
}

export default function EntryForm({ onSuccess, onClose, editingEntry, isEditing = false, showCloseButton = false }: EntryFormProps) {
  const [parameters, setParameters] = useState<Parameters>({})
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [shiftInfo, setShiftInfo] = useState<ShiftInfo | null>(null)

  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    line: '',
    shift: getCurrentShift(),
    hour: '',
    teamLeader: '',
    shiftInCharge: '',
    model: '',
    operatorNames: [''],
    availableTime: '',
    lineCapacity: '',
    ppcTarget: '',
    goodParts: '',
    rejects: '',
    problemHead: '',
    description: '',
    lossTime: '',
    responsibility: '',
    productionType: 'Single',
    defectType: 'Repeat',
    newDefectDescription: '',
    rejectionPhenomena: '',
    rejectionCause: '',
    rejectionCorrectiveAction: '',
    rejectionCount: '',
    // 4M Change tracking
    has4MChange: false,
    manChange: false,
    manReason: '',
    manCC: '',
    manSC: '',
    manGeneral: '',
    machineChange: false,
    machineReason: '',
    machineCC: '',
    machineSC: '',
    machineGeneral: '',
    materialChange: false,
    materialReason: '',
    materialCC: '',
    materialSC: '',
    materialGeneral: '',
    methodChange: false,
    methodReason: '',
    methodCC: '',
    methodSC: '',
    methodGeneral: '',
  })

  useEffect(() => {
    fetchParameters()
    updateShiftInfo()

    // Update shift info every minute
    const interval = setInterval(updateShiftInfo, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isEditing && editingEntry) {
      populateFormForEdit()
    } else {
      // Set current shift and hour for new entries
      updateShiftInfo()
    }
  }, [isEditing, editingEntry])

  const updateShiftInfo = () => {
    const currentShift = getCurrentShift()
    const currentHour = getCurrentHour(currentShift)
    const nextHour = getNextHour(currentShift, currentHour)
    const shiftConfig = SHIFT_SCHEDULES[currentShift]

    const timeRemaining = calculateTimeRemaining(currentHour)

    const info: ShiftInfo = {
      currentShift,
      currentHour,
      nextHour,
      shiftName: shiftConfig.name,
      timeRemaining
    }

    setShiftInfo(info)

    // Auto-set shift and hour for new entries
    if (!isEditing) {
      setFormData(prev => ({
        ...prev,
        shift: currentShift,
        hour: currentHour
      }))
    }
  }

  const calculateTimeRemaining = (hourSlot: string): string => {
    if (!hourSlot) return 'Unknown'

    const now = new Date()
    const [, endTime] = hourSlot.split('-')
    const [endHour, endMin] = endTime.split(':').map(Number)

    const endDate = new Date(now)
    endDate.setHours(endHour, endMin, 0, 0)

    // Handle overnight shift
    if (endHour < now.getHours()) {
      endDate.setDate(endDate.getDate() + 1)
    }

    const diffMs = endDate.getTime() - now.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins <= 0) return 'Time Up'

    const hours = Math.floor(diffMins / 60)
    const minutes = diffMins % 60

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const populateFormForEdit = () => {
    if (editingEntry) {
      setFormData({
        date: editingEntry.date.split('T')[0],
        line: editingEntry.line,
        shift: editingEntry.shift,
        hour: editingEntry.hour,
        teamLeader: editingEntry.teamLeader,
        shiftInCharge: editingEntry.shiftInCharge,
        model: editingEntry.model,
        operatorNames: editingEntry.operatorNames || [''],
        availableTime: editingEntry.availableTime,
        lineCapacity: editingEntry.lineCapacity,
        ppcTarget: editingEntry.ppcTarget?.toString() || '',
        goodParts: editingEntry.goodParts?.toString() || '',
        rejects: editingEntry.rejects?.toString() || '',
        problemHead: editingEntry.problemHead,
        description: editingEntry.description,
        lossTime: editingEntry.lossTime?.toString() || '',
        responsibility: editingEntry.responsibility,
        productionType: editingEntry.productionType || 'Single',
        defectType: editingEntry.defectType || 'Repeat',
        newDefectDescription: editingEntry.newDefectDescription || '',
        rejectionPhenomena: editingEntry.rejectionPhenomena || '',
        rejectionCause: editingEntry.rejectionCause || '',
        rejectionCorrectiveAction: editingEntry.rejectionCorrectiveAction || '',
        rejectionCount: editingEntry.rejectionCount?.toString() || '',

        // 4M Change tracking
        has4MChange: editingEntry.has4MChange || false,
        manChange: editingEntry.manChange || false,
        manReason: editingEntry.manReason || '',
        manCC: editingEntry.manCC || '',
        manSC: editingEntry.manSC || '',
        manGeneral: editingEntry.manGeneral || '',
        machineChange: editingEntry.machineChange || false,
        machineReason: editingEntry.machineReason || '',
        machineCC: editingEntry.machineCC || '',
        machineSC: editingEntry.machineSC || '',
        machineGeneral: editingEntry.machineGeneral || '',
        materialChange: editingEntry.materialChange || false,
        materialReason: editingEntry.materialReason || '',
        materialCC: editingEntry.materialCC || '',
        materialSC: editingEntry.materialSC || '',
        materialGeneral: editingEntry.materialGeneral || '',
        methodChange: editingEntry.methodChange || false,
        methodReason: editingEntry.methodReason || '',
        methodCC: editingEntry.methodCC || '',
        methodSC: editingEntry.methodSC || '',
        methodGeneral: editingEntry.methodGeneral || '',
      })
    }
  }

  const fetchParameters = async () => {
    try {
      const response = await fetch('/api/parameters')
      const data = await response.json()
      setParameters(data)
    } catch (error) {
      console.error('Failed to fetch parameters:', error)
    }
  }

  const addOperator = () => {
    if (formData.operatorNames.length < 8) {
      setFormData(prev => ({
        ...prev,
        operatorNames: [...prev.operatorNames, '']
      }))
    }
  }

  const removeOperator = (index: number) => {
    if (formData.operatorNames.length > 1) {
      setFormData(prev => ({
        ...prev,
        operatorNames: prev.operatorNames.filter((_, i) => i !== index)
      }))
    }
  }

  const updateOperatorName = (index: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      operatorNames: prev.operatorNames.map((op, i) => i === index ? name : op)
    }))
  }

  const parseNumber = (value: string): number => {
    if (value === '') return 0
    const parsed = parseInt(value)
    return isNaN(parsed) ? 0 : parsed
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Required field validation
    if (!formData.date) newErrors.date = 'Required'
    if (!formData.line) newErrors.line = 'Required'
    if (!formData.shift) newErrors.shift = 'Required'
    if (!formData.hour) newErrors.hour = 'Required'
    if (!formData.teamLeader) newErrors.teamLeader = 'Required'
    if (!formData.shiftInCharge) newErrors.shiftInCharge = 'Required'
    if (!formData.model) newErrors.model = 'Required'
    if (!formData.availableTime) newErrors.availableTime = 'Required'
    if (!formData.lineCapacity) newErrors.lineCapacity = 'Required'
    if (!formData.problemHead) newErrors.problemHead = 'Required'
    if (!formData.description) newErrors.description = 'Required'
    if (!formData.responsibility) newErrors.responsibility = 'Required'

    // Operator validation
    const validOperators = formData.operatorNames.filter(name => name.trim() !== '')
    if (validOperators.length === 0) newErrors.operators = 'At least one operator name is required'

    // Numeric validation
    const ppcTarget = parseNumber(formData.ppcTarget)
    const goodParts = parseNumber(formData.goodParts)
    const rejects = parseNumber(formData.rejects)
    const lossTime = parseNumber(formData.lossTime)
    const rejectionCount = parseNumber(formData.rejectionCount)

    if (formData.ppcTarget !== '' && ppcTarget < 0) newErrors.ppcTarget = 'Cannot be negative'
    if (formData.goodParts !== '' && goodParts < 0) newErrors.goodParts = 'Cannot be negative'
    if (formData.rejects !== '' && rejects < 0) newErrors.rejects = 'Cannot be negative'
    if (formData.lossTime !== '' && lossTime < 0) newErrors.lossTime = 'Cannot be negative'

    // Business logic validation
    const totalParts = goodParts + rejects
    if (formData.goodParts !== '' && formData.rejects !== '' && totalParts === 0) {
      newErrors.goodParts = 'Total production must be > 0'
    }

    if (rejects > 0) {
      if (!formData.rejectionPhenomena.trim()) newErrors.rejectionPhenomena = 'Required when rejects > 0'
      if (!formData.rejectionCause.trim()) newErrors.rejectionCause = 'Required when rejects > 0'
      if (!formData.rejectionCorrectiveAction.trim()) newErrors.rejectionCorrectiveAction = 'Required when rejects > 0'
      if (formData.rejectionCount === '' || rejectionCount <= 0) newErrors.rejectionCount = 'Must be > 0 when rejects exist'
      if (rejectionCount > rejects) newErrors.rejectionCount = 'Cannot exceed total rejects'
    }

    // New defect validation
    if (formData.defectType === 'New' && !formData.newDefectDescription.trim()) {
      newErrors.newDefectDescription = 'Required when defect type is New'
    }

    // Date validation
    const selectedDate = new Date(formData.date)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (selectedDate > today) {
      newErrors.date = 'Cannot be in future'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
      const submitData = {
        ...formData,
        operatorNames: formData.operatorNames.filter(name => name.trim() !== ''),
        ppcTarget: parseNumber(formData.ppcTarget),
        goodParts: parseNumber(formData.goodParts),
        rejects: parseNumber(formData.rejects),
        lossTime: parseNumber(formData.lossTime),
        rejectionCount: parseNumber(formData.rejectionCount)
      }

      const url = isEditing ? `/api/entries/${editingEntry?.id}` : '/api/entries'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        setSubmitStatus('success')
        if (!isEditing) resetForm()
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
    const currentShift = getCurrentShift()
    const currentHour = getCurrentHour(currentShift)

    setFormData({
      date: new Date().toISOString().split('T')[0],
      line: '',
      shift: currentShift,
      hour: currentHour,
      teamLeader: '',
      shiftInCharge: '',
      model: '',
      operatorNames: [''],
      availableTime: '',
      lineCapacity: '',
      ppcTarget: '',
      goodParts: '',
      rejects: '',
      problemHead: '',
      description: '',
      lossTime: '',
      responsibility: '',
      productionType: 'Single',
      defectType: 'Repeat',
      newDefectDescription: '',
      rejectionPhenomena: '',
      rejectionCause: '',
      rejectionCorrectiveAction: '',
      rejectionCount: '',
      // 4M Change tracking
      has4MChange: false,
      manChange: false,
      manReason: '',
      manCC: '',
      manSC: '',
      manGeneral: '',
      machineChange: false,
      machineReason: '',
      machineCC: '',
      machineSC: '',
      machineGeneral: '',
      materialChange: false,
      materialReason: '',
      materialCC: '',
      materialSC: '',
      materialGeneral: '',
      methodChange: false,
      methodReason: '',
      methodCC: '',
      methodSC: '',
      methodGeneral: '',
    })
    setErrors({})
    setSubmitStatus('idle')
  }

  const hasError = (field: string) => !!errors[field]

  return (
    <div className="max-w-full mx-auto">
      <Card className="shadow-lg border">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded flex items-center justify-center border">
                <Factory className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  {isEditing ? 'Edit Production Entry' : 'Hourly Production Entry'}
                </CardTitle>
                <CardDescription>
                  {isEditing ? 'Modify hourly production data' : 'Enter hourly production data for supervisor approval'}
                </CardDescription>
              </div>
            </div>

            {/* Shift Information Display */}
            {shiftInfo && (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <Badge variant="outline" className="text-sm">
                      {shiftInfo.shiftName}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Current Hour: <span className="font-medium">{shiftInfo.currentHour}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Time Remaining: <span className="font-medium">{shiftInfo.timeRemaining}</span>
                  </div>
                </div>
              </div>
            )}

            {showCloseButton && onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Current Shift Alert */}
          {shiftInfo && !isEditing && (
            <Alert className="mb-6 border-blue-300 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="font-medium">Active: {shiftInfo.shiftName}</div>
                <div className="text-sm">
                  Creating entry for <strong>{shiftInfo.currentHour}</strong>
                  {shiftInfo.timeRemaining !== 'Time Up' && (
                    <span> • {shiftInfo.timeRemaining} remaining</span>
                  )}
                </div>
                {shiftInfo.timeRemaining === 'Time Up' && (
                  <div className="text-sm text-orange-700 mt-1">
                    Hour has ended. Next hour: {shiftInfo.nextHour}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <Alert className="mb-6 border-green-300">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {isEditing ? 'Entry updated successfully!' : 'Hourly entry submitted successfully! Pending supervisor approval.'}
              </AlertDescription>
            </Alert>
          )}

          {(submitStatus === 'error' && Object.keys(errors).length > 0) && (
            <Alert className="mb-6 border-red-300">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Please correct the errors highlighted in the form below.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Date *</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Line *</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Shift *</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Hour *</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Model *</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Team Leader *</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Shift InCharge *</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => updateField('date', e.target.value)}
                        className={`h-8 text-xs ${hasError('date') ? 'border-red-500' : 'border-gray-300'}`}
                        max={new Date().toISOString().split('T')[0]}
                      />
                      {errors.date && <div className="text-xs text-red-600 mt-1">{errors.date}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <Select value={formData.line} onValueChange={(value) => updateField('line', value)}>
                        <SelectTrigger className={`h-8 text-xs ${hasError('line') ? 'border-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {parameters.LINE?.map((line) => (
                            <SelectItem key={line} value={line}>{line}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.line && <div className="text-xs text-red-600 mt-1">{errors.line}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <Select
                        value={formData.shift}
                        onValueChange={(value) => {
                          updateField('shift', value)
                          // Auto-update hour when shift changes
                          const newCurrentHour = getCurrentHour(value)
                          updateField('hour', newCurrentHour)
                        }}
                        disabled={!isEditing} // Lock for new entries
                      >
                        <SelectTrigger className={`h-8 text-xs ${hasError('shift') ? 'border-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(SHIFT_SCHEDULES).map((shift) => (
                            <SelectItem key={shift} value={shift}>
                              {SHIFT_SCHEDULES[shift].name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.shift && <div className="text-xs text-red-600 mt-1">{errors.shift}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <Select
                        value={formData.hour}
                        onValueChange={(value) => updateField('hour', value)}
                      // disabled={!isEditing && !!shiftInfo} // Lock for new entries to current hour
                      >
                        <SelectTrigger className={`h-8 text-xs ${hasError('hour') ? 'border-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {SHIFT_SCHEDULES[formData.shift]?.hours.map((hour) => (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.hour && <div className="text-xs text-red-600 mt-1">{errors.hour}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <Select value={formData.model} onValueChange={(value) => updateField('model', value)}>
                        <SelectTrigger className={`h-8 text-xs ${hasError('model') ? 'border-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {parameters.MODEL?.map((model) => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.model && <div className="text-xs text-red-600 mt-1">{errors.model}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <Select value={formData.teamLeader} onValueChange={(value) => updateField('teamLeader', value)}>
                        <SelectTrigger className={`h-8 text-xs ${hasError('teamLeader') ? 'border-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {parameters.TEAM_LEADER?.map((leader) => (
                            <SelectItem key={leader} value={leader}>{leader}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.teamLeader && <div className="text-xs text-red-600 mt-1">{errors.teamLeader}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <Select value={formData.shiftInCharge} onValueChange={(value) => updateField('shiftInCharge', value)}>
                        <SelectTrigger className={`h-8 text-xs ${hasError('shiftInCharge') ? 'border-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {parameters.SHIFT_INCHARGE?.map((incharge) => (
                            <SelectItem key={incharge} value={incharge}>{incharge}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.shiftInCharge && <div className="text-xs text-red-600 mt-1">{errors.shiftInCharge}</div>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Production Metrics */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Available Time *</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Line Capacity *</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">PPC Target</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Good Parts</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Rejects</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Loss Time</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Prod. Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">
                      <Select value={formData.availableTime} onValueChange={(value) => updateField('availableTime', value)}>
                        <SelectTrigger className={`h-8 text-xs ${hasError('availableTime') ? 'border-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {parameters.AVAILABLE_TIME?.map((time) => (
                            <SelectItem key={time} value={time}>{time} min</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.availableTime && <div className="text-xs text-red-600 mt-1">{errors.availableTime}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <Select value={formData.lineCapacity} onValueChange={(value) => updateField('lineCapacity', value)}>
                        <SelectTrigger className={`h-8 text-xs ${hasError('lineCapacity') ? 'border-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {parameters.LINE_CAPACITY?.map((capacity) => (
                            <SelectItem key={capacity} value={capacity}>{capacity} u/hr</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.lineCapacity && <div className="text-xs text-red-600 mt-1">{errors.lineCapacity}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData.ppcTarget}
                        onChange={(e) => updateField('ppcTarget', e.target.value)}
                        className={`h-8 text-xs ${hasError('ppcTarget') ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Target"
                      />
                      {errors.ppcTarget && <div className="text-xs text-red-600 mt-1">{errors.ppcTarget}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData.goodParts}
                        onChange={(e) => updateField('goodParts', e.target.value)}
                        className={`h-8 text-xs ${hasError('goodParts') ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Good"
                      />
                      {errors.goodParts && <div className="text-xs text-red-600 mt-1">{errors.goodParts}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData.rejects}
                        onChange={(e) => updateField('rejects', e.target.value)}
                        className={`h-8 text-xs ${hasError('rejects') ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Rejects"
                      />
                      {errors.rejects && <div className="text-xs text-red-600 mt-1">{errors.rejects}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        value={formData.lossTime}
                        onChange={(e) => updateField('lossTime', e.target.value)}
                        className={`h-8 text-xs ${hasError('lossTime') ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="Minutes"
                      />
                      {errors.lossTime && <div className="textxs text-red-600 mt-1">{errors.lossTime}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.productionType === 'Sets'}
                          onCheckedChange={(checked) => updateField('productionType', checked ? 'Sets' : 'Single')}
                        />
                        <span className="text-xs font-medium">{formData.productionType}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Problem Analysis with Defect Type */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Problem Head *</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Description *</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Responsibility *</th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Defect Type</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-3 py-2">
                      <Select value={formData.problemHead} onValueChange={(value) => updateField('problemHead', value)}>
                        <SelectTrigger className={`h-8 text-xs ${hasError('problemHead') ? 'border-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select problem" />
                        </SelectTrigger>
                        <SelectContent>
                          {parameters.PROBLEM_HEAD?.map((problem) => (
                            <SelectItem key={problem} value={problem}>{problem}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.problemHead && <div className="text-xs text-red-600 mt-1">{errors.problemHead}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <Select value={formData.description} onValueChange={(value) => updateField('description', value)}>
                        <SelectTrigger className={`h-8 text-xs ${hasError('description') ? 'border-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select description" />
                        </SelectTrigger>
                        <SelectContent>
                          {parameters.DESCRIPTION?.map((desc) => (
                            <SelectItem key={desc} value={desc}>{desc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.description && <div className="text-xs text-red-600 mt-1">{errors.description}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <Select value={formData.responsibility} onValueChange={(value) => updateField('responsibility', value)}>
                        <SelectTrigger className={`h-8 text-xs ${hasError('responsibility') ? 'border-red-500' : 'border-gray-300'}`}>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {parameters.RESPONSIBILITY?.map((resp) => (
                            <SelectItem key={resp} value={resp}>{resp}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.responsibility && <div className="text-xs text-red-600 mt-1">{errors.responsibility}</div>}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.defectType === 'New'}
                          onCheckedChange={(checked) => updateField('defectType', checked ? 'New' : 'Repeat')}
                        />
                        <Badge variant={formData.defectType === 'New' ? 'destructive' : 'secondary'} className="text-xs">
                          {formData.defectType}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* New Defect Description - Only show if New defect type */}
            {formData.defectType === 'New' && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">New Defect Description *</Label>
                <Input
                  value={formData.newDefectDescription}
                  onChange={(e) => updateField('newDefectDescription', e.target.value)}
                  placeholder="Describe the new defect/problem in detail..."
                  className={`h-8 text-xs ${hasError('newDefectDescription') ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.newDefectDescription && <div className="text-xs text-red-600">{errors.newDefectDescription}</div>}
              </div>
            )}

            {/* Rejection Details - Only show if rejects > 0 */}
            {parseNumber(formData.rejects) > 0 && (
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Rejection Details</Label>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Rejection Phenomena *</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Rejection Cause *</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Corrective Action *</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Rejection Count *</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={formData.rejectionPhenomena}
                            onChange={(e) => updateField('rejectionPhenomena', e.target.value)}
                            placeholder="Describe phenomena"
                            className={`h-8 text-xs ${hasError('rejectionPhenomena') ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors.rejectionPhenomena && <div className="text-xs text-red-600 mt-1">{errors.rejectionPhenomena}</div>}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={formData.rejectionCause}
                            onChange={(e) => updateField('rejectionCause', e.target.value)}
                            placeholder="Root cause"
                            className={`h-8 text-xs ${hasError('rejectionCause') ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors.rejectionCause && <div className="text-xs text-red-600 mt-1">{errors.rejectionCause}</div>}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={formData.rejectionCorrectiveAction}
                            onChange={(e) => updateField('rejectionCorrectiveAction', e.target.value)}
                            placeholder="Corrective action"
                            className={`h-8 text-xs ${hasError('rejectionCorrectiveAction') ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          {errors.rejectionCorrectiveAction && <div className="text-xs text-red-600 mt-1">{errors.rejectionCorrectiveAction}</div>}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            type="number"
                            min="0"
                            max={parseNumber(formData.rejects)}
                            value={formData.rejectionCount}
                            onChange={(e) => updateField('rejectionCount', e.target.value)}
                            placeholder="Count"
                            className={`h-8 text-xs ${hasError('rejectionCount') ? 'border-red-500' : 'border-gray-300'}`}
                          />
                          <div className="text-xs text-gray-500 mt-1">Max: {parseNumber(formData.rejects)}</div>
                          {errors.rejectionCount && <div className="text-xs text-red-600 mt-1">{errors.rejectionCount}</div>}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4M Change Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-start space-x-2">
                <Label className="text-sm font-bold">4M Change Management</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.has4MChange}
                    onCheckedChange={(checked) => {
                      updateField('has4MChange', checked)
                      // Reset all 4M fields when toggled off
                      if (!checked) {
                        updateField('manChange', false)
                        updateField('machineChange', false)
                        updateField('materialChange', false)
                        updateField('methodChange', false)
                        updateField('manReason', '')
                        updateField('manCC', '')
                        updateField('manSC', '')
                        updateField('manGeneral', '')
                        updateField('machineReason', '')
                        updateField('machineCC', '')
                        updateField('machineSC', '')
                        updateField('machineGeneral', '')
                        updateField('materialReason', '')
                        updateField('materialCC', '')
                        updateField('materialSC', '')
                        updateField('materialGeneral', '')
                        updateField('methodReason', '')
                        updateField('methodCC', '')
                        updateField('methodSC', '')
                        updateField('methodGeneral', '')
                      }
                    }}
                  />
                  <Badge variant={formData.has4MChange ? 'default' : 'secondary'} className="text-xs">
                    {formData.has4MChange ? 'Changes Made' : 'No Changes'}
                  </Badge>
                </div>
              </div>

              {formData.has4MChange && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-40">Category</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-semibold w-20">Change</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-1/4">Description/Reason</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-1/4">Critical Characteristics (CC)</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-1/4">Significant Characteristics (SC)</th>
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-1/4">General</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* MAN Row */}
                      <tr className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-3 font-semibold bg-gray-50">
                          MAN
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Switch
                              checked={formData.manChange}
                              onCheckedChange={(checked) => {
                                updateField('manChange', checked)
                                if (!checked) {
                                  updateField('manReason', '')
                                  updateField('manCC', '')
                                  updateField('manSC', '')
                                  updateField('manGeneral', '')
                                }
                              }}
                            />
                          </div>
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <Input
                            value={formData.manReason}
                            onChange={(e) => updateField('manReason', e.target.value)}
                            placeholder={formData.manChange ? "Describe the change" : "No change"}
                            className="h-8 text-xs"
                            disabled={!formData.manChange}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <Input
                            value={formData.manCC}
                            onChange={(e) => updateField('manCC', e.target.value)}
                            placeholder={formData.manChange ? "CC details" : "No change"}
                            className="h-8 text-xs"
                            disabled={!formData.manChange}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <Input
                            value={formData.manSC}
                            onChange={(e) => updateField('manSC', e.target.value)}
                            placeholder={formData.manChange ? "SC details" : "No change"}
                            className="h-8 text-xs"
                            disabled={!formData.manChange}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <Input
                            value={formData.manGeneral}
                            onChange={(e) => updateField('manGeneral', e.target.value)}
                            placeholder={formData.manChange ? "General details" : "No change"}
                            className="h-8 text-xs"
                            disabled={!formData.manChange}
                          />
                        </td>
                      </tr>

                      {/* MACHINE Row */}
                      <tr className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-3 font-semibold bg-gray-50">
                          MACHINE
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Switch
                              checked={formData.machineChange}
                              onCheckedChange={(checked) => {
                                updateField('machineChange', checked)
                                if (!checked) {
                                  updateField('machineReason', '')
                                  updateField('machineCC', '')
                                  updateField('machineSC', '')
                                  updateField('machineGeneral', '')
                                }
                              }}
                            />
                          </div>
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <Input
                            value={formData.machineReason}
                            onChange={(e) => updateField('machineReason', e.target.value)}
                            placeholder={formData.machineChange ? "Describe the change" : "No change"}
                            className="h-8 text-xs"
                            disabled={!formData.machineChange}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <Input
                            value={formData.machineCC}
                            onChange={(e) => updateField('machineCC', e.target.value)}
                            placeholder={formData.machineChange ? "CC details" : "No change"}
                            className="h-8 text-xs"
                            disabled={!formData.machineChange}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <Input
                            value={formData.machineSC}
                            onChange={(e) => updateField('machineSC', e.target.value)}
                            placeholder={formData.machineSC ? "SC details" : "No change"}
                            className="h-8 text-xs"
                            disabled={!formData.machineChange}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <Input
                            value={formData.machineGeneral}
                            onChange={(e) => updateField('machineGeneral', e.target.value)}
                            placeholder={formData.machineChange ? "General details" : "No change"}
                            className="h-8 text-xs"
                            disabled={!formData.machineChange}
                          />
                        </td>
                      </tr>

                      {/* MATERIAL Row */}
                      <tr className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-3 font-semibold bg-gray-50">
                          MATERIAL
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Switch
                              checked={formData.materialChange}
                              onCheckedChange={(checked) => {
                                updateField('materialChange', checked)
                                if (!checked) {
                                  updateField('materialReason', '')
                                  updateField('materialCC', '')
                                  updateField('materialSC', '')
                                  updateField('materialGeneral', '')
                                }
                              }}
                            />
                          </div>
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <Input
                            value={formData.materialReason}
                            onChange={(e) => updateField('materialReason', e.target.value)}
                            placeholder={formData.materialChange ? "Describe the change" : "No change"}
                            className="h-8 text-xs"
                            disabled={!formData.materialChange}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <Input
                            value={formData.materialCC}
                            onChange={(e) => updateField('materialCC', e.target.value)}
                            placeholder={formData.materialChange ? "CC details" : "No change"}
                            className="h-8 text-xs"
                            disabled={!formData.materialChange}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <Input
                            value={formData.materialSC}
                            onChange={(e) => updateField('materialSC', e.target.value)}
                            placeholder={formData.materialChange ? "SC details" : "No change"}
                            className="h-8 text-xs"
                            disabled={!formData.materialChange}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <Input
                            value={formData.materialGeneral}
                            onChange={(e) => updateField('materialGeneral', e.target.value)}
                            placeholder={formData.materialChange ? "General details" : "No change"}
                            className="h-8 text-xs"
                            disabled={!formData.materialChange}
                          />
                        </td>
                      </tr>

                      {/* METHOD/TOOL/FIXTURE/DIE Row */}
                      <tr className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-3 font-semibold bg-gray-50">
                          METHOD/TOOL/FIXTURE/DIE
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Switch
                              checked={formData.methodChange}
                              onCheckedChange={(checked) => {
                                updateField('methodChange', checked)
                                if (!checked) {
                                  updateField('methodReason', '')
                                  updateField('methodCC', '')
                                  updateField('methodSC', '')
                                  updateField('methodGeneral', '')
                                }
                              }}
                            />
                          </div>
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <Input
                            value={formData.methodReason}
                            onChange={(e) => updateField('methodReason', e.target.value)}
                            placeholder={formData.methodChange ? "Describe the change" : "No change"}
                            className="h-8 text-xs"
                            disabled={!formData.methodChange}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <Input
                            value={formData.methodCC}
                            onChange={(e) => updateField('methodCC', e.target.value)}
                            placeholder={formData.methodChange ? "CC details" : "No change"}
                            className="h-8 text-xs"
                            disabled={!formData.methodChange}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <Input
                            value={formData.methodSC}
                            onChange={(e) => updateField('methodSC', e.target.value)}
                            placeholder={formData.methodChange ? "SC details" : "No change"}
                            className="h-8 text-xs"
                            disabled={!formData.methodChange}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <Input
                            value={formData.methodGeneral}
                            onChange={(e) => updateField('methodGeneral', e.target.value)}
                            placeholder={formData.methodChange ? "General details" : "No change"}
                            className="h-8 text-xs"
                            disabled={!formData.methodChange}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>






            {/* Operators Section - Vertical List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Operators *
                  <Badge variant="outline" className="ml-2 text-xs">
                    {formData.operatorNames.filter(name => name.trim()).length}/8
                  </Badge>
                </Label>
                <Button
                  type="button"
                  onClick={addOperator}
                  disabled={formData.operatorNames.length >= 8}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Operator
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-16">#</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Operator Name</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.operatorNames.map((name, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                          {index + 1}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={name}
                            onChange={(e) => updateOperatorName(index, e.target.value)}
                            placeholder={`Operator ${index + 1} name`}
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {formData.operatorNames.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeOperator(index)}
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {errors.operators && (
                      <tr>
                        <td colSpan={3} className="border border-gray-300 px-3 py-2">
                          <span className="text-xs text-red-600">{errors.operators}</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Production Summary */}
            {/* Production Summary with OEE */}
            {(parseNumber(formData.goodParts) > 0 || parseNumber(formData.rejects) > 0) && (
              <div className="mt-6">
                <Label className="text-sm font-semibold mb-2 block">Production Summary & OEE Analysis</Label>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Total Production</th>
                        <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Efficiency %</th>
                        <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Target Achievement %</th>
                        <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Availability %</th>
                        <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Performance %</th>
                        <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Quality %</th>
                        <th className="border border-gray-300 px-4 py-2 text-center font-semibold">OEE %</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <div className="text-lg font-bold">{(parseNumber(formData.goodParts) + parseNumber(formData.rejects)).toLocaleString()}</div>
                          <div className="text-xs text-gray-600">Units</div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <div className="text-lg font-bold">
                            {parseNumber(formData.goodParts) + parseNumber(formData.rejects) > 0
                              ? Math.round((parseNumber(formData.goodParts) / (parseNumber(formData.goodParts) + parseNumber(formData.rejects))) * 100)
                              : 0}%
                          </div>
                          <div className="text-xs text-gray-600">Good / Total</div>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <div className="text-lg font-bold">
                            {parseNumber(formData.ppcTarget) > 0
                              ? Math.round(((parseNumber(formData.goodParts) + parseNumber(formData.rejects)) / parseNumber(formData.ppcTarget)) * 100)
                              : 0}%
                          </div>
                          <div className="text-xs text-gray-600">Actual / Target</div>
                        </td>
                        {(() => {
                          const oeeData = calculateOEE(
                            formData.availableTime || "0",
                            parseNumber(formData.lossTime),
                            formData.lineCapacity || "0",
                            parseNumber(formData.goodParts),
                            parseNumber(formData.rejects)
                          )
                          const category = getOEECategory(oeeData.oee)

                          return (
                            <>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                <div className="text-lg font-bold">{oeeData.availability}%</div>
                                <div className="text-xs text-gray-600">Operating / Planned</div>
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                <div className="text-lg font-bold">{oeeData.performance}%</div>
                                <div className="text-xs text-gray-600">Actual / Ideal Rate</div>
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                <div className="text-lg font-bold">{oeeData.quality}%</div>
                                <div className="text-xs text-gray-600">Good / Total</div>
                              </td>
                              <td className="border border-gray-300 px-4 py-3 text-center">
                                <div className={`text-xl font-bold ${category.color}`}>{oeeData.oee}%</div>
                                <div className="text-xs text-gray-600">{category.category}</div>
                              </td>
                            </>
                          )
                        })()}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* General Error */}
            {errors.general && (
              <Alert className="border-red-300 mt-6">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{errors.general}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={loading}
                className="px-6 py-2 flex items-center"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Form
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="px-8 py-2 font-semibold min-w-[180px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Updating...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? 'Update Entry' : 'Submit for Approval'}
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