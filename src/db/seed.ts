import dayjs from 'dayjs'
import { cleint, db } from '.'
import { goalCompletions, goals } from './schema'

async function seed() {
  await db.delete(goalCompletions)
  await db.delete(goals)

  const result = await db
    .insert(goals)
    .values([
      {
        title: 'Acordar cedo',
        desiredWeeklyFrequency: 5,
      },
      {
        title: 'Me exercitar',
        desiredWeeklyFrequency: 3,
      },
      {
        title: 'Meditar',
        desiredWeeklyFrequency: 2,
      },
    ])
    .returning()

  const startOfWeek = dayjs().startOf('week')

  await db.insert(goalCompletions).values([
    { id: result[0].id, createdAt: startOfWeek.toDate() },
    { id: result[1].id, createdAt: startOfWeek.add(1, 'day').toDate() },
  ])
}

seed().finally(() => {
  cleint.end()
})
