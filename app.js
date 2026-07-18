(() => {
  "use strict";

  const data = window.ITINERARY_DATA;
  if (!data) return;

  const state = {
    person: "both",
    scope: "all",
    day: "auto",
    overlapsOnly: false
  };

  const statusInterest = {
    anchor: 4,
    recommended: 3,
    option: 2,
    wishlist: 2,
    "drop-in": 1
  };

  const interestLabels = {
    0: "Not on the list",
    1: "Curious",
    2: "Interested",
    3: "Strong interest",
    4: "Must-see"
  };

  const elements = {
    personControls: document.querySelector("[data-person-controls]"),
    scopeControls: document.querySelector("[data-scope-controls]"),
    dayControls: document.querySelector("[data-day-controls]"),
    liveSummary: document.querySelector("[data-live-summary]"),
    logistics: document.querySelector("[data-logistics]"),
    schedule: document.querySelector("[data-schedule]"),
    empty: document.querySelector("[data-empty]"),
    updatedAt: document.querySelector("[data-updated-at]")
  };

  hydrateFromURL();
  renderStaticDetails();
  renderLogistics();
  renderDayControls();
  syncButtons();
  bindControls();
  renderSchedule();
  window.setInterval(renderSchedule, 60_000);

  const travelPanel = document.querySelector(".travel-panel");
  if (travelPanel) {
    const today = dateInTimeZone(effectiveNow(), data.conference.timeZone);
    const flightDays = data.events
      .filter((event) => /flight/i.test(event.type))
      .map((event) => event.date);
    if (flightDays.includes(today)) travelPanel.open = true;
  }

  function hydrateFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (["both", "me", "brother"].includes(params.get("person"))) state.person = params.get("person");
    if (["all", "priority", "shared"].includes(params.get("scope"))) state.scope = params.get("scope");
    if (["auto", "all", ...data.days.map((day) => day.date)].includes(params.get("day"))) state.day = params.get("day");
  }

  function renderStaticDetails() {
    document.querySelectorAll("[data-schedule-link]").forEach((link) => {
      link.href = data.conference.scheduleUrl;
    });

    elements.updatedAt.dateTime = data.updatedAt;
    elements.updatedAt.textContent = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short"
    }).format(new Date(data.updatedAt));
  }

  function renderLogistics() {
    elements.logistics.innerHTML = data.logistics.map((item) => `
      <article class="logistics-card">
        <div class="logistics-top">
          <span class="logistics-icon" aria-hidden="true">${escapeHTML(item.icon)}</span>
          <span class="tbd${item.status === "Confirmed" ? " is-confirmed" : ""}">${escapeHTML(item.status)}</span>
        </div>
        <p class="eyebrow">${escapeHTML(item.eyebrow)}</p>
        <h3>${escapeHTML(item.title)}</h3>
        <ul>${item.lines.map((line) => `<li>${escapeHTML(line)}</li>`).join("")}</ul>
        ${item.links?.length ? `<p class="logistics-links">${item.links.map((link) => `<a href="${escapeAttribute(link.url)}" target="_blank" rel="noreferrer">${escapeHTML(link.label)} ↗</a>`).join("")}</p>` : ""}
        <p class="note">${escapeHTML(item.note)}</p>
      </article>
    `).join("");
  }

  function renderDayControls() {
    const currentDay = currentItineraryDay();
    const dayButtons = data.days.map((day) => {
      const date = new Date(`${day.date}T12:00:00`);
      const label = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(date);
      return `<button type="button" data-day="${day.date}" aria-pressed="${isDayPressed(day.date)}">${escapeHTML(label.replace(",", ""))}</button>`;
    }).join("");

    elements.dayControls.innerHTML = `
      ${currentDay ? `<button type="button" data-day="auto" aria-pressed="${state.day === "auto"}">Today</button>` : ""}
      <button type="button" data-day="all" aria-pressed="${isDayPressed("all")}">Whole trip</button>
      ${dayButtons}
    `;
  }

  function bindControls() {
    elements.personControls.addEventListener("click", (event) => {
      const button = event.target.closest("[data-person]");
      if (!button) return;
      state.person = button.dataset.person;
      syncButtons();
      renderSchedule();
    });

    elements.scopeControls.addEventListener("click", (event) => {
      const button = event.target.closest("[data-scope]");
      if (!button) return;
      state.scope = button.dataset.scope;
      if (state.scope === "shared") state.person = "both";
      syncButtons();
      renderSchedule();
    });

    elements.dayControls.addEventListener("click", (event) => {
      const button = event.target.closest("[data-day]");
      if (!button) return;
      state.day = button.dataset.day;
      syncButtons();
      renderSchedule();
      document.querySelector("#schedule")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    elements.liveSummary.addEventListener("click", (event) => {
      if (!event.target.closest("[data-overlap-toggle]")) return;
      state.overlapsOnly = !state.overlapsOnly;
      renderSchedule();
    });

    document.querySelector("[data-reset-filters]").addEventListener("click", () => {
      state.person = "both";
      state.scope = "all";
      state.day = "all";
      state.overlapsOnly = false;
      syncButtons();
      renderSchedule();
    });
  }

  function syncButtons() {
    document.querySelectorAll("[data-person]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.person === state.person));
    });
    document.querySelectorAll("[data-scope]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.scope === state.scope));
    });
    document.querySelectorAll("[data-day]").forEach((button) => {
      button.setAttribute("aria-pressed", String(isDayPressed(button.dataset.day)));
    });
    writeURL();
  }

  function renderSchedule() {
    const matchedEvents = data.events.filter(matchesFilters);
    const conflicts = conflictIDs(matchedEvents);
    if (!conflicts.size) state.overlapsOnly = false;
    const visibleEvents = state.overlapsOnly
      ? matchedEvents.filter((event) => conflicts.has(event.id))
      : matchedEvents;
    const now = effectiveNow();
    const today = dateInTimeZone(now, data.conference.timeZone);
    const nowMinutes = minutesInTimeZone(now, data.conference.timeZone);

    elements.schedule.innerHTML = data.days.map((day) => {
      const events = visibleEvents
        .filter((event) => event.date === day.date)
        .sort((lhs, rhs) => lhs.start.localeCompare(rhs.start));
      if (!events.length) return "";

      const date = new Date(`${day.date}T12:00:00`);
      const dayNumber = new Intl.DateTimeFormat("en-US", { day: "2-digit" }).format(date);
      const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
      const cards = events.map((event) => renderEvent(event, conflicts, today, nowMinutes)).join("");

      return `
        <section class="day-section" data-date="${day.date}">
          <header class="day-header">
            <div class="day-date">${dayNumber}</div>
            <div>
              <p>${escapeHTML(month)} · ${escapeHTML(day.short)}</p>
              <h3>${escapeHTML(day.label)}</h3>
              <p>${escapeHTML(day.theme)} · ${events.length} ${plural(events.length, "pick")}</p>
            </div>
          </header>
          <div class="event-list">${cards}</div>
        </section>
      `;
    }).join("");

    elements.schedule.hidden = visibleEvents.length === 0;
    elements.empty.hidden = visibleEvents.length !== 0;

    const overlapCount = conflicts.size;
    const overlapControl = overlapCount
      ? ` · <button type="button" class="overlap-toggle" data-overlap-toggle aria-pressed="${state.overlapsOnly}">${state.overlapsOnly ? "showing overlaps · show all" : `${overlapCount} with timing overlaps`}</button>`
      : "";
    elements.liveSummary.innerHTML = `${visibleEvents.length} ${plural(visibleEvents.length, "pick")}${overlapControl}`;
  }

  function renderEvent(event, conflicts, today, nowMinutes) {
    const interestedPeople = data.travelers
      .filter((traveler) => interestLevel(event, traveler.id) > 0)
      .map((traveler) => traveler.id);
    const personClass = interestedPeople.length > 1 ? "for-both" : `for-${interestedPeople[0]}`;
    const past = eventHasEnded(event, today, nowMinutes);
    const current = !past && event.date === today && timeToMinutes(event.start) <= nowMinutes && timeToMinutes(event.end) > nowMinutes;
    const href = event.url || data.conference.scheduleUrl;

    if (past) {
      return `
      <article class="event-card event-stub ${personClass} is-past">
        <span class="stub-time">${escapeHTML(event.displayStart || formatTime(event.start))}</span>
        <span class="stub-title">${escapeHTML(event.title)}</span>
        <span class="past-label">✓ ended</span>
      </article>
    `;
    }

    return `
      <article class="event-card ${personClass}${!past && conflicts.has(event.id) ? " has-conflict" : ""}${current ? " is-now" : ""}${past ? " is-past" : ""}">
        <div class="event-time">
          <strong>${escapeHTML(event.displayStart || formatTime(event.start))}</strong>
          <span>to ${escapeHTML(event.displayEnd || formatTime(event.end))}</span>
          ${past ? `<span class="past-label">✓ ended</span>` : ""}
        </div>
        <div class="event-body">
          <h4>${escapeHTML(event.title)}</h4>
          ${event.subtitle ? `<p class="event-subtitle">${escapeHTML(event.subtitle)}</p>` : ""}
          <p class="event-meta">
            <span>${escapeHTML(event.type)}</span>
            <span>${escapeHTML(event.location)}</span>
            <a class="official-link" href="${escapeAttribute(href)}" target="_blank" rel="noreferrer">Details ↗</a>
          </p>
          <p class="event-note">${escapeHTML(event.note)}</p>
        </div>
        ${event.showInterest === false ? "" : `
          <div class="interest-graph" aria-label="Appeal levels">
            <span class="interest-title">Appeal</span>
            ${data.travelers.map((traveler) => renderInterestRow(event, traveler)).join("")}
          </div>
        `}
      </article>
    `;
  }

  function renderInterestRow(event, traveler) {
    const level = interestLevel(event, traveler.id);
    const segments = Array.from({ length: 4 }, (_, index) => `<i class="${index < level ? "filled" : ""}"></i>`).join("");
    return `
      <div class="interest-row person-${escapeAttribute(traveler.id)}">
        <span class="interest-name">${escapeHTML(traveler.label)}</span>
        <span class="interest-track" role="img" aria-label="${escapeAttribute(`${traveler.label}: ${interestLabels[level]}, ${level} of 4`)}" title="${escapeAttribute(interestLabels[level])}">${segments}</span>
      </div>
    `;
  }

  function matchesFilters(event) {
    const personMatches = state.person === "both" || interestLevel(event, state.person) > 0;
    const selectedDay = resolvedDay();
    const dayMatches = selectedDay === "all" || event.date === selectedDay;
    const scopeMatches = state.scope === "all"
      || (state.scope === "priority" && priorityInterest(event) >= 3)
      || (state.scope === "shared" && interestLevel(event, "me") > 0 && interestLevel(event, "brother") > 0);
    return personMatches && dayMatches && scopeMatches;
  }

  function priorityInterest(event) {
    if (state.person !== "both") return interestLevel(event, state.person);
    return Math.max(...data.travelers.map((traveler) => interestLevel(event, traveler.id)));
  }

  function interestLevel(event, travelerID) {
    const explicit = event.interest?.[travelerID];
    if (Number.isInteger(explicit)) return Math.max(0, Math.min(4, explicit));
    if (!event.people.includes(travelerID)) return 0;
    return statusInterest[event.status] ?? 0;
  }

  function conflictIDs(events) {
    const conflicts = new Set();
    const byDay = Object.groupBy
      ? Object.groupBy(events, (event) => event.date)
      : events.reduce((groups, event) => ({ ...groups, [event.date]: [...(groups[event.date] || []), event] }), {});

    Object.values(byDay).forEach((dayEvents) => {
      dayEvents.forEach((event, index) => {
        dayEvents.slice(index + 1).forEach((other) => {
          if (event.status === "drop-in" || other.status === "drop-in") return;
          const sharedPerson = data.travelers.some((traveler) =>
            interestLevel(event, traveler.id) > 0 && interestLevel(other, traveler.id) > 0
          );
          const overlaps = timeToMinutes(event.start) < timeToMinutes(other.end)
            && timeToMinutes(other.start) < timeToMinutes(event.end);
          if (sharedPerson && overlaps) {
            conflicts.add(event.id);
            conflicts.add(other.id);
          }
        });
      });
    });
    return conflicts;
  }

  function writeURL() {
    const url = new URL(window.location.href);
    url.searchParams.set("person", state.person);
    url.searchParams.set("scope", state.scope);
    if (state.day === "auto") url.searchParams.delete("day");
    else url.searchParams.set("day", state.day);
    window.history.replaceState({}, "", url);
  }

  function currentItineraryDay() {
    const today = dateInTimeZone(effectiveNow(), data.conference.timeZone);
    return data.days.some((day) => day.date === today) ? today : null;
  }

  function effectiveNow() {
    const previewValue = new URLSearchParams(window.location.search).get("previewTime");
    if (!previewValue) return new Date();
    const previewDate = new Date(previewValue);
    return Number.isNaN(previewDate.getTime()) ? new Date() : previewDate;
  }

  function eventHasEnded(event, today, nowMinutes) {
    if (event.date < today) return true;
    if (event.date > today) return false;
    return timeToMinutes(event.end) <= nowMinutes;
  }

  function resolvedDay() {
    return state.day === "auto" ? currentItineraryDay() || "all" : state.day;
  }

  function isDayPressed(value) {
    if (value === "all" && state.day === "auto" && !currentItineraryDay()) return true;
    return state.day === value;
  }

  function dateInTimeZone(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date);
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${value.year}-${value.month}-${value.day}`;
  }

  function minutesInTimeZone(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(date);
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return Number(value.hour) * 60 + Number(value.minute);
  }

  function timeToMinutes(value) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  }

  function formatTime(value) {
    const [hours, minutes] = value.split(":").map(Number);
    const suffix = hours >= 12 ? "p" : "a";
    const hour = hours % 12 || 12;
    return `${hour}:${String(minutes).padStart(2, "0")}${suffix}`;
  }

  function plural(count, word) {
    return count === 1 ? word : `${word}s`;
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHTML(value);
  }
})();
