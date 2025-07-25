-- Mevcut yanlış taksitli işlemleri temizleme sorgusu
-- Bu sorgu, aynı açıklamaya sahip taksitli işlemleri bulup silecek

-- Önce hangi kayıtların silineceğini görelim
SELECT 
  id,
  description,
  amount,
  date,
  installments,
  installment_group_id,
  created_at
FROM spendme_transactions 
WHERE description LIKE '%(Taksit 1/6)%'
  AND installments > 1
ORDER BY created_at DESC;

-- Eğer sonuçlar doğruysa, bu kayıtları silelim
-- DELETE FROM spendme_transactions 
-- WHERE description LIKE '%(Taksit 1/6)%'
--   AND installments > 1;

-- Silme işleminden sonra kontrol
SELECT 
  COUNT(*) as toplam_kayit,
  COUNT(CASE WHEN installments > 1 THEN 1 END) as taksitli_kayit_sayisi
FROM spendme_transactions; 