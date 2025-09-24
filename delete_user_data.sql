-- Kullanıcının tüm verilerini sil
-- Bu script, belirli kullanıcının tüm verilerini temizler

-- Önce mevcut durumu göster
SELECT 
    'BEFORE DELETION' as status,
    'transactions' as table_name,
    COUNT(*) as count
FROM spendme_transactions 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a';

SELECT 
    'BEFORE DELETION' as status,
    'categories' as table_name,
    COUNT(*) as count
FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a';

SELECT 
    'BEFORE DELETION' as status,
    'accounts' as table_name,
    COUNT(*) as count
FROM spendme_accounts 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a';

SELECT 
    'BEFORE DELETION' as status,
    'budgets' as table_name,
    COUNT(*) as count
FROM spendme_budgets 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a';

SELECT 
    'BEFORE DELETION' as status,
    'user_profiles' as table_name,
    COUNT(*) as count
FROM spendme_user_profiles 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a';

-- Verileri sil (foreign key constraint'ler nedeniyle sıralı silme)
-- 1. İşlemleri sil
DELETE FROM spendme_transactions 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a';

-- 2. Bütçeleri sil
DELETE FROM spendme_budgets 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a';

-- 3. Kategorileri sil
DELETE FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a';

-- 4. Hesapları sil
DELETE FROM spendme_accounts 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a';

-- 5. Kullanıcı profilini sil
DELETE FROM spendme_user_profiles 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a';

-- Silme sonrası durumu kontrol et
SELECT 
    'AFTER DELETION' as status,
    'transactions' as table_name,
    COUNT(*) as count
FROM spendme_transactions 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a';

SELECT 
    'AFTER DELETION' as status,
    'categories' as table_name,
    COUNT(*) as count
FROM spendme_categories 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a';

SELECT 
    'AFTER DELETION' as status,
    'accounts' as table_name,
    COUNT(*) as count
FROM spendme_accounts 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a';

SELECT 
    'AFTER DELETION' as status,
    'budgets' as table_name,
    COUNT(*) as count
FROM spendme_budgets 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a';

SELECT 
    'AFTER DELETION' as status,
    'user_profiles' as table_name,
    COUNT(*) as count
FROM spendme_user_profiles 
WHERE user_id = '52131fb6-d9e0-41f0-836a-9165ef336d8a'; 