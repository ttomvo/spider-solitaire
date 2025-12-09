import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { clsx } from 'clsx';
import Card from './Card';

const Column = ({ id, cards, onCardClick, isHintedTarget }) => {
    const { setNodeRef } = useDroppable({
        id: id,
        data: { type: 'column', columnId: id }
    });

    return (
        <div ref={setNodeRef} className="flex flex-col items-center min-h-[150px] relative" style={{ width: 'var(--card-width)' }}>
            {/* Placeholder for empty column */}
            <div className={clsx(
                "absolute top-0 border-2 rounded-md transition-all duration-300",
                isHintedTarget ? "border-yellow-400 bg-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-105" : "border-white/10"
            )} style={{ width: 'var(--card-width)', height: 'var(--card-height)' }}></div>

            {cards.map((card, index) => {
                // Logic to determine if draggable:
                // In Spider, you can drag a FACE UP card if it is the top of a valid run.
                // For simplicity in UI, we often just pass validation logic to parent.
                // Here we just render. The parent (App) determines isDraggable prop.
                return (
                    <Card
                        key={card.id}
                        id={card.id}
                        suit={card.suit}
                        rank={card.rank}
                        faceUp={card.faceUp}
                        isDraggable={card.isDraggable}
                        isHidden={card.isHidden}
                        isHintedSource={card.isHintedSource}
                        isHintedTarget={card.isHintedTarget}
                        onClick={() => onCardClick(card.id)}
                        style={{
                            marginTop: index === 0 ? 0 : 'var(--card-overlap)', // Dynamic overlap
                        }}
                    />
                );
            })}
        </div>
    );
};

export default Column;
