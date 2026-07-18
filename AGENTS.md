# Itinerary maintenance rules

- Keep this a build-free static site suitable for GitHub Pages and the GitLab Pages backup. Do not add a framework, package manager, server, database, or third-party runtime unless the user explicitly asks.
- Treat `itinerary-data.js` as the source of truth. Normal schedule, badge, traveler, flight, hotel, and selection updates belong there; do not edit UI files for routine content changes.
- Preserve the traveler IDs `me` and `brother`, ISO dates, and 24-hour Los Angeles conference times.
- Keep `start` and `end` normalized to Los Angeles time for sorting and overlap checks. Travel events may add `displayStart` and `displayEnd` when their human-facing local time zones differ.
- Completed-event styling uses the real clock. The `previewTime` query parameter exists only to preview a simulated ISO-8601 instant; do not bake preview timestamps into normal links.
- Use an event's optional `interest` map for independent Ben and Steve interest, with integer values from 0 through 4. When it is absent, the interface falls back to the event's `people` and `status`; prefer explicit values when the travelers differ.
- Keep event IDs stable after publication so links and future annotations can refer to them reliably.
- When schedule facts may have changed, verify them against the official SIGGRAPH schedule before editing. Distinguish verified changes from personal choices.
- After every content update, set `updatedAt` to an ISO-8601 timestamp with offset.
- Ben has Full Conference access; Steve is expected to have it as well. Preserve Full Conference candidates unless the user explicitly removes them. Access arrays describe which badge levels admit each event; the UI derives the minimum badge from them.
- Run `node --check app.js` and `node --check itinerary-data.js` after changes. Also load the page locally when UI files change.
- Keep unrelated user edits intact. Commit only the intended itinerary changes.
