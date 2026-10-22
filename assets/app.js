const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

const upcomingEl = document.querySelector("#upcoming-list");
const upcomingEmpty = document.querySelector("#upcoming-empty");
const archiveGrid = document.querySelector("#archive-grid");
const archiveEmpty = document.querySelector("#archive-empty");
const searchBox = document.querySelector("#archive-controls");
const searchInput = document.querySelector("#archive-search");
const searchEmpty = document.querySelector("#search-empty");

let archiveCards = [];

function photo(className, event, extra = "") {
  if (!event.image) return "";
  return `<div class="${className}"><img src="${esc(event.image)}" alt="${esc(event.alt || event.title)}" loading="lazy">${extra}</div>`;
}

function meta(parts) {
  const items = parts.filter(Boolean).map((p) => `<span>${esc(p)}</span>`).join("");
  return items ? `<p class="event-meta">${items}</p>` : "";
}

function renderUpcoming(events) {
  upcomingEl.innerHTML = events
    .map((e) => {
      const tag = e.day ? `<span class="date-tag"><strong>${esc(e.day)}</strong><span>${esc(e.month)}</span></span>` : "";
      return `
      <article class="event-card" data-reveal>
        ${photo("event-photo", e, tag)}
        <div class="event-body">
          ${meta([e.type, e.time, e.location])}
          <h3>${esc(e.title)}</h3>
          <p class="event-description">${esc(e.description)}</p>
          ${e.link && /^(https:\/\/|assets\/)/.test(e.link) ? `<a class="text-link event-link" href="${esc(e.link)}" target="_blank" rel="noopener">${esc(e.linkLabel || "Ayrıntılar")} <span class="arrow" aria-hidden="true">↗</span></a>` : ""}
        </div>
      </article>`;
    })
    .join("");
  upcomingEl.classList.toggle("upcoming--single", events.length === 1);
  upcomingEl.hidden = events.length === 0;
  upcomingEmpty.hidden = events.length > 0;
}

function renderArchive(events) {
  archiveGrid.innerHTML = events
    .map((e) => {
      const searchText = [e.title, e.description, e.type, e.date, e.location].join(" ");
      return `
      <article class="archive-card" data-reveal data-search="${esc(searchText)}">
        ${photo("archive-photo", e)}
        ${meta([e.date, e.type])}
        <h3>${esc(e.title)}</h3>
        <p class="event-description">${esc(e.description)}</p>
      </article>`;
    })
    .join("");
  archiveCards = [...archiveGrid.querySelectorAll(".archive-card")];
  archiveGrid.hidden = events.length === 0;
  archiveEmpty.hidden = events.length > 0;
  searchBox.hidden = events.length === 0;
}

function filterArchive() {
  const query = searchInput.value.trim().toLocaleLowerCase("tr");
  let visible = 0;
  archiveCards.forEach((card) => {
    card.hidden = !card.dataset.search.toLocaleLowerCase("tr").includes(query);
    if (!card.hidden) visible += 1;
  });
  searchEmpty.hidden = !(archiveCards.length > 0 && visible === 0);
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
  const message = "Etkinlikler şu an yüklenemedi. Lütfen sayfayı daha sonra yeniden açın.";
  upcomingEl.hidden = true;
  upcomingEmpty.textContent = message;
  upcomingEmpty.hidden = false;
  archiveGrid.hidden = true;
  searchBox.hidden = true;
}

searchInput.addEventListener("input", filterArchive);

fetch("data/events.json")
  .then((response) => {
    if (!response.ok) throw new Error(response.status);
    return response.json();
  })
  .then((data) => {
    renderUpcoming(data.upcoming || []);
    renderArchive(data.archive || []);
  })
  .catch(showLoadError)
  .finally(setupReveal);

fetch("data/site.json")
  .then((response) => (response.ok ? response.json() : {}))
  .then((site) => {
    const url = (site.ideaFormUrl || "").trim();
    if (!/^https:\/\//i.test(url)) return;
    const link = document.querySelector("#idea-link");
    link.href = url;
    link.hidden = false;
  })
  .catch(() => {});
