import React from 'react';
import { X, Volume2, VolumeX, AlignCenter } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, soundEnabled, setSoundEnabled, difficulty, setDifficulty }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-neutral-900 border border-neutral-700 text-white p-6 rounded-2xl shadow-2xl w-full max-w-sm relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold mb-6 text-center text-yellow-500">Settings</h2>

                <div className="space-y-6">
                    {/* Sound Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {soundEnabled ? <Volume2 className="text-green-500" /> : <VolumeX className="text-red-500" />}
                            <span className="text-lg font-medium">Sound Effects</span>
                        </div>
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 ${soundEnabled ? 'bg-green-600' : 'bg-neutral-600'
                                }`}
                        >
                            <div
                                className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${soundEnabled ? 'translate-x-6' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Difficulty Selection */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 mb-2">
                            <AlignCenter className="text-blue-500" />
                            <span className="text-lg font-medium">Difficulty (Suits)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 4].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setDifficulty(num)}
                                    className={`py-2 rounded-lg font-bold border transition-all ${difficulty === num
                                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg scale-105'
                                            : 'bg-neutral-800 border-neutral-600 text-neutral-400 hover:bg-neutral-700'
                                        }`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-neutral-500 text-center mt-1">
                            (Restart required to apply difficulty changes)
                        </p>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-neutral-800 text-center">
                    <p className="text-neutral-500 text-sm">Golden Meteor Solitaire</p>
                    <p className="text-neutral-600 text-xs mt-1">v1.0.0</p>
                </div>

            </div>
        </div>
    );
};

export default SettingsModal;
