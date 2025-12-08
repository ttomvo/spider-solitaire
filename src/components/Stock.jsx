import React from 'react';

import Card from './Card';

const Stock = ({ cards, onDeal }) => {
    if (cards.length === 0) {
        return (
            <div className="w-24 h-36 border-2 border-white/20 rounded-md flex items-center justify-center">
                <span className="text-white/20 text-2xl">❌</span>
            </div>
        );
    }

    return (
        <div
            className="w-24 h-36 relative"
            onClick={onDeal}
        >
            {/* Render cards stacked. Only need to render the ones that will be dealt? 
                Rendering all for simplicity and correct layout animation. 
                Reverse to have top card on top visually if we were stacking with offsets, 
                but here they are just 0,0 absolute. 
            */}
            {cards.map((card) => (
                <div key={card.id} className="absolute inset-0">
                    <Card
                        {...card}
                        isDraggable={false}
                    // Stock cards are face down. 
                    // If they become face up in Tableau, Framer handles it?
                    // Card component handles faceUp/Down rendering.
                    // We need to ensure we pass faceUp={false} explicitly if card state assumes it?
                    // card object in stock has faceUp: false.
                    />
                </div>
            ))}

            {/* Click area / Overlay for interaction and count */}
            <div className="absolute inset-0 z-10 cursor-pointer hover:brightness-110 active:scale-95 transition-all flex items-end justify-end p-1">
                <div className="bg-black/50 text-white text-xs px-1 rounded pointer-events-none">
                    {Math.ceil(cards.length / 10)}
                </div>
            </div>
        </div>
    );
};

export default Stock;
