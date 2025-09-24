-- Kategori durumunu kontrol etme sorgusu
-- Mevcut kategorileri ve yapılarını gösterir

-- Tüm kategorileri listele
SELECT 
  'categories' as data_type,
  c.id,
  c.name,
  c.icon,
  c.type,
  c.is_main,
  c.parent_id,
  c.user_id,
  u.email as user_email,
  parent_cat.name as parent_category_name
FROM spendme_categories c
LEFT JOIN auth.users u ON c.user_id = u.id
LEFT JOIN spendme_categories parent_cat ON c.parent_id = parent_cat.id
ORDER BY c.user_id, c.parent_id NULLS FIRST, c.name;

-- Kategori istatistikleri
SELECT 
  'stats' as data_type,
  user_id,
  COUNT(*) as total_categories,
  COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as main_categories,
  COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as sub_categories,
  COUNT(DISTINCT name) as unique_names
FROM spendme_categories 
GROUP BY user_id
ORDER BY user_id;

-- Duplicate kategorileri kontrol et
SELECT 
  'duplicates' as data_type,
  user_id,
  name,
  type,
  COUNT(*) as count
FROM spendme_categories 
GROUP BY user_id, name, type
HAVING COUNT(*) > 1
ORDER BY user_id, name; 