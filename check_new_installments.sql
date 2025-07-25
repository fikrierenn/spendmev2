-- Yeni oluşturulan taksitli işlemleri kontrol et
SELECT 
    id,
    description,
    date,
    amount,
    installments,
    installment_no,
    installment_group_id,
    created_at
FROM spendme_transactions 
WHERE installments > 1 
AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC, installment_group_id, installment_no;

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
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY installment_group_id
ORDER BY MIN(created_at) DESC; 