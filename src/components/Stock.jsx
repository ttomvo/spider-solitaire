import React from 'react';

import Card from './Card';

const Stock = ({ cards, onDeal }) => {
    if (cards.length === 0) {
        return (
            <div className="border-2 border-white/20 rounded-md flex items-center justify-center" style={{ width: 'var(--card-width)', height: 'var(--card-height)' }}>
                <span className="text-white/20 text-2xl">❌</span>
            </div>
        );
    }

    return (
        <div className="relative" onClick={onDeal} style={{ width: 'var(--card-width)', height: 'var(--card-height)' }}>
            {/* Render cards stacked. Only need to render the ones that will be dealt? 
                Rendering all for simplicity and correct layout animation. 
                Reverse to have top card on top visually if we were stacking with offsets, 
                but here they are just 0,0 absolute. 
            */}
            {cards.length === 0 ? (
                <div className="border-2 border-white/20 rounded-md flex items-center justify-center text-white/20 text-xs w-full h-full">
                    Empty
                </div>
            ) : (
                <>
                    {/* Render a stack effect */}
                    {cards.length > 1 && (
                        <div className="absolute top-1 left-1 card-back-pattern rounded-md w-full h-full border border-white/20"></div>
                    )}
                    {cards.length > 2 && (
                        <div className="absolute top-0.5 left-0.5 card-back-pattern rounded-md w-full h-full border border-white/20"></div>
                    )}

                    <div
                        className="relative"
                        style={{ width: 'var(--card-width)', height: 'var(--card-height)' }}
                    >
                        <div className="w-full h-full card-back-pattern rounded-md border-2 border-white/50 shadow-md flex items-center justify-center select-none cursor-pointer hover:brightness-110 transition-all active:scale-95">
                            <div className="w-8 h-8 rounded-full border-2 border-yellow-500/30 flex items-center justify-center">
                                <span className="text-yellow-500/50 text-xs font-serif">GM</span>
                            </div>
                        </div>
                        <div className="absolute -bottom-6 w-full text-center text-xs text-white/70 font-mono">
                            {cards.length}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Stock;
