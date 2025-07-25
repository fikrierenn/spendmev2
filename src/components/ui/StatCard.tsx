import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor: 'primary' | 'success' | 'warning' | 'danger';
  change?: string;
  changeType?: 'positive' | 'negative';
  onClick?: () => void; // Kart tıklanabilir ise
  clickable?: boolean;  // Tıklanabilirlik için stil
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  change,
  changeType,
  onClick,
  clickable,
}) => {
  const getIconColorClass = (color: string) => {
    switch (color) {
      case 'primary':
        return 'bg-primary-100 text-primary-600';
      case 'success':
        return 'bg-success-100 text-success-600';
      case 'warning':
        return 'bg-warning-100 text-warning-600';
      case 'danger':
        return 'bg-danger-100 text-danger-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getChangeColorClass = (type: string) => {
    switch (type) {
      case 'positive':
        return 'text-success-600';
      case 'negative':
        return 'text-danger-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div
      className={`card p-4 lg:p-6 ${clickable ? 'hover:shadow-lg cursor-pointer transition-all' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={`p-2 lg:p-3 rounded-xl ${getIconColorClass(iconColor)}`}>
          <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
        </div>
        <div className="ml-3 lg:ml-4 flex-1 min-w-0">
          <p className="text-xs lg:text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-lg lg:text-2xl font-bold text-gray-900 truncate">{value}</p>
          {change && (
            <div className="flex items-center mt-1">
              <span className={`text-xs lg:text-sm font-medium ${getChangeColorClass(changeType || '')}`}>
                {change}
              </span>
              <span className="text-xs lg:text-sm text-gray-500 ml-1 hidden sm:inline">geçen aya göre</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard; 