import renderToString from 'preact-render-to-string'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import fp from 'fastify-plugin'

const __dirname = dirname(fileURLToPath(import.meta.url))

declare module 'fastify' {
  interface FastifyReply {
    page: (path: string) => void
  }
}

async function createGetBaseManifest() {
  const manifestPath = join(__dirname, '../base.manifest.json')
  const hasAccess = await fs.promises
    .access(manifestPath)
    .then(_ => true)
    .catch(err => {
      console.log(err)
      return false
    })
  const manifest = hasAccess
    ? JSON.parse(await fs.promises.readFile(manifestPath, 'utf-8'))
    : {}
  return function () {
    return manifest
  }
}

export default fp((instance, v, done) => {
  let getBaseManifest: Awaited<ReturnType<typeof createGetBaseManifest>>
  instance.decorateReply('renderView', async function (path) {
    const module = await import(`../views/${path}`)
    const manifest = getBaseManifest()
    const fullPath = `src/views/${path}`
    const matchedKey = Object.keys(manifest).find(
      d => manifest[d].entryPoint === fullPath
    )
    let cssBundle
    if (matchedKey) {
      const manifestData = manifest[matchedKey]
      cssBundle = manifestData.cssBundle.replace(/^dist\//, '')
    }
    const html = renderToString(
      module.default({ request: this.request, response: this })
    )
    this.header('content-type', 'text/html')
    const withLayout = `
        ${cssBundle ? `<link rel="stylesheet" href="/assets/${cssBundle}" />` : ''}
        ${html}
    `
    return this.send(withLayout)
  })

  createGetBaseManifest().then(d => {
    getBaseManifest = d
    done()
  })
})
