-- =====================================================
-- GİYİM KATEGORİSİ İÇİN ALT KATEGORİ ÖNERİLERİ
-- =====================================================

-- Giyim ana kategorisi altına eklenecek alt kategoriler
-- Bu kategorileri Supabase'de Categories sayfasından ekleyebilirsiniz

-- 1. Erkek Giyim
INSERT INTO spendme_categories (name, type, parent_id, icon, user_id) VALUES
('Erkek Giyim', 'expense', (SELECT id FROM spendme_categories WHERE name = 'Giyim' AND type = 'expense' LIMIT 1), '👔', 'b5318971-add4-48ba-85fb-b856f2bd22ca');

-- 2. Kadın Giyim
INSERT INTO spendme_categories (name, type, parent_id, icon, user_id) VALUES
('Kadın Giyim', 'expense', (SELECT id FROM spendme_categories WHERE name = 'Giyim' AND type = 'expense' LIMIT 1), '👗', 'b5318971-add4-48ba-85fb-b856f2bd22ca');

-- 3. Çocuk Giyim
INSERT INTO spendme_categories (name, type, parent_id, icon, user_id) VALUES
('Çocuk Giyim', 'expense', (SELECT id FROM spendme_categories WHERE name = 'Giyim' AND type = 'expense' LIMIT 1), '👶', 'b5318971-add4-48ba-85fb-b856f2bd22ca');

-- 4. Ayakkabı
INSERT INTO spendme_categories (name, type, parent_id, icon, user_id) VALUES
('Ayakkabı', 'expense', (SELECT id FROM spendme_categories WHERE name = 'Giyim' AND type = 'expense' LIMIT 1), '👟', 'b5318971-add4-48ba-85fb-b856f2bd22ca');

-- 5. Aksesuar
INSERT INTO spendme_categories (name, type, parent_id, icon, user_id) VALUES
('Aksesuar', 'expense', (SELECT id FROM spendme_categories WHERE name = 'Giyim' AND type = 'expense' LIMIT 1), '👜', 'b5318971-add4-48ba-85fb-b856f2bd22ca');

-- 6. İç Giyim
INSERT INTO spendme_categories (name, type, parent_id, icon, user_id) VALUES
('İç Giyim', 'expense', (SELECT id FROM spendme_categories WHERE name = 'Giyim' AND type = 'expense' LIMIT 1), '🩲', 'b5318971-add4-48ba-85fb-b856f2bd22ca');

-- 7. Spor Giyim
INSERT INTO spendme_categories (name, type, parent_id, icon, user_id) VALUES
('Spor Giyim', 'expense', (SELECT id FROM spendme_categories WHERE name = 'Giyim' AND type = 'expense' LIMIT 1), '🏃', 'b5318971-add4-48ba-85fb-b856f2bd22ca');

-- 8. Takı & Mücevher
INSERT INTO spendme_categories (name, type, parent_id, icon, user_id) VALUES
('Takı & Mücevher', 'expense', (SELECT id FROM spendme_categories WHERE name = 'Giyim' AND type = 'expense' LIMIT 1), '💍', 'b5318971-add4-48ba-85fb-b856f2bd22ca');

-- 9. Kozmetik & Bakım
INSERT INTO spendme_categories (name, type, parent_id, icon, user_id) VALUES
('Kozmetik & Bakım', 'expense', (SELECT id FROM spendme_categories WHERE name = 'Giyim' AND type = 'expense' LIMIT 1), '💄', 'b5318971-add4-48ba-85fb-b856f2bd22ca');

-- 10. Çanta & Cüzdan
INSERT INTO spendme_categories (name, type, parent_id, icon, user_id) VALUES
('Çanta & Cüzdan', 'expense', (SELECT id FROM spendme_categories WHERE name = 'Giyim' AND type = 'expense' LIMIT 1), '👜', 'b5318971-add4-48ba-85fb-b856f2bd22ca');

-- Mevcut giyim kategorilerini kontrol et
SELECT 
    c1.name as "Ana Kategori",
    c2.name as "Alt Kategori",
    c2.icon,
    c2.type
FROM spendme_categories c1
LEFT JOIN spendme_categories c2 ON c1.id = c2.parent_id
WHERE c1.name = 'Giyim' AND c1.type = 'expense'
ORDER BY c2.name; 