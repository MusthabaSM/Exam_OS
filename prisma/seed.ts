import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding development database...')
  
  // 1. Create a dummy user
  const user = await prisma.user.upsert({
    where: { email: 'demo@examos.dev' },
    update: {},
    create: {
      email: 'demo@examos.dev',
      name: 'Demo User',
    },
  })

  console.log(`Created user: ${user.id}`)

  // 2. Define Exams
  const examsToSeed = [
    {
      name: 'IBPS Clerk',
      organization: 'IBPS',
      description: 'Institute of Banking Personnel Selection Clerk Examination',
      isDevelopment: true,
      subjects: [
        { name: 'English Language', order: 1, topics: ['Reading Comprehension', 'Grammar', 'Vocabulary'] },
        { name: 'Numerical Ability', order: 2, topics: ['Data Interpretation', 'Number Series', 'Simplification'] },
        { name: 'Reasoning Ability', order: 3, topics: ['Puzzles', 'Seating Arrangement', 'Syllogism'] }
      ]
    },
    {
      name: 'SBI Clerk',
      organization: 'SBI',
      description: 'State Bank of India Junior Associates',
      isDevelopment: true,
      subjects: [
        { name: 'General Awareness', order: 1, topics: ['Banking Awareness', 'Current Affairs'] },
        { name: 'Financial Awareness', order: 2, topics: ['RBI Policies', 'Budget'] }
      ]
    },
    {
      name: 'TNPSC Group 4',
      organization: 'TNPSC',
      description: 'Tamil Nadu Public Service Commission Group IV',
      isDevelopment: true,
      subjects: [
        { name: 'General Tamil', order: 1, topics: ['Grammar', 'Literature'] },
        { name: 'General Studies', order: 2, topics: ['History', 'Geography', 'Polity'] },
        { name: 'Aptitude', order: 3, topics: ['Ratio', 'Percentages'] }
      ]
    }
  ]

  // 3. Seed Exams, Subjects, and Topics
  for (const examData of examsToSeed) {
    const exam = await prisma.exam.create({
      data: {
        userId: user.id,
        name: examData.name,
        organization: examData.organization,
        description: examData.description,
        isDevelopment: examData.isDevelopment,
      }
    })
    console.log(`Created exam: ${exam.name}`)

    for (const subjectData of examData.subjects) {
      const subject = await prisma.subject.create({
        data: {
          examId: exam.id,
          name: subjectData.name,
          order: subjectData.order,
        }
      })

      for (let i = 0; i < subjectData.topics.length; i++) {
        await prisma.topic.create({
          data: {
            subjectId: subject.id,
            name: subjectData.topics[i],
            order: i + 1,
            difficulty: 'MEDIUM',
          }
        })
      }
    }
  }

  console.log('Seeding complete! 🚀')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
