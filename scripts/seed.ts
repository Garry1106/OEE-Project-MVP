import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.entry.deleteMany({})
  await prisma.parameter.deleteMany({})
  await prisma.user.deleteMany({})

  // Seed Parameters
  const parameterData = [
    {
      type: 'LINE',
      values: ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5']
    },
    {
      type: 'SHIFT',
      values: ['Morning', 'Evening', 'Night']
    },
    {
      type: 'MODEL',
      values: ['Model A', 'Model B', 'Model C', 'Model D']
    },
    {
      type: 'TEAM_LEADER',
      values: ['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Lisa Brown']
    },
    {
      type: 'SHIFT_INCHARGE',
      values: ['David Lee', 'Emma Davis', 'Chris Taylor', 'Anna White']
    },
    {
      type: 'AVAILABLE_TIME',
      values: ['480', '450', '420', '390']
    },
    {
      type: 'LINE_CAPACITY',
      values: ['100', '120', '150', '200']
    },
    {
      type: 'PROBLEM_HEAD',
      values: ['Quality Issue', 'Machine Breakdown', 'Material Shortage', 'Operator Absent']
    },
    {
      type: 'DESCRIPTION',
      values: ['Defective parts', 'Equipment failure', 'Supply delay', 'Staff shortage']
    },
    {
      type: 'RESPONSIBILITY',
      values: ['Production', 'Maintenance', 'Quality', 'Supply Chain']
    }
  ]

  console.log('📊 Seeding parameters...')
  for (const param of parameterData) {
    await prisma.parameter.create({
      data: {
        type: param.type as any,
        values: param.values
      }
    })
  }

  // Seed Users
  console.log('👥 Seeding users...')
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const teamLeader = await prisma.user.create({
    data: {
      name: 'Team Leader',
      email: 'teamleader@company.com',
      passwordHash: hashedPassword,
      role: 'TEAM_LEADER'
    }
  })

  const supervisor = await prisma.user.create({
    data: {
      name: 'Supervisor',
      email: 'supervisor@company.com',
      passwordHash: hashedPassword,
      role: 'SUPERVISOR'
    }
  })

  // Seed Sample Entries
  console.log('📝 Seeding sample entries...')
  const sampleEntries = [
    {
      date: new Date('2024-12-01'),
      line: 'Line 1',
      shift: 'Morning',
      teamLeader: 'John Smith',
      shiftInCharge: 'David Lee',
      model: 'Model A',
      numOfOperators: 5,
      availableTime: '480',
      lineCapacity: '100',
      ppcTarget: 500,
      goodParts: 480,
      rejects: 20,
      problemHead: 'Quality Issue',
      description: 'Defective parts',
      lossTime: 30,
      responsibility: 'Production',
      rejectionPhenomena: 'Surface defect',
      rejectionCause: 'Tool wear',
      rejectionCorrectiveAction: 'Tool replacement',
      rejectionCount: 20,
      status: 'APPROVED' as const,
      submittedById: teamLeader.id,
      approvedById: supervisor.id
    },
    {
      date: new Date('2024-12-02'),
      line: 'Line 2',
      shift: 'Evening',
      teamLeader: 'Sarah Johnson',
      shiftInCharge: 'Emma Davis',
      model: 'Model B',
      numOfOperators: 4,
      availableTime: '450',
      lineCapacity: '120',
      ppcTarget: 540,
      goodParts: 520,
      rejects: 15,
      problemHead: 'Machine Breakdown',
      description: 'Equipment failure',
      lossTime: 45,
      responsibility: 'Maintenance',
      rejectionPhenomena: 'Dimension error',
      rejectionCause: 'Calibration issue',
      rejectionCorrectiveAction: 'Machine recalibration',
      rejectionCount: 15,
      status: 'PENDING' as const,
      submittedById: teamLeader.id
    }
  ]

  for (const entryData of sampleEntries) {
    await prisma.entry.create({
      data: entryData
    })
  }

  const admin = await prisma.user.create({
  data: {
    name: 'System Administrator',
    email: 'admin@company.com',
    passwordHash: hashedPassword,
    role: 'ADMIN'
  }
})


  console.log('✅ Database seeded successfully!')
  console.log('')
  console.log('🔐 Login credentials:')
  console.log('Team Leader: teamleader@company.com / password123')
  console.log('Supervisor: supervisor@company.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })