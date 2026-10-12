const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

const upcomingEl = document.querySelector("#upcoming-list");
const archiveGrid = document.querySelector("#archive-grid");
const filtersEl = document.querySelector("#archive-filters");
const searchInput = document.querySelector("#archive-search");
const emptyState = document.querySelector("#empty-state");
const sampleNote = document.querySelector("#sample-note");

let activeCategory = "all";
let labels = {};
let archiveCards = [];

function renderUpcoming(events) {
  upcomingEl.innerHTML = events
    .map(
      (e) => `
      <article class="event-card" data-reveal>
        <div class="event-photo">
          <img src="${esc(e.image)}" alt="${esc(e.alt)}" loading="lazy">
          <span class="date-tag"><strong>${esc(e.day)}</strong><span>${esc(e.month)}${e.sample ? " · ÖRNEK" : ""}</span></span>
        </div>
        <p class="event-meta"><span>${esc(labels[e.category] || e.category)}</span><span>${esc(e.location)}</span></p>
        <h3>${esc(e.title)}</h3>
        <p class="event-description">${esc(e.description)}</p>
      </article>`
    )
    .join("");
}

function renderArchive(events) {
  archiveGrid.innerHTML = events
    .map((e) => {
      const label = labels[e.category] || e.category;
      const searchText = [e.title, e.description, label, e.date].join(" ");
      return `
      <article class="archive-card" data-category="${esc(e.category)}" data-search="${esc(searchText)}">
        <div class="archive-photo"><img src="${esc(e.image)}" alt="${esc(e.alt)}" loading="lazy"></div>
        <p class="event-meta"><span>${esc(e.date)}${e.sample ? " · Örnek tarih" : ""}</span><span>${esc(label)}</span></p>
        <h3>${esc(e.title)}</h3>
        <p class="event-description">${esc(e.description)}</p>
      </article>`;
    })
    .join("");
  archiveCards = [...archiveGrid.querySelectorAll(".archive-card")];
}

function renderFilters(categories) {
  const all = [{ id: "all", label: "Tümü" }, ...categories];
  filtersEl.innerHTML = all
    .map((c) => `<button class="filter-button" type="button" data-filter="${esc(c.id)}" aria-pressed="${c.id === "all"}">${esc(c.label)}</button>`)
    .join("");
  filtersEl.querySelectorAll(".filter-button").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.filter;
      filtersEl.querySelectorAll(".filter-button").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      filterArchive();
    });
  });
}

function filterArchive() {
  const query = searchInput.value.trim().toLocaleLowerCase("tr");
  let visible = 0;
  archiveCards.forEach((card) => {
    const okCategory = activeCategory === "all" || card.dataset.category === activeCategory;
    const okSearch = card.dataset.search.toLocaleLowerCase("tr").includes(query);
    card.hidden = !(okCategory && okSearch);
    if (!card.hidden) visible += 1;
  });
  emptyState.textContent = "Bu aramayla eşleşen bir buluşma bulunamadı.";
  emptyState.classList.toggle("is-visible", visible === 0 && archiveCards.length > 0);
}

function setupReveal() {
  const items = document.querySelectorAll("[data-reveal]:not(.is-visible)");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((item) => observer.observe(item));
  } else {
    items.forEach((item) => item.classList.add("is-visible"));
  }
}

function showLoadError() {
  const message = "Etkinlikler şu an yüklenemedi. Sayfayı bir web sunucusu üzerinden açtığınızdan emin olun.";
  upcomingEl.innerHTML = `<p class="event-description">${message}</p>`;
  emptyState.textContent = message;
  emptyState.classList.add("is-visible");
}

searchInput.addEventListener("input", filterArchive);

fetch("data/events.json")
  .then((response) => {
    if (!response.ok) throw new Error(response.status);
    return response.json();
  })
  .then((data) => {
    labels = Object.fromEntries(data.categories.map((c) => [c.id, c.label]));
    renderFilters(data.categories);
    renderUpcoming(data.upcoming);
    renderArchive(data.archive);
    sampleNote.hidden = !data.archive.some((e) => e.sample);
    filterArchive();
  })
  .catch(showLoadError)
  .finally(setupReveal);
