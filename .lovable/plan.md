
# Phase 2C.7: TDS-like UI Layout + True Same-Scene Garage→Game

Bu phase, Coffee Rush'ı Tower Defense Simulator (TDS) hissiyatına yaklaştıran büyük bir UI overhaul içeriyor.

---

## Tamamlanan Değişiklikler

### 1. True Same-Scene Garage → Game ✅
- Canvas artık MENU ve PLAY state'lerinde aynı cart'ı çiziyor
- `drawMenuScene()` fonksiyonu eklendi (renderer.ts)
- `GarageOverlay` component canvas üzerine transparent overlay olarak çalışıyor
- Play basıldığında sadece UI overlay fade-out yapıyor, cart yerinde kalıyor

### 2. TDS-Style Top Info Bar ✅
- **Sol**: Profile/Level placeholder (Lv.1 badge)
- **Orta**: Chapter ismi (tıklanabilir - modal açıyor)
  - "☕ Dawn Rush" (Chapter 1)
  - "∞ Endless" (Endless mode)
- **Sağ**: 
  - 🔋 Energy (10/10) - günlük stamina (Power ile karıştırılmıyor!)
  - 🪙 Coins 
  - 🏆 Quests button (placeholder modal)

### 3. Contextual Upgrade Tiles ✅
- 2x2 grid kaldırıldı
- TDS tarzı contextual tile'lar:
  - **📦 +1 Cargo**: Sağ üstte, her zaman görünür
  - **🛡️ Cart HP**: Sol tarafta (sadece cargo varsa)
  - **☕ Damage + ⚡ Power**: Alt kısımda compact row

### 4. In-Game Bottom HUD ✅
- **Power Bar**: Tek bar + numeric değer (örn: "⚡ Power 3.2")
- **Skill Button**: 💣 ikonu + "2⚡" cost badge
- Power tüketim sistemi korundu (TONIC_BOMB_COST = 2)

### 5. Footer Tabs ✅
- Battle (aktif)
- Shop, Hero, Weapons, Tower (locked - "Coming Soon" toast)

---

## Dosya Değişiklikleri

| Dosya | Durum | Açıklama |
|-------|-------|----------|
| `src/game/GarageOverlay.tsx` | **YENİ** | TDS-style overlay component |
| `src/game/GarageScreen.tsx` | **SİLİNDİ** | Eski garage component |
| `src/game/GameHUD.tsx` | Güncellendi | Yeni power bar + skill button UI |
| `src/game/renderer.ts` | Güncellendi | `drawMenuScene()` fonksiyonu eklendi |
| `src/game/CoffeeRushGame.tsx` | Güncellendi | GarageOverlay import, menu scene draw |

---

## Terminoloji (Önemli!)

| Kavram | İkon | Kullanım |
|--------|------|----------|
| **POWER** | ⚡ | Run içi kaynak, skill kullanımı |
| **ENERGY** | 🔋 | Günlük stamina (10/10 regen) |

Bu iki kavram farklı ikonlarla gösterilmeli - TDS'de ikisi de lightning kullanıyor ama biz ayırıyoruz.

---

## Kabul Kriterleri

- [x] Garage'daki cart, oyundaki cart ile AYNI (aynı sprite, aynı pozisyon)
- [x] Play basıldığında "UI kayboldu, oyun başladı" hissi
- [x] Top info bar: Profile | Chapter name | Energy + Coins
- [x] Contextual upgrade tiles: +1 Cargo (sağ üst), HP (sol), Damage/Power (alt)
- [x] Bottom HUD: Power bar numeric + skill button with cost badge
- [x] Footer tabs: Battle aktif, diğerleri locked

---

## İleride Yapılacak (Phase 2C.8+)

- [ ] Energy enforcement (gerçek günlük limit)
- [ ] Profile/Level gerçek verilerle
- [ ] Quests/Daily sistemi
- [ ] Shop/Hero/Weapons/Tower tab içerikleri
