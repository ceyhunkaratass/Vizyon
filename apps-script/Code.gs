/**
 * Vizyoner Gençlik fikir kutusu: e-posta doğrulama kodu + fikrin iletilmesi.
 *
 * Kurulum için README.md'deki "E-posta doğrulamalı fikir formu" bölümüne bak.
 * ÖNEMLİ: Aşağıdaki RECIPIENT adresini yalnızca Apps Script editöründe yaz,
 * GitHub'a gönderme.
 */
const CONFIG = {
  RECIPIENT: "BURAYA_TOPLULUK_MAILI@ornek.com", // fikirlerin geleceği adres
  SENDER_NAME: "Vizyoner Gençlik",
  CODE_TTL_SEC: 600,                 // kod 10 dakika geçerli
  MAX_ATTEMPTS: 5,                   // bir kod için en fazla yanlış deneme
  RESEND_WAIT_SEC: 60,               // aynı adrese iki kod arası bekleme
  MAX_CODES_PER_EMAIL_PER_HOUR: 5,   // aynı adrese saatte en fazla kod
  DAILY_CODE_LIMIT: 60,              // günlük toplam kod sınırı (Gmail kotasını korur)
  MIN_QUOTA_RESERVE: 6,              // Gmail kotasında en az bu kadar hak bırak
  TIME_ZONE: "Europe/Istanbul",
};

function doGet() {
  return json_({ ok: true, service: "vizyoner-genclik-fikir-kutusu" });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return json_({ ok: false, error: "server" });
  }
  try {
    let body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (err) {
      return json_({ ok: false, error: "invalid_input" });
    }
    if (body && body.action === "send_code") return sendCode_(body);
    if (body && body.action === "submit") return submitIdea_(body);
    return json_({ ok: false, error: "invalid_input" });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: "server" });
  } finally {
    lock.releaseLock();
  }
}

function sendCode_(body) {
  const name = cleanName_(body.name);
  const email = cleanEmail_(body.email);
  if (!email) return json_({ ok: false, error: "bad_email" });
  if (!name) return json_({ ok: false, error: "invalid_input" });

  const cache = CacheService.getScriptCache();
  const now = Date.now();

  const last = Number(cache.get("t:" + email) || 0);
  const wait = Math.ceil(CONFIG.RESEND_WAIT_SEC - (now - last) / 1000);
  if (last && wait > 0) return json_({ ok: false, error: "wait", wait: wait });

  const hourCount = Number(cache.get("h:" + email) || 0);
  if (hourCount >= CONFIG.MAX_CODES_PER_EMAIL_PER_HOUR) return json_({ ok: false, error: "hour_limit" });

  const dayKey = "d:" + Utilities.formatDate(new Date(), CONFIG.TIME_ZONE, "yyyy-MM-dd");
  const dayCount = Number(cache.get(dayKey) || 0);
  if (dayCount >= CONFIG.DAILY_CODE_LIMIT || MailApp.getRemainingDailyQuota() < CONFIG.MIN_QUOTA_RESERVE) {
    return json_({ ok: false, error: "daily_limit" });
  }

  const code = String(100000 + Math.floor(Math.random() * 900000));
  try {
    MailApp.sendEmail({
      to: email,
      subject: "Vizyoner Gençlik doğrulama kodun: " + code,
      body:
        "Merhaba " + name + ",\n\n" +
        "Vizyoner Gençlik fikir kutusu için doğrulama kodun:\n\n    " + code + "\n\n" +
        "Bu kod " + Math.round(CONFIG.CODE_TTL_SEC / 60) + " dakika geçerlidir. " +
        "Kodu sen istemediysen bu e-postayı görmezden gelebilirsin.\n\n" +
        "Vizyoner Gençlik",
      name: CONFIG.SENDER_NAME,
    });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: "server" });
  }

  cache.put("c:" + email, JSON.stringify({ code: code, attempts: 0 }), CONFIG.CODE_TTL_SEC);
  cache.put("t:" + email, String(now), CONFIG.RESEND_WAIT_SEC);
  cache.put("h:" + email, String(hourCount + 1), 3600);
  cache.put(dayKey, String(dayCount + 1), 86400);
  return json_({ ok: true });
}

function submitIdea_(body) {
  const name = cleanName_(body.name);
  const email = cleanEmail_(body.email);
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!email) return json_({ ok: false, error: "bad_email" });
  if (!name || message.length < 10 || message.length > 1500 || !/^\d{6}$/.test(code) || !body.consent) {
    return json_({ ok: false, error: "invalid_input" });
  }

  const cache = CacheService.getScriptCache();
  const raw = cache.get("c:" + email);
  if (!raw) return json_({ ok: false, error: "expired" });
  const entry = JSON.parse(raw);

  if (entry.code !== code) {
    entry.attempts += 1;
    if (entry.attempts >= CONFIG.MAX_ATTEMPTS) {
      cache.remove("c:" + email);
      return json_({ ok: false, error: "too_many_attempts" });
    }
    cache.put("c:" + email, JSON.stringify(entry), CONFIG.CODE_TTL_SEC);
    return json_({ ok: false, error: "bad_code" });
  }
  cache.remove("c:" + email); // kod tek kullanımlık

  try {
    MailApp.sendEmail({
      to: CONFIG.RECIPIENT,
      replyTo: email,
      subject: "Vizyoner Gençlik sitesinden yeni fikir: " + name,
      body:
        "Ad soyad: " + name + "\n" +
        "E-posta (doğrulandı): " + email + "\n" +
        "Onay: KVKK aydınlatma metni okundu, açık rıza verildi\n" +
        "Tarih: " + Utilities.formatDate(new Date(), CONFIG.TIME_ZONE, "dd.MM.yyyy HH:mm") + "\n\n" +
        message,
      name: CONFIG.SENDER_NAME,
    });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: "server" });
  }
  return json_({ ok: true });
}

function cleanName_(value) {
  if (typeof value !== "string") return "";
  const name = value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
  return name.length >= 3 && name.length <= 80 ? name : "";
}

function cleanEmail_(value) {
  if (typeof value !== "string") return "";
  const email = value.trim().toLowerCase();
  if (email.length > 120 || !/^[^@\s,;<>"']+@[^@\s,;<>"']+\.[^@\s,;<>"']{2,}$/.test(email)) return "";
  return email;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
