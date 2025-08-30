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
  productionType?: string // Changed from strict union to string
  defectType?: string     // Changed from strict union to string
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
}

export interface FormData {
  date: string
  line: string
  shift: string
  teamLeader: string
  shiftInCharge: string
  model: string
  operatorNames: string[]
  availableTime: string
  lineCapacity: string
  ppcTarget: string  // Changed from number to string
  goodParts: string  // Changed from number to string
  rejects: string    // Changed from number to string
  problemHead: string
  description: string
  lossTime: string   // Changed from number to string
  responsibility: string
  productionType: string |'Single' | 'Sets'
  defectType:string|'Repeat' | 'New'
  newDefectDescription: string
  rejectionPhenomena: string
  rejectionCause: string
  rejectionCorrectiveAction: string
  rejectionCount: string  // Changed from number to string
}

export interface FormErrors {
  [key: string]: string
}

export interface Parameters {
  [key: string]: string[]
}