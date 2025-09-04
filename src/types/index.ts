export interface User {
  id: string
  name: string
  email: string
  role: 'TEAM_LEADER' | 'SUPERVISOR'
}

export interface RejectionDetail {
  id: string
  defectName: string
  rejectionPhenomena: string
  rejectionCause: string
  startLossTime: string
  endLossTime: string
  correctiveAction: string
  rejectionCount: number
}

export interface Entry {
  id: string
  date: string
  line: string
  shift: string
  hour: string
  teamLeader: string
  shiftInCharge: string
  model: string
  operatorNames: string[]
  stationNames: string[] // NEW: Station names
  availableTime: string
  lineCapacity: string
  problemHead: string
  description: string // Now text input
  lossTime: number
  responsibility: string
  defectType?: 'Repeat' | 'New'
  newDefectDescription?: string
  newDefectCorrectiveAction?: string // NEW: Corrective action for new defects
  rejectionDetails: RejectionDetail[] // NEW: Multiple rejection details
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedBy: { name: string; email: string }
  approvedBy?: { name: string; email: string }
  createdAt: string
  updatedAt: string

  productionType?: 'LH' | 'RH' | 'BOTH'
  
  // Updated target fields
  ppcTarget?: number
  ppcTargetLH?: number
  ppcTargetRH?: number
  
  // Updated production fields
  goodParts?: number
  goodPartsLH?: number
  goodPartsRH?: number
  
  // SPD fields
  spdParts?: number
  spdPartsLH?: number
  spdPartsRH?: number
  
  // Updated rejection fields
  rejects?: number
  rejectsLH?: number
  rejectsRH?: number

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
  hour: string
  teamLeader: string
  shiftInCharge: string
  model: string
  operatorNames: string[]
  stationNames: string[] // NEW: Station names
  availableTime: string
  lineCapacity: string
  problemHead: string
  description: string // Now text input
  lossTime: string
  responsibility: string
  defectType: 'Repeat' | 'New'
  newDefectDescription: string
  newDefectCorrectiveAction: string // NEW: Corrective action for new defects
  rejectionDetails: RejectionDetail[] // NEW: Multiple rejection details

  productionType: 'LH' | 'RH' | 'BOTH'
  
  // Updated target fields
  ppcTarget: string
  ppcTargetLH: string
  ppcTargetRH: string
  
  // Updated production fields
  goodParts: string
  goodPartsLH: string
  goodPartsRH: string
  
  // SPD fields
  spdParts: string
  spdPartsLH: string
  spdPartsRH: string
  
  // Updated rejection fields
  rejects: string
  rejectsLH: string
  rejectsRH: string

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

export interface ShiftData {
  date: string
  line: string
  operatorNames: string[]
  stationNames: string[] // NEW: Station names
}