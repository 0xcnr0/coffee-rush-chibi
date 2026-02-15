

# Gate2 HP Artisi + Flame Garage UI Tamamlama

## Degisiklik 1: Gate2 HP 320 -> 350

**Dosya:** `config.ts` satir 29

Tek deger degisikligi: `gateHP: 320` -> `gateHP: 350`

Baska hicbir degere dokunulmaz. GATE_HP_RATIOS dizisi zaten referans olarak tutuluyor, gercek HP degerleri STAGES dizisinde dogrudan tanimli.

**Beklenen etki:** Run7 verisine gore G2'de 24s'de 270/320 hasar verilmis. 350 HP ile tahmini siege suresi ~28-30s olacak, G1 ile tutarli hissiyat.

---

## Degisiklik 2: GarageOverlay'a Flame Satin Alma Butonlari

**Dosya:** `GarageOverlay.tsx`

`purchaseFlameForBox` zaten import edilmis ama UI render kodu eksik. Star butonlarinin yanina ayni tasarimda Flame butonlari eklenecek:

- Sadece `bestStageReached >= 3` ise gorunur (Stage 2 Gate yikilmis olmali)
- Her kargo kutusu icin ayri satin alma (Star modeli ile ayni)
- Emoji: fire emojisi, renk: turuncu tema (bg-orange-600)
- Fiyat: 200 coin (GAME_CONFIG.FLAME_PER_BOX_COST)
- Satin alinca toast: "Flame Equipped!"
- Pozisyon: Star butonunun saginda, ayni satir, ayni boyut

---

## Degisiklik 3: drawFlameZone (renderer.ts)

Flame pasif alaninin gorsel temsili eksik. `drawStarZone` ile ayni yapiyi takip eden `drawFlameZone` fonksiyonu:

- Turuncu/kirmizi renk paleti (Star'in mavi/beyaz temasina karsi)
- Kon seklinde gorsel (FLAME_PASSIVE_CONE_ANGLE: 45 derece, on tarafa)
- Basit alev parcacik animasyonu
- `drawStarZone` cagrildigi her yerde kosullu olarak `drawFlameZone` da cagrilacak

---

## Dokunulmayacaklar
- Gate1 HP (300) — degismez
- Gate3-5 HP — degismez
- Stage1/Stage2 spawn — degismez
- Star guaranteed gate hit — degismez
- EVO sistemi — degismez
- Travel sureleri — degismez

## Uygulama Sirasi
1. `config.ts` — Gate2 HP: 320 -> 350
2. `renderer.ts` — drawFlameZone ekleme
3. `GarageOverlay.tsx` — Flame satin alma butonlari

