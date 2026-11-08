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

const safeSrc = (src) => /^(https:\/\/|assets\/)/.test(src || "");
let archiveGalleries = [];

function renderArchive(events) {
  archiveGalleries = [];
  archiveGrid.innerHTML = events
    .map((e, index) => {
      const searchText = [e.title, e.description, e.type, e.date, e.location].join(" ");
      const extra = (e.gallery || []).filter((g) => g && safeSrc(g.src));
      const hasGallery = extra.length > 0 && safeSrc(e.image);
      archiveGalleries[index] = hasGallery
        ? [{ src: e.image, alt: e.alt || e.title, caption: e.coverCaption || e.title }, ...extra.map((g) => ({ src: g.src, alt: g.alt || g.caption || e.title, caption: g.caption || "" }))]
        : [];
      const count = archiveGalleries[index].length;
      const cover = hasGallery
        ? `<div class="photo-stack"><button class="archive-photo archive-photo--button" type="button" data-event="${index}" data-photo="0" aria-label="Fotoğrafları görüntüle (${count} fotoğraf)"><img src="${esc(e.image)}" alt="${esc(e.alt || e.title)}" loading="lazy"><span class="photo-count" aria-hidden="true">${count} fotoğraf</span></button></div>`
        : photo("archive-photo", e);
      return `
      <article class="archive-card${hasGallery ? " archive-card--feature" : ""}" data-reveal data-search="${esc(searchText)}">
        ${cover}
        <div class="archive-body">
          ${meta([e.date, e.type])}
          <h3>${esc(e.title)}</h3>
          <p class="event-description">${esc(e.description)}</p>
          ${hasGallery ? `<button class="text-link gallery-open" type="button" data-event="${index}" data-photo="0">${esc(e.galleryTitle || "Etkinlikten kareler")} (${count}) <span class="arrow" aria-hidden="true">→</span></button>` : ""}
        </div>
      </article>`;
    })
    .join("");
  archiveCards = [...archiveGrid.querySelectorAll(".archive-card")];
  archiveGrid.hidden = events.length === 0;
  archiveEmpty.hidden = events.length > 0;
  searchBox.hidden = events.length === 0;
}

const lightbox = document.querySelector("#lightbox");
let lbItems = [];
let lbIndex = 0;

function showLightbox(i) {
  lbIndex = (i + lbItems.length) % lbItems.length;
  const item = lbItems[lbIndex];
  const img = lightbox.querySelector(".lightbox-img");
  img.src = item.src;
  img.alt = item.alt;
  lightbox.querySelector(".lightbox-caption").textContent = item.caption ? `${item.caption} (${lbIndex + 1}/${lbItems.length})` : `${lbIndex + 1}/${lbItems.length}`;
}

archiveGrid.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-photo]");
  if (!trigger) return;
  lbItems = archiveGalleries[Number(trigger.dataset.event)] || [];
  if (lbItems.length === 0) return;
  showLightbox(Number(trigger.dataset.photo));
  lightbox.showModal();
});

if (lightbox) {
  lightbox.querySelector(".lightbox-close").addEventListener("click", () => lightbox.close());
  lightbox.querySelector(".lightbox-prev").addEventListener("click", () => showLightbox(lbIndex - 1));
  lightbox.querySelector(".lightbox-next").addEventListener("click", () => showLightbox(lbIndex + 1));
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") showLightbox(lbIndex - 1);
    if (event.key === "ArrowRight") showLightbox(lbIndex + 1);
  });
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

const CONTACT_ICONS = {
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-4.2A8 8 0 1 1 8.4 18.8L4 20z"/><path d="M9.2 8.6c.2-.4.5-.4.8-.3l.7 1.5c.1.3 0 .5-.2.7l-.5.6c.7 1.3 1.8 2.3 3.1 3l.7-.7c.2-.2.5-.2.7-.1l1.4.7c.3.2.3.5.2.8-.4 1-1.5 1.5-2.5 1.2-2.5-.7-4.5-2.7-5.3-5.2-.2-.8 0-1.6.9-2.2z" fill="currentColor" stroke="none"/></svg>',
  uye: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19c.4-3.2 2.6-5 5.5-5s5.1 1.8 5.5 5"/><path d="M16 5.6a3 3 0 0 1 0 5.8M17.5 14.4c2 .5 3.2 2.1 3.5 4.6"/></svg>',
  web: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5z"/></svg>',
};

function renderContacts(contacts) {
  const items = contacts.filter((c) => c && /^https:\/\//i.test(c.url || ""));
  if (items.length === 0) return;
  document.querySelector("#contact-list").innerHTML = items
    .map((c) => {
      const shown = c.text || c.url.replace(/^https:\/\//i, "").replace(/\/$/, "");
      const icon = CONTACT_ICONS[c.type] || CONTACT_ICONS.web;
      return `<li><a class="contact-card${c.featured ? " contact-card--featured" : ""}" href="${esc(c.url)}" target="_blank" rel="noopener"><span class="contact-icon">${icon}</span><span class="contact-text"><span class="contact-label">${esc(c.label)}</span><span class="contact-value">${esc(shown)}</span></span><span class="arrow" aria-hidden="true">↗</span></a></li>`;
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
    const member = (site.memberUrl || "").trim();
    if (/^https:\/\//i.test(member)) {
      const cta = document.querySelector("#member-cta");
      cta.href = member;
      cta.hidden = false;
    }
    renderContacts(site.contacts || []);
    setupIdeaForm(site.ideaFormKey, (site.ideaEndpoint || "").trim());
  })
  .catch(() => {});

// Bilinen e-posta sağlayıcıları ve yaygın yazım hataları
const KNOWN_DOMAINS = [
  "gmail.com", "googlemail.com",
  "outlook.com", "outlook.com.tr", "hotmail.com", "hotmail.com.tr", "live.com", "msn.com",
  "yahoo.com", "yahoo.com.tr", "ymail.com",
  "icloud.com", "me.com", "mac.com",
  "yandex.com", "yandex.com.tr", "yandex.ru",
  "proton.me", "protonmail.com",
  "aol.com", "gmx.com", "mail.com", "zoho.com"
];

function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function suggestDomain(domain) {
  let best = null;
  let bestDist = Infinity;
  KNOWN_DOMAINS.forEach((known) => {
    const d = levenshtein(domain, known);
    if (d < bestDist) {
      bestDist = d;
      best = known;
    }
  });
  // Uzantısı eksik yazımları yakala ("gmail" -> "gmail.com")
  if (bestDist > 2) {
    const name = domain.split(".")[0];
    KNOWN_DOMAINS.forEach((known) => {
      if (bestDist > 2 && known.split(".")[0] === name) {
        best = known;
        bestDist = 1;
      }
    });
  }
  return bestDist <= 2 ? best : null;
}

function validateEmailDomain(email) {
  const at = email.lastIndexOf("@");
  if (at < 1) return { ok: false, message: "E-posta adresinde \"@\" işareti ve kullanıcı adı olmalı (ör. ornek@gmail.com)." };

  const local = email.slice(0, at);
  const domain = email.slice(at + 1).toLowerCase();
  if (!domain) return { ok: false, message: "\"@\" işaretinden sonra sağlayıcıyı yaz (ör. @gmail.com, @outlook.com)." };

  // Geçerli biçim kontrolü
  if (!/^[A-Za-z0-9._%+-]+$/.test(local)) return { ok: false, message: "E-posta adresinin kullanıcı adı kısmında geçersiz karakter var." };
  if (!/^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(domain)) return { ok: false, message: "Geçerli bir e-posta adresi yazar mısın? Sana bu adresten dönebiliriz." };

  // Üniversite adresleri (.edu, .edu.tr) geçerli
  if (/\.edu(\.[a-z]{2})?$/.test(domain)) return { ok: true };

  // Bilinen sağlayıcılar listesinde mi?
  if (KNOWN_DOMAINS.indexOf(domain) !== -1) return { ok: true };

  // Yazım hatası var mı kontrol et
  const suggestion = suggestDomain(domain);
  if (suggestion) {
    return { ok: false, message: `\"@${domain}\" hatalı görünüyor. Şunu mu demek istedin: ${local}@${suggestion}?` };
  }

  return { ok: false, message: "Lütfen geçerli bir e-posta sağlayıcısı kullan (ör. @gmail.com, @outlook.com, @hotmail.com) ya da üniversite adresini yaz." };
}

const OTP_ERRORS = {
  bad_email: "Bu e-posta adresi kabul edilmedi. Adresi kontrol eder misin?",
  invalid_input: "Bilgilerin eksik ya da çok uzun görünüyor. Kontrol edip tekrar dener misin?",
  hour_limit: "Bu adres için saatlik kod sınırına ulaşıldı. Bir saat sonra tekrar dene.",
  daily_limit: "Bugün doğrulama kodu gönderme sınırına ulaştık. Yarın tekrar dener misin?",
  bad_code: "Kod yanlış. Kontrol edip tekrar dene.",
  expired: "Kodun süresi dolmuş. \"Kodu yeniden gönder\"e basıp yeni kod iste.",
  too_many_attempts: "Çok fazla yanlış deneme yaptın. \"Kodu yeniden gönder\"e basıp yeni kod iste.",
  server: "Şu an bir sorun oluştu. Biraz sonra tekrar dener misin?",
};

function setupIdeaForm(key, endpoint) {
  key = (key || "").trim();
  const otp = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint || "");
  if (!otp && !/^[0-9a-f-]{20,}$/i.test(key)) return;

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

  // E-posta doğrulama kodu (Apps Script) akışı
  const codeField = document.querySelector("#idea-code-field");
  const codeInput = document.querySelector("#idea-code");
  const resendBtn = document.querySelector("#idea-resend");
  const submitLabel = document.querySelector("#idea-submit-label");
  let codeSentTo = "";
  let resendTimer = null;

  const startResendCountdown = (seconds) => {
    clearInterval(resendTimer);
    let left = seconds;
    const tick = () => {
      resendBtn.disabled = left > 0;
      resendBtn.textContent = left > 0 ? `Kodu yeniden gönder (${left})` : "Kodu yeniden gönder";
      if (left <= 0) clearInterval(resendTimer);
      left -= 1;
    };
    tick();
    resendTimer = setInterval(tick, 1000);
  };

  const resetOtp = () => {
    codeSentTo = "";
    clearInterval(resendTimer);
    codeInput.value = "";
    codeField.hidden = true;
    resendBtn.disabled = true;
    submitLabel.textContent = "Doğrulama kodu gönder";
  };

  const callApi = async (payload) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  };

  const apiMessage = (result) => {
    if (result && result.error === "wait") return `Yeni kod için ${Number(result.wait) || 60} saniye beklemen gerekiyor.`;
    return OTP_ERRORS[result && result.error] || OTP_ERRORS.server;
  };

  if (otp) {
    document.querySelector("#kvkk-otp").hidden = false;
    document.querySelector("#kvkk-w3f").hidden = true;
    submitLabel.textContent = "Doğrulama kodu gönder";
    form.email.addEventListener("input", () => {
      if (codeSentTo && form.email.value.trim().toLowerCase() !== codeSentTo) {
        resetOtp();
        say("");
      }
    });
  }

  const dialog = document.querySelector("#kvkk-dialog");
  document.querySelector("#kvkk-open").addEventListener("click", () => dialog.showModal());
  document.querySelector("#kvkk-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  resendBtn.addEventListener("click", () => {
    const name = form.name.value.trim().replace(/\s+/g, " ");
    const email = form.email.value.trim();
    if (!email || name.split(" ").filter((part) => part.length > 1).length < 2) return say("Önce adını, soyadını ve e-postanı yaz.", "error");
    codeSentTo = "";
    form.requestSubmit();
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

    // E-posta doğrulaması: biçim + sağlayıcı kontrolü
    const emailCheck = validateEmailDomain(email);
    if (!emailCheck.ok) return fail(form.email, emailCheck.message);

    if (message.length < 10) return fail(form.message, "Fikrini biraz daha ayrıntılı yazar mısın? En az 10 karakter gerekli.");
    if (!form.consent.checked) return fail(form.consent, "Göndermek için aydınlatma metnini okuyup onay kutusunu işaretlemen gerekiyor.");
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));

    if (form.botcheck.checked) {
      say("Teşekkürler!", "ok");
      return;
    }

    if (otp) {
      const normalized = email.toLowerCase();
      submit.disabled = true;
      try {
        if (codeSentTo !== normalized) {
          say("Doğrulama kodu gönderiliyor…");
          const sent = await callApi({ action: "send_code", name, email });
          if (!sent.ok) {
            if (sent.error === "wait") startResendCountdown(Number(sent.wait) || 60);
            return fail(form.email, apiMessage(sent));
          }
          codeSentTo = normalized;
          codeField.hidden = false;
          submitLabel.textContent = "Fikrimi gönder";
          startResendCountdown(60);
          say("Doğrulama kodunu e-postana gönderdik. Kodu yazıp \"Fikrimi gönder\"e bas.", "ok");
          codeInput.focus();
          return;
        }
        const code = codeInput.value.trim();
        if (!/^\d{6}$/.test(code)) return fail(codeInput, "E-postana gelen 6 haneli kodu yazar mısın?");
        say("Gönderiliyor…");
        const result = await callApi({ action: "submit", name, email, message, code, consent: "KVKK aydınlatma metni okundu, açık rıza verildi" });
        if (!result.ok) {
          if (result.error === "bad_code") return fail(codeInput, apiMessage(result));
          if (result.error === "expired" || result.error === "too_many_attempts") {
            codeInput.value = "";
            startResendCountdown(0);
          }
          return say(apiMessage(result), "error");
        }
        form.reset();
        resetOtp();
        say("Fikrin bize ulaştı, teşekkürler! Her mesajı okuyoruz.", "ok");
      } catch (error) {
        console.error("Fikir formu gönderilemedi:", error);
        say("Sunucuya ulaşılamadı. İnternet bağlantını ya da reklam engelleyiciyi kontrol edip tekrar dene.", "error");
      } finally {
        submit.disabled = false;
      }
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
