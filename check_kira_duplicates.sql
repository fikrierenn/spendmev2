-- Kira kategorisindeki duplicate'leri kontrol et
SELECT 
    id,
    name,
    type,
    parent_id,
    is_main,
    created_at,
    user_id
FROM spendme_categories 
WHERE name = 'Kira' 
AND user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
ORDER BY type, created_at;

-- Kira kategorisinin istatistikleri
SELECT 
    type,
    COUNT(*) as count,
    STRING_AGG(id::text, ', ') as ids
FROM spendme_categories 
WHERE name = 'Kira' 
AND user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
GROUP BY type;

-- Tüm kategorilerde duplicate olan isimler
SELECT 
    name,
    type,
    COUNT(*) as count
FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
GROUP BY name, type
HAVING COUNT(*) > 1
ORDER BY name, type; 