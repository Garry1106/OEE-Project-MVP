'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { Entry } from '@/types'
import {
  Calendar,
  Factory,
  Clock,
  Users,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  BarChart3,
  Info,
  Award,
  TrendingUp,
  TrendingDown,
  Loader2,
  Eye,
  Settings,
  Edit
} from 'lucide-react'
import { calculateOEE, getOEECategory } from '@/lib/oee'

interface EntryDetailsProps {
  entry: Entry
  onClose: () => void
  onEdit?: (entry: Entry) => void
  onApprove?: (id: string, status: 'APPROVED' | 'REJECTED', reason?: string) => void
  showActions?: boolean
  userRole?: string
}

export default function EntryDetails({ entry, onClose, onEdit, onApprove, showActions = true, userRole }: EntryDetailsProps) {
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const totalProduction = entry.goodParts + entry.rejects
  const efficiency = totalProduction > 0 ? Math.round((entry.goodParts / totalProduction) * 100) : 0
  const rejectRate = totalProduction > 0 ? Math.round((entry.rejects / totalProduction) * 100) : 0
  const targetAchievement = entry.ppcTarget > 0 ? Math.round((totalProduction / entry.ppcTarget) * 100) : 0

  const handleApprove = () => {
    if (onApprove) {
      onApprove(entry.id, 'APPROVED')
    }
  }

  const handleRejectClick = () => {
    setRejectionDialogOpen(true)
  }

  const handleRejectConfirm = async () => {
    if (onApprove && rejectionReason.trim()) {
      setSubmitting(true)
      await onApprove(entry.id, 'REJECTED', rejectionReason.trim())
      setSubmitting(false)
      setRejectionDialogOpen(false)
      setRejectionReason('')
    }
  }

  const handleRejectCancel = () => {
    setRejectionDialogOpen(false)
    setRejectionReason('')
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(entry)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      PENDING: {
        variant: 'secondary' as const,
        icon: Clock,
        className: 'bg-yellow-500'
      },
      APPROVED: {
        variant: 'default' as const,
        icon: CheckCircle,
        className: 'bg-green-500'
      },
      REJECTED: {
        variant: 'destructive' as const,
        icon: XCircle,
        className: 'bg-red-500'
      }
    }

    const statusConfig = config[status as keyof typeof config]
    const Icon = statusConfig.icon

    return (
      <Badge variant={statusConfig.variant} className={statusConfig.className}>
        <Icon className="w-4 h-4 mr-1" />
        {status}
      </Badge>
    )
  }

  const getPerformanceIndicator = (value: number, type: 'efficiency' | 'rejectRate' | 'targetAchievement') => {
    let color = 'text-gray-600'
    let icon = Info

    if (type === 'efficiency') {
      if (value >= 95) { color = 'text-green-600'; icon = Award }
      else if (value >= 85) { color = 'text-blue-600'; icon = TrendingUp }
      else if (value >= 75) { color = 'text-yellow-600'; icon = AlertTriangle }
      else { color = 'text-red-600'; icon = TrendingDown }
    } else if (type === 'rejectRate') {
      if (value <= 2) { color = 'text-green-600'; icon = Award }
      else if (value <= 5) { color = 'text-blue-600'; icon = CheckCircle }
      else if (value <= 10) { color = 'text-yellow-600'; icon = AlertTriangle }
      else { color = 'text-red-600'; icon = XCircle }
    } else if (type === 'targetAchievement') {
      if (value >= 100) { color = 'text-green-600'; icon = Award }
      else if (value >= 90) { color = 'text-blue-600'; icon = TrendingUp }
      else if (value >= 80) { color = 'text-yellow-600'; icon = AlertTriangle }
      else { color = 'text-red-600'; icon = TrendingDown }
    }

    const Icon = icon
    return { color, Icon }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card className="shadow-lg border">
        <CardHeader className="">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded flex items-center justify-center border">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Production Entry Details</CardTitle>
                <CardDescription className="text-gray-600 mt-1">
                  Entry ID: {entry.id.slice(-8)} • Created: {new Date(entry.createdAt).toLocaleString()}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(entry.status)}
              {onEdit && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>


      {/* Basic Information */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Date</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Line</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Shift</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Hour</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Model</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Team Leader</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Shift InCharge</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Production Type</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-3 font-normal">
                {new Date(entry.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </td>
              <td className="border border-gray-300 px-4 py-3">
                <Badge variant="outline">{entry.line}</Badge>
              </td>
              <td className="border border-gray-300 px-4 py-3">
                <Badge variant="outline">{entry.shift}</Badge>
              </td>
              <td className="border border-gray-300 px-4 py-3"> {/* Add this */}
                <Badge variant="outline" className="font-medium text-blue-700">
                  {entry.hour}
                </Badge>
              </td>
              <td className="border border-gray-300 px-4 py-3">
                <Badge variant="outline">{entry.model}</Badge>
              </td>
              <td className="border border-gray-300 px-4 py-3 font-medium">
                {entry.teamLeader}
              </td>
              <td className="border border-gray-300 px-4 py-3 font-medium">
                {entry.shiftInCharge}
              </td>
              <td className="border border-gray-300 px-4 py-3">
                <Badge variant={entry.productionType === 'Sets' ? 'default' : 'secondary'}>
                  {entry.productionType || 'Single'}
                </Badge>
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
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Available Time</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Line Capacity</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">PPC Target</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Good Parts</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Rejects</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Loss Time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-3">
                <span className="font-medium">{entry.availableTime}</span>
                <span className="text-gray-500 ml-1">min</span>
              </td>
              <td className="border border-gray-300 px-4 py-3">
                <span className="font-medium">{entry.lineCapacity}</span>
                <span className="text-gray-500 ml-1">u/hr</span>
              </td>
              <td className="border border-gray-300 px-4 py-3">
                <span className="text-lg font-semibold">
                  {entry.ppcTarget.toLocaleString()}
                </span>
              </td>
              <td className="border border-gray-300 px-4 py-3">
                <span className="text-lg font-semibold text-green-600">
                  {entry.goodParts.toLocaleString()}
                </span>
              </td>
              <td className="border border-gray-300 px-4 py-3">
                <span className="text-lg font-semibold text-red-600">
                  {entry.rejects.toLocaleString()}
                </span>
              </td>
              <td className="border border-gray-300 px-4 py-3">
                <span className="text-lg font-semibold">
                  {entry.lossTime}
                </span>
                <span className="text-gray-500 ml-1">min</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Problem Analysis */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Problem Head</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Description</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Responsibility</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Defect Type</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-3">
                <Badge variant="outline">{entry.problemHead}</Badge>
              </td>
              <td className="border border-gray-300 px-4 py-3 font-medium">
                {entry.description}
              </td>
              <td className="border border-gray-300 px-4 py-3">
                <Badge variant="outline">{entry.responsibility}</Badge>
              </td>
              <td className="border border-gray-300 px-4 py-3">
                <Badge variant={entry.defectType === 'New' ? 'destructive' : 'secondary'}>
                  {entry.defectType || 'Repeat'} Defect
                </Badge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Operators - Vertical List */}
      {entry.operatorNames && entry.operatorNames.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-bold">
            Operators ({entry.operatorNames.filter(name => name.trim()).length})
          </Label>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold w-16">#</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-bold">Operator Name</th>
                </tr>
              </thead>
              <tbody>
                {entry.operatorNames.filter(name => name.trim()).map((name, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 font-medium">
                      {name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Defect Description */}
      {entry.defectType === 'New' && entry.newDefectDescription && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">New Defect Description</Label>
          <div className="border border-gray-300 p-4 rounded">
            <div className="font-medium">{entry.newDefectDescription}</div>
          </div>
        </div>
      )}

      {/* Rejection Details */}
      {(entry.rejects > 0 || entry.rejectionPhenomena) && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Rejection Details</Label>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold">Rejection Phenomena</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold">Root Cause</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold">Corrective Action</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold">Rejection Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-3 font-medium">
                    {entry.rejectionPhenomena || 'Not specified'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 font-medium">
                    {entry.rejectionCause || 'Not specified'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 font-medium">
                    {entry.rejectionCorrectiveAction || 'Not specified'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <span className="text-lg font-bold text-red-600">
                      {entry.rejectionCount || 0}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4M Change Management */}
      {entry.has4MChange && (
        <div className="space-y-2">
          <Label className="text-sm font-bold">4M Change Management</Label>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold w-40">Category</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-bold w-20">Changed</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold w-1/4">Description/Reason</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold w-1/4">Critical Characteristics (CC)</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold w-1/4">Significant Characteristics (SC)</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-bold w-1/4">General</th>
                </tr>
              </thead>
              <tbody>
                {/* MAN Row */}
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">
                    MAN
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <Badge variant={entry.manChange ? 'default' : 'secondary'} className="text-xs">
                      {entry.manChange ? 'Yes' : 'No'}
                    </Badge>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="min-h-[20px]">
                      {entry.manChange && entry.manReason ? (
                        <span className="font-medium">{entry.manReason}</span>
                      ) : (
                        <span className="text-gray-400 italic">No change</span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="min-h-[20px]">
                      {entry.manChange && entry.manCC ? (
                        <span className="font-medium">{entry.manCC}</span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="min-h-[20px]">
                      {entry.manChange && entry.manSC ? (
                        <span className="font-medium">{entry.manSC}</span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="min-h-[20px]">
                      {entry.manChange && entry.manGeneral ? (
                        <span className="font-medium">{entry.manGeneral}</span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </div>
                  </td>
                </tr>

                {/* MACHINE Row */}
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">
                    MACHINE
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <Badge variant={entry.machineChange ? 'default' : 'secondary'} className="text-xs">
                      {entry.machineChange ? 'Yes' : 'No'}
                    </Badge>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="min-h-[20px]">
                      {entry.machineChange && entry.machineReason ? (
                        <span className="font-medium">{entry.machineReason}</span>
                      ) : (
                        <span className="text-gray-400 italic">No change</span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="min-h-[20px]">
                      {entry.machineChange && entry.machineCC ? (
                        <span className="font-medium">{entry.machineCC}</span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="min-h-[20px]">
                      {entry.machineChange && entry.machineSC ? (
                        <span className="font-medium">{entry.machineSC}</span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="min-h-[20px]">
                      {entry.machineChange && entry.machineGeneral ? (
                        <span className="font-medium">{entry.machineGeneral}</span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </div>
                  </td>
                </tr>

                {/* MATERIAL Row */}
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">
                    MATERIAL
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <Badge variant={entry.materialChange ? 'default' : 'secondary'} className="text-xs">
                      {entry.materialChange ? 'Yes' : 'No'}
                    </Badge>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="min-h-[20px]">
                      {entry.materialChange && entry.materialReason ? (
                        <span className="font-medium">{entry.materialReason}</span>
                      ) : (
                        <span className="text-gray-400 italic">No change</span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="min-h-[20px]">
                      {entry.materialChange && entry.materialCC ? (
                        <span className="font-medium">{entry.materialCC}</span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="min-h-[20px]">
                      {entry.materialChange && entry.materialSC ? (
                        <span className="font-medium">{entry.materialSC}</span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="min-h-[20px]">
                      {entry.materialChange && entry.materialGeneral ? (
                        <span className="font-medium">{entry.materialGeneral}</span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </div>
                  </td>
                </tr>

                {/* METHOD/TOOL/FIXTURE/DIE Row */}
                <tr className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3 font-semibold bg-gray-50">
                    METHOD/TOOL/FIXTURE/DIE
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <Badge variant={entry.methodChange ? 'default' : 'secondary'} className="text-xs">
                      {entry.methodChange ? 'Yes' : 'No'}
                    </Badge>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="min-h-[20px]">
                      {entry.methodChange && entry.methodReason ? (
                        <span className="font-medium">{entry.methodReason}</span>
                      ) : (
                        <span className="text-gray-400 italic">No change</span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="min-h-[20px]">
                      {entry.methodChange && entry.methodCC ? (
                        <span className="font-medium">{entry.methodCC}</span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="min-h-[20px]">
                      {entry.methodChange && entry.methodSC ? (
                        <span className="font-medium">{entry.methodSC}</span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="min-h-[20px]">
                      {entry.methodChange && entry.methodGeneral ? (
                        <span className="font-medium">{entry.methodGeneral}</span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* 4M Summary Badge */}
      {!entry.has4MChange && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">4M Change Management</Label>
          <div className="p-4 border border-gray-300 text-center">
            <Badge variant="secondary" className="text-sm">
              No 4M Changes Recorded
            </Badge>
            <div className="text-xs text-gray-500 mt-2">
              No changes were made to Man, Machine, Material, or Method during this production hour.
            </div>
          </div>
        </div>
      )}






      {/* Status Information */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Status</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Submitted By</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Submission Date</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Reviewed By</th>
              <th className="border border-gray-300 px-4 py-2 text-left font-bold">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-3">
                {getStatusBadge(entry.status)}
              </td>
              <td className="border border-gray-300 px-4 py-3">
                <div>
                  <div className="font-medium">{entry.submittedBy.name}</div>
                  <div className="text-xs text-gray-500">{entry.submittedBy.email}</div>
                </div>
              </td>
              <td className="border border-gray-300 px-4 py-3 font-medium">
                {new Date(entry.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
              <td className="border border-gray-300 px-4 py-3">
                {entry.approvedBy ? (
                  <div>
                    <div className="font-medium">{entry.approvedBy.name}</div>
                    <div className="text-xs text-gray-500">{entry.approvedBy.email}</div>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">Pending</span>
                )}
              </td>
              <td className="border border-gray-300 px-4 py-3 font-medium">
                {new Date(entry.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>


      {/* Rejection Reason */}
      {entry.status === 'REJECTED' && entry.rejectionReason && (
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Supervisor Feedback</Label>
          <div className="border border-red-300 p-4 rounded">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <div>
                <div className="font-medium text-red-800 mb-2">Rejection Reason:</div>
                <div className="text-gray-900 leading-relaxed">{entry.rejectionReason}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Production Summary with OEE */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Production Summary & OEE Analysis</Label>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-6 py-3 text-center font-bold">Total Production</th>
                <th className="border border-gray-300 px-6 py-3 text-center font-bold">Efficiency</th>
                <th className="border border-gray-300 px-6 py-3 text-center font-bold">Target Achievement</th>
                <th className="border border-gray-300 px-6 py-3 text-center font-bold">Availability</th>
                <th className="border border-gray-300 px-6 py-3 text-center font-bold">Performance</th>
                <th className="border border-gray-300 px-6 py-3 text-center font-bold">Quality</th>
                <th className="border border-gray-300 px-6 py-3 text-center font-bold">OEE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-6 py-6 text-center">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{totalProduction.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Units</div>
                </td>
                <td className="border border-gray-300 px-6 py-6 text-center">
                  <div className="text-2xl font-bold mb-1">{efficiency}%</div>
                  <div className="text-xs text-gray-600">Good / Total</div>
                </td>
                <td className="border border-gray-300 px-6 py-6 text-center">
                  <div className="text-2xl font-bold mb-1">{targetAchievement}%</div>
                  <div className="text-xs text-gray-600">Actual / Target</div>
                </td>
                {(() => {
                  const oeeData = calculateOEE(
                    entry.availableTime,
                    entry.lossTime,
                    entry.lineCapacity,
                    entry.goodParts,
                    entry.rejects
                  )
                  const category = getOEECategory(oeeData.oee)

                  return (
                    <>
                      <td className="border border-gray-300 px-6 py-6 text-center">
                        <div className="text-2xl font-bold mb-1">{oeeData.availability}%</div>
                        <div className="text-xs text-gray-600">Operating / Planned</div>
                      </td>
                      <td className="border border-gray-300 px-6 py-6 text-center">
                        <div className="text-2xl font-bold mb-1">{oeeData.performance}%</div>
                        <div className="text-xs text-gray-600">Actual / Ideal</div>
                      </td>
                      <td className="border border-gray-300 px-6 py-6 text-center">
                        <div className="text-2xl font-bold mb-1">{oeeData.quality}%</div>
                        <div className="text-xs text-gray-600">Good / Total</div>
                      </td>
                      <td className="border border-gray-300 px-6 py-6 text-center">
                        <div className={`text-3xl font-bold mb-1 ${category.color}`}>{oeeData.oee}%</div>
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






      {/* Approval Actions */}
      {showActions && entry.status === 'PENDING' && onApprove && userRole === 'SUPERVISOR' && (
        <Card className="shadow-lg border-2 border-gray-300 rounded-none">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center text-xl">
              <User className="mr-3 h-6 w-6" />
              Supervisor Actions
            </CardTitle>
          </CardHeader>
          <CardContent >
            <div className="border border-gray-200 rounded p-2">
              <div className="text-center space-y-4">
                <div className="text-lg font-medium text-gray-900 mb-4">
                  Review this production entry and take appropriate action
                </div>
                <div className="flex justify-center space-x-4">
                  <Button

                    onClick={handleApprove}
                    className="px-8 py-3 text-lg font-semibold min-w-[150px] bg-green-600 hover:bg-green-700"

                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Approve Entry
                  </Button>
                  <Button
                    onClick={handleRejectClick}
                    variant="destructive"
                    className="px-8 py-3 text-lg font-semibold min-w-[150px]"
                  >
                    <XCircle className="mr-2 h-5 w-5" />
                    Reject Entry
                  </Button>
                </div>
                <div className="text-sm text-gray-500 mt-4">
                  Approved entries will be saved to the database. Rejected entries will be sent back to the team leader for revision.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}



      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={handleRejectCancel}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-700">
              <XCircle className="mr-2 h-5 w-5" />
              Reject Entry
            </DialogTitle>
            <DialogDescription>
              Please provide a detailed reason for rejecting this production entry. The team leader will see this feedback and can use it to make corrections.
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
                className="mt-1 min-h-[120px]"
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                Be specific about what needs to be corrected or improved.
              </div>
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