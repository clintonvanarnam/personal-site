# Sanity schema snippets

Copy these into the `schemas` folder of your Sanity Studio (created via `npx sanity@latest init`).

## siteSettings.js
```js
export default {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'description', title: 'Description', type: 'text' },
    { name: 'bio', title: 'Bio', type: 'text' },
    { name: 'contactWork', title: 'Email (work)', type: 'string' },
    { name: 'contactClasses', title: 'Email (classes)', type: 'string' }
  ]
}
```

## project.js
```js
export default {
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'client', title: 'Client', type: 'string' },
    { name: 'role', title: 'Role', type: 'string' },
    { name: 'year', title: 'Year', type: 'number' },
    { name: 'notes', title: 'Notes', type: 'text' }
  ]
}
```

## schema.js
Add both to your Studio's root `schema.js` (or `schema.ts`) export:
```js
import siteSettings from './siteSettings'
import project from './project'

export const schema = {
  types: [siteSettings, project]
}
```
