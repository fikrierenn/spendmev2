-- Mevcut taksitli işlemleri gruplamak için güncellenmiş sorgu
-- Bu sorgu, tutarları farklı olan taksitli işlemleri de doğru şekilde gruplar

WITH installment_groups AS (
  SELECT 
    user_id,
    -- Description'ı temizle (taksit numarası olmadan)
    REGEXP_REPLACE(description, '\s*\(Taksit\s+\d+\/\d+\)\s*$', '') as clean_description,
    payment_method,
    account_id,
    category_id,
    installments,
    MIN(created_at) as first_created,
    gen_random_uuid() as group_id
  FROM spendme_transactions 
  WHERE installments > 1
  GROUP BY 
    user_id, 
    REGEXP_REPLACE(description, '\s*\(Taksit\s+\d+\/\d+\)\s*$', ''),
    payment_method, 
    account_id, 
    category_id, 
    installments
)
UPDATE spendme_transactions 
SET installment_group_id = ig.group_id
FROM installment_groups ig
WHERE spendme_transactions.user_id = ig.user_id
  -- Description'ı temizleyip karşılaştır
  AND REGEXP_REPLACE(spendme_transactions.description, '\s*\(Taksit\s+\d+\/\d+\)\s*$', '') = ig.clean_description
  AND spendme_transactions.payment_method = ig.payment_method
  AND spendme_transactions.account_id = ig.account_id
  AND spendme_transactions.category_id = ig.category_id
  AND spendme_transactions.installments = ig.installments
  -- Sadece henüz grup ID'si olmayan kayıtları güncelle
  AND spendme_transactions.installment_group_id IS NULL;

-- Güncelleme sonrası kontrol sorgusu
SELECT 
  installment_group_id,
  description,
  amount,
  installments,
  COUNT(*) as taksit_sayisi
FROM spendme_transactions 
WHERE installment_group_id IS NOT NULL
GROUP BY installment_group_id, description, amount, installments
ORDER BY installment_group_id; 