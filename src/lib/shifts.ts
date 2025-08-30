export interface ShiftConfig {
  name: string
  hours: string[]
  startTime: string
  endTime: string
}

export const SHIFT_SCHEDULES: Record<string, ShiftConfig> = {
  MORNING: {
    name: 'Morning Shift',
    startTime: '07:00',
    endTime: '15:30',
    hours: [
      "07:00-08:00", "08:00-09:00", "09:00-10:00", "10:00-11:00",
      "11:30-12:30", "12:30-13:30", "13:30-14:30", "14:30-15:30"
    ]
  },
  AFTERNOON: {
    name: 'Afternoon Shift', 
    startTime: '15:30',
    endTime: '23:30',
    hours: [
      "15:30-16:30", "16:30-17:30", "17:30-18:30", "18:30-19:30",
      "19:30-20:30", "20:30-21:30", "21:30-22:30", "22:30-23:30"
    ]
  },
  EVENING: {
    name: 'Evening Shift',
    startTime: '23:30', 
    endTime: '07:00',
    hours: [
      "23:30-00:30", "00:30-01:30", "01:30-02:30", "02:30-03:30",
      "03:30-04:30", "04:30-05:30", "05:30-06:30", "06:30-07:00"
    ]
  }
}

export const getCurrentShift = (): string => {
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const currentTime = hour * 60 + minute

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
  const minute = now.getMinutes()
  const currentTime = hour * 60 + minute

  const shiftConfig = SHIFT_SCHEDULES[shift]
  if (!shiftConfig) return ''

  // Find current hour slot
  for (const hourSlot of shiftConfig.hours) {
    const [startHour, startMin] = hourSlot.split('-')[0].split(':').map(Number)
    const [endHour, endMin] = hourSlot.split('-')[1].split(':').map(Number)
    
    let startTime = startHour * 60 + startMin
    let endTime = endHour * 60 + endMin
    
    // Handle overnight shifts
    if (shift === 'EVENING') {
      if (startTime >= 1410) startTime = startTime // Same day
      else startTime = startTime + 1440 // Next day
      
      if (endTime <= 420) endTime = endTime + 1440 // Next day
      
      let adjustedCurrentTime = currentTime
      if (currentTime >= 1410) adjustedCurrentTime = currentTime // Same day  
      else adjustedCurrentTime = currentTime + 1440 // Next day
      
      if (adjustedCurrentTime >= startTime && adjustedCurrentTime < endTime) {
        return hourSlot
      }
    } else {
      if (currentTime >= startTime && currentTime < endTime) {
        return hourSlot  
      }
    }
  }
  
  return shiftConfig.hours[0] // Default to first hour
}

export const getNextHour = (shift: string, currentHour: string): string => {
  const shiftConfig = SHIFT_SCHEDULES[shift]
  if (!shiftConfig) return ''
  
  const currentIndex = shiftConfig.hours.indexOf(currentHour)
  if (currentIndex === -1 || currentIndex === shiftConfig.hours.length - 1) {
    return shiftConfig.hours[0] // Loop back to first hour
  }
  
  return shiftConfig.hours[currentIndex + 1]
}