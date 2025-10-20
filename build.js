import fs from 'node:fs/promises'
import path from 'node:path'
import dotenv from 'dotenv'
import { createClient } from '@sanity/client'

dotenv.config()

const projectId = process.env.SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || 'production'
const apiVersion = process.env.SANITY_API_VERSION || '2025-10-19'
const token = process.env.SANITY_READ_TOKEN || undefined

if (!projectId) {
  console.error('Missing SANITY_PROJECT_ID in .env')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion, useCdn: false, token })

async function fetchContent() {
  // siteSettings: singleton document
  const settingsQuery = `*[_type == "siteSettings"][0]{
    title,
    description,
    bio,
    contactWork,
    contactClasses
  }`

  // projects: list of recent projects
  const projectsQuery = `*[_type == "project"]|order(year desc, _updatedAt desc){
    title,
    client,
    role,
    year,
    notes,
    url
  }`

  const [settings, projects] = await Promise.all([
    client.fetch(settingsQuery),
    client.fetch(projectsQuery)
  ])

  return { settings, projects }
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderHtml({ settings, projects }) {
  const title = settings?.title || 'Clinton Van Arnam — Graphic Designer & Educator'
  const description = settings?.description || 'Graphic designer and educator based in Brooklyn, NY.'
  const bio = settings?.bio || ''
  const contactWork = settings?.contactWork || ''
  const contactClasses = settings?.contactClasses || ''

  const projectItems = (projects || []).map(p => {
    const year = p.year ? `${p.year} — ` : ''
    const title = p.title || ''
    const client = p.client ? ` — ${p.client}` : ''
    const role = p.role ? ` — ${p.role}` : ''
    const notes = p.notes ? ` — ${p.notes}` : ''
    
    // If URL exists, make the entire line a clickable link
    if (p.url) {
      const linkText = year + title + client + role + notes
      return `<li><a href="${escapeHtml(p.url)}">${escapeHtml(linkText)}</a></li>`
    }
    
    return `<li>${escapeHtml(year + title + client + role + notes)}</li>`
  }).join('\n                ')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <style>
    html, body { font-family: Courier, "Courier New", monospace; font-size: 12px; }
    *, *::before, *::after { font-size: 12px; font-weight: normal; }
    body { margin: 20px; max-width: 500px; }
  </style>
</head>
<body>
  <main>
    <section aria-labelledby="about">
      <h2 id="about">About</h2>
      ${bio ? `<p>${escapeHtml(bio)}</p>` : ''}
    </section>

    <section aria-labelledby="contact">
      <h2 id="contact">Contact</h2>
      ${contactWork ? `<p>Email (work): <a href="mailto:${escapeHtml(contactWork)}">${escapeHtml(contactWork)}</a></p>` : '<p>Email (work):</p>'}
      ${contactClasses ? `<p>Email (classes): <a href="mailto:${escapeHtml(contactClasses)}">${escapeHtml(contactClasses)}</a></p>` : '<p>Email (classes):</p>'}
    </section>

    <section aria-labelledby="projects">
      <h2 id="projects">Recent Projects</h2>
      <ul>
        ${projectItems}
      </ul>
    </section>
  </main>
</body>
</html>`
}

async function main() {
  const { settings, projects } = await fetchContent()
  const html = renderHtml({ settings, projects })
  const outPath = path.join(process.cwd(), 'index.html')
  await fs.writeFile(outPath, html)
  console.log(`Wrote ${outPath}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
