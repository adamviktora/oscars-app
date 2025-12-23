'use client';

import { Check } from 'lucide-react';

interface MovieCheckboxProps {
  id: number;
  name: string;
  selected: boolean;
  disabled: boolean;
  hasUnsavedChanges?: boolean;
  onToggle: (movieId: number, selected: boolean) => void;
}

export default function MovieCheckbox({
  id,
  name,
  selected,
  disabled,
  hasUnsavedChanges,
  onToggle,
}: MovieCheckboxProps) {
  const handleClick = () => {
    if (!disabled || selected) {
      onToggle(id, !selected);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        border p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 relative
        ${selected 
          ? 'border-green-500 bg-green-500/10' 
          : disabled 
            ? 'border-base-300 bg-base-200 opacity-50 cursor-not-allowed' 
            : 'border-base-300 hover:border-base-content/30'
        }
        ${hasUnsavedChanges ? 'ring-2 ring-warning ring-offset-1' : ''}
      `}
    >
      {hasUnsavedChanges && (
        <span className="absolute -top-2 -right-2 badge badge-warning badge-xs">•</span>
      )}
      <div
        className={`
          w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0
          ${selected 
            ? 'border-green-500 bg-green-500' 
            : 'border-base-content/30'
          }
        `}
      >
        {selected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
      </div>
      <span className={`${selected ? 'font-medium' : ''}`}>{name}</span>
    </div>
  );
}
