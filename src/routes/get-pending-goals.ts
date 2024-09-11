import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { getWeekPeddingGoals } from '../functions/get-week-pedding-goals'

export const getPedingGoalsRoute: FastifyPluginAsyncZod = async app => {
  app.get('/pending-goals', async () => {
    const { penddingGoals } = await getWeekPeddingGoals()
    return { penddingGoals }
  })
}
