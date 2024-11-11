import fastify from 'fastify'
import { basename, dirname, join } from 'node:path'
import glob from 'tiny-glob'
import { routes } from './routes.js'
import fStatic from '@fastify/static'
import { fileURLToPath } from 'node:url'

const environment = process.env.NODE_ENV ?? 'development'

const envToLogger = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
  production: true,
  test: false,
}

const pluginPaths = await glob('./plugins/**/*.{js,ts}', {
  cwd: './src',
})

const plugins = await Promise.all(
  pluginPaths.map(async plugPath => {
    return await import(`./plugins/${basename(plugPath)}`)
  })
)

export const getAppInstance = createAppInstance()

async function run() {
  const instance = getAppInstance()
  await prepare(instance)
  await routes(instance)
  await instance.listen({
    port: Number(process.env.PORT ?? 3000),
    host: process.env.HOST ?? '127.0.0.1',
  })
}

function createAppInstance() {
  let app
  return function getAppInstance() {
    return (
      app ??
      (app = fastify({
        logger: envToLogger[environment] ?? true,
      }))
    )
  }
}

/**
 * @param {import("fastify").FastifyInstance} instance
 */
function prepare(instance) {
  instance.register(fStatic, {
    root: join(dirname(fileURLToPath(import.meta.url)), 'islands'),
    prefix: '/islands/',
  })

  instance.register(fStatic, {
    root: join(dirname(fileURLToPath(import.meta.url))),
    prefix: '/assets/',
    decorateReply: false,
    allowedPath: (path, root, request) => {
      if (['.css', '.woff', '.woff2'].some(d => path.endsWith(d))) {
        return true
      }
      return false
    },
  })

  plugins.forEach(plug => {
    instance.register(plug, {})
  })
}

await run()
