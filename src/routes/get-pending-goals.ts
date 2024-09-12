import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { getWeekPendingGoals } from '../functions/get-week-pedding-goals'

export const getPedingGoalsRoute: FastifyPluginAsyncZod = async app => {
  app.get('/pending-goals', async () => {
    const { pendingGoals } = await getWeekPendingGoals()
    return { pendingGoals }
  })
}
