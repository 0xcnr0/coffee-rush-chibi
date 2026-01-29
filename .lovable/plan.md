

# Fix: Run Summary Görünmüyor - Scroll Ekleme

## Sorun

Screenshot'ta görüldüğü gibi, EndScreen içeriği ekranı tam dolduruyor:
- Chapter Failed başlığı
- Time Survived kartı  
- Served / Tips / Checkpoints / Beans istatistikleri
- Play Again ve Home butonları
- Cargo Box tip'i

**RunSummary bileşeni** kodda butonların altında yer alıyor (satır 255-257) ama ekran scroll edilemediği için görünmüyor.

## Çözüm

EndScreen container'a scroll özelliği ekle:
- `flex-col` yerine `overflow-y-auto` ile scroll container
- Content'i içeride tutarak mobil ekranlarda RunSummary'e ulaşılabilsin
- Ayrıca RunSummary'i butonların hemen üstüne taşı (daha görünür konum)

## Teknik Değişiklikler

### 1. EndScreen.tsx - Scroll Ekleme

**Satır 146** - Ana container'a scroll ekle:

```typescript
// Mevcut:
<div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-coffee-dark/95 to-coffee-espresso/95 p-4 z-20">

// Yeni:
<div className="absolute inset-0 flex flex-col items-center justify-start overflow-y-auto bg-gradient-to-b from-coffee-dark/95 to-coffee-espresso/95 p-4 pt-8 z-20">
```

`justify-center` → `justify-start` + `overflow-y-auto` + `pt-8` padding

### 2. RunSummary Konumunu Değiştir (Opsiyonel)

RunSummary'i butonların üstüne taşı ki kullanıcı hemen görsün:
- Mevcut: Butonlar → Cargo Hint → RunSummary → Share text
- Yeni: Butonlar → RunSummary → Cargo Hint → Share text

Veya RunSummary'e margin-top ekleyerek daha görünür yap.

### 3. Chapter Clear Screen için Aynı Fix

Satır 41'deki Chapter Clear screen'i de aynı scroll fix'ini almalı.

## Beklenen Sonuç

- Mobil ekranlarda EndScreen scroll edilebilir olacak
- RunSummary kartı görünecek ve "📊 Run Summary" başlığına tıklayarak açılabilecek
- Copy Line / Copy JSON butonları çalışacak

## Risk

Düşük - sadece CSS değişikliği, layout düzeltmesi.

