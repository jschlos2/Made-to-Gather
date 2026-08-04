# Jennifer Robertson’s graduation invitation

A reusable multi-event invitation system built with Astro, TypeScript, Cloudflare Pages Functions, and Cloudflare D1. Every event is generated from one shared page and component set; content, artwork, theme colors, font stacks, and decorative classes live in typed configuration. The invitation pages remain statically generated while `/api/rsvp` runs server-side and stores validated responses.

## Run locally

```sh
npm install
npm run dev
```

Open the local address Astro prints in the terminal. To validate a production build:

```sh
npm run build
```

`npm run dev` previews the invitation design but does not run the RSVP endpoint. For a complete local RSVP environment, follow [Local D1 development](#local-d1-development).

For a clean dependency install matching `package-lock.json`, use `npm ci`. The project pins Node.js 22 in `.node-version` for consistent local and Cloudflare builds.

## Available routes

- `/events/graduation/` — the primary graduation invitation
- `/events/birthday/` — a clearly labeled demonstration event
- `/host/` — the private RSVP dashboard, protected by Cloudflare Access in production
- `/host/archive/` — the authenticated Made to Gather family archive
- `/host/events/:slug/edit/` — authenticated lifecycle controls
- `/host/events/:slug/preview/` — authenticated preview, including draft events
- `/events/graduation/photos/upload/` — token-gated guest photo upload
- `/events/graduation/photos/` — approved-only event gallery
- `/` — a simple event preview index

Astro generates each event route statically from `src/pages/events/[slug].astro`. Unknown URLs use `src/pages/404.astro`.

## Create another event

1. Open `src/data/events.ts`.
2. Add another object to the exported `events` array. TypeScript will require the slug, title, subtitle, date, time, location, description, details, RSVP deadline, artwork, theme colors, and font selections.
3. Put the event artwork in `public/artwork/` and reference it with a root-relative path such as `/artwork/my-event.jpg`. Include its pixel dimensions and useful alternative text.
4. Choose a unique URL-safe slug such as `garden-party`. Astro will generate `/events/garden-party/` during the next build.
5. Reuse an existing theme object or define another `EventTheme`. Optional `decorativeClasses` can target event-specific refinements in `src/styles/global.css`.
6. Run `npm run build`. The new route will appear in the build output and on the home-page event index.

Set `photos.uploadsEnabled` and `photos.galleryEnabled` for each event. Give `uploadTokenEnv` a unique server environment variable name, such as `PHOTO_UPLOAD_TOKEN_GARDEN_PARTY`; never put the token value in `events.ts`.

Also set typed `lifecycle` defaults. These are the safe fallback before the lifecycle migration is applied; host changes are stored as D1 overrides and do not rewrite source files.

## Event lifecycle and family archive

Every event has one manual lifecycle status plus independent `rsvpOpen` and `photoUploadsOpen` controls. Dates and the configured IANA timezone are displayed to the host, but dates never silently change status or close an event.

| Status | Guest experience |
| --- | --- |
| Draft | The public event route returns a generic 404. Hosts use the authenticated preview route. It is not listed publicly and is noindexed. |
| RSVP open | Invitation details and the RSVP form are available. Photo upload appears only when the separate upload switch is enabled. |
| RSVP closed | Invitation details remain visible and the form is replaced with a polite closed message. The host can reopen the separate RSVP switch. |
| Event day | Date, address, parking, and bring-along details receive stronger visual emphasis. Uploads still require the separate photo switch. |
| Photos open | Details and the approved gallery remain available. The editor defaults RSVPs off and photo uploads on; either switch remains an explicit host decision. |
| Archived | The invitation becomes a themed keepsake with its artwork, event summary, details, and approved gallery prioritized. RSVP and upload acceptance are forced off in the guest experience. An empty photo message appears when nothing is approved. |

Open `/host/archive/` to see **Drafts**, **Upcoming Gatherings**, and **Past Gatherings**. Open an event’s **Manage** or **Edit event configuration** action to change status and the independent switches. Closing an open RSVP or archiving requires an explicit confirmation. To reopen RSVPs, check **Accept new RSVPs** and save. To open uploads, check **Accept guest photo uploads** and save; the event must also have `photos.uploadsEnabled: true` in `src/data/events.ts`. To archive, choose **Archived**, save, and accept the confirmation prompt.

Lifecycle controls edit operational availability only. Titles, dates, addresses, artwork, summaries, and visual themes remain reviewed code in `src/data/events.ts`; this intentionally avoids turning the family archive into a public or multi-customer content-management system.

Privacy boundaries:

- `/host/`, `/host/archive/`, `/host/events/*`, and `/host/api/*` are authenticated by Cloudflare Access and the existing JWT-validating middleware.
- Drafts are accessible through authenticated host previews and blocked on public `/events/*` routes.
- Non-draft `/events/:slug/` pages are **link-only**, not authenticated. They include noindex metadata and response headers and are excluded from the public root page and `robots.txt`, but anyone can forward an unlisted link.
- Public lifecycle and gallery endpoints return no guest names, phone numbers, RSVP responses, pending photos, upload tokens, or R2 object keys.
- No sitemap is generated, and the public root route does not enumerate family events.

Lifecycle state is stored by the additive `migrations/0004_create_event_lifecycle.sql` migration. Apply it locally with `npm run db:migrate:local`. Review it before applying remotely with the existing D1 migration command. Until applied, the server safely uses each event’s typed defaults; host changes cannot be persisted.

Do not copy the page or components for a new event.

## Customize the invitations

- **Event information and themes:** edit `src/data/events.ts`.
- **Artwork:** replace `public/artwork/graduation-poster.jpg` and update its dimensions/alternative text in `src/data/events.ts` if needed. The current file is a web-optimized copy of the supplied `gradinvitepostcard.png` artwork.
- **Colors, fonts, spacing, borders, and shadows:** edit the variables in `:root` at the top of `src/styles/global.css`.
- **Local fonts:** put licensed `.woff2` files in `public/fonts/`, then enable and update the sample `@font-face` rule in `src/styles/global.css`.
- **Layout:** reusable sections live in `src/components/InvitationPage.astro`, `Hero.astro`, `EventDetails.astro`, `RsvpForm.astro`, and `Footer.astro`.
- **Dynamic route:** `src/pages/events/[slug].astro` maps typed configurations to static pages.

## RSVP data flow

1. The browser validates the visible form fields, creates a one-time submission ID, disables the submit button, and sends JSON to the same-origin `/api/rsvp` endpoint.
2. `functions/api/rsvp.js` checks the request method, origin, media type, payload size, event slug, phone number, field types, lengths, attendance value, and party size.
3. The endpoint normalizes text and uses a parameterized D1 statement—form values are never interpolated into SQL.
4. D1 stores the response in `rsvps`. The submission ID is the primary key, so a repeated request with the same ID is treated as an idempotent retry instead of creating another row.
5. The browser displays the existing confirmation design after a successful write or leaves the form visible with an accessible error message if saving fails.

The database binding is named `DB` and is only available to the server-side Pages Function. No database identifier, credentials, or query access is sent to browser code.

## Database schema

The migration is `migrations/0001_create_rsvps.sql`. It creates:

- `id` — client-generated UUID and primary key used for retry protection
- `event_slug` — links the response to an event in `src/data/events.ts`
- `guest_name`
- `mobile_number` — added by `migrations/0002_add_mobile_number.sql`; nullable for existing records and stored as US E.164 for new submissions
- `attendance_status` — constrained to `attending` or `declines`
- `adults` and `children` — integers constrained to 0–12 each
- `dietary_restrictions` — nullable, up to 500 characters
- `message` — nullable, up to 1,000 characters
- `submitted_at` — UTC timestamp generated by D1

An index on `(event_slug, submitted_at)` supports event-specific response review.

The second migration adds rather than replaces the mobile-number column, preserving every existing RSVP. It intentionally permits `NULL` for rows submitted before mobile collection was introduced. No email column existed in the original schema, so no email data needed to be migrated or removed.

## Cloudflare D1 setup

No D1 binding existed before this feature. The repository contains `wrangler.example.jsonc`, not a live database ID. Do not commit a database identifier if you prefer to manage the production binding exclusively in the Cloudflare dashboard.

1. Create the database in **Cloudflare Dashboard → Storage & databases → D1**, named `made-to-gather-rsvps`. Alternatively, while signed in to Wrangler, run:

```sh
npx wrangler@latest d1 create made-to-gather-rsvps
```

2. In **Workers & Pages → made-to-gather → Settings → Bindings**, add a **D1 database binding**:

| Setting | Value |
| --- | --- |
| Variable name | `DB` |
| D1 database | `made-to-gather-rsvps` |

Add the binding to both Production and Preview if preview deployments should accept test RSVPs. Redeploy after changing a binding.

3. Create the ignored local configuration if it does not exist, then replace `REPLACE_WITH_YOUR_D1_DATABASE_ID` with the ID shown by `npx wrangler@latest d1 list`:

```sh
cp wrangler.example.jsonc wrangler.local.jsonc
```

4. Review the files in `migrations/`, then explicitly apply pending migrations to the remote database when ready:

```sh
npx wrangler@latest d1 migrations apply made-to-gather-rsvps --remote --config wrangler.local.jsonc
```

This command changes the remote database. The migrations are additive and preserve existing RSVP and photo rows. It is intentionally not part of the build command and was not run automatically.

4. Keep the existing Cloudflare Pages build settings:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `main` |

Cloudflare Pages automatically bundles the root `functions/` directory alongside the static Astro output.

## Local D1 development

Wrangler is invoked with `npx` so it is not included in the production application bundle. Network access is required the first time `npx` downloads it.

1. Create a local-only configuration and replace the database ID placeholder with the ID printed when the D1 database was created:

```sh
cp wrangler.example.jsonc wrangler.local.jsonc
```

`wrangler.local.jsonc` and `.wrangler/` are ignored by Git. Local commands below use local D1 storage and do not write to the remote database.

2. Apply the migration locally:

```sh
npm run db:migrate:local
```

3. Start the built site, Pages Function, and local D1 binding:

```sh
npm run dev:cloudflare
```

Open `http://localhost:8788/events/graduation/`.

4. In another terminal, verify a valid insert, an idempotent retry, and rejection of an invalid party size:

```sh
npm run verify:rsvp -- http://localhost:8788
```

5. Confirm the local row was stored:

```sh
npx wrangler@latest d1 execute made-to-gather-rsvps --local --config wrangler.local.jsonc --command "SELECT id, event_slug, guest_name, mobile_number, attendance_status, adults, children, submitted_at FROM rsvps ORDER BY submitted_at DESC LIMIT 10"
```

To inspect production after a real submission, use the D1 console in the Cloudflare dashboard or run the same query with `--remote` only when you intentionally want to access production data. RSVP rows contain personal information; do not paste query output into public issues or logs.

## Secure host dashboard

The dashboard at `/host/` shows response totals, adult and child totals, guest responses, dietary notes, messages, and submission dates. It can filter by event and attendance, sort by date or guest name, and export the current filter as CSV. It is read-only: editing and deleting responses are intentionally not implemented.

### Authentication approach

Use **Cloudflare Access with the Cloudflare identity provider restricted to your Cloudflare account members**. This is the smallest appropriate setup for a personal site: Cloudflare blocks the `/host/*` route at the edge and asks you to sign in with the Cloudflare account you already protect with MFA. The Pages middleware then independently validates the signed Access JWT before it serves either the dashboard or its RSVP API. A hidden URL, browser-stored password, or frontend credential is not used.

The application needs two non-secret server-side values:

- `TEAM_DOMAIN` — your Access team domain, for example `https://your-team.cloudflareaccess.com`
- `POLICY_AUD` — the audience tag shown for the Access application

Do not put Access service tokens, API tokens, passwords, or private keys in this repository. `TEAM_DOMAIN` and `POLICY_AUD` are identifiers rather than credentials, but they should still be configured in the Pages dashboard instead of frontend code.

### Cloudflare Access setup (complete before the next production deployment)

1. Open **Cloudflare Zero Trust → Settings → Authentication → Login methods**. Add or open **Cloudflare** and enable **Restrict to account members**. This ensures the Cloudflare login method only recognizes members of your account.
2. Open **Access controls → Applications → Add an application**, choose a self-hosted application, and protect the production hostname and path `made-to-gather.pages.dev/host/*` (replace the hostname if your Pages project differs).
3. Add an **Allow** policy whose Include rule is **Cloudflare Account Member**, then select your Cloudflare account. Do not use an Everyone rule. Choose a session duration appropriate for your device, such as eight hours.
4. Copy the application’s **AUD tag** and your Zero Trust team domain.
5. Open **Workers & Pages → made-to-gather → Settings → Variables and Secrets**. Add `POLICY_AUD` and `TEAM_DOMAIN` to the Production environment. These values are consumed only by the server-side Pages middleware.
6. Do **not** define `HOST_AUTH_DISABLED` in Production. That development switch works only for loopback requests, but omitting it avoids confusion.
7. Confirm that the `DB` D1 binding and migration described above are configured before expecting dashboard data.
8. Configure equivalent Access protection and variables for any preview hostname that should expose the dashboard, or disable preview deployments. The middleware fails closed when configuration or a valid JWT is missing, so an unconfigured preview cannot return RSVP data.
9. Deploy only after the Access application and policy are active.

The `robots` meta tag, `robots.txt`, and `X-Robots-Tag` response header discourage indexing, but they are not security controls. Cloudflare Access and server-side JWT validation provide the actual protection.

Official references: [Cloudflare identity provider](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/cloudflare/), [Access policies](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/), and [validating Access JWTs](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).

### Dashboard testing

For safe local development, copy `wrangler.example.jsonc` to the ignored `wrangler.local.jsonc`, keep `HOST_AUTH_DISABLED` set to `true`, apply the local D1 migration, and run `npm run dev:cloudflare`. The bypass is accepted only on `localhost`, `127.0.0.1`, or `::1`; it cannot disable authentication on the deployed hostname. Visit `http://localhost:8788/host/`.

Run the automated signed-token verification with:

```sh
npm run verify:host-auth
```

After deployment, verify both sides of the policy:

1. In a private browser window, open `/host/`. Cloudflare should require sign-in; a user outside the allowed account must not reach the dashboard.
2. Sign in as an allowed Cloudflare account member. The dashboard should load and display D1 responses.
3. Change the attendance filter and sort order, then download CSV and confirm it contains only the selected rows.
4. Review **Zero Trust → Logs → Access** for allowed and denied requests.

CSV files contain personal guest information. Store and share exports carefully, and delete local copies when they are no longer needed.

## Host-assisted text messaging

Messages are sent manually because this personal site deliberately has no Twilio, email-to-SMS gateway, automated sending service, or bulk-message system. A guest’s required mobile number is normalized on the server and stored in the private D1 `rsvps.mobile_number` column as US E.164, such as `+15035551234`. The number is never written into public event configuration or public invitation HTML.

On the authenticated `/host/` dashboard, each response initially shows only `(***) ***-1234`. **Reveal** displays the full number for that row. **Text guest** opens the host device’s messaging application through an encoded `sms:` link with message copy generated from the RSVP’s event configuration. The link only opens a draft; the host must review and press Send. There is no bulk action.

**Copy message** is the fallback for devices that do not preserve the prefilled `sms:` body. It uses the secure browser Clipboard API and announces success or failure visibly. `sms:` behavior varies: some desktop devices have no SMS application, and Android/iOS versions differ in whether they accept or retain a prefilled message. If the draft body is absent, copy the prepared message and paste it into the messaging app.

To test without contacting a real guest:

1. Use a clearly labeled test number such as `(503) 555-1234` only in local D1.
2. Run `npm run verify:messaging`; the test does not contact a carrier or open a messaging application.
3. In the local dashboard, confirm the masked last four digits and use Reveal.
4. Use Copy message and paste into a local text editor to inspect it.
5. Inspect the Text guest link destination or open it on a device, but close the resulting draft without pressing Send.

The CSV export intentionally does not include mobile numbers. Full numbers remain available only through the authenticated dashboard API and explicit per-row reveal/action controls.

## Privacy and security limitations

- Guest names, mobile numbers, dietary notes, and messages are stored as plaintext in D1. Limit Cloudflare account access and define a retention/deletion policy before collecting real responses.
- The endpoint has same-origin checks, bounded input, strict validation, prepared statements, and retry protection, but it does not yet include Turnstile, IP-based rate limiting, or abuse monitoring.
- The host dashboard is read-only and depends on a correctly configured Cloudflare Access policy. Guest authentication, self-service editing, and deletion workflows do not exist yet.
- Access controls who can view responses; D1 still stores guest content as plaintext, and authorized account members can export it.
- The site collects a mobile number for host follow-up but never sends email or SMS automatically and does not expose RSVP records through public routes.
- Avoid placing medical details in the optional dietary field; request only what is necessary for hosting the event.

## Private guest photos

Guest images are stored in a **private Cloudflare R2 bucket** under opaque UUID object keys. D1 stores the event slug, internal object key, sanitized original filename, MIME type, byte size, pending/approved/removed moderation state, timestamps, and a one-way rate-limit fingerprint. The public gallery query returns only approved photo IDs and controlled image URLs; it never returns R2 keys, upload tokens, filenames, or pending/removed images.

Uploads accept JPEG, PNG, and WebP only, with a maximum of 8 MB per photo and 5 photos per selection. The server checks declared and actual size, allowlisted MIME type, file signature, event configuration, a constant-time token comparison, and a rolling 20-upload-per-link/IP daily limit. HEIC/HEIF is intentionally rejected because reliable browser display requires conversion. Images are not transcoded, resized, or stripped of EXIF metadata; guests should avoid images containing sensitive location metadata. R2 is private, but authorized Cloudflare account members and the application runtime can access stored originals.

### Cloudflare setup (manual)

1. Create a private R2 bucket named `made-to-gather-photos`. Do not enable a public development URL or custom public domain.
2. In **Workers & Pages → made-to-gather → Settings → Bindings**, add an R2 binding with variable name `PHOTOS` and select that bucket. Add it separately to Preview only if previews should process photos.
3. Generate a unique high-entropy upload token locally, for example `openssl rand -hex 32`. In **Settings → Variables and Secrets**, add it as an encrypted secret named `PHOTO_UPLOAD_TOKEN_GRADUATION`. Never commit or paste its value into client code.
4. Review `migrations/0003_create_event_photos.sql`, then apply pending migrations only when ready:

```sh
npx wrangler@latest d1 migrations apply made-to-gather-rsvps --remote --config wrangler.local.jsonc
```

This remote command was not run by Codex. The migration is additive and preserves RSVP rows. Share the private link as `/events/graduation/photos/upload/?token=YOUR_TOKEN`. The page moves the token into session storage and removes it from the visible URL immediately; guests should still avoid forwarding the link. Rotate the encrypted secret if the link is exposed. Existing open sessions retain the old token until their tab/session ends.

The authenticated `/host/` dashboard includes photo filters, previews, individual approve/remove/restore actions, bulk approval for up to 50 selected pending photos, and an explicitly confirmed permanent-delete action. Removal hides an image but retains its R2 object and metadata; permanent deletion removes both and cannot be undone. Only approved images appear publicly, and the invitation reveals “View event photos” only after at least one approval.

### Local photo testing

Copy `wrangler.example.jsonc` to the ignored `wrangler.local.jsonc`, set a long local-only `PHOTO_UPLOAD_TOKEN_GRADUATION` value in its `vars`, then run `npm run db:migrate:local` and `npm run dev:cloudflare`. Wrangler uses local R2 storage by default. Open the private upload URL on localhost with that token, upload non-sensitive test images, and moderate them at `/host/` (the local-only auth bypass remains constrained to loopback requests).

Run `npm run verify:photos` for validation/signature/token/moderation safety checks. Also test an invalid token, a renamed non-image, an over-8-MB file, all three supported formats, approve/remove/restore, gallery visibility, and confirmed permanent deletion. Inspect local metadata with:

```sh
npx wrangler@latest d1 execute made-to-gather-rsvps --local --config wrangler.local.jsonc --command "SELECT id, event_slug, mime_type, file_size, moderation_status, uploaded_at FROM event_photos ORDER BY uploaded_at DESC LIMIT 20"
```

Do not use real guest photos in local tests or make the R2 bucket public. Token links are lightweight access control suitable for this personal upload flow, not guest identity verification. There is no malware scanner, EXIF removal, per-person identity, automated retention, content reporting, or upload revocation UI yet.

## Intentionally deferred

This milestone does not include browser-based editing of invitation wording/artwork, RSVP modification or deletion, automatic email or SMS sending, bulk messaging, payments, guest accounts, a drag-and-drop editor, analytics, Turnstile, image conversion, or automated data-retention tooling.

## Deploy through GitHub and Cloudflare Pages

This project uses static Astro pages plus a root-level Cloudflare Pages Function. It does not need the `@astrojs/cloudflare` adapter because the invitation pages themselves do not use Astro server-side rendering.

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

The `DB` D1 binding described above is required for working RSVP submissions. The host dashboard also requires the server-side `TEAM_DOMAIN` and `POLICY_AUD` values described above. No client-side secrets or environment variables are required. Node.js 22 is selected automatically from the committed `.node-version` file.

7. Review the generated `*.pages.dev` project name carefully; it becomes the default Pages subdomain.
8. Selecting **Save and Deploy** will make the site publicly reachable. Only select it when you are ready to publish.

After the first deployment, pushes to `main` create production deployments. Pull requests receive preview deployments. A custom domain is optional and can be added later under the Pages project’s **Custom domains** settings.

Official references: [Cloudflare’s Astro Pages guide](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/), [Cloudflare build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/), and [GitHub’s guide for locally hosted code](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github).
