-- Mevcut taksitli işlemlerin description'larını düzeltme sorgusu
-- Bu sorgu, installment_no alanına göre description'ları güncelleyecek

-- Önce mevcut durumu görelim
SELECT 
  id,
  description,
  installment_no,
  installments,
  date
FROM spendme_transactions 
WHERE installment_group_id = '7bb481eb-4502-4089-a08a-86b71cabb302'
ORDER BY installment_no;

-- Description'ları düzelt
UPDATE spendme_transactions 
SET description = 'Açıklama yok (Taksit ' || installment_no || '/' || installments || ')'
WHERE installment_group_id = '7bb481eb-4502-4089-a08a-86b71cabb302';

-- Düzeltme sonrası kontrol
SELECT 
  id,
  description,
  installment_no,
  installments,
  date
FROM spendme_transactions 
WHERE installment_group_id = '7bb481eb-4502-4089-a08a-86b71cabb302'
ORDER BY installment_no; 