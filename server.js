const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const { RatATatCatGame } = require('./src/GameLogic.js');

app.use(express.static('public'));

const games = new Map();

io.on('connection', (socket) => {
    console.log(`✅ Player connected: ${socket.id}`);

    // ============ GAME MANAGEMENT ============

    socket.on('createGame', ({ playerName }) => {
        const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const game = new RatATatCatGame(gameId);
        
        if (game.addPlayer(socket.id, playerName)) {
            games.set(gameId, game);
            socket.join(gameId);
            socket.gameId = gameId;
            
            console.log(`🎮 Game ${gameId} created by ${playerName}`);
            socket.emit('gameCreated', { gameId, gameState: game.getGameState(socket.id) });
        }
    });

    socket.on('joinGame', ({ gameId, playerName }) => {
        const game = games.get(gameId);
        
        if (!game) {
            socket.emit('error', 'Game not found');
            return;
        }
        
        if (game.gameStarted) {
            socket.emit('error', 'Game already started');
            return;
        }
        
        if (!game.addPlayer(socket.id, playerName)) {
            socket.emit('error', 'Game is full (max 6 players)');
            return;
        }
        
        socket.join(gameId);
        socket.gameId = gameId;
        
        console.log(`👥 ${playerName} joined game ${gameId}`);
        broadcastGameState(gameId);
    });

    socket.on('startRound', () => {
        const game = games.get(socket.gameId);
        if (!game) return;
        
        if (game.startRound()) {
            console.log(`🎲 Game ${socket.gameId} started`);
            broadcastGameState(socket.gameId);
        } else {
            socket.emit('error', 'Need at least 2 players to start');
        }
    });

    // ============ TURN ACTIONS ============

    socket.on('drawFromDeck', () => {
        const game = games.get(socket.gameId);
        if (!game || !isPlayerTurn(game, socket.id)) return;
        
        const result = game.drawFromDeck();
        if (result.success) {
            console.log(`🎴 ${socket.id} drew from deck`);
            broadcastGameState(socket.gameId);
        } else {
            socket.emit('error', result.error);
        }
    });

    socket.on('drawFromDiscard', () => {
        const game = games.get(socket.gameId);
        if (!game || !isPlayerTurn(game, socket.id)) return;
        
        const result = game.drawFromDiscardPile();
        if (result.success) {
            console.log(`🎴 ${socket.id} drew from discard`);
            broadcastGameState(socket.gameId);
        } else {
            socket.emit('error', result.error);
        }
    });

    socket.on('replaceCard', ({ cardIndex }) => {
        const game = games.get(socket.gameId);
        if (!game || !isPlayerTurn(game, socket.id)) return;
        
        const result = game.replaceCardInHand(cardIndex);
        if (result.success) {
            console.log(`🔄 ${socket.id} replaced card at index ${cardIndex}`);
            broadcastGameState(socket.gameId);
        } else {
            socket.emit('error', result.error);
        }
    });

    socket.on('discardDrawn', () => {
        const game = games.get(socket.gameId);
        if (!game || !isPlayerTurn(game, socket.id)) return;
        
        const result = game.discardDrawnCard();
        if (result.success) {
            console.log(`🗑️  ${socket.id} discarded drawn card`);
            broadcastGameState(socket.gameId);
        } else {
            socket.emit('error', result.error);
        }
    });

    // ============ POWER CARD ACTIONS ============

    socket.on('usePeek', ({ cardIndex }) => {
        const game = games.get(socket.gameId);
        if (!game || !isPlayerTurn(game, socket.id)) return;
        
        const result = game.usePeek(cardIndex);
        if (result.success) {
            console.log(`👁️  ${socket.id} peeked at card ${cardIndex}`);
            // Send revealed card only to the player
            socket.emit('cardRevealed', { card: result.revealedCard, index: cardIndex });
            broadcastGameState(socket.gameId);
        } else {
            socket.emit('error', result.error);
        }
    });

    socket.on('useSwap', ({ myCardIndex, opponentId, opponentCardIndex }) => {
        const game = games.get(socket.gameId);
        if (!game || !isPlayerTurn(game, socket.id)) return;

        const result = game.useSwap(myCardIndex, opponentId, opponentCardIndex);
        if (result.success) {
            console.log(`🔄 ${socket.id} swapped card with ${opponentId}`);
            broadcastGameState(socket.gameId);
        } else {
            socket.emit('error', result.error);
        }
    });

    socket.on('declineSwap', () => {
        const game = games.get(socket.gameId);
        if (!game || !isPlayerTurn(game, socket.id)) return;

        const result = game.declineSwap();
        if (result.success) {
            console.log(`🔄 ${socket.id} declined to use Swap card`);
            broadcastGameState(socket.gameId);
        } else {
            socket.emit('error', result.error);
        }
    });

    socket.on('useDraw2', () => {
        const game = games.get(socket.gameId);
        if (!game || !isPlayerTurn(game, socket.id)) return;
        
        const result = game.useDraw2();
        if (result.success) {
            console.log(`➕ ${socket.id} used Draw 2`);
            broadcastGameState(socket.gameId);
        } else {
            socket.emit('error', result.error);
        }
    });

    socket.on('handleDraw2Card', ({ action, cardIndex }) => {
        const game = games.get(socket.gameId);
        if (!game || !isPlayerTurn(game, socket.id)) return;
        
        const result = game.handleDraw2Card(action, cardIndex);
        if (result.success) {
            console.log(`➕ ${socket.id} handled Draw 2 card: ${action}`);
            broadcastGameState(socket.gameId);
        } else {
            socket.emit('error', result.error);
        }
    });

    socket.on('useAddCard', () => {
        const game = games.get(socket.gameId);
        if (!game || !isPlayerTurn(game, socket.id)) return;
        
        const result = game.useAddCard();
        if (result.success) {
            console.log(`🎴 ${socket.id} added card to their hand`);
            broadcastGameState(socket.gameId);
        } else {
            socket.emit('error', result.error);
        }
    });

    // ============ KNOCKING ============

    socket.on('knock', () => {
        const game = games.get(socket.gameId);
        if (!game || !isPlayerTurn(game, socket.id)) return;
        
        const result = game.knock();
        if (result.success) {
            console.log(`🔔 ${socket.id} knocked!`);
            broadcastGameState(socket.gameId);
        } else {
            socket.emit('error', result.error);
        }
    });

    // ============ DISCONNECTION ============

    socket.on('disconnect', () => {
        console.log(`❌ Player disconnected: ${socket.id}`);
        
        if (socket.gameId) {
            const game = games.get(socket.gameId);
            if (game) {
                const shouldDelete = game.removePlayer(socket.id);
                
                if (shouldDelete) {
                    games.delete(socket.gameId);
                    console.log(`🗑️  Game ${socket.gameId} deleted (no players left)`);
                } else {
                    broadcastGameState(socket.gameId);
                }
            }
        }
    });
});

// ============ HELPER FUNCTIONS ============

function isPlayerTurn(game, playerId) {
    return game.getCurrentPlayer()?.id === playerId;
}

function broadcastGameState(gameId) {
    const game = games.get(gameId);
    if (!game) return;
    
    // Send personalized game state to each player
    game.players.forEach(player => {
        const socket = io.sockets.sockets.get(player.id);
        if (socket) {
            socket.emit('gameState', game.getGameState(player.id));
        }
    });
}

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`\n🎮 Rat-a-Tat Cat Server Running`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🎯 Waiting for players...\n`);
});