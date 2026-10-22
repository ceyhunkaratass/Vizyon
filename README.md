# Vizyoner Gençlik

Malatya Turgut Özal Üniversitesi öğrenci topluluğu Vizyoner Gençlik'in tanıtım sitesi.

## Yapı

```
index.html          Sayfa içeriği (amaç, değerler, yaklaşım, akademik yapı)
assets/style.css    Tüm stiller
assets/logo.png     Topluluk logosu (üst/alt köşe ve sekme simgesi)
assets/hero-logo.jpg Ana sayfadaki büyük logo
assets/app.js       Etkinlik kartlarını ve arşiv aramasını üretir
data/events.json    Yaklaşan etkinlikler ve arşiv
```

## Etkinlik eklemek

`data/events.json` dosyasını düzenleyin; sayfada başka bir şey değiştirmenize gerek yok. Liste boşken sayfada "yakında duyurulacak" yazısı görünür.

`upcoming` (yaklaşan) kaydı örneği:

```json
{
  "title": "Etkinlik adı",
  "day": "24",
  "month": "EKİ",
  "type": "Atölye",
  "time": "Cumartesi · 10:00",
  "location": "Malatya Turgut Özal Üniversitesi",
  "description": "Kısa açıklama.",
  "image": "assets/etkinlik.jpg",
  "alt": "Fotoğrafın açıklaması"
}
```

`archive` (geçmiş) kaydında `day` ve `month` yerine `"date": "Mayıs 2026"` yazılır. `type`, `time`, `location`, `image`, `alt`, `link` ve `linkLabel` isteğe bağlıdır; fotoğraf yoksa kart yazıyla görünür. Arşivdeki arama kutusu etkinlik eklenince kendiliğinden belirir.

## Fikir formu bağlantısı

Sayfa sonundaki "Fikrini bize yaz" bağlantısı, `data/site.json` içindeki `ideaFormUrl` doluyken görünür. Örneğin bir Google Formlar adresi yazın (`https://` ile başlamalı); boş bırakırsanız bağlantı gizli kalır.

## Yerelde çalıştırma

Etkinlikler `fetch` ile yüklendiği için sayfa dosyaya çift tıklayarak değil, bir web sunucusuyla açılmalıdır:

```
python3 -m http.server 8000
```

Ardından `http://localhost:8000` adresini açın. GitHub Pages gibi statik barındırmada ek ayar gerekmez.
