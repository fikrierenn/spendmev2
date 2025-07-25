import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  CreditCard,
  Tag,
  Wallet,
  PieChart,
  BarChart3,
  Bot,
  Settings
} from 'lucide-react';
import { MOBILE_NAV_ITEMS } from '../../constants';

const BottomNavigation: React.FC = () => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    Home,
    CreditCard,
    Tag,
    Wallet,
    PieChart,
    BarChart3,
    Bot,
    Settings,
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className="h-6 w-6" /> : null;
  };

  return (
    <>
      {/* Safe area spacer for devices with home indicator */}
      <div className="lg:hidden h-6 bg-white"></div>
      
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <nav className="flex justify-around px-2 py-3">
          {MOBILE_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => `
                relative flex flex-col items-center justify-center py-3 px-2 min-w-0 flex-1 
                transition-all duration-200 ease-in-out rounded-xl mx-1
                ${isActive
                  ? 'text-primary-600 bg-primary-50 shadow-sm'
                  : 'text-gray-500 hover:text-primary-600 hover:bg-gray-50'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <div className={`
                    flex flex-col items-center space-y-1
                    ${isActive ? 'transform scale-110' : 'transform scale-100'}
                  `}>
                    <span className="transition-transform duration-200">
                      {getIcon(item.icon)}
                    </span>
                    <span className="text-xs font-medium truncate leading-tight">
                      {item.name}
                    </span>
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-1 w-1 h-1 bg-primary-600 rounded-full"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default BottomNavigation; 