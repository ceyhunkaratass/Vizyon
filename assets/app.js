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

function renderContacts(contacts) {
  const items = contacts.filter((c) => c && /^https:\/\//i.test(c.url || ""));
  if (items.length === 0) return;
  document.querySelector("#contact-list").innerHTML = items
    .map((c) => {
      const shown = c.text || c.url.replace(/^https:\/\//i, "").replace(/\/$/, "");
      return `<li><span class="contact-label">${esc(c.label)}</span><a class="contact-value" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(shown)} <span class="arrow" aria-hidden="true">↗</span></a></li>`;
    })
    .join("");
  document.querySelector("#iletisim").hidden = false;
  document.querySelectorAll("#nav-contact, .nav-contact-m").forEach((a) => (a.hidden = false));
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
    if (/^https:\/\//i.test(url)) {
      const link = document.querySelector("#idea-link");
      link.href = url;
      link.hidden = false;
    }
    renderContacts(site.contacts || []);
    setupIdeaForm(site.ideaFormKey);
  })
  .catch(() => {});

function setupIdeaForm(key) {
  key = (key || "").trim();
  if (!/^[0-9a-f-]{20,}$/i.test(key)) return;

  const form = document.querySelector("#idea-form");
  const status = document.querySelector("#idea-status");
  const submit = document.querySelector("#idea-submit");
  document.querySelector(".closing").classList.add("closing--form");
  document.querySelector(".closing-lead").hidden = false;
  document.querySelector("#idea-link").hidden = true;
  form.hidden = false;

  const say = (text, kind) => {
    status.textContent = text;
    status.dataset.kind = kind || "";
  };

  const dialog = document.querySelector("#kvkk-dialog");
  document.querySelector("#kvkk-open").addEventListener("click", () => dialog.showModal());
  document.querySelector("#kvkk-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = form.name.value.trim().replace(/\s+/g, " ");
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    const fail = (field, text) => {
      form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
      field.setAttribute("aria-invalid", "true");
      say(text, "error");
      field.focus();
    };
    if (name.split(" ").filter((part) => part.length > 1).length < 2) return fail(form.name, "Adını ve soyadını birlikte yazar mısın?");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return fail(form.email, "Geçerli bir e-posta adresi yazar mısın? Sana bu adresten dönebiliriz.");
    if (message.length < 10) return fail(form.message, "Fikrini biraz daha ayrıntılı yazar mısın? En az 10 karakter gerekli.");
    if (!form.consent.checked) return fail(form.consent, "Göndermek için aydınlatma metnini okuyup onay kutusunu işaretlemen gerekiyor.");
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));

    if (form.botcheck.checked) {
      say("Teşekkürler!", "ok");
      return;
    }

    const payload = {
      access_key: key,
      subject: "Vizyoner Gençlik sitesinden yeni fikir",
      from_name: "Vizyoner Gençlik sitesi",
      name,
      email,
      message,
      consent: "KVKK aydınlatma metni okundu, açık rıza verildi",
    };

    submit.disabled = true;
    say("Gönderiliyor…");
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const raw = await response.text();
      let result = {};
      try {
        result = JSON.parse(raw);
      } catch (parseError) {
        result = {};
      }
      if (!response.ok || !result.success) {
        const reason = result.message || `sunucu yanıtı ${response.status}`;
        const failure = new Error(reason);
        failure.fromServer = true;
        throw failure;
      }
      form.reset();
      say("Fikrin bize ulaştı, teşekkürler! Her mesajı okuyoruz.", "ok");
    } catch (error) {
      console.error("Fikir formu gönderilemedi:", error);
      if (error.fromServer) {
        say(`Gönderilemedi: ${error.message}. Bu mesajı topluluk yöneticisine iletirsen düzeltiriz.`, "error");
      } else {
        say("Sunucuya ulaşılamadı. İnternet bağlantını ya da reklam engelleyiciyi kontrol edip tekrar dene.", "error");
      }
    } finally {
      submit.disabled = false;
    }
  });
}
