import { useEffect } from 'react';
import { playCardMove, playCardDeal, playWin } from '../utils/sound';

export const useSound = (enabled = true) => {
    // Ensure context is resumed on first interaction if possible, 
    // although the utils handle resume checks too.
    useEffect(() => {
        const handleInteraction = () => {
            // Just a dummy touch to ensure audio context can start if strictly locked
            // But our utils call resume() on play, which works inside click handlers.
        };
        window.addEventListener('click', handleInteraction, { once: true });
        return () => window.removeEventListener('click', handleInteraction);
    }, []);

    // Wrapper to check enabled state
    const wrap = (fn) => () => {
        if (enabled) fn();
    };

    return {
        playMove: wrap(playCardMove),
        playDeal: wrap(playCardDeal),
        playWin: wrap(playWin)
    };
};
