
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

// Simple suit icons or text
const suitIcons = {
    spades: '♠️',
    hearts: '♥️',
    clubs: '♣️',
    diamonds: '♦️'
};

const Card = ({ id, suit, rank, faceUp, isDraggable, isHidden, isHintedSource, isHintedTarget, style: propStyle, ...props }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: id,
        data: { suit, rank, faceUp },
        disabled: !isDraggable,
    });

    // Deterministic random values based on ID
    const { rotation, xOffset } = React.useMemo(() => {
        const str = String(id);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
        }

        const seed = Math.abs(hash);
        const r = ((seed % 100) / 100) * 3 - 1.5; // -1.5 to +1.5 degrees
        const x = ((seed % 10) / 10) * 2 - 1;     // -1 to +1 pixels

        return { rotation: r, xOffset: x };
    }, [id]);

    // Outer Style: Handles Dragging Position & Z-Index & Layout props
    // We do NOT apply rotation here to avoid conflict with Framer's layout transform
    const outerStyle = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
        ...propStyle
    } : {
        zIndex: (isHintedSource || isHintedTarget) ? 100 : "auto", // Boost Z-index if hinted
        ...propStyle
    };

    // Inner Style: Handles the "Messy" look
    // This is a static transform relative to the parent
    const innerStyle = {
        transform: `translate3d(${xOffset}px, 0, 0) rotate(${rotation}deg)`,
    };

    if (isHidden) {
        return <div className="w-24 h-36 opacity-0 pointer-events-none" style={propStyle}></div>;
    }

    const Wrapper = motion.div;

    // Common Visual Classes for the card look
    const faceDownClasses = "w-full h-full card-back-pattern rounded-md border-2 border-white/50 shadow-md flex items-center justify-center select-none";
    const faceUpClasses = clsx(
        "w-full h-full bg-white rounded-md border border-gray-300 shadow-md flex flex-col justify-between p-1 select-none relative transition-all duration-300",
        (suit === 'hearts' || suit === 'diamonds') ? "text-red-600" : "text-black",
        isDraggable ? "cursor-grab active:cursor-grabbing" : "cursor-default",
        isHintedSource && "ring-4 ring-yellow-400 ring-offset-2 scale-105 z-50",
        isHintedTarget && "ring-4 ring-green-400 ring-offset-2 scale-105 z-40"
    );

    if (!faceUp) {
        return (
            <Wrapper
                layoutId={id}
                ref={setNodeRef}
                className="w-24 h-36 relative" // Outer container size
                style={outerStyle}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
            >
                <div className={faceDownClasses} style={innerStyle} onClick={props.onClick}>
                    <div className="w-8 h-8 rounded-full border-2 border-yellow-500/30 flex items-center justify-center">
                        <span className="text-yellow-500/50 text-xs font-serif">GM</span>
                    </div>
                </div>
            </Wrapper>
        );
    }

    return (
        <Wrapper
            layoutId={id}
            ref={setNodeRef}
            style={outerStyle}
            {...listeners}
            {...attributes}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-24 h-36 relative" // Outer container size
        >
            <div className={faceUpClasses} style={innerStyle} onClick={props.onClick}>
                <div className="text-sm font-bold leading-none">{rank} {suitIcons[suit]}</div>
                <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20 pointer-events-none">
                    {suitIcons[suit]}
                </div>
                <div className="text-sm font-bold leading-none self-end rotate-180">{rank} {suitIcons[suit]}</div>
            </div>
        </Wrapper>
    );
};

export default Card;
