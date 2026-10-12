# Genç Vizyoner

Malatya Turgut Özal Üniversitesi öğrenci topluluğu Genç Vizyoner'in tanıtım sitesi.

## Yapı

```
index.html          Sayfa içeriği (amaç, değerler, kültür, akademik yapı)
assets/style.css    Tüm stiller
assets/app.js       Etkinlik kartlarını ve arşiv filtresini üretir
data/events.json    Yaklaşan etkinlikler ve arşiv
```

## Etkinlik eklemek

`data/events.json` dosyasını düzenleyin; sayfada başka bir şey değiştirmenize gerek yok.

- `upcoming`: yaklaşan etkinlikler (`day`, `month`, `location` alanlarıyla)
- `archive`: geçmiş etkinlikler (`date` alanıyla, örn. `"Mayıs"`)
- `categories`: filtre düğmeleri; yeni tür eklemek için buraya `id` ve `label` ekleyin
- Gerçek etkinliklerde `"sample": true` satırını silin; "ÖRNEK" etiketleri kaybolur

Şu an tüm etkinlikler örnek içeriktir.

## Fikir formu bağlantısı

Sayfa sonundaki "Fikrini bize yaz" bağlantısı, `data/site.json` içindeki `ideaFormUrl` doluyken görünür. Örneğin bir Google Formlar adresi yazın (`https://` ile başlamalı); boş bırakırsanız bağlantı gizli kalır.

## Yerelde çalıştırma

Etkinlikler `fetch` ile yüklendiği için sayfa dosyaya çift tıklayarak değil, bir web sunucusuyla açılmalıdır:

```
python3 -m http.server 8000
```

Ardından `http://localhost:8000` adresini açın. GitHub Pages gibi statik barındırmada ek ayar gerekmez.
