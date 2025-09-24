-- Kalan duplikasyonları temizle
-- Bu script, belirli kategorilerin duplicate versiyonlarını temizler

-- Önce mevcut durumu göster
SELECT 
    'BEFORE CLEANUP' as status,
    name,
    type,
    parent_id,
    COUNT(*) as duplicate_count
FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
GROUP BY name, type, parent_id
HAVING COUNT(*) > 1
ORDER BY name, type;

-- "Ek Gelir" ve "Maaş" kategorilerinin duplicate versiyonlarını temizle
-- Sadece ana kategori versiyonlarını bırak (parent_id null olanlar)
DELETE FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
AND name IN ('Ek Gelir', 'Maaş')
AND parent_id IS NOT NULL;

-- "Faturalar" kategorisinin duplicate versiyonlarını temizle
DELETE FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
AND name = 'Faturalar'
AND id NOT IN (
    SELECT MIN(id) 
    FROM spendme_categories 
    WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
    AND name = 'Faturalar'
    AND parent_id IS NULL
);

-- "Gelir" kategorisinin duplicate versiyonlarını temizle
DELETE FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
AND name = 'Gelir'
AND id NOT IN (
    SELECT MIN(id) 
    FROM spendme_categories 
    WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
    AND name = 'Gelir'
    AND parent_id IS NULL
);

-- "Konut" kategorisinin duplicate versiyonlarını temizle
DELETE FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
AND name = 'Konut'
AND id NOT IN (
    SELECT MIN(id) 
    FROM spendme_categories 
    WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
    AND name = 'Konut'
    AND parent_id IS NULL
);

-- "Market" kategorisinin duplicate versiyonlarını temizle
DELETE FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
AND name = 'Market'
AND id NOT IN (
    SELECT MIN(id) 
    FROM spendme_categories 
    WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
    AND name = 'Market'
    AND parent_id IS NULL
);

-- "Sağlık" kategorisinin duplicate versiyonlarını temizle
DELETE FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
AND name = 'Sağlık'
AND id NOT IN (
    SELECT MIN(id) 
    FROM spendme_categories 
    WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
    AND name = 'Sağlık'
    AND parent_id IS NULL
);

-- "Ulaşım" kategorisinin duplicate versiyonlarını temizle
DELETE FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
AND name = 'Ulaşım'
AND id NOT IN (
    SELECT MIN(id) 
    FROM spendme_categories 
    WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
    AND name = 'Ulaşım'
    AND parent_id IS NULL
);

-- "Yatırım" kategorisinin duplicate versiyonlarını temizle
DELETE FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
AND name = 'Yatırım'
AND id NOT IN (
    SELECT MIN(id) 
    FROM spendme_categories 
    WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
    AND name = 'Yatırım'
    AND parent_id IS NULL
);

-- "Yemek" kategorisinin duplicate versiyonlarını temizle
DELETE FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
AND name = 'Yemek'
AND id NOT IN (
    SELECT MIN(id) 
    FROM spendme_categories 
    WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
    AND name = 'Yemek'
    AND parent_id IS NULL
);

-- Temizlik sonrası durumu kontrol et
SELECT 
    'AFTER CLEANUP' as status,
    name,
    type,
    parent_id,
    COUNT(*) as count
FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
GROUP BY name, type, parent_id
HAVING COUNT(*) > 1
ORDER BY name, type;

-- Toplam kategori sayısını göster
SELECT 
    'TOTAL CATEGORIES' as status,
    COUNT(*) as total_count
FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'; 