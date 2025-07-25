// Türkçe Açıklama: Bu sayfa, detaylı bütçe durumu (kategori akordiyonları, alt kategoriler, gerçekleşen harcamalar ve bütçeler) için özel olarak hazırlanmıştır. Menüden erişilebilir olmalı.

import React from 'react';
import BudgetStatus from '../../components/ui/BudgetStatus';

const BudgetStatusPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Bütçe Durumu</h1>
      {/* BudgetStatus componenti, Supabase'den verileri kendi çeker ve akordiyonlu kategori yapısını gösterir */}
      <BudgetStatus selectedPeriod="2025-07" />
    </div>
  );
};

export default BudgetStatusPage; 