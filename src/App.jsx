
import React, { useState } from 'react';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors, defaultDropAnimationSideEffects } from '@dnd-kit/core';
import { createDeck, shuffleDeck, dealInitialLayout, isValidMove, checkForCompletedRun } from './validations/gameLogic';
import Card from './components/Card';
import Column from './components/Column';
import Stock from './components/Stock';
import Foundation from './components/Foundation';
import SettingsModal from './components/SettingsModal';
import { useSound } from './hooks/useSound';
import { Settings } from 'lucide-react';

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

function App() {
  const initializeGame = () => {
    const deck = createDeck(1);
    const shuffled = shuffleDeck(deck);
    const { tableau, stock } = dealInitialLayout(shuffled);
    return {
      tableau,
      stock,
      foundation: [],
      moves: 0
    };
  };

  const [gameState, setGameState] = useState(() => initializeGame());
  const [activeId, setActiveId] = useState(null);
  const [draggedStack, setDraggedStack] = useState([]);
  const [isDealing, setIsDealing] = useState(false);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [difficulty, setDifficulty] = useState(1); // 1, 2, 4 suits (TODO: Implement logic for >1)
  const [history, setHistory] = useState([]);

  // Persist sound
  React.useEffect(() => {
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const { playMove, playDeal } = useSound(soundEnabled);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const saveHistory = () => {
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(gameState))]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setHistory(prev => prev.slice(0, prev.length - 1));
    setGameState(previousState);
  };

  const handleStockClick = async () => {
    if (isDealing) return;
    if (gameState.stock.length === 0) return;

    // Rule: Cannot deal if any column is empty
    if (gameState.tableau.some(col => col.length === 0)) {
      alert("Cannot deal while there are empty columns!");
      return;
    }

    setIsDealing(true);
    saveHistory(); // Save before dealing

    // Deal 1 card to each column, one by one
    for (let i = 0; i < 10; i++) {
      // Wait for visual effect
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setGameState(prevState => {
        const currentStock = [...prevState.stock];
        if (currentStock.length === 0) return prevState;

        const card = currentStock.pop();
        card.faceUp = true;

        playDeal();

        const currentTableau = prevState.tableau.map(col => [...col]);
        currentTableau[i].push(card);

        return {
          ...prevState,
          stock: currentStock,
          tableau: currentTableau,
          // Do NOT check runs yet. Wait until full deal.
        };
      });
    }

    // Wait a bit after last card lands
    await new Promise(resolve => setTimeout(resolve, 200));

    // Consolidate and Check Runs on ALL columns
    // Use functional update to ensure we have latest state after all the rapid updates
    setGameState(finalState => {
      let newFoundation = [...finalState.foundation];
      let newTableau = finalState.tableau.map(col => [...col]);

      newTableau.forEach(col => {
        if (checkForCompletedRun(col)) {
          const run = col.splice(col.length - 13, 13);
          newFoundation.push(run);
          if (col.length > 0) {
            col[col.length - 1].faceUp = true;
          }
        }
      });

      return {
        ...finalState,
        tableau: newTableau,
        foundation: newFoundation
      };
    });

    setIsDealing(false);
  };

  // Helper to calculate draggable status
  const getIsDraggable = (card, colIndex, cardIndex) => {
    if (!card.faceUp) return false;
    const col = gameState.tableau[colIndex];
    // Must be a valid sequence from cardIndex to end of col
    // Same suit, descending rank
    for (let i = cardIndex; i < col.length - 1; i++) {
      if (col[i].suit !== col[i + 1].suit || col[i].value !== col[i + 1].value + 1) {
        return false;
      }
    }
    return true;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const { id } = active;

    // Find card and build stack
    for (let i = 0; i < 10; i++) {
      const col = gameState.tableau[i];
      const idx = col.findIndex(c => c.id === id);
      if (idx !== -1) {
        // Found it
        const stack = col.slice(idx);
        setDraggedStack(stack);
        setActiveId(id);
        break;
      }
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedStack([]);

    if (!over) return;

    const sourceCardId = active.id;
    // Find source column
    let sourceColIndex = -1;
    let sourceCardIndex = -1;

    gameState.tableau.forEach((col, i) => {
      const idx = col.findIndex(c => c.id === sourceCardId);
      if (idx !== -1) {
        sourceColIndex = i;
        sourceCardIndex = idx;
      }
    });

    if (sourceColIndex === -1) return;

    const destColId = over.id; // "col-0", "col-1" or card ID
    let destColIndex = -1;

    // Determine destination column index
    if (String(destColId).startsWith("col-")) {
      destColIndex = parseInt(destColId.split("-")[1]);
    } else {
      // Dropped on a card
      gameState.tableau.forEach((col, i) => {
        if (col.some(c => c.id === destColId)) {
          destColIndex = i;
        }
      });
    }

    if (destColIndex === -1 || destColIndex === sourceColIndex) return;

    const sourceCol = [...gameState.tableau[sourceColIndex]];
    const destCol = [...gameState.tableau[destColIndex]];
    const movingCards = sourceCol.slice(sourceCardIndex);

    // Validate Move
    if (isValidMove(destCol, movingCards)) {
      // Execute Move
      // 1. Remove from source
      sourceCol.splice(sourceCardIndex, movingCards.length);

      // 2. Flip new top of source if needed
      if (sourceCol.length > 0) {
        sourceCol[sourceCol.length - 1].faceUp = true;
      }

      // 3. Add to dest
      movingCards.forEach(c => destCol.push(c));

      // 4. Check for completed runs in dest
      let newFoundation = [...gameState.foundation];
      if (checkForCompletedRun(destCol)) {
        // Move completed run to foundation
        // Remove last 13 cards
        const run = destCol.splice(destCol.length - 13, 13);
        newFoundation.push(run);
        // Flip new top if needed
        if (destCol.length > 0) {
          destCol[destCol.length - 1].faceUp = true;
        }
      }

      const newTableau = [...gameState.tableau];
      newTableau[sourceColIndex] = sourceCol;
      newTableau[destColIndex] = destCol;

      playMove();

      setGameState({
        ...gameState,
        tableau: newTableau,
        foundation: newFoundation,
        moves: gameState.moves + 1
      });
    }
  };

  const handleCardClick = (clickedCardId) => {
    // 1. Find the card
    let sourceColIndex = -1;
    let sourceCardIndex = -1;
    gameState.tableau.forEach((col, i) => {
      const idx = col.findIndex(c => c.id === clickedCardId);
      if (idx !== -1) {
        sourceColIndex = i;
        sourceCardIndex = idx;
      }
    });

    if (sourceColIndex === -1) return;

    const sourceCol = gameState.tableau[sourceColIndex];
    if (!sourceCol[sourceCardIndex].faceUp) return;

    // 2. Validate stack is movable
    // Must be same suit descending from sourceCardIndex to end
    for (let i = sourceCardIndex; i < sourceCol.length - 1; i++) {
      if (sourceCol[i].suit !== sourceCol[i + 1].suit || sourceCol[i].value !== sourceCol[i + 1].value + 1) {
        return; // Not a valid stack to move
      }
    }

    const movingCards = sourceCol.slice(sourceCardIndex);
    const topCardValue = movingCards[0].value;
    const topCardSuit = movingCards[0].suit;

    // 3. Find best target
    // Priorities:
    // 1. Empty column (if King involved? or just generally?) -> Actually usually piling on cards is better than empty cols unless necessary.
    // Let's stick to Plan:
    // P1: Same suit sequence (e.g. 6 of Spades -> 7 of Spades)
    // P2: Different suit sequence (e.g. 6 of Spades -> 7 of Hearts)
    // P3: Empty column

    let bestTargetColIndex = -1;
    let bestPriority = 999;

    gameState.tableau.forEach((col, i) => {
      // Skip source column
      if (i === sourceColIndex) return;

      if (col.length === 0) {
        // Empty column, valid for any move
        if (3 < bestPriority) {
          bestPriority = 3;
          bestTargetColIndex = i;
        }
      } else {
        const targetCard = col[col.length - 1];
        if (targetCard.value === topCardValue + 1) {
          // Valid rank
          if (targetCard.suit === topCardSuit) {
            // Same suit - Priority 1
            // Immediate win, usually
            if (1 < bestPriority) {
              bestPriority = 1;
              bestTargetColIndex = i;
            }
          } else {
            // Different suit - Priority 2
            if (2 < bestPriority) {
              bestPriority = 2;
              bestTargetColIndex = i;
            }
          }
        }
      }
    });

    // 4. Execute Move
    if (bestTargetColIndex !== -1) {
      const destCol = [...gameState.tableau[bestTargetColIndex]];
      const newSourceCol = [...sourceCol];

      // Remove from source
      newSourceCol.splice(sourceCardIndex, movingCards.length);

      // Flip
      if (newSourceCol.length > 0) {
        newSourceCol[newSourceCol.length - 1].faceUp = true;
      }

      // Add to dest
      movingCards.forEach(c => destCol.push(c));

      // Check completion
      let newFoundation = [...gameState.foundation];
      if (checkForCompletedRun(destCol)) {
        const run = destCol.splice(destCol.length - 13, 13);
        newFoundation.push(run);
        if (destCol.length > 0) {
          destCol[destCol.length - 1].faceUp = true;
        }
      }

      const newTableau = [...gameState.tableau];
      newTableau[sourceColIndex] = newSourceCol;
      newTableau[bestTargetColIndex] = destCol;

      playMove();

      setGameState({
        ...gameState,
        tableau: newTableau,
        foundation: newFoundation,
        moves: gameState.moves + 1
      });
    }
  };

  const isCardHidden = (card) => {
    if (activeId === card.id) return true;
    if (draggedStack.some(c => c.id === card.id)) return true;
    return false;
  };

  const [hintState, setHintState] = useState(null); // { sourceCardId, targetCardId, targetColId }
  const [availableHints, setAvailableHints] = useState([]);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const hintTimeoutRef = React.useRef(null);

  const handleHint = () => {
    // If we have active hints and are currently showing one, cycle to next
    if (hintState && availableHints.length > 0) {
      const nextIndex = (currentHintIndex + 1) % availableHints.length;
      setCurrentHintIndex(nextIndex);
      setHintState(availableHints[nextIndex]);

      // Reset timer
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => setHintState(null), 1500);
      return;
    }

    // Smarter Hint: Check ALL valid movable sub-stacks.
    let allMoves = [];

    gameState.tableau.forEach((sourceCol, sourceColIndex) => {
      if (sourceCol.length === 0) return;

      let validStackStartIndex = sourceCol.length - 1;
      for (let i = sourceCol.length - 1; i >= 0; i--) {
        if (!sourceCol[i].faceUp) break;
        if (i < sourceCol.length - 1) {
          if (sourceCol[i].suit !== sourceCol[i + 1].suit || sourceCol[i].value !== sourceCol[i + 1].value + 1) {
            break; // Sequence broken
          }
        }
        validStackStartIndex = i;
      }

      for (let i = validStackStartIndex; i < sourceCol.length; i++) {
        const movingUnit = sourceCol.slice(i);
        const topCard = movingUnit[0];

        gameState.tableau.forEach((targetCol, targetColIndex) => {
          if (sourceColIndex === targetColIndex) return;

          let priority = 999;
          let targetCardId = null;
          let targetColId = null;

          if (targetCol.length === 0) {
            if (i > 0) priority = 3;
            targetColId = `col-${targetColIndex}`;
          } else {
            const targetCard = targetCol[targetCol.length - 1];
            if (targetCard.value === topCard.value + 1) {
              targetCardId = targetCard.id;
              targetColId = `col-${targetColIndex}`;
              if (targetCard.suit === topCard.suit) {
                priority = 1;
              } else {
                priority = 2;
              }
            }
          }

          if (priority < 999) {
            allMoves.push({
              priority,
              // Tie-breaker: Prefer moving larger stacks (deeper index i)
              // Or prefer moving from larger piles? 
              // Let's use priority first.
              move: {
                sourceCardId: topCard.id,
                targetCardId: targetCardId,
                targetColId: targetColId
              }
            });
          }
        });
      }
    });

    if (allMoves.length > 0) {
      // Sort by priority (asc)
      allMoves.sort((a, b) => a.priority - b.priority);

      const sortedMoves = allMoves.map(m => m.move);
      setAvailableHints(sortedMoves);
      setCurrentHintIndex(0);
      setHintState(sortedMoves[0]);

      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      hintTimeoutRef.current = setTimeout(() => setHintState(null), 1500);
    } else {
      // Optional: Shake effect or toast "No moves"
    }
  };

  // Keyboard Shortcuts
  // Use ref to access latest state/handlers without re-binding event listener
  const handlersRef = React.useRef({ handleStockClick, handleUndo, handleHint });
  React.useEffect(() => {
    handlersRef.current = { handleStockClick, handleUndo, handleHint };
  });

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input (not relevant here but good practice)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'd' || e.key === 'D') {
        handlersRef.current.handleStockClick();
      } else if (e.key === 'u' || e.key === 'U') {
        handlersRef.current.handleUndo();
      } else if (e.key === 'h' || e.key === 'H') {
        handlersRef.current.handleHint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clear hints when game state changes
  React.useEffect(() => {
    setHintState(null);
    setAvailableHints([]);
    setCurrentHintIndex(0);
  }, [gameState]);

  const hasWon = gameState?.foundation.length === 8; // 8 sets of 13 = 104 cards

  if (!gameState) return <div className="text-white">Loading...</div>;

  return (
    <div className="min-h-screen p-2 md:p-4 lg:p-8 bg-game-green text-white select-none overflow-hidden touch-none">
      <div className="w-full max-w-[1800px] mx-auto h-full flex flex-col px-2 md:px-4">
        {hasWon && (
          <WinModal onPlayAgain={() => setGameState(initializeGame())} soundEnabled={soundEnabled} />
        )}

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          difficulty={difficulty}
          setDifficulty={setDifficulty}
        />

        <header className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-yellow-500 drop-shadow-md">Spider Solitaire</h1>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Settings"
            >
              <Settings size={28} />
            </button>
          </div>
          <div className="flex gap-4 items-center">
            <div className="bg-black/30 px-4 py-2 rounded-lg font-mono">Moves: {gameState.moves}</div>
            <button onClick={() => setGameState(initializeGame())} className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded shadow-lg transition-colors">New Game</button>
          </div>
        </header>

        <div className="flex justify-between mb-2">
          <div className="flex gap-8">
            <Stock cards={gameState.stock} onDeal={handleStockClick} />
            {/* Spacer or any other info */}
          </div>
          <Foundation completedRuns={gameState.foundation} />
        </div>

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-10 gap-2 lg:gap-4 flex-grow mt-4">
            {gameState.tableau.map((col, colIndex) => (
              <Column
                key={`col-${colIndex}`}
                id={`col-${colIndex}`}
                // Hint target if this column is the target in the hint state AND it's empty (targetCardId is null)
                isHintedTarget={hintState?.targetColId === `col-${colIndex}` && !hintState?.targetCardId}
                cards={col.map((card, cardIndex) => ({
                  ...card,
                  // Logic for draggability...
                  isDraggable: card.faceUp && getIsDraggable(card, colIndex, cardIndex),
                  isHidden: isCardHidden(card),
                  // Logic for hints
                  isHintedSource: hintState?.sourceCardId === card.id,
                  isHintedTarget: hintState?.targetCardId === card.id
                }))}
                onCardClick={(cardId) => handleCardClick(cardId, colIndex)}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {draggedStack.length > 0 ? (
              <div className="flex flex-col relative" style={{ width: 'var(--card-width)' }}>
                {draggedStack.map((card, index) => (
                  <Card
                    key={card.id}
                    {...card}
                    isDraggable={true}
                    disableLayoutAnimations={true}
                    style={{ marginTop: index === 0 ? 0 : 'var(--card-overlap)' }}
                  />
                ))}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <div className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white py-2 px-4 flex justify-center items-center gap-8 text-sm font-mono border-t border-white/10 z-40">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">D</span>
            <span>Deal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">U</span>
            <span>Undo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">H</span>
            <span>Hint</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const WinModal = ({ onPlayAgain, soundEnabled }) => {
  const { playWin } = useSound(soundEnabled);

  React.useEffect(() => {
    playWin();
  }, [playWin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center animate-bounce">
        <h2 className="text-6xl font-bold text-yellow-400 mb-4">You Win!</h2>
        <p className="text-2xl text-white mb-8">Congratulations! You've solved the spider.</p>
        <button onClick={onPlayAgain} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-full text-xl font-bold transition-all transform hover:scale-105">Play Again</button>
      </div>
    </div>
  );
};

export default App;
