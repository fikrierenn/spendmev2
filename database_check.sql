-- Mevcut tablo yapısını kontrol et
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'spendme_transactions' 
ORDER BY ordinal_position;

-- Transfer işlemleri için gerekli alanları ekle (eğer yoksa)
ALTER TABLE spendme_transactions 
ADD COLUMN IF NOT EXISTS from_account_id UUID REFERENCES spendme_accounts(id),
ADD COLUMN IF NOT EXISTS to_account_id UUID REFERENCES spendme_accounts(id);

-- Mevcut transfer işlemlerini kontrol et
SELECT * FROM spendme_transactions WHERE type = 'transfer' LIMIT 5;

-- RLS politikalarını kontrol et
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'spendme_transactions'; 