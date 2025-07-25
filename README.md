# SpendMe - Kişisel Finans Yönetimi PWA

SpendMe, kişisel finans yönetimi için geliştirilen, modern ve kullanıcı dostu bir Progressive Web App (PWA)'dir. Kullanıcılar gelir ve giderlerini kolayca kaydedebilir, kategorilere ayırabilir, bütçelerini yönetebilir ve harcama alışkanlıklarını analiz edebilirler.

## 🚀 Özellikler

### Ana Modüller
- **Kullanıcı Yönetimi:** Supabase Auth ile kullanıcı kaydı, girişi ve oturum yönetimi
- **Gelir/Gider Yönetimi:** Kullanıcılar gelir veya gider ekleyebilir, düzenleyebilir, silebilir
- **Kategori Yönetimi:** Kullanıcılar kendi harcama ve gelir kategorilerini oluşturabilir
- **Hesap Yönetimi:** Farklı banka/kredi kartı veya nakit hesapları tanımlanabilir
- **Bütçe Yönetimi:** Aylık veya kategori bazlı bütçeler tanımlanabilir
- **Raporlama ve Analiz:** Grafik ve tablo ile harcama/gelir analizi
- **AI Fonksiyonları:** Gemini API ile doğal dilde harcama analizi ve öneriler
- **PWA ve Mobil Uyumluluk:** Offline çalışabilir, ana ekrana eklenebilir

### AI ile Doğal Dil İşlem Girişi
Kullanıcılar, gelir veya gider işlemlerini klasik form yerine doğal dilde yazarak ekleyebilir. AI, bu metni analiz edip işlem detaylarını otomatik olarak doldurur.

**Örnek Kullanım:**
- "Bugün Migros'tan 350 TL market alışverişi yaptım, kredi kartı ile."
- "Maaşım 25.000 TL Ziraat hesabıma yattı."
- "Akaryakıt için 800 TL harcadım, nakit ödedim."

## 🛠️ Teknoloji Yığını

- **Frontend:** React 18 + TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod
- **Routing:** React Router v6
- **Charts:** Recharts
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Notifications:** React Hot Toast
- **Date Handling:** date-fns
- **Backend:** Supabase (Auth, Database, Storage)
- **AI:** Gemini API (Backend proxy ile)

## 📊 Veritabanı Şeması

### spendme_accounts
- id (uuid, primary key)
- user_id (uuid, foreign key)
- name (text)
- type (text) - banka, nakit, kredi kartı vb.
- icon (text)
- iban (text, optional)
- note (text, optional)
- card_limit (numeric, optional)
- statement_day (integer, optional)
- due_day (integer, optional)
- card_note (text, optional)
- card_number (varchar, optional)

### spendme_budgets
- id (uuid, primary key)
- user_id (uuid, foreign key)
- category_id (uuid, foreign key, optional)
- period (text) - aylık vb.
- amount (numeric)
- created_at (timestamp)

### spendme_categories
- id (uuid, primary key)
- user_id (uuid, foreign key)
- name (text)
- icon (text, optional)
- type (text) - expense/income
- is_main (boolean, default false)
- parent_id (uuid, foreign key, optional)

### spendme_settings
- id (uuid, primary key)
- user_id (uuid, foreign key)
- theme (text, optional)
- ai_humor_mode (text, optional) - serious, friendly, funny, clown
- language (text, optional)
- created_at (timestamp)

### spendme_transactions
- id (uuid, primary key)
- user_id (uuid, foreign key)
- type (text) - income/expense/transfer
- amount (numeric)
- account_id (uuid, foreign key, optional)
- category_id (uuid, foreign key, optional)
- payment_method (text, optional)
- installments (integer, optional)
- vendor (text, optional)
- description (text, optional)
- date (date)
- to_account_id (uuid, foreign key, optional) - transfer için

### spendme_users
- id (uuid, primary key)
- email (text, optional)
- display_name (text, optional)
- created_at (timestamp)

## 🚀 Kurulum

1. **Projeyi klonlayın:**
```bash
git clone <repository-url>
cd spendmev2
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Ortam değişkenlerini ayarlayın:**
```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_GEMINI_API_URL=your_backend_proxy_url
```

4. **Geliştirme sunucusunu başlatın:**
```bash
npm start
```

## 📁 Proje Yapısı

```
src/
├── components/          # Yeniden kullanılabilir bileşenler
│   ├── ui/             # Temel UI bileşenleri
│   ├── forms/          # Form bileşenleri
│   ├── charts/         # Grafik bileşenleri
│   └── layout/         # Layout bileşenleri
├── pages/              # Sayfa bileşenleri
│   ├── auth/           # Kimlik doğrulama sayfaları
│   ├── dashboard/      # Ana dashboard
│   ├── transactions/   # İşlem yönetimi
│   ├── categories/     # Kategori yönetimi
│   ├── accounts/       # Hesap yönetimi
│   ├── budgets/        # Bütçe yönetimi
│   ├── reports/        # Raporlar ve analizler
│   ├── ai/             # AI fonksiyonları
│   └── settings/       # Ayarlar
├── hooks/              # Custom React hooks
├── stores/             # Zustand state stores
├── services/           # API servisleri
├── types/              # TypeScript tip tanımları
├── utils/              # Yardımcı fonksiyonlar
├── constants/          # Sabitler
└── styles/             # Global stiller
```

## 🎯 Geliştirme Kuralları

### Kod Standartları
- **React Fonksiyonel Component:** Class component kullanmayın
- **TypeScript:** Tüm dosyalar .tsx uzantılı olmalı
- **Tailwind CSS:** Styling için sadece Tailwind kullanın
- **Prettier & ESLint:** Kod formatı zorunlu
- **Türkçe Kullanımı:** Sadece UI metinlerinde Türkçe kullanın
- **Değişken/Fonksiyon İsimleri:** İngilizce olmalı

### Hata Yönetimi
- Tüm asenkron işlemler try...catch ile sarılmalı
- Hatalar console.error ile loglanmalı
- Kullanıcıya uygun hata mesajları gösterilmeli

### Git Workflow
- PR açıklaması zorunlu
- İlgili issue ile ilişkilendirilmeli
- Testler geçmeden merge edilmez

## 🔧 Geliştirme Komutları

```bash
# Geliştirme sunucusu
npm start

# Production build
npm run build

# Test çalıştırma
npm test

# Lint kontrolü
npm run lint

# Prettier formatı
npm run format
```

## 📱 PWA Özellikleri

- **Offline Çalışma:** Service Worker ile offline desteği
- **Ana Ekrana Ekleme:** PWA manifest ile
- **Push Notifications:** Bütçe aşımı uyarıları
- **Responsive Design:** Mobil ve masaüstü uyumlu

## 🤖 AI Fonksiyonları

### Doğal Dil İşlem Girişi
Kullanıcılar doğal dilde işlem bilgisi yazabilir:
- "Bugün Migros'tan 350 TL market alışverişi yaptım"
- AI otomatik olarak kategori, hesap, tutar, tarih çıkarır

### Harcama Analizi
- "Bu ay en çok harcadığım kategori ne?"
- "Tasarruf önerileri ver"
- "Geçen aya göre harcamalarım nasıl?"

### AI Mizah Modları
- **Serious:** Ciddi ve profesyonel
- **Friendly:** Samimi ve dostane
- **Funny:** Eğlenceli ve mizahi
- **Clown:** Tamamen eğlenceli

## 🔒 Güvenlik

- API anahtarları frontend'de tutulmaz
- Supabase RLS (Row Level Security) aktif
- Tüm kullanıcı verileri user_id ile izole edilir
- HTTPS zorunlu

## 📈 Gelecek Özellikler

- [ ] Çoklu para birimi desteği
- [ ] Fatura hatırlatıcıları
- [ ] Hedef tasarruf planları
- [ ] Yatırım takibi
- [ ] Aile/ortak hesap yönetimi
- [ ] Gelişmiş AI önerileri
- [ ] Export/Import özellikleri
- [ ] Dark mode
- [ ] Çoklu dil desteği

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **Proje Sahibi:** [İsim]
- **Email:** [email]
- **GitHub:** [github-username]

---

**SpendMe ile finansal hedeflerinize ulaşın! 💰**
