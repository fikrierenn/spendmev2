-- Yeni oluşturulan yanlış taksitli işlemleri düzelt
-- Bu script, aynı tarihli ve aynı açıklamalı taksitleri düzeltir

-- Önce mevcut durumu kontrol et
SELECT 
    installment_group_id,
    COUNT(*) as taksit_sayisi,
    MIN(date) as ilk_tarih,
    MAX(date) as son_tarih,
    COUNT(DISTINCT date) as farkli_tarih_sayisi,
    COUNT(DISTINCT description) as farkli_aciklama_sayisi
FROM spendme_transactions 
WHERE installments > 1 
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY installment_group_id
HAVING COUNT(DISTINCT date) = 1 OR COUNT(DISTINCT description) = 1;

-- Yanlış taksitleri düzelt
WITH installment_groups AS (
  SELECT 
    installment_group_id,
    MIN(date) as baslangic_tarihi,
    MIN(description) as orijinal_aciklama,
    COUNT(*) as taksit_sayisi,
    MIN(amount) as taksit_tutari
  FROM spendme_transactions 
  WHERE installments > 1 
  AND created_at > NOW() - INTERVAL '1 hour'
  GROUP BY installment_group_id
  HAVING COUNT(DISTINCT date) = 1 OR COUNT(DISTINCT description) = 1
)
UPDATE spendme_transactions 
SET 
  date = (
    SELECT DATE(baslangic_tarihi + (installment_no - 1) * INTERVAL '1 month')
    FROM installment_groups ig 
    WHERE ig.installment_group_id = spendme_transactions.installment_group_id
  ),
  description = (
    SELECT 
      CASE 
        WHEN installment_no = 1 THEN 
          REGEXP_REPLACE(orijinal_aciklama, ' \(Taksit [0-9]+/[0-9]+\)', '')
        ELSE 
          REGEXP_REPLACE(orijinal_aciklama, ' \(Taksit [0-9]+/[0-9]+\)', '') || 
          ' (Taksit ' || installment_no || '/' || taksit_sayisi || ')'
      END
    FROM installment_groups ig 
    WHERE ig.installment_group_id = spendme_transactions.installment_group_id
  )
WHERE installment_group_id IN (
  SELECT installment_group_id 
  FROM installment_groups
);

-- Düzeltme sonrası kontrol
SELECT 
    installment_group_id,
    COUNT(*) as taksit_sayisi,
    MIN(date) as ilk_tarih,
    MAX(date) as son_tarih,
    COUNT(DISTINCT date) as farkli_tarih_sayisi,
    COUNT(DISTINCT description) as farkli_aciklama_sayisi
FROM spendme_transactions 
WHERE installments > 1 
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY installment_group_id
ORDER BY MIN(created_at) DESC; 