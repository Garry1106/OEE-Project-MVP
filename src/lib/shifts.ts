import { SHIFT_HOURS } from '@/types'

export interface ShiftInfo {
  name: string
  startTime: string
  endTime: string
  breakTime?: string
  hours: string[]
}

export const SHIFTS: Record<string, ShiftInfo> = {
  MORNING: {
    name: 'Morning Shift',
    startTime: '07:00',
    endTime: '15:30',
    breakTime: '11:00-11:30',
    hours: SHIFT_HOURS.MORNING
  },
  AFTERNOON: {
    name: 'Afternoon Shift',
    startTime: '15:30',
    endTime: '23:30',
    hours: SHIFT_HOURS.AFTERNOON
  },
  EVENING: {
    name: 'Evening Shift',
    startTime: '23:30',
    endTime: '07:00',
    hours: SHIFT_HOURS.EVENING
  }
}

export const getCurrentShift = (): string => {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const currentTime = hour * 60 + minute // Convert to minutes

  // Morning: 7:00 - 15:30 (420 - 930)
  if (currentTime >= 420 && currentTime < 930) {
    return 'MORNING'
  }
  // Afternoon: 15:30 - 23:30 (930 - 1410)
  else if (currentTime >= 930 && currentTime < 1410) {
    return 'AFTERNOON'
  }
  // Evening: 23:30 - 07:00 (crosses midnight)
  else {
    return 'EVENING'
  }
}

export const getCurrentHour = (shift: string): string => {
  const now = new Date()
  const hour = now.getHours()
  const shiftHours = SHIFT_HOURS[shift as keyof typeof SHIFT_HOURS]
  
  if (!shiftHours) return ''
  
  // Find the current hour slot based on actual time
  for (const hourSlot of shiftHours) {
    const [startHour] = hourSlot.split('-')[0].split(':').map(Number)
    
    if (shift === 'EVENING') {
      // Handle evening shift that crosses midnight
      if (hour >= 23 || hour < 7) {
        if (hour === 23 && hourSlot.startsWith('23:30')) return hourSlot
        if (hour >= 0 && hour < 7) {
          const slotHour = hourSlot.split('-')[0].split(':')[0]
          if (parseInt(slotHour) === hour) return hourSlot
        }
      }
    } else {
      if (hour === startHour) return hourSlot
    }
  }
  
  return shiftHours[0] // Default to first hour if none matches
}

export const getMissingHourlyEntries = async (
  date: string, 
  shift: string, 
  line: string,
  existingEntries: string[]
): Promise<string[]> => {
  const shiftHours = SHIFT_HOURS[shift as keyof typeof SHIFT_HOURS]
  if (!shiftHours) return []
  
  return shiftHours.filter(hour => !existingEntries.includes(hour))
}

export const isValidHourForShift = (hour: string, shift: string): boolean => {
  const shiftHours = SHIFT_HOURS[shift as keyof typeof SHIFT_HOURS]
  return shiftHours ? shiftHours.includes(hour) : false
}