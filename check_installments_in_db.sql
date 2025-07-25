-- Veritabanında taksit işlemlerini kontrol et
SELECT 
    COUNT(*) as toplam_islem_sayisi,
    COUNT(CASE WHEN installments > 1 THEN 1 END) as taksitli_islem_sayisi,
    COUNT(CASE WHEN installments = 1 OR installments IS NULL THEN 1 END) as normal_islem_sayisi
FROM spendme_transactions;

-- Taksitli işlemleri detaylı listele
SELECT 
    id,
    description,
    amount,
    installments,
    installment_no,
    installment_group_id,
    date,
    created_at,
    user_id
FROM spendme_transactions 
WHERE installments > 1
ORDER BY created_at DESC;

-- Taksit gruplarını kontrol et
SELECT 
    installment_group_id,
    COUNT(*) as taksit_sayisi,
    MIN(date) as ilk_tarih,
    MAX(date) as son_tarih,
    MIN(amount) as min_tutar,
    MAX(amount) as max_tutar,
    STRING_AGG(description, ' | ') as aciklamalar
FROM spendme_transactions 
WHERE installments > 1
GROUP BY installment_group_id
ORDER BY MIN(created_at) DESC; 