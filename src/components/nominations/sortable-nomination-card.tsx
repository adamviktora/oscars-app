'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { RankingButton } from './ranking-button';

interface SortableNominationCardProps {
  id: number;
  movieName: string;
  actorName: string | null;
  ranking: number | null;
  maxRanking: number;
  disabled?: boolean;
  disableDrag?: boolean;
  onRankingChange: (nominationId: number, ranking: number) => void;
}

export function SortableNominationCard({
  id,
  movieName,
  actorName,
  ranking,
  maxRanking,
  disabled = false,
  disableDrag = false,
  onRankingChange,
}: SortableNominationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: disabled || disableDrag });

  const style = disableDrag
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  return (
    <div
      ref={disableDrag ? undefined : setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 p-3 bg-base-100 border rounded-lg shadow-sm
        ${isDragging && !disableDrag ? 'opacity-50 shadow-lg scale-[1.02] z-50' : ''}
      `}
    >
      {/* Ranking button */}
      <RankingButton
        ranking={ranking}
        maxRanking={maxRanking}
        disabled={disabled}
        onSelect={(newRanking) => onRankingChange(id, newRanking)}
      />

      {/* Movie/Actor info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{movieName}</h3>
        {actorName && (
          <p className="text-sm text-base-content/60 truncate">{actorName}</p>
        )}
      </div>

      {/* Drag handle - hidden when drag is disabled */}
      {!disableDrag && (
        <button
          {...attributes}
          {...listeners}
          disabled={disabled}
          className={`
            p-2 rounded-lg transition-colors shrink-0
            ${
              disabled
                ? 'cursor-not-allowed opacity-40'
                : 'cursor-grab active:cursor-grabbing hover:bg-base-200'
            }
          `}
          aria-label="Přetáhnout pro změnu pořadí"
        >
          <GripVertical className="w-5 h-5 text-base-content/50" />
        </button>
      )}
    </div>
  );
}
