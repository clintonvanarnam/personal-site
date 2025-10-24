import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Sanity configuration
const PROJECT_ID = 'sgwgpnzc'
const DATASET = 'production'
const API_VERSION = '2025-10-19'

async function fetchContent() {
  const query = encodeURIComponent(`{
    "settings": *[_type == "siteSettings"][0]{
      title,
      description,
      bio,
      contactWork,
      contactClasses,
      socialUrl,
      linkedinUrl
    },
    "projects": *[_type == "project"]|order(date desc, year desc, _updatedAt desc){
      title,
      role,
      date,
      year,
      notes,
      url,
      collaborators
    }
  }`)
  
  const url = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${query}`
  
  const response = await fetch(url)
  const data = await response.json()
  return data.result
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Convert Sanity block content to HTML
function blockContentToHtml(blocks) {
  if (!blocks || !Array.isArray(blocks)) return ''
  
  return blocks.map(block => {
    if (block._type === 'block') {
      const children = block.children || []
      const markDefs = block.markDefs || []
      
      const text = children.map(child => {
        let content = escapeHtml(child.text || '')
        
        if (child.marks && child.marks.length > 0) {
          const marks = [...child.marks].reverse()
          
          marks.forEach(mark => {
            if (mark === 'strong') {
              content = `<strong>${content}</strong>`
            } else if (mark === 'em') {
              content = `<em>${content}</em>`
            } else if (mark === 'code') {
              content = `<code>${content}</code>`
            } else {
              const markDef = markDefs.find(def => def._key === mark)
              if (markDef && markDef._type === 'link') {
                const href = escapeHtml(markDef.href || '')
                content = `<a href="${href}" target="_blank" rel="noopener noreferrer">${content}</a>`
              }
            }
          })
        }
        return content
      }).join('')
      
      const style = block.style || 'normal'
      if (style === 'h1') return `<h1>${text}</h1>`
      if (style === 'h2') return `<h2>${text}</h2>`
      if (style === 'h3') return `<h3>${text}</h3>`
      if (style === 'h4') return `<h4>${text}</h4>`
      return `<p>${text}</p>`
    }
    return ''
  }).join('')
}

async function generateStaticHTML() {
  console.log('🔄 Fetching content from Sanity...')
  const { settings, projects } = await fetchContent()
  
  // Generate bio content
  let bioContent = ''
  if (settings?.bio) {
    if (Array.isArray(settings.bio)) {
      bioContent = blockContentToHtml(settings.bio)
    } else {
      bioContent = escapeHtml(settings.bio)
    }
  }
  
  // Generate contact content
  const contactWork = settings?.contactWork 
    ? `Email (work): <a href="mailto:${escapeHtml(settings.contactWork)}">${escapeHtml(settings.contactWork)}</a>`
    : 'Email (work):'
  
  const contactClasses = settings?.contactClasses
    ? `Email (classes): <a href="mailto:${escapeHtml(settings.contactClasses)}">${escapeHtml(settings.contactClasses)}</a>`
    : 'Email (classes):'
  
  const socialLink = settings?.socialUrl
    ? `<a href="${escapeHtml(settings.socialUrl)}" target="_blank" rel="noopener noreferrer">Social</a>`
    : 'Social'
  
  const linkedinLink = settings?.linkedinUrl
    ? `<a href="${escapeHtml(settings.linkedinUrl)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>`
    : 'LinkedIn'
  
  // Generate projects content
  let projectsContent = '<li>No projects yet</li>'
  if (projects && projects.length > 0) {
    // Shuffle the dingbats array for more visual variety
    const DINGBATS = ['\u2766', '\u2767', '\u2055', '\u273B', '\u273C', '\u273D', '\u273E', '\u273F', '\u2740', '\u2741', '\u2743', '\u274A', '\u274B']
    const shuffledDingbats = [...DINGBATS].sort(() => Math.random() - 0.5)
    
    projectsContent = projects.map((p, index) => {
      let yearStr = ''
      if (p.date) {
        const d = new Date(p.date)
        if (!isNaN(d)) {
          yearStr = `<span class="col-year">${d.getFullYear()}</span>`
        }
      }
      if (!yearStr && p.year) {
        yearStr = `<span class="col-year">${escapeHtml(String(p.year))}</span>`
      }
      
      let title
      if (p.title && p.url) {
        title = `<span class="col-title"><a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.title)}</a></span>`
      } else if (p.title) {
        title = `<span class="col-title">${escapeHtml(p.title)}</span>`
      } else {
        title = '<span class="col-title"></span>'
      }
      
      let roleAndCollaborators = ''
      if (p.role || p.collaborators) {
        roleAndCollaborators = '<br>'
        if (p.role) {
          roleAndCollaborators += `<span class="col-role">${escapeHtml(p.role)}</span>`
        }
        if (p.collaborators) {
          if (p.role) roleAndCollaborators += '<br>'
          roleAndCollaborators += `<span class="col-collaborators">${escapeHtml(p.collaborators)}</span>`
        }
      }
      
      const sym = shuffledDingbats[index % shuffledDingbats.length]
      return `<li data-bullet="${sym}">${yearStr}<br>${title}${roleAndCollaborators}</li>`
    }).join('')
  }

  // Generate complete HTML from scratch
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(settings?.title || 'Clinton Van Arnam')}</title>
  <meta name="description" content="Graphic designer and educator based in Brooklyn, NY.">
  <link rel="stylesheet" href="style.css">

  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="favicon/favicon.ico">
  <link rel="icon" type="image/svg+xml" href="favicon/favicon.svg">
  <link rel="icon" type="image/png" sizes="96x96" href="favicon/favicon-96x96.png">
  <link rel="apple-touch-icon" href="favicon/apple-touch-icon.png">
  <link rel="manifest" href="favicon/site.webmanifest">

  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="Clinton Van Arnam" />
  <meta property="og:description" content="Graphic designer and educator based in Brooklyn, NY." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://clintonvanarnam.net" />
  <meta property="og:image" content="https://clintonvanarnam.net/favicon/web-app-manifest-512x512.png" />

  <!-- Twitter Card Meta Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Clinton Van Arnam" />
  <meta name="twitter:description" content="Graphic designer and educator based in Brooklyn, NY." />
  <meta name="twitter:image" content="https://clintonvanarnam.net/favicon/web-app-manifest-512x512.png" />
</head>
<body>
  <main>
    <section aria-labelledby="about">
      <div id="bio">${bioContent}</div>
    </section>

    <section aria-labelledby="contact">
      <p id="contact-work">${contactWork}</p>
      <p id="contact-classes">${contactClasses}</p>
      <p id="contact-social">${socialLink}</p>
      <p id="contact-linkedin">${linkedinLink}</p>
    </section>

    <section aria-labelledby="projects">
      <p>- - - - - - - - - - - - - - - - - - - - - - - -</p>
      <h2 id="projects">Recent:</h2>
      <ul id="projects-list">
        ${projectsContent}
      </ul>
    </section>
  </main>
</body>
</html>`

  return html
}

async function buildStaticSite() {
  try {
    const html = await generateStaticHTML()
    
    console.log('🔧 Creating dist directory...')
    const distDir = path.join(__dirname, 'dist')
    await fs.mkdir(distDir, { recursive: true })
    
    console.log('📝 Writing static HTML...')
    await fs.writeFile(path.join(distDir, 'index.html'), html)
    
    console.log('📋 Copying assets...')
    await fs.copyFile(path.join(__dirname, 'style.css'), path.join(distDir, 'style.css'))
    
    // Copy favicon directory
    const faviconSrc = path.join(__dirname, 'favicon')
    const faviconDest = path.join(distDir, 'favicon')
    await fs.mkdir(faviconDest, { recursive: true })
    
    const faviconFiles = await fs.readdir(faviconSrc)
    for (const file of faviconFiles) {
      await fs.copyFile(path.join(faviconSrc, file), path.join(faviconDest, file))
    }
    
    console.log('✅ Static site generated successfully!')
    console.log('📁 Files created in /dist directory')
    console.log('🚀 Deploy the /dist folder to your hosting provider')
    
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

buildStaticSite()