# Test İşlemi Analizi

## Girdi: "Köfteci Yusuf kıyma 480 tl nakit"

### AI Analizi:
- **İşlem Türü**: Gider (yemek alışverişi)
- **Tutar**: 480 TL
- **Kategori**: Market > Et & Et Ürünleri
- **Hesap**: Nakit
- **Vendor**: Köfteci Yusuf
- **Açıklama**: "Köfteci Yusuf'tan kıyma alışverişi"

### Önerilen Kategori Yapısı:

#### Market Ana Kategorisi Alt Kategorileri:
1. **Et & Et Ürünleri** 🥩
   - Kıyma, dana eti, tavuk eti, balık
   
2. **Süt & Süt Ürünleri** 🥛
   - Süt, peynir, yoğurt, tereyağı
   
3. **Meyve & Sebze** 🍎
   - Elma, domates, patates, soğan
   
4. **Ekmek & Fırın** 🥖
   - Ekmek, pide, börek, pasta
   
5. **İçecek** 🥤
   - Su, meşrubat, meyve suyu, çay
   
6. **Temizlik** 🧴
   - Deterjan, sabun, şampuan, diş macunu
   
7. **Kişisel Bakım** 🧴
   - Deodorant, tıraş malzemeleri, kozmetik
   
8. **Ev & Bahçe** 🏠
   - Kağıt ürünleri, çöp poşeti, pil

### Test Senaryoları:

#### 1. Giyim Alışverişi:
```
"LC Waikiki'den gömlek aldım 150 TL"
→ Kategori: Giyim > Erkek Giyim
```

#### 2. Market Alışverişi:
```
"Migros'tan süt ve ekmek aldım 45 TL"
→ Kategori: Market > Süt & Süt Ürünleri
```

#### 3. Restoran:
```
"Köfteci Yusuf'ta yemek yedim 80 TL"
→ Kategori: Eğlence > Restoran
```

### AI Prompt İyileştirmesi:
- Market alışverişleri için daha spesifik alt kategoriler
- Restoran vs market alışverişi ayrımı
- Vendor bilgisinin doğru çıkarılması 