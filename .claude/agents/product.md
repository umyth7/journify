# Journify — Ürün Tanımı

## Ne
40 dakikadan uzun live set'leri (DJ setleri) dinlemeye odaklı bir müzik platformu.

## Temel Felsefe
Müzik bir yolculuktur (journey). Platform, parça parça single dinleme alışkanlığının 
aksine, bir set içindeki duygusal/enerji geçişini, hikayeyi ve akışı (flow) ön plana çıkarır.
Amaç: dinleyicinin sadece "şarkı" değil, set'in anlattığı hikayeyi deneyimlemesi.

## Farklılaştığı Nokta (Rakiplerden Ayrışma)
- SoundCloud/Mixcloud: set'i barındırır ama "yolculuk" deneyimini öne çıkarmaz, 
  keşif algoritması single/track odaklı.
- Spotify/Apple Music: uzun format live set kültürüne uygun değil, track-based.
- Senssetify: set'in zaman çizgisinde duygu/enerji eğrisi, key/BPM geçişleri, 
  "an"ları işaretleme (timestamp + hikaye notu) gibi set-native deneyim sunar.

## Hedef Kullanıcı
- Elektronik müzik (house/techno vb.) dinleyicisi, uzun format sete vakit ayıran kitle
- DJ'ler / set yükleyenler (kendi yolculuklarını anlatan içerik üreticileri)

## Mevcut Bağlantılar / Avantajlar
- EDM Journal (@edm.journal) — geniş Instagram erişimi, kurucunun zaten bu kitleye sesi var
- Mevcut işbirlikleri: Organizatörler, DJ'ler, label'lar, influencer'lar ile bağlantılar
- Kurucu aynı zamanda aktif DJ — "insider" hikaye anlatıcılığı mümkün

## Teknik Altyapı (kısa)
Railway, Cloudflare R2, Clerk, Upstash Redis 
Kulanıcı artmaya başladığında, ölçeklenebilirlik için AWS veya GCP'ye geçiş planlanabilir.
google auth için clerk yerine kendi auth sistemi geliştirilebilir.

## Teknik Yol Haritası / Notlar
- Auth: Şu an Clerk kullanılıyor (hızlı başlangıç için). 
  Uzun vadede Clerk'ten çıkılıp kendi auth servisi yazılacak.
  → Bu yüzden kod tasarımında Clerk'e sıkı coupling'den kaçınılmalı 
    (auth katmanı abstraction ile sarılmalı, business logic Clerk'in 
    spesifik API/SDK'sına bağımlı olmamalı).