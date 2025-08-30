interface OEECalculation {
  availability: number
  performance: number
  quality: number
  oee: number
}

export function calculateOEE(
  availableTime: string,    // "480"
  lossTime: number,         // 30
  lineCapacity: string,     // "100"
  goodParts: number,        // 360
  rejects: number,          // 40
  actualTime?: number       // Optional: actual operating time
): OEECalculation {
  // Parse string values
  const plannedTime = parseInt(availableTime) || 0
  const idealRate = parseInt(lineCapacity) || 0
  
  if (plannedTime <= 0 || idealRate <= 0) {
    return { availability: 0, performance: 0, quality: 0, oee: 0 }
  }
  
  // Calculate Availability
  const operatingTime = plannedTime - lossTime
  const availability = (operatingTime / plannedTime) * 100
  
  // Calculate Performance
  const totalProduced = goodParts + rejects
  const idealProduction = (operatingTime / 60) * idealRate // Convert minutes to hours
  const performance = idealProduction > 0 ? (totalProduced / idealProduction) * 100 : 0
  
  // Calculate Quality
  const quality = totalProduced > 0 ? (goodParts / totalProduced) * 100 : 0
  
  // Calculate OEE
  const oee = (availability * performance * quality) / 10000 // Divide by 10000 since all are percentages
  
  return {
    availability: Math.round(availability * 100) / 100,
    performance: Math.round(performance * 100) / 100,
    quality: Math.round(quality * 100) / 100,
    oee: Math.round(oee * 100) / 100
  }
}

export function getOEECategory(oee: number): { category: string; color: string } {
  if (oee >= 85) return { category: 'World Class', color: 'text-green-600' }
  if (oee >= 60) return { category: 'Good', color: 'text-blue-600' }
  return { category: 'Needs Improvement', color: 'text-red-600' }
}