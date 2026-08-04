# Jennifer Robertson’s graduation invitation

A reusable, static multi-event invitation system built with Astro and TypeScript. Every event is generated from one shared page and component set; content, artwork, theme colors, font stacks, and decorative classes live in typed configuration.

## Run locally

```sh
npm install
npm run dev
```

Open the local address Astro prints in the terminal. To validate a production build:

```sh
npm run build
```

For a clean dependency install matching `package-lock.json`, use `npm ci`. The project pins Node.js 22 in `.node-version` for consistent local and Cloudflare builds.

## Available routes

- `/events/graduation/` — the primary graduation invitation
- `/events/birthday/` — a clearly labeled demonstration event
- `/` — a simple event preview index

Astro generates each event route statically from `src/pages/events/[slug].astro`. Unknown URLs use `src/pages/404.astro`.

## Create another event

1. Open `src/data/events.ts`.
2. Add another object to the exported `events` array. TypeScript will require the slug, title, subtitle, date, time, location, description, details, RSVP deadline, artwork, theme colors, and font selections.
3. Put the event artwork in `public/artwork/` and reference it with a root-relative path such as `/artwork/my-event.jpg`. Include its pixel dimensions and useful alternative text.
4. Choose a unique URL-safe slug such as `garden-party`. Astro will generate `/events/garden-party/` during the next build.
5. Reuse an existing theme object or define another `EventTheme`. Optional `decorativeClasses` can target event-specific refinements in `src/styles/global.css`.
6. Run `npm run build`. The new route will appear in the build output and on the home-page event index.

Do not copy the page or components for a new event.

## Customize the invitations

- **Event information and themes:** edit `src/data/events.ts`.
- **Artwork:** replace `public/artwork/graduation-poster.jpg` and update its dimensions/alternative text in `src/data/events.ts` if needed. The current file is a web-optimized copy of the supplied `gradinvitepostcard.png` artwork.
- **Colors, fonts, spacing, borders, and shadows:** edit the variables in `:root` at the top of `src/styles/global.css`.
- **Local fonts:** put licensed `.woff2` files in `public/fonts/`, then enable and update the sample `@font-face` rule in `src/styles/global.css`.
- **Layout:** reusable sections live in `src/components/InvitationPage.astro`, `Hero.astro`, `EventDetails.astro`, `RsvpForm.astro`, and `Footer.astro`.
- **Dynamic route:** `src/pages/events/[slug].astro` maps typed configurations to static pages.

## Intentionally deferred

The RSVP confirmation is a front-end preview only. This milestone does not include a database, saved submissions, authentication, email or SMS sending, payments, guest management, a drag-and-drop editor, or analytics. Those features can be connected later without changing the event content model or core invitation layout.

## Deploy through GitHub and Cloudflare Pages

This project is a static Astro site. It does not need the `@astrojs/cloudflare` adapter because it does not use server-side rendering or Pages Functions.

### 1. Create the GitHub repository

1. Sign in to GitHub and create a new empty repository. Do not initialize it with a README, `.gitignore`, or license because those files already exist locally.
2. In this project directory, run:

```sh
git init
git add .
git commit -m "Prepare invitation site for Cloudflare Pages"
git branch -M main
git remote -v
```

3. Inspect the output of `git remote -v` before continuing:
   - If it lists an existing remote, do not overwrite it. Use that remote if it is correct, or stop and decide how you want to handle it.
   - If it prints nothing, copy the HTTPS URL from the empty GitHub repository and run:

```sh
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git remote -v
git push -u origin main
```

GitHub may ask you to authenticate. Never commit passwords, access tokens, `.env` files, or private keys.

### 2. Connect the repository to Cloudflare Pages

1. Sign in to the Cloudflare dashboard.
2. Open **Workers & Pages**.
3. Select **Create application**.
4. Select the **Pages** tab, then **Import an existing Git repository**.
5. Connect GitHub if prompted and choose the repository created above.
6. In **Set up builds and deployments**, enter:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | `Astro` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Leave blank when this project is at the repository root |

No environment variables, bindings, secrets, Pages Functions, or compatibility flags are required for the current static site. Node.js 22 is selected automatically from the committed `.node-version` file.

7. Review the generated `*.pages.dev` project name carefully; it becomes the default Pages subdomain.
8. Selecting **Save and Deploy** will make the site publicly reachable. Only select it when you are ready to publish.

After the first deployment, pushes to `main` create production deployments. Pull requests receive preview deployments. A custom domain is optional and can be added later under the Pages project’s **Custom domains** settings.

Official references: [Cloudflare’s Astro Pages guide](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/), [Cloudflare build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/), and [GitHub’s guide for locally hosted code](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github).
