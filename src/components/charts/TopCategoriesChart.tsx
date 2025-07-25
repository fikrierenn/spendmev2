import React from 'react';
import { ChartData } from '../../types';
import { formatCurrency } from '../../utils/dummyData';

interface TopCategoriesChartProps {
  data: ChartData[];
}

const TopCategoriesChart: React.FC<TopCategoriesChartProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const percentage = total > 0 ? (item.value / total) * 100 : 0;
        
        return (
          <div key={item.name} className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{item.name}</span>
                <span className="text-sm text-gray-500">{formatCurrency(item.value)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: item.color 
                  }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-500 w-12 text-right">
              {percentage.toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default TopCategoriesChart; 