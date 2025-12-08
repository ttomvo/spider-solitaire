
export const SUITS = ['spades', 'hearts', 'clubs', 'diamonds'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const RANK_VALUES = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
    '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
};

// Create a deck for Spider Solitaire
// Typically 2 decks of cards (104 cards total)
// For 1 suit: 104 spades
// For 2 suits: 52 spades, 52 hearts
// For 4 suits: 2 of each suit
export const createDeck = (numSuits = 1) => {
    const deck = [];
    const suitsToUse = [];

    if (numSuits === 1) {
        suitsToUse.push('spades'); // 8 sets of spades? No, usually 8 full suits of spades. 13*8 = 104
        // Actually full deck has 4 suits. 
        // 1 suit mode = 8 full sets of Spades (A-K)
        for (let i = 0; i < 8; i++) {
            RANKS.forEach(rank => {
                deck.push({
                    id: crypto.randomUUID(),
                    suit: 'spades',
                    rank,
                    value: RANK_VALUES[rank],
                    faceUp: false
                });
            });
        }
    } else if (numSuits === 2) {
        // 4 sets of Spades, 4 sets of Hearts
        for (let i = 0; i < 4; i++) {
            ['spades', 'hearts'].forEach(suit => {
                RANKS.forEach(rank => {
                    deck.push({
                        id: crypto.randomUUID(),
                        suit,
                        rank,
                        value: RANK_VALUES[rank],
                        faceUp: false
                    });
                });
            });
        }
    } else {
        // 2 sets of all 4 suits
        for (let i = 0; i < 2; i++) {
            SUITS.forEach(suit => {
                RANKS.forEach(rank => {
                    deck.push({
                        id: crypto.randomUUID(),
                        suit,
                        rank,
                        value: RANK_VALUES[rank],
                        faceUp: false
                    });
                });
            });
        }
    }
    return deck;
};

export const shuffleDeck = (deck) => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
};

// Deal: 10 columns. 
// First 4 columns: 6 cards. Last 6 columns: 5 cards.
// Top card face up.
// Remaining 50 cards in stock.
export const dealInitialLayout = (shuffledDeck) => {
    const tableau = Array(10).fill([]).map(() => []);
    let deckIndex = 0;

    // Deal 54 cards to tableau
    for (let col = 0; col < 10; col++) {
        const cardsInCol = col < 4 ? 6 : 5;
        for (let i = 0; i < cardsInCol; i++) {
            const card = { ...shuffledDeck[deckIndex] };
            if (i === cardsInCol - 1) {
                card.faceUp = true;
            }
            tableau[col].push(card);
            deckIndex++;
        }
    }

    const stock = shuffledDeck.slice(deckIndex);
    return { tableau, stock };
};

// Check if a move is valid
// destColumn: array of cards in destination column
// movingCards: array of cards being moved (could be a stack)
export const isValidMove = (destColumn, movingCards) => {
    if (destColumn.length === 0) return true; // Can always move to empty column

    const targetCard = destColumn[destColumn.length - 1];
    const topMovingCard = movingCards[0];

    // Rule: Descending order (regardless of suit for moving TO a card, but usually we want same suit to build runs)
    // Spider Solitaire Rules:
    // 1. You can place a card on top of another card if it is 1 rank lower (e.g., 9 on 10).
    // 2. Suit does NOT matter for the drop itself.
    // 3. BUT, you can only pick up a stack if they are all same suit and in sequence. (This check should be done on drag start)

    return targetCard.value === topMovingCard.value + 1;
};

// Check if a column has a completed run (K to A of same suit)
export const checkForCompletedRun = (column) => {
    if (column.length < 13) return false;

    // Check last 13 cards
    const last13 = column.slice(-13);

    // Check if simple sequence K -> A
    if (last13[0].value !== 13) return false; // Must start with K

    // Check suits match and sequence is correct
    const suit = last13[0].suit;
    for (let i = 0; i < 13; i++) {
        if (last13[i].suit !== suit) return false;
        if (last13[i].value !== 13 - i) return false; // 13, 12, 11... 1
    }

    return true;
};
