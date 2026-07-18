# SIGGRAPH 2026 itinerary maintenance handoff

Use the following as the opening prompt for a new Codex task:

---

Maintain and publish the live SIGGRAPH 2026 itinerary for Ben and Steve throughout their trip.

Canonical project state:

- Local repo: `/Users/brw/Developer/apps/siggraph26`
- GitHub project: `https://github.com/benwilliams0540/siggraph26`
- Live public site: `https://benwilliams0540.github.io/siggraph26/`
- GitLab backup: `https://gitlab.com/brw2/siggraph26`
- Backup public site: `https://siggraph26-a0ec18.gitlab.io`
- Default branch: `main`
- Conference time zone: `America/Los_Angeles`

Start every task by reading `AGENTS.md`, `README.md`, the live worktree status, and the files relevant to the requested change. Recheck the GitHub, GitLab backup, and live-site state instead of assuming this handoff is current. Preserve unrelated work and stage only explicit paths.

The site is intentionally plain HTML, CSS, and JavaScript. Keep it build-free and easy to repair from a phone or hotel room. Do not add a framework, package manager, database, server, Pawl runtime, or third-party runtime unless I explicitly ask.

`itinerary-data.js` is the source of truth for routine updates. Schedule selections, interest levels, travel, hotel, badge, attendee, location, and timing changes should normally edit only that file and its `updatedAt` timestamp. Do not change UI files merely to update content.

Data conventions:

- Internal traveler ID `me` means Ben; `brother` means Steve. Keep those IDs stable even though the interface uses their names.
- Ben has a Full Conference badge. Steve is currently expected to have Full Conference too. Preserve Full-only candidates unless I remove them or his badge changes.
- Interest is an integer from 0 through 4 for each person: 0 not on the list, 1 curious, 2 interested, 3 strong interest, 4 must-see. Use an explicit `interest: { me: n, brother: n }` map whenever their enthusiasm differs.
- Keep published event IDs stable.
- Dates are `YYYY-MM-DD`. `start` and `end` are 24-hour Los Angeles time so sorting, overlap detection, and completed-session styling work consistently.
- Travel entries may use `displayStart` and `displayEnd` when the visible local time zones differ from the normalized Los Angeles times.
- The outbound American Airlines flight is still marked tentative: arrive CLT at 7:00 a.m. EDT Sunday, July 19; depart 8:57 a.m. EDT; land LAX 10:56 a.m. PDT. The return is tentatively Saturday, July 25, 11:00 a.m. PDT to 7:00 p.m. EDT, but its date was inferred from the earlier search and must be confirmed. Hotel details remain TBD.

Behavior to preserve:

- The page supports Ben, Steve, and combined schedules; all picks, priorities, and full-session views; and day filtering.
- When there is no explicit `day` query parameter, the page chooses the current itinerary day using Los Angeles time. A shared URL with an explicit day intentionally overrides that behavior.
- Sessions that have fully ended are crossed off based on the real current time. `previewTime` is only a testing query parameter for previewing that state; never bake it into ordinary shared links.
- Preserve the dark, compact, mobile-first design, including equal-height wrapped selectors in the fixed header.
- The interest display is a four-segment graph for both Ben and Steve, not the old name, badge, and pick-strength pills.

For conference facts that could have changed—time, room, cancellation, badge access, or session details—verify the official SIGGRAPH schedule before editing and distinguish verified facts from personal choices or tentative logistics. If the official site cannot be checked, say so clearly rather than presenting an assumption as confirmed.

After each change:

1. Update `updatedAt` for content changes.
2. Run `node --check app.js` and `node --check itinerary-data.js`.
3. Load the page locally when UI behavior or styling changed, including a phone-width check when relevant.
4. Review `git diff` and `git status` so unrelated changes stay untouched.
5. Commit only the intended paths with a concise commit message.
6. Push `main` to the GitHub `origin` and GitLab `gitlab` remotes.
7. Wait for the GitHub Pages build to report `built` with `gh api repos/benwilliams0540/siggraph26/pages/builds/latest`, and wait for the GitLab backup with `glab ci status --wait`.
8. Verify that `https://benwilliams0540.github.io/siggraph26/` and `https://siggraph26-a0ec18.gitlab.io` serve the updated public page without authentication.

Publishing itinerary updates to this public project is expected when I ask you to change or maintain the itinerary. If I ask only for analysis, recommendations, or a preview, do not publish unless I also request an update. Report the commit, pipeline result, live verification, and any remaining uncertainty at handoff.

Begin by inspecting the canonical repo and summarizing its actual current state briefly. Then handle my next itinerary request.

---
