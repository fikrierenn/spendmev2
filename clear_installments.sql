-- Mevcut taksitli işlemleri temizle
-- Bu script, tüm taksitli işlemleri silecek

-- Önce mevcut durumu kontrol et
SELECT 
    COUNT(*) as toplam_taksitli_islem,
    COUNT(DISTINCT installment_group_id) as taksit_grubu_sayisi
FROM spendme_transactions 
WHERE installments > 1;

-- Taksitli işlemleri sil
DELETE FROM spendme_transactions 
WHERE installments > 1;

-- Silme sonrası kontrol
SELECT 
    COUNT(*) as kalan_islem_sayisi
FROM spendme_transactions; 