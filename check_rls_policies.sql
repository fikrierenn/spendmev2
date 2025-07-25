-- =====================================================
-- RLS POLİTİKALARINI KONTROL ET VE GÜNCELLE
-- =====================================================

-- 1. Mevcut RLS politikalarını kontrol et
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'spendme_transactions'
ORDER BY policyname;

-- 2. Transfer işlemleri için INSERT politikası ekle (eğer yoksa)
CREATE POLICY IF NOT EXISTS "Users can insert transfer transactions" ON spendme_transactions
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  (type = 'transfer' OR type = 'income' OR type = 'expense')
);

-- 3. Transfer işlemleri için SELECT politikası ekle (eğer yoksa)
CREATE POLICY IF NOT EXISTS "Users can view transfer transactions" ON spendme_transactions
FOR SELECT USING (
  auth.uid() = user_id
);

-- 4. Transfer işlemleri için UPDATE politikası ekle (eğer yoksa)
CREATE POLICY IF NOT EXISTS "Users can update transfer transactions" ON spendme_transactions
FOR UPDATE USING (
  auth.uid() = user_id
);

-- 5. Transfer işlemleri için DELETE politikası ekle (eğer yoksa)
CREATE POLICY IF NOT EXISTS "Users can delete transfer transactions" ON spendme_transactions
FOR DELETE USING (
  auth.uid() = user_id
);

-- 6. Test transfer işlemi ekle
INSERT INTO spendme_transactions (
  user_id, 
  type, 
  amount, 
  from_account_id, 
  to_account_id, 
  description, 
  date, 
  account_id
) VALUES (
  'b5318971-add4-48ba-85fb-b856f2bd22ca', 
  'transfer', 
  100.00, 
  (SELECT id FROM spendme_accounts WHERE user_id = 'b5318971-add4-48ba-85fb-b856f2bd22ca' LIMIT 1),
  (SELECT id FROM spendme_accounts WHERE user_id = 'b5318971-add4-48ba-85fb-b856f2bd22ca' LIMIT 1 OFFSET 1),
  'Test transfer işlemi', 
  CURRENT_DATE,
  (SELECT id FROM spendme_accounts WHERE user_id = 'b5318971-add4-48ba-85fb-b856f2bd22ca' LIMIT 1)
);

-- 7. Transfer işlemlerini kontrol et
SELECT 
  id, 
  type, 
  amount, 
  from_account_id, 
  to_account_id, 
  description, 
  date, 
  account_id, 
  user_id,
  created_at
FROM spendme_transactions 
WHERE type = 'transfer' 
ORDER BY created_at DESC 
LIMIT 10;

-- 8. Hesap bakiyelerini kontrol et
SELECT 
  id,
  name,
  type,
  balance,
  user_id
FROM spendme_accounts 
WHERE user_id = 'b5318971-add4-48ba-85fb-b856f2bd22ca'
ORDER BY name; 