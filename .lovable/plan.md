
## BATTLE + Reset Yan Yana Duzeltmesi

### Sorun
Eski ekran goruntusunde BATTLE butonu ve Reset Progress ayni satirda yan yana duruyordu. Simdi BATTLE `w-full` (tam genislik) olarak tek basina bir satir kapliyor, Reset de altinda ayri satirda gorunuyor. Bu yuzden alt bolum gereksiz yere asagi uzuyor.

### Cozum
`src/game/GarageOverlay.tsx` dosyasinda (satir 378-390 civari):

Suanki yapi:
```text
<button "w-full ...">BATTLE</button>    <!-- tam genislik -->
<button>Reset Progress</button>          <!-- altinda ayri satir -->
```

Yeni yapi:
```text
<div className="flex gap-2 items-center">
  <button className="flex-1 ...">BATTLE</button>   <!-- genisler ama tam degil -->
  <button>Reset Progress</button>                    <!-- yaninda kucuk kalir -->
</div>
```

### Teknik Detay

**Dosya:** `src/game/GarageOverlay.tsx` (satir 378-390)

- BATTLE butonundan `w-full` kaldirilacak, yerine `flex-1` konacak
- Reset butonu ayri satirdan cikarilip BATTLE ile ayni `flex row` icine alinacak
- Reset butonundaki `mx-auto` kaldirilacak (artik yan yana oldugu icin gereksiz)
- Butun bu iki buton bir `<div className="flex gap-2 items-center">` icine sarilacak

Tek dosya, tek bolge degisikligi. Baska dosyaya dokunulmayacak.
