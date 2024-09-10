import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { db } from '../db'
import { goalCompletions, goals } from '../db/schema'
import { sql, and, lte, count, gte, eq } from 'drizzle-orm'

dayjs.extend(weekOfYear)

export async function getWeekPeddingGoals() {
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  const goalsCreatedUpToWeekCTE = db.$with('goals_created_up_to_week').as(
    db
      .select({
        id: goals.id,
        title: goals.title,
        desiredWeeklyFrequency: goals.desiredWeeklyFrequency,
        createdAt: goals.createdAt,
      })
      .from(goals)
      .where(lte(goals.createdAt, lastDayOfWeek))
  )

  const goalCompletionCountCTE = db.$with('goal_completion_count').as(
    db
      .select({
        goalId: goalCompletions.goalId,
        completionCount: count(goalCompletions.id).as('completionCount'),
      })
      .from(goalCompletions)
      .where(
        and(
          gte(goalCompletions.createdAt, firstDayOfWeek),
          lte(goalCompletions.createdAt, lastDayOfWeek)
        )
      )
      .groupBy(goalCompletions.goalId)
  )

  const penddingGoals = await db
    .with(goalsCreatedUpToWeekCTE, goalCompletionCountCTE)
    .select({
      id: goalsCreatedUpToWeekCTE.id,
      title: goalsCreatedUpToWeekCTE.title,
      desiredWeeklyFrequency: goalsCreatedUpToWeekCTE.desiredWeeklyFrequency,
      completionCount: sql`
        COALESCE(${goalCompletionCountCTE.completionCount}, 0)
      `.mapWith(Number),
    })
    .from(goalsCreatedUpToWeekCTE)
    .leftJoin(
      goalCompletionCountCTE,
      eq(goalCompletionCountCTE.goalId, goalsCreatedUpToWeekCTE.id)
    )

  return {
    penddingGoals,
  }
}
