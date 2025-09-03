// interface OEECalculation {
//   availability: number
//   performance: number
//   quality: number
//   oee: number
// }

// export function calculateOEE(
//   availableTime: string,    // "480"
//   lossTime: number,         // 30
//   lineCapacity: string,     // "100"
//   goodParts: number,        // 360
//   rejects: number,          // 40
//   actualTime?: number       // Optional: actual operating time
// ): OEECalculation {
//   // Parse string values
//   const plannedTime = parseInt(availableTime) || 0
//   const idealRate = parseInt(lineCapacity) || 0
  
//   if (plannedTime <= 0 || idealRate <= 0) {
//     return { availability: 0, performance: 0, quality: 0, oee: 0 }
//   }
  
//   // Calculate Availability
//   const operatingTime = plannedTime - lossTime
//   const availability = (operatingTime / plannedTime) * 100
  
//   // Calculate Performance
//   const totalProduced = goodParts + rejects
//   const idealProduction = (operatingTime / 60) * idealRate // Convert minutes to hours
//   const performance = idealProduction > 0 ? (totalProduced / idealProduction) * 100 : 0
  
//   // Calculate Quality
//   const quality = totalProduced > 0 ? (goodParts / totalProduced) * 100 : 0
  
//   // Calculate OEE
//   const oee = (availability * performance * quality) / 10000 // Divide by 10000 since all are percentages
  
//   return {
//     availability: Math.round(availability * 100) / 100,
//     performance: Math.round(performance * 100) / 100,
//     quality: Math.round(quality * 100) / 100,
//     oee: Math.round(oee * 100) / 100
//   }
// }

// export function getOEECategory(oee: number): { category: string; color: string } {
//   if (oee >= 85) return { category: 'World Class', color: 'text-green-600' }
//   if (oee >= 60) return { category: 'Good', color: 'text-blue-600' }
//   return { category: 'Needs Improvement', color: 'text-red-600' }
// }



export interface OEEData {
  availability: number
  performance: number
  quality: number
  oee: number
}

export interface OEECategory {
  category: string
  color: string
}

export function calculateOEE(
  availableTime: string,
  lossTime: number,
  lineCapacity: string,
  goodParts: number,
  totalParts: number
): OEEData {
  // Parse available time (remove "min" suffix)
  const plannedTime = parseInt(availableTime.replace(' min', '')) || 60
  const operatingTime = plannedTime - lossTime
  
  // Parse line capacity (remove "u/hr" suffix)
  const idealRate = parseInt(lineCapacity.replace(' u/hr', '')) || 0
  const idealProduction = Math.round((idealRate * plannedTime) / 60)
  
  // Calculate OEE components
  const availability = plannedTime > 0 ? Math.round((operatingTime / plannedTime) * 100) : 0
  const performance = idealProduction > 0 ? Math.round((totalParts / idealProduction) * 100) : 0
  const quality = totalParts > 0 ? Math.round((goodParts / totalParts) * 100) : 0
  
  const oee = Math.round((availability * performance * quality) / 10000)
  
  return {
    availability: Math.max(0, Math.min(100, availability)),
    performance: Math.max(0, Math.min(100, performance)),
    quality: Math.max(0, Math.min(100, quality)),
    oee: Math.max(0, Math.min(100, oee))
  }
}

export function getOEECategory(oee: number): OEECategory {
  if (oee >= 85) return { category: 'World Class', color: 'text-green-600' }
  if (oee >= 65) return { category: 'Acceptable', color: 'text-blue-600' }
  if (oee >= 40) return { category: 'Poor', color: 'text-yellow-600' }
  return { category: 'Unacceptable', color: 'text-red-600' }
}