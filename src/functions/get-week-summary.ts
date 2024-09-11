import dayjs from 'dayjs'
import { db } from '../db'
import { goalCompletions, goals } from '../db/schema'
import { and, count, eq, gte, lte, sql } from 'drizzle-orm'

export async function getWeekSummary() {
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

  const goalsCompletedInWeekCTE = db.$with('goal_completed_in_week').as(
    db
      .select({
        id: goalCompletions.id,
        title: goals.title,
        completedAt: goalCompletions.createdAt,
        completedAtDate: sql /*sql*/`
          DATE(${goalCompletions.createdAt}),
        `.as('completed_at_date'),
      })
      .from(goalCompletions)
      .innerJoin(goals, eq(goals.id, goalCompletions.goalId))
      .where(
        and(
          gte(goalCompletions.createdAt, firstDayOfWeek),
          lte(goalCompletions.createdAt, lastDayOfWeek)
        )
      )
  )

  const goalsCompletedByWeekDay = db.$with('goals_completed_by_week_day').as(
    db
      .select({
        completedDate: goalsCompletedInWeekCTE.completedAtDate,
        completions: sql`
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', ${goalsCompletedInWeekCTE.id},
              'title', ${goalsCompletedInWeekCTE.title},
              'completedAt', ${goalsCompletedInWeekCTE.completedAt},
            )
          )
        `.as('completions'),
      })
      .from(goalsCompletedInWeekCTE)
      .groupBy(goalsCompletedInWeekCTE.completedAtDate)
  )

  const result = await db
    .with(
      goalsCreatedUpToWeekCTE,
      goalsCompletedInWeekCTE,
      goalsCompletedByWeekDay
    )
    .select({
      completed: sql`
        (SELECT COUNT(*) FROM ${goalsCompletedInWeekCTE}),
      `.mapWith(Number),
      total: sql`
      (SELECT SUM(${goalsCreatedUpToWeekCTE.desiredWeeklyFrequency}) FROM ${goalsCompletedInWeekCTE})
    `.mapWith(Number),
      golsPerDay: sql`
      JSON_OBJECT_AGG(
        ${goalsCompletedByWeekDay.completedDate},
        ${goalsCompletedByWeekDay.completions},
      )
    `,
    })
    .from(goalsCompletedByWeekDay)

  return {
    result,
  }
}
