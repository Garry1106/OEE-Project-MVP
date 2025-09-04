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
import { Entry, FormData, FormErrors, Parameters, ShiftInfo, ShiftData, RejectionDetail } from '@/types'
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
  AlertCircle,
  Trash2
} from 'lucide-react'

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
  const [shiftData, setShiftData] = useState<ShiftData | null>(null)

  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    line: '',
    shift: getCurrentShift(),
    hour: '',
    teamLeader: '',
    shiftInCharge: '',
    model: '',
    operatorNames: [''],
    stationNames: [''], // NEW: Station names
    availableTime: '',
    lineCapacity: '',
    
    // Updated production type
    productionType: 'LH',
    
    // Updated target fields
    ppcTarget: '',
    ppcTargetLH: '',
    ppcTargetRH: '',
    
    // Updated production fields
    goodParts: '',
    goodPartsLH: '',
    goodPartsRH: '',
    
    // SPD fields
    spdParts: '',
    spdPartsLH: '',
    spdPartsRH: '',
    
    // Updated rejection fields
    rejects: '',
    rejectsLH: '',
    rejectsRH: '',
    
    // Loss Time section (formerly Problem Head)
    problemHead: '',
    description: '', // Now text input
    lossTime: '', // Moved to Loss Time section
    responsibility: '',
    defectType: 'Repeat',
    newDefectDescription: '',
    newDefectCorrectiveAction: '', // NEW: Corrective action for new defects
    rejectionDetails: [], // NEW: Multiple rejection details
    
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
    loadShiftData()

    const interval = setInterval(updateShiftInfo, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isEditing && editingEntry) {
      populateFormForEdit()
    } else {
      updateShiftInfo()
    }
  }, [isEditing, editingEntry])

  useEffect(() => {
    if (formData.line && formData.shift && formData.date) {
      loadShiftData()
    }
  }, [formData.line, formData.shift, formData.date])

  // Auto-calculate PPC targets based on production type and line capacity
  useEffect(() => {
    if (formData.lineCapacity && formData.productionType) {
      const capacityStr = formData.lineCapacity.replace(' u/hr', '')
      const capacity = parseNumber(capacityStr)
      
      if (formData.productionType === 'BOTH') {
        const halfCapacity = Math.floor(capacity / 2)
        setFormData(prev => ({
          ...prev,
          ppcTargetLH: halfCapacity.toString(),
          ppcTargetRH: halfCapacity.toString(),
          ppcTarget: capacity.toString()
        }))
      } else if (formData.productionType === 'LH') {
        setFormData(prev => ({
          ...prev,
          ppcTargetLH: capacity.toString(),
          ppcTargetRH: '',
          ppcTarget: capacity.toString()
        }))
      } else if (formData.productionType === 'RH') {
        setFormData(prev => ({
          ...prev,
          ppcTargetLH: '',
          ppcTargetRH: capacity.toString(),
          ppcTarget: capacity.toString()
        }))
      }
    }
  }, [formData.lineCapacity, formData.productionType])

  const loadShiftData = async () => {
    if (isEditing || !formData.date || !formData.shift || !formData.line) return

    try {
      const response = await fetch(`/api/entries/shift-data?date=${formData.date}&shift=${formData.shift}&line=${formData.line}`)
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setShiftData(data)
          setFormData(prev => ({
            ...prev,
            date: data.date,
            line: data.line,
            operatorNames: data.operatorNames,
            stationNames: data.stationNames || data.operatorNames.map(() => '') // Handle existing data
          }))
        } else {
          setShiftData(null)
        }
      }
    } catch (error) {
      console.error('Failed to load shift data:', error)
    }
  }

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
        stationNames: editingEntry.stationNames || [''],
        availableTime: editingEntry.availableTime,
        lineCapacity: editingEntry.lineCapacity,
        
        productionType: editingEntry.productionType || 'LH',
        
        ppcTarget: editingEntry.ppcTarget?.toString() || '',
        ppcTargetLH: editingEntry.ppcTargetLH?.toString() || '',
        ppcTargetRH: editingEntry.ppcTargetRH?.toString() || '',
        
        goodParts: editingEntry.goodParts?.toString() || '',
        goodPartsLH: editingEntry.goodPartsLH?.toString() || '',
        goodPartsRH: editingEntry.goodPartsRH?.toString() || '',
        
        spdParts: editingEntry.spdParts?.toString() || '',
        spdPartsLH: editingEntry.spdPartsLH?.toString() || '',
        spdPartsRH: editingEntry.spdPartsRH?.toString() || '',
        
        rejects: editingEntry.rejects?.toString() || '',
        rejectsLH: editingEntry.rejectsLH?.toString() || '',
        rejectsRH: editingEntry.rejectsRH?.toString() || '',
        
        problemHead: editingEntry.problemHead,
        description: editingEntry.description,
        lossTime: editingEntry.lossTime?.toString() || '',
        responsibility: editingEntry.responsibility,
        defectType: editingEntry.defectType || 'Repeat',
        newDefectDescription: editingEntry.newDefectDescription || '',
        newDefectCorrectiveAction: editingEntry.newDefectCorrectiveAction || '',
        rejectionDetails: editingEntry.rejectionDetails || [],

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

  const parseNumber = (value: string): number => {
    if (value === '') return 0
    const parsed = parseInt(value)
    return isNaN(parsed) ? 0 : parsed
  }

  // Calculate totals based on production type
  const calculateTotals = () => {
    if (formData.productionType === 'BOTH') {
      const goodLH = parseNumber(formData.goodPartsLH)
      const goodRH = parseNumber(formData.goodPartsRH)
      const spdLH = parseNumber(formData.spdPartsLH)
      const spdRH = parseNumber(formData.spdPartsRH)
      const rejectLH = parseNumber(formData.rejectsLH)
      const rejectRH = parseNumber(formData.rejectsRH)

      return {
        totalGood: goodLH + goodRH,
        totalSpd: spdLH + spdRH,
        totalRejects: rejectLH + rejectRH,
        totalProduction: goodLH + goodRH + spdLH + spdRH + rejectLH + rejectRH
      }
    } else {
      const good = parseNumber(formData.goodParts)
      const spd = parseNumber(formData.spdParts)
      const rejects = parseNumber(formData.rejects)

      return {
        totalGood: good,
        totalSpd: spd,
        totalRejects: rejects,
        totalProduction: good + spd + rejects
      }
    }
  }

  // NEW: Rejection detail management functions
  const addRejectionDetail = () => {
    const newRejection: RejectionDetail = {
      id: Date.now().toString(),
      defectName: '',
      rejectionPhenomena: '',
      rejectionCause: '',
      startLossTime: '',
      endLossTime: '',
      correctiveAction: '',
      rejectionCount: 0
    }
    setFormData(prev => ({
      ...prev,
      rejectionDetails: [...prev.rejectionDetails, newRejection]
    }))
  }

  const removeRejectionDetail = (id: string) => {
    setFormData(prev => ({
      ...prev,
      rejectionDetails: prev.rejectionDetails.filter(rejection => rejection.id !== id)
    }))
  }

  const updateRejectionDetail = (id: string, field: keyof RejectionDetail, value: any) => {
    setFormData(prev => ({
      ...prev,
      rejectionDetails: prev.rejectionDetails.map(rejection =>
        rejection.id === id ? { ...rejection, [field]: value } : rejection
      )
    }))
  }

  const renderProductionFields = () => {
    const isBoth = formData.productionType === 'BOTH'
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Available Time *</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Line Capacity *</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Prod. Type</th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                PPC Target {isBoth && '(LH/RH)'}
              </th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                Good Parts {isBoth && '(LH/RH)'}
              </th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                SPD Parts {isBoth && '(LH/RH)'}
              </th>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold">
                Rejects {isBoth && '(LH/RH)'}
              </th>
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
                <Select value={formData.productionType} onValueChange={(value) => updateField('productionType', value as 'LH' | 'RH' | 'BOTH')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LH">LH</SelectItem>
                    <SelectItem value="RH">RH</SelectItem>
                    <SelectItem value="BOTH">LH & RH</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="border border-gray-300 px-3 py-2">
                {isBoth ? (
                  <div className="flex space-x-1">
                    <Input
                      type="number"
                      min="0"
                      value={formData.ppcTargetLH}
                      onChange={(e) => updateField('ppcTargetLH', e.target.value)}
                      className="h-8 text-xs flex-1"
                      placeholder="LH"
                      disabled
                    />
                    <Input
                      type="number"
                      min="0"
                      value={formData.ppcTargetRH}
                      onChange={(e) => updateField('ppcTargetRH', e.target.value)}
                      className="h-8 text-xs flex-1"
                      placeholder="RH"
                      disabled
                    />
                  </div>
                ) : (
                  <Input
                    type="number"
                    min="0"
                    value={formData.ppcTarget}
                    onChange={(e) => updateField('ppcTarget', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Target"
                    disabled
                  />
                )}
              </td>
              <td className="border border-gray-300 px-3 py-2">
                {isBoth ? (
                  <div className="flex space-x-1">
                    <Input
                      type="number"
                      min="0"
                      value={formData.goodPartsLH}
                      onChange={(e) => updateField('goodPartsLH', e.target.value)}
                      className={`h-8 text-xs flex-1 ${hasError('goodParts') ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="LH"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={formData.goodPartsRH}
                      onChange={(e) => updateField('goodPartsRH', e.target.value)}
                      className={`h-8 text-xs flex-1 ${hasError('goodParts') ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="RH"
                    />
                  </div>
                ) : (
                  <Input
                    type="number"
                    min="0"
                    value={formData.goodParts}
                    onChange={(e) => updateField('goodParts', e.target.value)}
                    className={`h-8 text-xs ${hasError('goodParts') ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Good"
                  />
                )}
                {errors.goodParts && <div className="text-xs text-red-600 mt-1">{errors.goodParts}</div>}
              </td>
              <td className="border border-gray-300 px-3 py-2">
                {isBoth ? (
                  <div className="flex space-x-1">
                    <Input
                      type="number"
                      min="0"
                      value={formData.spdPartsLH}
                      onChange={(e) => updateField('spdPartsLH', e.target.value)}
                      className="h-8 text-xs flex-1"
                      placeholder="LH"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={formData.spdPartsRH}
                      onChange={(e) => updateField('spdPartsRH', e.target.value)}
                      className="h-8 text-xs flex-1"
                      placeholder="RH"
                    />
                  </div>
                ) : (
                  <Input
                    type="number"
                    min="0"
                    value={formData.spdParts}
                    onChange={(e) => updateField('spdParts', e.target.value)}
                    className="h-8 text-xs"
                    placeholder="SPD"
                  />
                )}
              </td>
              <td className="border border-gray-300 px-3 py-2">
                {isBoth ? (
                  <div className="flex space-x-1">
                    <Input
                      type="number"
                      min="0"
                      value={formData.rejectsLH}
                      onChange={(e) => updateField('rejectsLH', e.target.value)}
                      className={`h-8 text-xs flex-1 ${hasError('rejects') ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="LH"
                    />
                    <Input
                      type="number"
                      min="0"
                      value={formData.rejectsRH}
                      onChange={(e) => updateField('rejectsRH', e.target.value)}
                      className={`h-8 text-xs flex-1 ${hasError('rejects') ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="RH"
                    />
                  </div>
                ) : (
                  <Input
                    type="number"
                    min="0"
                    value={formData.rejects}
                    onChange={(e) => updateField('rejects', e.target.value)}
                    className={`h-8 text-xs ${hasError('rejects') ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Rejects"
                  />
                )}
                {errors.rejects && <div className="text-xs text-red-600 mt-1">{errors.rejects}</div>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  // Operator and station management
  const addOperator = () => {
    if (formData.operatorNames.length < 8) {
      setFormData(prev => ({
        ...prev,
        operatorNames: [...prev.operatorNames, ''],
        stationNames: [...prev.stationNames, '']
      }))
    }
  }

  const removeOperator = (index: number) => {
    if (formData.operatorNames.length > 1) {
      setFormData(prev => ({
        ...prev,
        operatorNames: prev.operatorNames.filter((_, i) => i !== index),
        stationNames: prev.stationNames.filter((_, i) => i !== index)
      }))
    }
  }

  const updateOperatorName = (index: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      operatorNames: prev.operatorNames.map((op, i) => i === index ? name : op)
    }))
  }

  const updateStationName = (index: number, station: string) => {
    setFormData(prev => ({
      ...prev,
      stationNames: prev.stationNames.map((st, i) => i === index ? station : st)
    }))
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
    if (!formData.description.trim()) newErrors.description = 'Required'
    if (!formData.responsibility) newErrors.responsibility = 'Required'

    // Operator validation
    const validOperators = formData.operatorNames.filter(name => name.trim() !== '')
    if (validOperators.length === 0) newErrors.operators = 'At least one operator name is required'

    // Production type specific validation
    const totals = calculateTotals()
    
    if (totals.totalProduction === 0) {
      newErrors.production = 'Total production must be > 0'
    }

    // Numeric validation
    const lossTime = parseNumber(formData.lossTime)
    if (formData.lossTime !== '' && lossTime < 0) newErrors.lossTime = 'Cannot be negative'

    // Rejection details validation
    if (totals.totalRejects > 0 && formData.rejectionDetails.length === 0) {
      newErrors.rejectionDetails = 'At least one rejection detail required when rejects > 0'
    }

    // Validate individual rejection details
    formData.rejectionDetails.forEach((rejection, index) => {
      if (!rejection.defectName.trim()) newErrors[`rejection_${index}_defectName`] = 'Defect name required'
      if (!rejection.rejectionPhenomena.trim()) newErrors[`rejection_${index}_phenomena`] = 'Phenomena required'
      if (!rejection.rejectionCause.trim()) newErrors[`rejection_${index}_cause`] = 'Cause required'
      if (!rejection.startLossTime.trim()) newErrors[`rejection_${index}_startTime`] = 'Start time required'
      if (!rejection.endLossTime.trim()) newErrors[`rejection_${index}_endTime`] = 'End time required'
      if (!rejection.correctiveAction.trim()) newErrors[`rejection_${index}_action`] = 'Action required'
      if (rejection.rejectionCount <= 0) newErrors[`rejection_${index}_count`] = 'Count must be > 0'
    })

    // New defect validation
    if (formData.defectType === 'New') {
      if (!formData.newDefectDescription.trim()) {
        newErrors.newDefectDescription = 'Required when defect type is New'
      }
      if (!formData.newDefectCorrectiveAction.trim()) {
        newErrors.newDefectCorrectiveAction = 'Corrective action required for new defects'
      }
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
      const totals = calculateTotals()
      
      const submitData = {
        ...formData,
        operatorNames: formData.operatorNames.filter(name => name.trim() !== ''),
        stationNames: formData.stationNames.filter(name => name.trim() !== ''),
        
        // Handle production type specific data
        ...(formData.productionType === 'BOTH' ? {
          ppcTargetLH: parseNumber(formData.ppcTargetLH),
          ppcTargetRH: parseNumber(formData.ppcTargetRH),
          ppcTarget: parseNumber(formData.ppcTargetLH) + parseNumber(formData.ppcTargetRH),
          goodPartsLH: parseNumber(formData.goodPartsLH),
          goodPartsRH: parseNumber(formData.goodPartsRH),
          goodParts: totals.totalGood,
          spdPartsLH: parseNumber(formData.spdPartsLH),
          spdPartsRH: parseNumber(formData.spdPartsRH),
          spdParts: totals.totalSpd,
          rejectsLH: parseNumber(formData.rejectsLH),
          rejectsRH: parseNumber(formData.rejectsRH),
          rejects: totals.totalRejects,
        } : {
          ppcTarget: parseNumber(formData.ppcTarget),
          goodParts: parseNumber(formData.goodParts),
          spdParts: parseNumber(formData.spdParts),
          rejects: parseNumber(formData.rejects),
          // Clear LH/RH specific fields for single production
          ppcTargetLH: null,
          ppcTargetRH: null,
          goodPartsLH: null,
          goodPartsRH: null,
          spdPartsLH: null,
          spdPartsRH: null,
          rejectsLH: null,
          rejectsRH: null,
        }),
        
        lossTime: parseNumber(formData.lossTime),
        rejectionDetails: formData.rejectionDetails.map(rejection => ({
          ...rejection,
          rejectionCount: Number(rejection.rejectionCount)
        }))
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
        if (!isEditing) {
          resetForm()
        }
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
      date: shiftData?.date || new Date().toISOString().split('T')[0],
      line: shiftData?.line || '',
      shift: currentShift,
      hour: currentHour,
      teamLeader: '',
      shiftInCharge: '',
      model: '',
      operatorNames: shiftData?.operatorNames || [''],
      stationNames: shiftData?.stationNames || [''],
      availableTime: '',
      lineCapacity: '',
      productionType: 'LH',
      ppcTarget: '',
      ppcTargetLH: '',
      ppcTargetRH: '',
      goodParts: '',
      goodPartsLH: '',
      goodPartsRH: '',
      spdParts: '',
      spdPartsLH: '',
      spdPartsRH: '',
      rejects: '',
      rejectsLH: '',
      rejectsRH: '',
      problemHead: '',
      description: '',
      lossTime: '',
      responsibility: '',
      defectType: 'Repeat',
      newDefectDescription: '',
      newDefectCorrectiveAction: '',
      rejectionDetails: [],
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
          {/* Shift Data Alert - Show when shift data is loaded */}
          {shiftData && !isEditing && (
            <Alert className="mb-6 border-green-300 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="font-medium">Shift data loaded</div>
                <div className="text-sm">
                  Date: <strong>{shiftData.date}</strong> | Line: <strong>{shiftData.line}</strong> | 
                  Operators: <strong>{shiftData.operatorNames.join(', ')}</strong>
                </div>
              </AlertDescription>
            </Alert>
          )}

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
            {/* Basic Information - Date/Line/Operators locked after first entry */}
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
                        disabled={!!shiftData && !isEditing}
                      />
                      {errors.date && <div className="text-xs text-red-600 mt-1">{errors.date}</div>}
                      {!!shiftData && !isEditing && (
                        <div className="text-xs text-gray-500 mt-1">Locked for shift</div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <Select 
                        value={formData.line} 
                        onValueChange={(value) => updateField('line', value)}
                        disabled={!!shiftData && !isEditing}
                      >
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
                      {!!shiftData && !isEditing && (
                        <div className="text-xs text-gray-500 mt-1">Locked for shift</div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      <Select
                        value={formData.shift}
                        onValueChange={(value) => {
                          updateField('shift', value)
                          const newCurrentHour = getCurrentHour(value)
                          updateField('hour', newCurrentHour)
                        }}
                        disabled={!isEditing}
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
            {renderProductionFields()}

            {/* Loss Time Section (formerly Problem Head) */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Loss Time</Label>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Problem Head *</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Description *</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Loss Time (min)</th>
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Responsibility *</th>
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
                        <Input
                          value={formData.description}
                          onChange={(e) => updateField('description', e.target.value)}
                          placeholder="Describe the problem in detail..."
                          className={`h-8 text-xs ${hasError('description') ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        {errors.description && <div className="text-xs text-red-600 mt-1">{errors.description}</div>}
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
                        {errors.lossTime && <div className="text-xs text-red-600 mt-1">{errors.lossTime}</div>}
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
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Defect Type Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Label className="text-sm font-semibold">Defect Type</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.defectType === 'New'}
                    onCheckedChange={(checked) => updateField('defectType', checked ? 'New' : 'Repeat')}
                  />
                  <Badge variant={formData.defectType === 'New' ? 'destructive' : 'secondary'} className="text-xs">
                    {formData.defectType}
                  </Badge>
                </div>
              </div>

              {/* New Defect Description - Only show if New defect type */}
              {formData.defectType === 'New' && (
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Corrective Action for New Defect *</Label>
                    <Input
                      value={formData.newDefectCorrectiveAction}
                      onChange={(e) => updateField('newDefectCorrectiveAction', e.target.value)}
                      placeholder="Corrective action taken for new defect..."
                      className={`h-8 text-xs ${hasError('newDefectCorrectiveAction') ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.newDefectCorrectiveAction && <div className="text-xs text-red-600">{errors.newDefectCorrectiveAction}</div>}
                  </div>
                </div>
              )}
            </div>

            {/* Rejection Details - Only show if total rejects > 0 */}
            {(() => {
              const totals = calculateTotals()
              if (totals.totalRejects > 0) {
                // Ensure at least one rejection detail exists when there are rejects
                if (formData.rejectionDetails.length === 0) {
                  const defaultRejection: RejectionDetail = {
                    id: Date.now().toString(),
                    defectName: '',
                    rejectionPhenomena: '',
                    rejectionCause: '',
                    startLossTime: '',
                    endLossTime: '',
                    correctiveAction: '',
                    rejectionCount: 0
                  }
                  setFormData(prev => ({
                    ...prev,
                    rejectionDetails: [defaultRejection]
                  }))
                }

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Rejection Details</Label>
                      <Button
                        type="button"
                        onClick={addRejectionDetail}
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Rejection
                      </Button>
                    </div>

                    {formData.rejectionDetails.map((rejection, index) => (
                      <div key={rejection.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-sm">Rejection #{index + 1}</h4>
                          {formData.rejectionDetails.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeRejectionDetail(rejection.id)}
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead>
                              <tr>
                                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Defect Name *</th>
                                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Phenomena *</th>
                                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Cause *</th>
                                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Start Loss Time *</th>
                                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Corrective Action *</th>
                                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">End Loss Time *</th>
                                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Count *</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-gray-300 px-3 py-2">
                                  <Input
                                    value={rejection.defectName}
                                    onChange={(e) => updateRejectionDetail(rejection.id, 'defectName', e.target.value)}
                                    placeholder="Defect name"
                                    className={`h-8 text-xs ${hasError(`rejection_${index}_defectName`) ? 'border-red-500' : 'border-gray-300'}`}
                                  />
                                  {errors[`rejection_${index}_defectName`] && <div className="text-xs text-red-600 mt-1">{errors[`rejection_${index}_defectName`]}</div>}
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  <Input
                                    value={rejection.rejectionPhenomena}
                                    onChange={(e) => updateRejectionDetail(rejection.id, 'rejectionPhenomena', e.target.value)}
                                    placeholder="Describe phenomena"
                                    className={`h-8 text-xs ${hasError(`rejection_${index}_phenomena`) ? 'border-red-500' : 'border-gray-300'}`}
                                  />
                                  {errors[`rejection_${index}_phenomena`] && <div className="text-xs text-red-600 mt-1">{errors[`rejection_${index}_phenomena`]}</div>}
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  <Input
                                    value={rejection.rejectionCause}
                                    onChange={(e) => updateRejectionDetail(rejection.id, 'rejectionCause', e.target.value)}
                                    placeholder="Root cause"
                                    className={`h-8 text-xs ${hasError(`rejection_${index}_cause`) ? 'border-red-500' : 'border-gray-300'}`}
                                  />
                                  {errors[`rejection_${index}_cause`] && <div className="text-xs text-red-600 mt-1">{errors[`rejection_${index}_cause`]}</div>}
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  <Input
                                    type="time"
                                    value={rejection.startLossTime}
                                    onChange={(e) => updateRejectionDetail(rejection.id, 'startLossTime', e.target.value)}
                                    className={`h-8 text-xs ${hasError(`rejection_${index}_startTime`) ? 'border-red-500' : 'border-gray-300'}`}
                                  />
                                  {errors[`rejection_${index}_startTime`] && <div className="text-xs text-red-600 mt-1">{errors[`rejection_${index}_startTime`]}</div>}
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  <Input
                                    value={rejection.correctiveAction}
                                    onChange={(e) => updateRejectionDetail(rejection.id, 'correctiveAction', e.target.value)}
                                    placeholder="Corrective action"
                                    className={`h-8 text-xs ${hasError(`rejection_${index}_action`) ? 'border-red-500' : 'border-gray-300'}`}
                                  />
                                  {errors[`rejection_${index}_action`] && <div className="text-xs text-red-600 mt-1">{errors[`rejection_${index}_action`]}</div>}
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  <Input
                                    type="time"
                                    value={rejection.endLossTime}
                                    onChange={(e) => updateRejectionDetail(rejection.id, 'endLossTime', e.target.value)}
                                    className={`h-8 text-xs ${hasError(`rejection_${index}_endTime`) ? 'border-red-500' : 'border-gray-300'}`}
                                  />
                                  {errors[`rejection_${index}_endTime`] && <div className="text-xs text-red-600 mt-1">{errors[`rejection_${index}_endTime`]}</div>}
                                </td>
                                
                                <td className="border border-gray-300 px-3 py-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={totals.totalRejects}
                                    value={rejection.rejectionCount}
                                    onChange={(e) => updateRejectionDetail(rejection.id, 'rejectionCount', parseInt(e.target.value) || 0)}
                                    placeholder="Count"
                                    className={`h-8 text-xs ${hasError(`rejection_${index}_count`) ? 'border-red-500' : 'border-gray-300'}`}
                                  />
                                  <div className="text-xs text-gray-500 mt-1">Max: {totals.totalRejects}</div>
                                  {errors[`rejection_${index}_count`] && <div className="text-xs text-red-600 mt-1">{errors[`rejection_${index}_count`]}</div>}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}

                    {errors.rejectionDetails && (
                      <Alert className="border-red-300">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">{errors.rejectionDetails}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )
              }
              return null
            })()}

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
                            placeholder={formData.machineChange ? "SC details" : "No change"}
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

            {/* Operators Section with Station Names - Locked after first entry */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Operators & Stations *
                  <Badge variant="outline" className="ml-2 text-xs">
                    {formData.operatorNames.filter(name => name.trim()).length}/8
                  </Badge>
                  {!!shiftData && !isEditing && (
                    <Badge variant="secondary" className="ml-2 text-xs">Locked for shift</Badge>
                  )}
                </Label>
                <Button
                  type="button"
                  onClick={addOperator}
                  disabled={formData.operatorNames.length >= 8 || (!!shiftData && !isEditing)}
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
                      <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Station Name</th>
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
                            disabled={!!shiftData && !isEditing}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <Input
                            value={formData.stationNames[index] || ''}
                            onChange={(e) => updateStationName(index, e.target.value)}
                            placeholder={`Station ${index + 1} name`}
                            className="h-8 text-xs"
                            disabled={!!shiftData && !isEditing}
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          {formData.operatorNames.length > 1 && (!shiftData || isEditing) && (
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
                        <td colSpan={4} className="border border-gray-300 px-3 py-2">
                          <span className="text-xs text-red-600">{errors.operators}</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Production Summary with updated calculations */}
            {(() => {
              const totals = calculateTotals()
              if (totals.totalProduction > 0) {
                return (
                  <div className="mt-6">
                    <Label className="text-sm font-semibold mb-2 block">Production Summary & Performance Analysis</Label>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Total Good</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Total SPD</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Total Rejects</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Total Production</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Efficiency %</th>
                            <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Target Achievement %</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-4 py-3 text-center">
                              <div className="text-lg font-bold text-green-600">{totals.totalGood.toLocaleString()}</div>
                              {formData.productionType === 'BOTH' && (
                                <div className="text-xs text-gray-600">
                                  LH: {parseNumber(formData.goodPartsLH)} | RH: {parseNumber(formData.goodPartsRH)}
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center">
                              <div className="text-lg font-bold text-blue-600">{totals.totalSpd.toLocaleString()}</div>
                              {formData.productionType === 'BOTH' && (
                                <div className="text-xs text-gray-600">
                                  LH: {parseNumber(formData.spdPartsLH)} | RH: {parseNumber(formData.spdPartsRH)}
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center">
                              <div className="text-lg font-bold text-red-600">{totals.totalRejects.toLocaleString()}</div>
                              {formData.productionType === 'BOTH' && (
                                <div className="text-xs text-gray-600">
                                  LH: {parseNumber(formData.rejectsLH)} | RH: {parseNumber(formData.rejectsRH)}
                                </div>
                              )}
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center">
                              <div className="text-xl font-bold">{totals.totalProduction.toLocaleString()}</div>
                              <div className="text-xs text-gray-600">Units</div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center">
                              <div className="text-lg font-bold">
                                {Math.round(((totals.totalGood + totals.totalSpd) / totals.totalProduction) * 100)}%
                              </div>
                              <div className="text-xs text-gray-600">Good + SPD / Total</div>
                            </td>
                            <td className="border border-gray-300 px-4 py-3 text-center">
                              <div className="text-lg font-bold">
                                {parseNumber(formData.ppcTarget) > 0
                                  ? Math.round((totals.totalProduction / parseNumber(formData.ppcTarget)) * 100)
                                  : 0}%
                              </div>
                              <div className="text-xs text-gray-600">Actual / Target</div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Production Type Summary */}
                    {formData.productionType === 'BOTH' && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded border">
                          <h4 className="font-semibold text-blue-800 mb-2">LH Production</h4>
                          <div className="text-sm space-y-1">
                            <div>Good: <span className="font-medium">{parseNumber(formData.goodPartsLH)}</span></div>
                            <div>SPD: <span className="font-medium">{parseNumber(formData.spdPartsLH)}</span></div>
                            <div>Rejects: <span className="font-medium">{parseNumber(formData.rejectsLH)}</span></div>
                            <div className="border-t pt-1">Total: <span className="font-bold">{parseNumber(formData.goodPartsLH) + parseNumber(formData.spdPartsLH) + parseNumber(formData.rejectsLH)}</span></div>
                          </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded border">
                          <h4 className="font-semibold text-green-800 mb-2">RH Production</h4>
                          <div className="text-sm space-y-1">
                            <div>Good: <span className="font-medium">{parseNumber(formData.goodPartsRH)}</span></div>
                            <div>SPD: <span className="font-medium">{parseNumber(formData.spdPartsRH)}</span></div>
                            <div>Rejects: <span className="font-medium">{parseNumber(formData.rejectsRH)}</span></div>
                            <div className="border-t pt-1">Total: <span className="font-bold">{parseNumber(formData.goodPartsRH) + parseNumber(formData.spdPartsRH) + parseNumber(formData.rejectsRH)}</span></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
              return null
            })()}

            {/* General Error */}
            {errors.general && (
              <Alert className="border-red-300 mt-6">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{errors.general}</AlertDescription>
              </Alert>
            )}

            {errors.production && (
              <Alert className="border-red-300 mt-6">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{errors.production}</AlertDescription>
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