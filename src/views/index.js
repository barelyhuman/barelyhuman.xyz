import '../global.css'
import BaseLayout from '../layouts/base.jsx'
import data from '../data/links.json'

export default function IndexView() {
  return (
    <BaseLayout>
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
  const description = constructDescription(link)
  return (
    <li class="py-3 my-3 segment-dividers">
      <a
        href={link.link}
        class="inline-flex gap-1 items-center hover:text-lime"
        target="_blank"
        rel="noopener noreferrer"
      >
        {link.name} <span class="text-xs iconify ph--arrow-up-right" />
      </a>
      <p class="text-zinc-600">{description}</p>
    </li>
  )
}

function constructDescription(linkSet) {
  let resultString = linkSet.description
  if (!linkSet?.replacements) {
    return resultString
  }
  Object.keys(linkSet.replacements).forEach(k => {
    const replacement = linkSet.replacements[k]
    if (replacement.type === 'link') {
      const before = resultString.slice(0, replacement.at.start)
      const after = resultString.slice(replacement.at.end)
      const label = resultString.slice(replacement.at.start, replacement.at.end)
      resultString = [
        before,
        <a
          target="_blank"
          rel="noopener noreferrer"
          class="underline text-zinc-500 hover:text-lime underline-offset-4"
          href={replacement.value}
        >
          {label}
        </a>,
        after,
      ]
    }
  })
  return resultString
}
