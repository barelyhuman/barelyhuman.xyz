import '../global.css'
import BaseLayout from '../layouts/base.jsx'
import data from '../data/links.json'

/**
 * @param {object} options
 * @param {import("fastify").FastifyRequest} options.request
 * @returns
 */
export default function Page({}) {
  return (
    <BaseLayout>
      <script src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js"></script>
      <div class="min-h-[100vh] mx-auto max-w-lg">
        <header class="flex items-center px-2 h-header-height">
          <h1 class="text-zinc-600">~ barelyhuman.xyz</h1>
        </header>
        <div class="flex flex-col p-2">
          <ul>
            {data.map(d => (
              <RenderLink link={d} />
            ))}
          </ul>
        </div>
      </div>
    </BaseLayout>
  )
}

function RenderLink({ link }) {
  return (
    <li class="py-3 my-3 segment-dividers">
      <a href={link.link} class="inline-flex gap-1 items-center hover:text-lime" target="_blank">
        {link.name} <iconify-icon class="text-xs" icon="ph:arrow-up-right" />
      </a>
      <p class="text-zinc-600">{link.description}</p>
    </li>
  )
}
