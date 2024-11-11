import { context, analyzeMetafile } from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import fs from 'node:fs'
import glob from 'tiny-glob'
import chokidar from 'chokidar'
import nodemon from 'nodemon'
import postcss from 'esbuild-postcss'

import {
  DEFAULT_TRANSPILED_IDENTIFIERS,
  readSourceFile,
  isFunctionIsland,
  findIslands,
  injectIslandAST,
  generateClientTemplate,
  getServerTemplatePlaceholder,
  IMPORT_PATH_PLACEHOLDER,
} from '@dumbjs/preland'
import { addImportToAST, codeFromAST } from '@dumbjs/preland/ast'
import { dirname, join } from 'node:path'

const ctxAPI = {
  entryPoints: ['./src/entry.js'],
  splitting: true,
  platform: 'node',
  outdir: 'dist',
  logLevel: 'info',
  metafile: true,
  chunkNames: '[dir]/[name]',
  format: 'esm',
  jsx: 'automatic',
  jsxDev: false,
  jsxImportSource: 'preact',
  bundle: true,
  loader: {
    '.js': 'jsx',
    '.woff2': 'copy',
    '.woff': 'copy',
  },
  plugins: [nodeExternalsPlugin(), islandPlugin()],
}

const pcssFiles = [
  'postcss.config.js',
  'postcss.config.cjs',
  'postcss.config.mjs',
]
async function main() {
  const args = process.argv.slice(2)
  const isDev = args.includes('-w') || args.includes('--watch') || false

  const hasPostCSS = (
    await Promise.all(
      pcssFiles.map(
        async d =>
          await fs.promises
            .access(join(process.cwd(), d))
            .then(_ => true)
            .catch(_ => false)
      )
    )
  ).filter(Boolean)

  if (hasPostCSS) {
    ctxAPI.plugins.push(postcss())
  }

  const ctx = await context(ctxAPI)

  const output = await ctx.rebuild()
  if (isDev) {
    const watcher = chokidar.watch('.', {
      ignoreInitial: true,
      depth: 5,
    })

    watcher.add(
      await glob('./src/**/*.css', { absolute: true, filesOnly: true })
    )

    await ctx.watch()
    nodemon({
      script: 'dist/entry.js',
      ext: 'css, js',
      exec: process.execPath,
    })

    process.on('SIGINT', () => {
      console.log('Closing...')
      ctx
        .dispose()
        .then(_ => {
          process.exit(0)
        })
        .catch(_ => process.exit(1))
    })
  } else {
    await ctx.dispose()
  }

  await fs.promises.writeFile(
    './dist/base.manifest.json',
    JSON.stringify(output.metafile.outputs),
    'utf8'
  )
  process.stdout.write((await analyzeMetafile(output.metafile)) + '\n')
  process.stdout.write('Built!\n')
}

/**
 * @returns {import("esbuild").Plugin}
 */
function islandPlugin() {
  const clientsToGenerate = {}
  return {
    name: 'preact-islands',
    setup(builder) {
      builder.onEnd(async () => {
        const pathToIslands = join('.generated', 'islands')
        Object.keys(clientsToGenerate).forEach(file => {
          const islandKeys = Object.keys(clientsToGenerate[file])
          if (islandKeys.length === 0) return
          islandKeys.forEach(k => {
            const creationPath = join(`.generated/islands/${k}.js`)
            fs.mkdirSync(dirname(creationPath), { recursive: true })
            const template = clientsToGenerate[file][k].template.replace(
              IMPORT_PATH_PLACEHOLDER,
              file
            )
            fs.writeFileSync(creationPath, template, 'utf8')
          })
        })

        const hasIslands = await fs.promises
          .access(pathToIslands)
          .then(_ => true)
          .catch(_ => false)

        if (!hasIslands) return

        const output = await builder.esbuild.build({
          entryPoints: await glob('.generated/islands/**/*.js', {
            filesOnly: true,
          }),
          platform: 'browser',
          bundle: true,
          metafile: true,
          splitting: true,
          format: 'esm',
          jsxImportSource: 'preact',
          jsx: 'automatic',
          loader: {
            '.js': 'jsx',
          },
          outdir: 'dist/islands',
        })
        await fs.promises.writeFile(
          './dist/islands.manifest.json',
          JSON.stringify(output.metafile, null, 2),
          'utf8'
        )
      })
      builder.onLoad({ filter: /(js|ts)x?$/ }, ctx => {
        const loader =
          ctx.path.endsWith('ts') || ctx.path.endsWith('tsx') ? 'tsx' : 'jsx'
        clientsToGenerate[ctx.path] ||= {}
        const code = readSourceFile(ctx.path)
        const islands = findIslands(code, {
          isFunctionIsland: ast =>
            isFunctionIsland(ast, {
              transpiledIdentifiers:
                DEFAULT_TRANSPILED_IDENTIFIERS.concat('_jsxDEV'),
            }),
        })
        if (islands?.length > 0) {
          const addImport = addImportToAST(islands[0].ast)

          islands.forEach(i => {
            injectIslandAST(i.ast, i)

            if (
              clientsToGenerate[ctx.path][i.id] &&
              clientsToGenerate[ctx.path][i.id].generated
            ) {
              return
            }

            clientsToGenerate[ctx.path][i.id] = {
              island: i,
              template: generateClientTemplate(i.id),
            }
          })

          addImport('h', 'preact', { named: true })
          addImport('Fragment', 'preact', { named: true })

          let finalCode = codeFromAST(islands[0].ast)

          islands.forEach(i => {
            finalCode = finalCode.replace(
              getServerTemplatePlaceholder(i.id),
              `/islands/${i.id}.js`
            )
          })

          return {
            contents: finalCode,
            loader: loader,
          }
        }
      })
    },
  }
}

await main()
