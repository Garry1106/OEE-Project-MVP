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

export function calculateHourlyOEE(
  lossTime: number,           // Loss time for this hour in minutes
  lineCapacity: string,       // "120 u/hr" - theoretical capacity per hour
  goodParts: number,          // Good parts produced this hour
  spdParts: number,          // SPD parts produced this hour
  rejects: number,           // Rejected parts this hour
  plannedHourTime: number = 60 // Standard hour = 60 minutes
): OEEData {
  // Parse line capacity (remove "u/hr" suffix)
  const idealRate = parseInt(lineCapacity.replace(' u/hr', '')) || 0
  
  // Calculate total parts produced this hour
  const totalParts = goodParts + spdParts + rejects
  
  // Calculate operating time for this hour
  const operatingTime = plannedHourTime - lossTime
  
  // Calculate OEE components
  // Availability = Operating Time / Planned Time
  const availability = plannedHourTime > 0 ? 
    Math.round((operatingTime / plannedHourTime) * 100) : 0
  
  // Performance = Actual Production / Theoretical Production
  // For hourly data: actual parts vs line capacity
  const performance = idealRate > 0 ? 
    Math.round((totalParts / idealRate) * 100) : 0
  
  // Quality = Good Parts / Total Parts
  const quality = totalParts > 0 ? 
    Math.round((goodParts / totalParts) * 100) : 0
  
  // OEE = Availability × Performance × Quality
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

// Test function with mockup data
// export function testOEECalculation() {
//   // Test Case 1: Good Performance
//   const test1 = calculateHourlyOEE(
//     5,      // 5 minutes loss time
//     "120",  // 120 units/hour capacity
//     100,    // 100 good parts
//     5,      // 5 SPD parts
//     10,     // 10 rejects
//   )
  
//   console.log("Test 1 - Good Performance:", test1)
//   console.log("Category:", getOEECategory(test1.oee))
  
//   // Test Case 2: Poor Performance with High Losses
//   const test2 = calculateHourlyOEE(
//     20,     // 20 minutes loss time  
//     "100",  // 100 units/hour capacity
//     60,     // 60 good parts
//     2,      // 2 SPD parts
//     18,     // 18 rejects
//   )
  
//   console.log("Test 2 - Poor Performance:", test2)
//   console.log("Category:", getOEECategory(test2.oee))
// }