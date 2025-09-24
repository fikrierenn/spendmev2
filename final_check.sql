-- Final duplicate kontrolü
SELECT 
  'duplicates' as data_type,
  user_id,
  name,
  type,
  COUNT(*) as count
FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
GROUP BY user_id, name, type
HAVING COUNT(*) > 1
ORDER BY user_id, name;

-- Kategori istatistikleri
SELECT 
  'stats' as data_type,
  user_id,
  COUNT(*) as total_categories,
  COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_categories,
  COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as sub_categories,
  COUNT(DISTINCT name) as unique_names
FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'
GROUP BY user_id; 