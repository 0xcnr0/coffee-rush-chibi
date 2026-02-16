

## Kasa HP Upgrade Butonlarini Garage'a Ekle

### Mevcut Durum
- `purchaseBlockPip(slotIndex, cost)` fonksiyonu `persistence.ts`'te mevcut ve calisiyor
- `blockPips[]` array'i progression datasinda tutuluyor (default: [0,0,0])
- Ancak GarageOverlay.tsx'te bu fonksiyon **import edilmiyor** ve hicbir buton bu fonksiyonu cagirmiyor
- Her kasanin saginda Star ve Brew butonlari var, ama HP upgrade butonu yok

### Cozum
Her kargo kutusunun **sol tarafina** (kartRightEdge yerine CART_X - offset) veya mevcut Star/Brew butonlarinin yanina bir Shield ikonlu HP upgrade butonu ekle.

### Teknik Detay

**Dosya:** `src/game/GarageOverlay.tsx`

1. Import listesine `purchaseBlockPip` ekle (satir 4)
2. Her kutu icin (boxIdx loop icinde, satir 260) Star/Brew butonlarinin yanina bir HP buton ekle:
   - Shield ikonu (zaten import edilmis)
   - `blockPips[boxIdx]` pip durumunu goster (BLOCK_PIP_PER_EVO kadar nokta)
   - `blockEvoChoices[boxIdx]` evo sayisini goster
   - Tiklaninca `purchaseBlockPip(boxIdx, cost)` cagir
   - Maliyet: `getPipCost(blockPips[boxIdx], BLOCK_PIP_BASE_COST, BLOCK_PIP_COST_SCALING)`

3. Buton stili mevcut Star/Brew butonlariyla ayni formatta olacak:
   - 32px genislik, 38-46px yukseklik
   - Pip noktalar alt kisimda
   - Coin maliyeti en altta
   - MAX durumunda yesil Check ikonu

### Diger Degerler
Gate HP, spawn degerleri, Brew, Star mekanikleri, config sabitleri, renderer kodu degismez. Sadece GarageOverlay.tsx'te UI butonu eklenir.

