-- Taksitli işlemlerin tarihlerini düzeltme sorgusu
-- Bu sorgu, installment_no alanına göre tarihleri güncelleyecek

-- Önce mevcut durumu görelim
SELECT 
  id,
  description,
  installment_no,
  date,
  created_at
FROM spendme_transactions 
WHERE installment_group_id = '7bb481eb-4502-4089-a08a-86b71cabb302'
ORDER BY installment_no;

-- Tarihleri düzelt (her taksit bir ay sonra)
UPDATE spendme_transactions 
SET date = (DATE '2025-07-22' + INTERVAL '1 month' * (installment_no - 1))::date
WHERE installment_group_id = '7bb481eb-4502-4089-a08a-86b71cabb302';

-- Düzeltme sonrası kontrol
SELECT 
  id,
  description,
  installment_no,
  date,
  created_at
FROM spendme_transactions 
WHERE installment_group_id = '7bb481eb-4502-4089-a08a-86b71cabb302'
ORDER BY installment_no; 