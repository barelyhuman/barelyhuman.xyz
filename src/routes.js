/**
 * @param {import("fastify").FastifyInstance} router
 */
export async function routes(router) {
  router.get('/:id', (req, res) => {
    res.renderView('index.js')
  })
}
