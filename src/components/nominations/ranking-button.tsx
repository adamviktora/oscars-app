'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface RankingButtonProps {
  ranking: number | null;
  maxRanking: number; // 5 or 10
  disabled?: boolean;
  onSelect: (ranking: number) => void;
  onClear?: () => void;
}

export function RankingButton({
  ranking,
  maxRanking,
  disabled = false,
  onSelect,
  onClear,
}: RankingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Update popover position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (num: number) => {
    onSelect(num);
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear?.();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-10 h-10 rounded-full border-2 flex items-center justify-center
          font-bold text-lg transition-all
          ${
            ranking
              ? 'bg-primary text-primary-content border-primary'
              : 'bg-base-200 border-base-300 text-base-content/40 hover:bg-base-300 hover:border-primary hover:text-primary'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={ranking ? `Pořadí ${ranking}` : 'Vybrat pořadí'}
      >
        {ranking || '?'}
      </button>

      {isOpen && !disabled && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'absolute',
              top: popoverPosition.top,
              left: popoverPosition.left,
            }}
            className="z-[9999] bg-base-100 rounded-xl shadow-2xl border border-base-300 p-3"
          >
            <div
              className={`grid ${
                maxRanking === 10 ? 'grid-cols-6 gap-2' : 'grid-cols-6 gap-2'
              }`}
            >
              {Array.from({ length: maxRanking }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => handleSelect(num)}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    font-semibold text-base transition-all
                    ${
                      ranking === num
                        ? 'bg-primary text-primary-content'
                        : 'bg-base-200 hover:bg-primary hover:text-primary-content'
                    }
                  `}
                >
                  {num}
                </button>
              ))}
              {/* Clear button */}
              <button
                onClick={handleClear}
                className="w-10 h-10 rounded-full flex items-center justify-center
                  transition-all bg-error/20 text-error hover:bg-error hover:text-error-content"
                aria-label="Zrušit pořadí"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
