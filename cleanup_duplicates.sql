-- Kategorilerdeki duplikasyonları temizle
-- Bu script, aynı kullanıcı için aynı isim, tip ve parent_id'ye sahip kategorileri temizler

-- Önce duplikasyonları göster
SELECT 
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

-- Duplikasyonları sil (her grup için sadece bir tane bırak)
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