-- =====================================================
-- TRANSFER İŞLEMLERİ İÇİN DATABASE MIGRATION
-- =====================================================

-- 1. Mevcut tablo yapısını kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'spendme_transactions' 
ORDER BY ordinal_position;

-- 2. Transfer işlemleri için gerekli alanları ekle
ALTER TABLE spendme_transactions 
ADD COLUMN IF NOT EXISTS from_account_id UUID REFERENCES spendme_accounts(id),
ADD COLUMN IF NOT EXISTS to_account_id UUID REFERENCES spendme_accounts(id);

-- 3. Type enum'ını güncelle
ALTER TABLE spendme_transactions
DROP CONSTRAINT IF EXISTS spendme_transactions_type_check,
ADD CONSTRAINT spendme_transactions_type_check 
  CHECK (type IN ('income', 'expense', 'transfer'));

-- 4. RLS politikalarını güncelle
DROP POLICY IF EXISTS "Users can insert transfer transactions" ON spendme_transactions;
DROP POLICY IF EXISTS "Users can view transfer transactions" ON spendme_transactions;
DROP POLICY IF EXISTS "Users can update transfer transactions" ON spendme_transactions;
DROP POLICY IF EXISTS "Users can delete transfer transactions" ON spendme_transactions;

CREATE POLICY "Users can insert transfer transactions" ON spendme_transactions
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND 
  (type = 'transfer' OR type = 'income' OR type = 'expense')
);

CREATE POLICY "Users can view transfer transactions" ON spendme_transactions
FOR SELECT USING (
  auth.uid() = user_id
);

CREATE POLICY "Users can update transfer transactions" ON spendme_transactions
FOR UPDATE USING (
  auth.uid() = user_id
);

CREATE POLICY "Users can delete transfer transactions" ON spendme_transactions
FOR DELETE USING (
  auth.uid() = user_id
);

-- 5. Transfer işlemleri için trigger fonksiyonu
CREATE OR REPLACE FUNCTION handle_transfer_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Transfer işlemi ise hesap bakiyelerini güncelle
  IF NEW.type = 'transfer' AND NEW.from_account_id IS NOT NULL AND NEW.to_account_id IS NOT NULL THEN
    -- Gönderen hesaptan düş
    UPDATE spendme_accounts 
    SET balance = balance - NEW.amount 
    WHERE id = NEW.from_account_id AND user_id = NEW.user_id;
    
    -- Alıcı hesaba ekle
    UPDATE spendme_accounts 
    SET balance = balance + NEW.amount 
    WHERE id = NEW.to_account_id AND user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı ekle
DROP TRIGGER IF EXISTS transfer_transaction_trigger ON spendme_transactions;
CREATE TRIGGER transfer_transaction_trigger
  AFTER INSERT ON spendme_transactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_transfer_transaction();

-- 6. İndeksler ekle
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON spendme_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON spendme_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON spendme_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON spendme_transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON spendme_transactions(type);

-- 7. Mevcut transfer işlemlerini kontrol et
SELECT 
  id, type, amount, from_account_id, to_account_id, 
  description, date, account_id, user_id
FROM spendme_transactions 
WHERE type = 'transfer' 
ORDER BY created_at DESC 
LIMIT 10;