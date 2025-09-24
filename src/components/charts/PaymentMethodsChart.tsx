import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PaymentMethodData {
  name: string;
  value: number;
  color: string;
  icon: string;
}

interface PaymentMethodsChartProps {
  data: PaymentMethodData[];
}

const PaymentMethodsChart: React.FC<PaymentMethodsChartProps> = ({ data }) => {
  // Eğer veri yoksa loading göster
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        Henüz ödeme yöntemi verisi bulunmuyor
      </div>
    );
  }

  // Toplam tutarı hesapla
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{data.icon}</span>
            <span className="font-semibold text-gray-900 dark:text-white">{data.name}</span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <div>Tutar: {data.value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div>
            <div>Oran: %{percentage}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload?.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Merkezde toplam tutar göster */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Toplam</div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsChart;
