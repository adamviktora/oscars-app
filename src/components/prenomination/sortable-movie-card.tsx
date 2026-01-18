'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableMovieCardProps {
  id: number;
  name: string;
  rank: number;
  isOverflow?: boolean;
  disabled?: boolean;
}

export function SortableMovieCard({ id, name, rank, isOverflow = false, disabled = false }: SortableMovieCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 bg-base-100 border rounded-lg shadow-sm ${
        isDragging ? 'opacity-50 shadow-lg scale-105 z-50' : ''
      } ${isOverflow ? 'opacity-75' : ''}`}
    >
      {/* Rank badge */}
      <div className={`flex items-center justify-center w-10 h-10 text-white rounded-full font-bold text-lg shrink-0 ${
        isOverflow ? 'bg-yellow-500' : 'bg-green-500'
      }`}>
        {rank}
      </div>

      {/* Movie name */}
      <h3 className={`text-lg font-medium flex-1 ${isOverflow ? 'text-base-content/70' : ''}`}>{name}</h3>

      {/* Drag handle on the right for easier mobile use */}
      <button
        {...attributes}
        {...listeners}
        disabled={disabled}
        className={`p-2 rounded-lg transition-colors ${
          disabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab active:cursor-grabbing hover:bg-base-200'
        }`}
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-5 h-5 text-base-content/50" />
      </button>
    </div>
  );
}

