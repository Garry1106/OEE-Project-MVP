export interface User {
  id: string
  name: string
  email: string
  role: 'TEAM_LEADER' | 'SUPERVISOR'
}

export interface Entry {
  id: string
  date: string
  line: string
  shift: string
  hour: string  // NEW FIELD
  teamLeader: string
  shiftInCharge: string
  model: string
  operatorNames: string[]
  availableTime: string
  lineCapacity: string
  ppcTarget: number
  goodParts: number
  rejects: number
  problemHead: string
  description: string
  lossTime: number
  responsibility: string
  productionType?: 'Single' | 'Sets'
  defectType?: 'Repeat' | 'New'
  newDefectDescription?: string
  rejectionPhenomena: string | null
  rejectionCause: string | null
  rejectionCorrectiveAction: string | null
  rejectionCount: number | null
  rejectionReason?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedBy: { name: string; email: string }
  approvedBy?: { name: string; email: string }
  createdAt: string
  updatedAt: string


  // 4M Change tracking
  has4MChange?: boolean
  manChange?: boolean
  manReason?: string
  manCC?: string
  manSC?: string
  manGeneral?: string
  machineChange?: boolean
  machineReason?: string
  machineCC?: string
  machineSC?: string
  machineGeneral?: string
  materialChange?: boolean
  materialReason?: string
  materialCC?: string
  materialSC?: string
  materialGeneral?: string
  methodChange?: boolean
  methodReason?: string
  methodCC?: string
  methodSC?: string
  methodGeneral?: string




}

export interface FormData {
  date: string
  line: string
  shift: string
  hour: string  // NEW FIELD
  teamLeader: string
  shiftInCharge: string
  model: string
  operatorNames: string[]
  availableTime: string
  lineCapacity: string
  ppcTarget: string
  goodParts: string
  rejects: string
  problemHead: string
  description: string
  lossTime: string
  responsibility: string
  productionType: 'Single' | 'Sets'
  defectType: 'Repeat' | 'New'
  newDefectDescription: string
  rejectionPhenomena: string
  rejectionCause: string
  rejectionCorrectiveAction: string
  rejectionCount: string

  // 4M Change tracking
  has4MChange: boolean
  manChange: boolean
  manReason: string
  manCC: string
  manSC: string
  manGeneral: string
  machineChange: boolean
  machineReason: string
  machineCC: string
  machineSC: string
  machineGeneral: string
  materialChange: boolean
  materialReason: string
  materialCC: string
  materialSC: string
  materialGeneral: string
  methodChange: boolean
  methodReason: string
  methodCC: string
  methodSC: string
  methodGeneral: string


}

export interface FormErrors {
  [key: string]: string
}

export interface Parameters {
  [key: string]: string[]
}

export interface ShiftInfo {
  currentShift: string
  currentHour: string
  nextHour: string
  shiftName: string
  timeRemaining: string
}