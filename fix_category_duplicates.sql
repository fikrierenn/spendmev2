-- Kategorilerdeki duplikasyonları temizle
-- Bu script, belirli kullanıcı için tüm duplicate kategorileri temizler

-- Önce mevcut durumu göster
SELECT 
    'BEFORE CLEANUP' as status,
    user_id,
    name,
    type,
    parent_id,
    COUNT(*) as duplicate_count
FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
GROUP BY user_id, name, type, parent_id
HAVING COUNT(*) > 1
ORDER BY name, type;

-- Duplikasyonları sil (her grup için sadece en eski olanı bırak)
DELETE FROM spendme_categories 
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY user_id, name, type, parent_id 
                   ORDER BY created_at ASC
               ) as rn
        FROM spendme_categories 
        WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
    ) t
    WHERE rn > 1
);

-- Temizlik sonrası durumu kontrol et
SELECT 
    'AFTER CLEANUP' as status,
    user_id,
    name,
    type,
    parent_id,
    COUNT(*) as count
FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
GROUP BY user_id, name, type, parent_id
HAVING COUNT(*) > 1
ORDER BY name, type;

-- Toplam kategori sayısını göster
SELECT 
    'TOTAL CATEGORIES' as status,
    COUNT(*) as total_count
FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'; 