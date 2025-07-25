import React from 'react';
import { CATEGORY_EMOJIS } from '../../constants';

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  return (
    <div>
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
        {CATEGORY_EMOJIS.map((icon) => (
          <button
            type="button"
            key={icon}
            className={`text-2xl p-1 rounded hover:bg-primary-100 focus:outline-none ${value === icon ? 'ring-2 ring-primary-500 bg-primary-100' : ''}`}
            onClick={() => onChange(icon)}
            aria-label={`İkon seç: ${icon}`}
          >
            {icon}
          </button>
        ))}
      </div>
      {value && (
        <div className="mt-2 text-sm text-gray-600">Seçili ikon: <span className="text-xl">{value}</span></div>
      )}
    </div>
  );
};

export default IconPicker; 