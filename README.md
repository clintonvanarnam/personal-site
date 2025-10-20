# Personal Site

A minimal site powered by Sanity (CMS) but rendered to plain, CSS-free HTML.

## Two ways to manage content

1) Static: edit `index.html` directly (quickest, no tooling).
2) CMS (Sanity): edit content in Sanity Studio, then run a small build script to generate `index.html`.

This repo includes the CMS path. If you prefer static-only, you can ignore the Node files and just edit `index.html`.

## Requirements
- Node.js 18+
- A Sanity account (https://www.sanity.io)

## Setup (Sanity + build)

1. Install dependencies
   
	```sh
	npm install
	```

2. Create a Sanity project (if you don’t have one)
	- Install the Sanity CLI globally (optional): `npm i -g sanity`
	- Run: `npx sanity@latest init --create-project "Clinton Personal Site" --dataset production`
	- Note the Project ID. Set it in your `.env`.

3. Configure environment variables
	- Copy `.env.example` to `.env`
	- Fill in `SANITY_PROJECT_ID`

4. Define your content types (schemas)
	You can add these in any Sanity Studio tied to your project. If you don't have a Studio, create one (e.g., in another folder via `npx sanity@latest init`) and add these schemas.

	- siteSettings (singleton)
	  - title (string)
	  - description (text or string)
	  - bio (text)
	  - contactWork (string)
	  - contactClasses (string)

	- project (document)
	  - title (string)
	  - client (string)
	  - role (string)
	  - year (number)
	  - notes (text or string)

	GROQ used by the build:
	- `*[_type == "siteSettings"][0]{ title, description, bio, contactWork, contactClasses }`
	- `*[_type == "project"]|order(year desc, _updatedAt desc){ title, client, role, year, notes }`

5. Seed some content
	- Create one `siteSettings` document and fill your bio, description, and emails.
	- Add your projects as `project` documents (year, title, client, role, notes as needed).

6. Build the HTML from Sanity content
   
	```sh
	npm run build
	```

	This generates/overwrites `index.html` locally with:
	- Font: Courier, 12px everywhere, no bold
	- Sections: About, Contact (emails auto-linked), Recent Projects

7. View locally
	- Open `index.html` in your browser.

## Hosting
- GitHub Pages, Netlify, Vercel—all fine for static hosting. You’ll commit and push the generated `index.html`.

## Notes
- You control typography rules in `build.js` (inline CSS). It currently enforces Courier at 12px and disables bold globally.
- If you want to add more fields (e.g., links per project), extend the schema and update the rendering in `build.js`.
