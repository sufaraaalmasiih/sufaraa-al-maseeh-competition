"use client";

import { cn } from "@/lib/utils";

interface PuzzlePieceProps {
  children: React.ReactNode;
  dragging?: boolean;
  className?: string;
  draggable?: boolean;
  onDragEnd?: () => void;
  onDragOver?: (event: React.DragEvent) => void;
  onDragStart?: () => void;
}

export function PuzzlePiece({
  children,
  dragging = false,
  className,
  draggable,
  onDragEnd,
  onDragOver,
  onDragStart,
}: PuzzlePieceProps) {
  return (
    <div
      draggable={draggable}
      className={cn("puzzle-piece", dragging && "puzzle-piece-dragging", className)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
    >
      {children}
    </div>
  );
}
