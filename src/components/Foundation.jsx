import Card from './Card';

const Foundation = ({ completedRuns }) => {
    return (
        <div className="flex gap-2">
            {/* Spider Solitaire needs 8 foundations for 8 completed runs */}
            {Array.from({ length: 8 }).map((_, index) => {
                const run = completedRuns[index];
                return (
                    <div
                        key={index}
                        className="border-2 border-white/20 rounded-md bg-black/10 flex items-center justify-center relative"
                        style={{ width: 'var(--card-width)', height: 'var(--card-height)' }}
                    >
                        {!run && <span className="text-white/10 text-3xl">♠️</span>}

                        {run && run.map((card) => (
                            <div key={card.id} className="absolute inset-0 z-10">
                                <Card
                                    {...card}
                                    isDraggable={false}
                                    faceUp={true} // Completed runs are always visible
                                />
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

export default Foundation;
