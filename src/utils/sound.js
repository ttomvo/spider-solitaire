// Simple synth using Web Audio API

let audioCtx = null;

const getAudioContext = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
};


export const playCardMove = () => {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        // Thwip sound - frequency sweep high to low
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
        console.error("Audio error", e);
    }
};

export const playCardDeal = () => {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        // Softer pip
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);

        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
        console.error("Audio error", e);
    }
};

export const playWin = () => {
    try {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        // Arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50]; // C E G C G C
        let time = ctx.currentTime;

        notes.forEach((note, i) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note, time + i * 0.1);

            gainNode.gain.setValueAtTime(0.1, time + i * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, time + i * 0.1 + 0.4);

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.start(time + i * 0.1);
            osc.stop(time + i * 0.1 + 0.4);
        });
    } catch (e) {
        console.error("Audio error", e);
    }
};
