import React from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (isInstallable && !isInstalled) {
      setIsVisible(true);
    }
  }, [isInstallable, isInstalled]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
            <Smartphone className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">SpendMe'i Yükle</h3>
            <p className="text-xs text-gray-500">Ana ekrana ekleyin ve hızlı erişim sağlayın</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={installApp}
            className="btn-primary text-xs px-3 py-1"
          >
            <Download className="h-3 w-3 mr-1" />
            Yükle
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallBanner; 