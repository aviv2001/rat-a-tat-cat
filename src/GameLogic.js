/**
 * Rat-a-Tat Cat Game Logic
 * Official rules implementation with Add Card twist
 */

class Card {
    constructor(type, value = null) {
        this.type = type; // 'number', 'peek', 'swap', 'draw2', 'addcard'
        this.value = value; // 0-9 for number cards, null for power cards
    }

    getPoints() {
        return this.type === 'number' ? this.value : 0;
    }

    isPowerCard() {
        return this.type !== 'number';
    }
}

class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.hand = []; // Always 4 cards initially, can grow with Add Card
        this.knownCards = []; // Boolean array - true if player knows this card
        this.score = 0;
        this.totalScore = 0; // Cumulative across rounds
    }

    // Player can see outer cards at start
    revealOuterCards() {
        if (this.hand.length >= 2) {
            this.knownCards[0] = true; // Leftmost
            this.knownCards[this.hand.length - 1] = true; // Rightmost
        }
    }

    addCard(card) {
        this.hand.push(card);
        this.knownCards.push(false); // New cards are unknown
    }

    replaceCard(index, newCard) {
        const oldCard = this.hand[index];
        this.hand[index] = newCard;
        return oldCard;
    }

    peekAtCard(index) {
        if (index >= 0 && index < this.hand.length) {
            this.knownCards[index] = true;
        }
    }

    calculateScore() {
        this.score = this.hand.reduce((sum, card) => sum + card.getPoints(), 0);
        return this.score;
    }
}

class RatATatCatGame {
    constructor(gameId) {
        this.gameId = gameId;
        this.players = [];
        this.deck = [];
        this.discardPile = [];
        this.currentPlayerIndex = 0;
        this.drawnCard = null;
        this.drawnFromDiscard = false;
        this.gameStarted = false;
        this.roundEnded = false;
        this.knockerId = null;
        this.finalRoundActive = false;
        this.playersCompletedFinalTurn = 0;
        
        // Draw 2 chain state
        this.draw2ChainActive = false;
        this.draw2CardsRemaining = 0;
    }

    // ============ DECK MANAGEMENT ============

    initializeDeck() {
        this.deck = [];
        
        // Number cards: 0-8 appear 4 times each (36 cards)
        for (let value = 0; value <= 8; value++) {
            for (let i = 0; i < 4; i++) {
                this.deck.push(new Card('number', value));
            }
        }
        
        // Number 9 appears 9 times (9 cards)
        for (let i = 0; i < 9; i++) {
            this.deck.push(new Card('number', 9));
        }
        
        // Power cards: 3 copies each of Peek, Swap, Draw2
        for (let i = 0; i < 3; i++) {
            this.deck.push(new Card('peek'));
            this.deck.push(new Card('swap'));
            this.deck.push(new Card('draw2'));
        }
        
        // ADD CARD twist: 2 copies
        for (let i = 0; i < 2; i++) {
            this.deck.push(new Card('addcard'));
        }
        
        this.shuffleDeck();
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    drawCard() {
        // Reshuffle discard if deck empty
        if (this.deck.length === 0) {
            if (this.discardPile.length > 1) {
                const topCard = this.discardPile.pop();
                this.deck = [...this.discardPile];
                this.discardPile = [topCard];
                this.shuffleDeck();
            }
        }
        
        return this.deck.length > 0 ? this.deck.pop() : null;
    }

    // ============ GAME FLOW ============

    addPlayer(playerId, playerName) {
        if (this.players.length >= 6) return false;
        if (this.gameStarted) return false;
        
        this.players.push(new Player(playerId, playerName));
        return true;
    }

    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        if (this.currentPlayerIndex >= this.players.length) {
            this.currentPlayerIndex = 0;
        }
        return this.players.length === 0;
    }

    startRound() {
        if (this.players.length < 2) return false;
        
        this.initializeDeck();
        this.discardPile = [];
        this.roundEnded = false;
        this.knockerId = null;
        this.finalRoundActive = false;
        this.playersCompletedFinalTurn = 0;
        
        // Deal 4 cards to each player
        this.players.forEach(player => {
            player.hand = [];
            player.knownCards = [];
            for (let i = 0; i < 4; i++) {
                player.hand.push(this.drawCard());
                player.knownCards.push(false);
            }
            // Outer cards are NOT automatically revealed - player can hover to see them
        });
        
        // First discard - if power card, redraw
        let firstDiscard = this.drawCard();
        while (firstDiscard.isPowerCard()) {
            this.deck.unshift(firstDiscard); // Put back
            this.shuffleDeck();
            firstDiscard = this.drawCard();
        }
        this.discardPile.push(firstDiscard);
        
        this.currentPlayerIndex = 0;
        this.gameStarted = true;
        
        return true;
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    // ============ TURN ACTIONS ============

    /**
     * Option A: Draw from discard pile
     * RULE: Must replace one of your cards, cannot discard it
     */
    drawFromDiscardPile() {
        if (this.drawnCard) return { success: false, error: 'Already drawn a card this turn' };
        if (this.discardPile.length === 0) return { success: false, error: 'Discard pile empty' };
        
        const card = this.discardPile.pop();
        if (card.isPowerCard()) {
            // Power cards cannot be drawn from discard
            this.discardPile.push(card);
            return { success: false, error: 'Cannot draw power cards from discard pile' };
        }
        
        this.drawnCard = card;
        this.drawnFromDiscard = true;
        
        return { success: true, card, mustUse: true };
    }

    /**
     * Option B: Draw from deck
     * RULE: Can use it, use power, or discard it
     */
    drawFromDeck() {
        if (this.drawnCard) return { success: false, error: 'Already drawn a card this turn' };
        
        const card = this.drawCard();
        if (!card) return { success: false, error: 'Deck is empty' };
        
        this.drawnCard = card;
        this.drawnFromDiscard = false;
        
        return { success: true, card, mustUse: false };
    }

    /**
     * Replace one of your cards with the drawn card
     */
    replaceCardInHand(cardIndex) {
        if (!this.drawnCard) return { success: false, error: 'No card drawn' };
        
        const player = this.getCurrentPlayer();
        if (cardIndex < 0 || cardIndex >= player.hand.length) {
            return { success: false, error: 'Invalid card index' };
        }
        
        const replacedCard = player.replaceCard(cardIndex, this.drawnCard);
        // Card remains hidden after replacement
        this.discardPile.push(replacedCard);
        
        this.drawnCard = null;
        this.drawnFromDiscard = false;
        
        this.endTurn();
        return { success: true };
    }

    /**
     * Discard the drawn card without using it
     * RULE: Only allowed if drawn from deck, not discard pile
     */
    discardDrawnCard() {
        if (!this.drawnCard) return { success: false, error: 'No card drawn' };
        if (this.drawnFromDiscard) return { success: false, error: 'Cannot discard card from discard pile' };
        
        this.discardPile.push(this.drawnCard);
        this.drawnCard = null;
        
        this.endTurn();
        return { success: true };
    }

    // ============ POWER CARD ACTIONS ============

    /**
     * Use Peek power card
     * RULE: Look at one of your cards, then end turn
     */
    usePeek(cardIndex) {
        if (!this.drawnCard || this.drawnCard.type !== 'peek') {
            return { success: false, error: 'No peek card drawn' };
        }
        
        const player = this.getCurrentPlayer();
        if (cardIndex < 0 || cardIndex >= player.hand.length) {
            return { success: false, error: 'Invalid card index' };
        }
        
        // Don't mark as known - just return the card for temporary reveal
        const peekedCard = player.hand[cardIndex];
        
        this.discardPile.push(this.drawnCard);
        this.drawnCard = null;
        this.drawnFromDiscard = false;
        
        this.endTurn();
        return { success: true, revealedCard: peekedCard };
    }

    /**
     * Use Swap power card
     * RULE: Blind swap one of your cards with opponent's card (OPTIONAL)
     */
    useSwap(myCardIndex, opponentId, opponentCardIndex) {
        if (!this.drawnCard || this.drawnCard.type !== 'swap') {
            return { success: false, error: 'No swap card drawn' };
        }

        const player = this.getCurrentPlayer();
        const opponent = this.players.find(p => p.id === opponentId);

        if (!opponent) {
            return { success: false, error: 'Invalid opponent' };
        }
        if (opponent.id === player.id) {
            return { success: false, error: 'Cannot swap with yourself' };
        }
        if (myCardIndex < 0 || myCardIndex >= player.hand.length) {
            return { success: false, error: 'Invalid your card index' };
        }
        if (opponentCardIndex < 0 || opponentCardIndex >= opponent.hand.length) {
            return { success: false, error: 'Invalid opponent card index' };
        }

        // Blind swap - neither player should know what they're getting
        const myCard = player.hand[myCardIndex];
        const theirCard = opponent.hand[opponentCardIndex];

        player.hand[myCardIndex] = theirCard;
        opponent.hand[opponentCardIndex] = myCard;

        // Update known status - swapped cards are now unknown
        player.knownCards[myCardIndex] = false;
        opponent.knownCards[opponentCardIndex] = false;

        this.discardPile.push(this.drawnCard);
        this.drawnCard = null;
        this.drawnFromDiscard = false;

        this.endTurn();
        return { success: true, swappedWith: opponent.name };
    }

    /**
     * Decline to use Swap power card
     * RULE: Swap is optional - player can choose not to swap
     */
    declineSwap() {
        if (!this.drawnCard || this.drawnCard.type !== 'swap') {
            return { success: false, error: 'No swap card drawn' };
        }

        // Discard the swap card without using it
        this.discardPile.push(this.drawnCard);
        this.drawnCard = null;
        this.drawnFromDiscard = false;

        this.endTurn();
        return { success: true };
    }

    /**
     * Use Draw 2 power card
     * RULE: Draw 2 cards, can use first or discard and draw second
     * Chains if you draw another Draw 2
     */
    useDraw2() {
        if (!this.drawnCard || this.drawnCard.type !== 'draw2') {
            return { success: false, error: 'No draw2 card drawn' };
        }
        
        this.discardPile.push(this.drawnCard);
        this.drawnCard = null;
        
        // Activate Draw 2 chain
        this.draw2ChainActive = true;
        this.draw2CardsRemaining = 2;
        
        // Draw first card
        const firstCard = this.drawCard();
        if (!firstCard) {
            this.draw2ChainActive = false;
            this.endTurn();
            return { success: false, error: 'Deck empty' };
        }
        
        this.drawnCard = firstCard;
        
        // Check if it's another Draw 2 (chain continues)
        if (firstCard.type === 'draw2') {
            this.discardPile.push(firstCard);
            this.drawnCard = null;
            this.draw2CardsRemaining = 2; // Reset to 2
            
            const nextCard = this.drawCard();
            this.drawnCard = nextCard;
            return { success: true, card: nextCard, chaining: true, cardsRemaining: 2 };
        }
        
        return { success: true, card: firstCard, chaining: false, cardsRemaining: 2 };
    }

    /**
     * During Draw 2 chain - handle the drawn card
     */
    handleDraw2Card(action, cardIndex = null) {
        if (!this.draw2ChainActive) {
            return { success: false, error: 'No Draw 2 active' };
        }
        
        if (action === 'use' && cardIndex !== null) {
            // Use this card to replace
            const result = this.replaceCardInHand(cardIndex);
            if (result.success) {
                this.draw2ChainActive = false;
                this.draw2CardsRemaining = 0;
                // Turn already ended in replaceCardInHand
            }
            return result;
        } else if (action === 'discard') {
            // Discard this card and draw next
            this.discardPile.push(this.drawnCard);
            this.drawnCard = null;
            this.draw2CardsRemaining--;
            
            if (this.draw2CardsRemaining > 0) {
                const nextCard = this.drawCard();
                if (!nextCard) {
                    this.draw2ChainActive = false;
                    this.endTurn();
                    return { success: false, error: 'Deck empty' };
                }
                
                this.drawnCard = nextCard;
                
                // Check for another Draw 2 (chain continues)
                if (nextCard.type === 'draw2') {
                    this.discardPile.push(nextCard);
                    this.drawnCard = null;
                    this.draw2CardsRemaining = 2;
                    
                    const chainCard = this.drawCard();
                    this.drawnCard = chainCard;
                    return { success: true, card: chainCard, chaining: true, cardsRemaining: 2 };
                }
                
                return { success: true, card: nextCard, cardsRemaining: this.draw2CardsRemaining };
            } else {
                // Draw 2 complete
                this.draw2ChainActive = false;
                this.endTurn();
                return { success: true, draw2Complete: true };
            }
        }
        
        return { success: false, error: 'Invalid action' };
    }

    /**
     * Use Add Card power card (TWIST!)
     * RULE: Adds one more card to YOUR hand (hidden)
     */
    useAddCard() {
        if (!this.drawnCard || this.drawnCard.type !== 'addcard') {
            return { success: false, error: 'No addcard drawn' };
        }
        
        const currentPlayer = this.getCurrentPlayer();
        
        // Current player draws a new card (they don't know what it is)
        const newCard = this.drawCard();
        if (newCard) {
            currentPlayer.addCard(newCard);
        }
        
        this.discardPile.push(this.drawnCard);
        this.drawnCard = null;
        this.drawnFromDiscard = false;
        
        this.endTurn();
        return { success: true, addedCard: newCard };
    }

    // ============ KNOCKING & ROUND END ============

    /**
     * Knock to end the round
     * RULE: Can knock at end of any turn, triggers final round
     */
    knock() {
        if (this.knockerId) return { success: false, error: 'Someone already knocked' };
        
        const player = this.getCurrentPlayer();
        this.knockerId = player.id;
        this.finalRoundActive = true;
        this.playersCompletedFinalTurn = 0;
        
        // Move to next player without incrementing final turn counter (knocker doesn't get counted)
        this.drawnCard = null;
        this.drawnFromDiscard = false;
        
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        } while (this.players[this.currentPlayerIndex].id === this.knockerId);
        
        return { success: true };
    }

    /**
     * End current turn and move to next player
     */
    endTurn() {
        // Clear any drawn card state
        this.drawnCard = null;
        this.drawnFromDiscard = false;
        
        if (this.finalRoundActive) {
            this.playersCompletedFinalTurn++;
            
            // Check if everyone except knocker completed final turn
            if (this.playersCompletedFinalTurn >= this.players.length - 1) {
                this.endRound();
                return;
            }
        }
        
        // Move to next player (skip knocker in final round)
        do {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        } while (this.finalRoundActive && this.players[this.currentPlayerIndex].id === this.knockerId);
    }

    /**
     * End the round, replace power cards, calculate scores
     */
    endRound() {
        // Replace all power cards in hands
        this.players.forEach(player => {
            for (let i = 0; i < player.hand.length; i++) {
                while (player.hand[i].isPowerCard()) {
                    const replacement = this.drawCard();
                    if (replacement && replacement.type === 'number') {
                        player.hand[i] = replacement;
                        player.knownCards[i] = true; // Now revealed
                    } else if (replacement && replacement.isPowerCard()) {
                        // Keep drawing if we get another power card
                        continue;
                    } else {
                        break; // Deck empty
                    }
                }
            }
            
            // Calculate scores
            player.calculateScore();
            player.totalScore += player.score;
        });
        
        this.roundEnded = true;
    }

    /**
     * Get game state for a specific player
     * RULE: Players only see their own known cards and opponents' revealed cards
     */
    getGameState(playerId) {
        const player = this.players.find(p => p.id === playerId);
        
        return {
            gameId: this.gameId,
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                handSize: p.hand.length,
                hand: p.id === playerId 
                    ? p.hand.map((card, idx) => {
                        const isOuter = idx === 0 || idx === p.hand.length - 1;
                        return {
                            card: this.roundEnded || p.knownCards[idx] || isOuter ? card : { type: 'hidden' },
                            isKnown: this.roundEnded || p.knownCards[idx],
                            isOuter: isOuter
                        };
                      })
                    : p.hand.map((card, idx) => ({
                        card: this.roundEnded ? card : { type: 'hidden' },
                        isKnown: this.roundEnded,
                        isOuter: false
                      })),
                score: this.roundEnded ? p.score : null,
                totalScore: p.totalScore
            })),
            currentPlayerId: this.getCurrentPlayer()?.id,
            isMyTurn: this.getCurrentPlayer()?.id === playerId,
            discardTop: this.discardPile[this.discardPile.length - 1],
            deckSize: this.deck.length,
            drawnCard: this.getCurrentPlayer()?.id === playerId ? this.drawnCard : null,
            drawnFromDiscard: this.drawnFromDiscard,
            draw2Active: this.draw2ChainActive,
            draw2Remaining: this.draw2CardsRemaining,
            gameStarted: this.gameStarted,
            roundEnded: this.roundEnded,
            knockerId: this.knockerId,
            finalRoundActive: this.finalRoundActive
        };
    }
}

module.exports = { RatATatCatGame, Card, Player };