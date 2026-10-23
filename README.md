# Vizyoner Gençlik

Malatya Turgut Özal Üniversitesi öğrenci topluluğu Vizyoner Gençlik'in tanıtım sitesi.

## Yapı

```
index.html          Sayfa içeriği (amaç, değerler, yaklaşım, akademik yapı)
assets/style.css    Tüm stiller
assets/logo.png     Topluluk logosu (üst/alt köşe ve sekme simgesi)
assets/hero-logo.jpg Ana sayfadaki büyük logo
assets/fonts/       Sitenin kendi yazı tipleri (DM Sans, Space Grotesk, Dancing Script; SIL OFL 1.1)
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

## Fikir formu (sitenin içinde)

Sayfa sonundaki "Fikrini gönder" formu [Web3Forms](https://web3forms.com) ile çalışır: gönderilen fikirler e-postanıza düşer. Açmak için:

1. web3forms.com'da e-posta adresinizi yazın, "Create your Access Key" deyin. Anahtar e-postanıza gelir.
2. Anahtarı `data/site.json` içindeki `ideaFormKey` alanına yazın.

Formda KVKK onay kutusu ve "Aydınlatma metni" bağlantısıyla açılan bir pencere vardır (metin `index.html` içinde, `#kvkk-dialog` bölümünde; veri sorumlusu bilgisini ve saklama süresini kendi topluluğunuza göre gözden geçirin). Onay kutusu işaretlenmeden form gönderilmez.

Anahtar boşken form gizli kalır. Bu anahtar sitede herkese açık durmak üzere tasarlanmıştır, gizli bir şifre değildir.

## Eski fikir formu bağlantısı

Form anahtarı (`ideaFormKey`) boşken, sayfa sonunda `data/site.json` içindeki `ideaFormUrl` adresine giden "Fikrini bize yaz" bağlantısı görünür (örneğin bir Google Formlar adresi, `https://` ile başlamalı). Anahtar girilince form açılır ve bu bağlantı gizlenir. İkisi de boşsa fikir bölümünde yalnızca etkinlik butonu kalır.

## İletişim bölümü

"İletişim" bölümü `data/site.json` içindeki `contacts` listesinden oluşur. Yeni bağlantı eklemek için listeye bir satır yazın (adres `https://` ile başlamalı, `text` isteğe bağlıdır):

```json
{ "label": "Instagram", "url": "https://www.instagram.com/vizyonergenclik/", "text": "@vizyonergenclik" }
```

Liste boşsa bölüm ve menü bağlantısı gizli kalır.

## Yerelde çalıştırma

Etkinlikler `fetch` ile yüklendiği için sayfa dosyaya çift tıklayarak değil, bir web sunucusuyla açılmalıdır:

```
python3 -m http.server 8000
```

Ardından `http://localhost:8000` adresini açın. GitHub Pages gibi statik barındırmada ek ayar gerekmez.
