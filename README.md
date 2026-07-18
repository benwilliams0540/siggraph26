# SIGGRAPH 2026 itinerary

A build-free conference itinerary for Ben and Steve, designed for GitHub Pages and quick AI-assisted updates during SIGGRAPH.

- Live site: https://benwilliams0540.github.io/siggraph26/
- GitHub project: https://github.com/benwilliams0540/siggraph26
- GitLab backup: https://gitlab.com/brw2/siggraph26 · https://siggraph26-a0ec18.gitlab.io

## Why this is deliberately simple

The site is plain HTML, CSS, and JavaScript. There is no package manager, framework, database, or deployment build to repair from a hotel room. `itinerary-data.js` is the source of truth; normal schedule, travel, hotel, badge, and attendee updates should only change that file.

The structure borrows Pawl's useful discipline—small structured records, explicit status, and predictable edits—without depending on Pawl's Swift CLI, leases, GitLab pipeline, or work-board renderer.

## Preview locally

Opening `index.html` directly works. To preview through a local web server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish

The primary site publishes the root of `main` directly through GitHub Pages. The `origin` remote points to GitHub. The `gitlab` remote remains a backup; its `.gitlab-ci.yml` Pages job validates both JavaScript files, copies the static site into its deployment artifact, and publishes it without a package install or application build.

After an itinerary update:

```bash
git add itinerary-data.js
git commit -m "content: update conference itinerary"
git push origin main
git push gitlab main
gh api repos/benwilliams0540/siggraph26/pages/builds/latest --jq '{status,commit}'
glab ci status --wait
```

Wait for both deployments, then verify the primary site at https://benwilliams0540.github.io/siggraph26/ and the backup at https://siggraph26-a0ec18.gitlab.io.

For UI changes, stage the specific HTML, CSS, or JavaScript files as well. Do not commit the generated `public/` directory; the pipeline creates it for each deployment.

## Update during the conference

Ask an AI to edit `itinerary-data.js`, update `updatedAt`, run the checks below, and commit the change. Useful requests include:

- “Mark these three events as priorities and remove this one.”
- “Add our flight and hotel confirmations.”
- “The room changed; verify the official schedule and update it.”
- “Add a dinner at 7:30 for both of us.”

Status values:

- `anchor`: a top priority
- `recommended`: a strong pick
- `option`: worth considering
- `drop-in`: a flexible exhibit or installation
- `wishlist`: a Full Conference session that has not yet been promoted to a priority

The interface presents interest as a four-segment graph for both travelers. Add an optional `interest` map to an event when Ben and Steve have different enthusiasm levels:

```js
interest: { me: 4, brother: 2 }
```

The scale is 0 (not on the list), 1 (curious), 2 (interested), 3 (strong interest), and 4 (must-see). When the map is omitted, the site derives the levels from the existing `people` and `status` fields.

Person values are `me` and `brother`. Dates use `YYYY-MM-DD`; times use 24-hour Los Angeles time.

The page chooses the current itinerary day using the conference's Los Angeles time zone when opened without a `day` query parameter. An explicit day in a shared or bookmarked URL intentionally overrides that automatic selection.

## Quick checks

```bash
node --check app.js
node --check itinerary-data.js
```

The URL records the active filters, so filtered views can be bookmarked or shared—for example `?person=brother&scope=priority&day=2026-07-22`.
