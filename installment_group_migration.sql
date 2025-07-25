-- Taksitli işlemler için grup ID'si ekleme migration'ı
-- Bu migration, taksitli işlemleri gruplamak için yeni bir alan ekler

-- 1. Yeni alan ekle
ALTER TABLE spendme_transactions 
ADD COLUMN installment_group_id UUID;

-- 2. İndeks ekle (performans için)
CREATE INDEX idx_installment_group_id ON spendme_transactions(installment_group_id);

-- 3. Mevcut taksitli işlemleri gruplamak için (opsiyonel)
-- Bu kısım mevcut taksitli işlemleri gruplamak için kullanılabilir
-- Şimdilik yorum satırı olarak bırakıyoruz

/*
-- Mevcut taksitli işlemleri gruplamak için (manuel olarak çalıştırılabilir)
-- Bu sorgu mevcut taksitli işlemleri bulup grup ID'si atar
WITH installment_groups AS (
  SELECT 
    user_id,
    description,
    payment_method,
    account_id,
    category_id,
    installments,
    MIN(created_at) as first_created,
    gen_random_uuid() as group_id
  FROM spendme_transactions 
  WHERE installments > 1
  GROUP BY user_id, description, payment_method, account_id, category_id, installments
)
UPDATE spendme_transactions 
SET installment_group_id = ig.group_id
FROM installment_groups ig
WHERE spendme_transactions.user_id = ig.user_id
  AND spendme_transactions.description LIKE ig.description || '%'
  AND spendme_transactions.payment_method = ig.payment_method
  AND spendme_transactions.account_id = ig.account_id
  AND spendme_transactions.category_id = ig.category_id
  AND spendme_transactions.installments = ig.installments;
*/ 