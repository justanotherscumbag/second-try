const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'dist' directory (where Parcel builds to)
app.use(express.static(path.join(__dirname, 'dist')));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Game state storage
const games = new Map();
const gameHistory = new Map();

class Game {
  constructor(gameId) {
    this.gameId = gameId;
    this.players = new Map();
    this.deck = this.createDeck();
    this.round = 0;
    this.maxRounds = 10;
    this.gameState = 'waiting'; // waiting, playing, finished
  }

  createDeck() {
    const deck = [];
    // Create 45 cards total (15 of each type)
    ['rock', 'paper', 'scissors'].forEach(type => {
      for (let i = 0; i < 15; i++) {
        deck.push(type);
      }
    });
    return this.shuffle(deck);
  }

  shuffle(array) {
    let currentIndex = array.length;
    while (currentIndex !== 0) {
      const randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  dealCards() {
    const hands = new Map();
    this.players.forEach((player, playerId) => {
      const hand = this.deck.splice(0, 15);
      hands.set(playerId, hand);
    });
    return hands;
  }

  calculateStatistics(playerHand, remainingDeck) {
    const stats = {
      hand: {
        rock: playerHand.filter(card => card === 'rock').length,
        paper: playerHand.filter(card => card === 'paper').length,
        scissors: playerHand.filter(card => card === 'scissors').length
      },
      deck: {
        rock: remainingDeck.filter(card => card === 'rock').length,
        paper: remainingDeck.filter(card => card === 'paper').length,
        scissors: remainingDeck.filter(card => card === 'scissors').length
      }
    };
    return stats;
  }

  calculateOptimalChoice(playerStats) {
    const { hand, deck } = playerStats;
    const totalCards = Object.values(deck).reduce((a, b) => a + b, 0);
    
    // Calculate probabilities of opponent having each type
    const probabilities = {
      rock: deck.rock / totalCards,
      paper: deck.paper / totalCards,
      scissors: deck.scissors / totalCards
    };
    
    // Calculate expected value for each choice
    const expectedValues = {
      rock: probabilities.scissors - probabilities.paper,
      paper: probabilities.rock - probabilities.scissors,
      scissors: probabilities.paper - probabilities.rock
    };
    
    // Return the choice with highest expected value
    return Object.entries(expectedValues).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }
}

io.on('connection', (socket) => {
  socket.on('join_game', ({ username, gameId }) => {
    let game = games.get(gameId);
    
    if (!game) {
      game = new Game(gameId);
      games.set(gameId, game);
    }
    
    if (game.players.size >= 2) {
      socket.emit('error', { message: 'Game is full' });
      return;
    }
    
    game.players.set(socket.id, { username, score: 0 });
    socket.join(gameId);
    
    if (game.players.size === 2) {
      const hands = game.dealCards();
      game.gameState = 'playing';
      
      // Send initial game state to both players
      hands.forEach((hand, playerId) => {
        const stats = game.calculateStatistics(hand, game.deck);
        io.to(playerId).emit('game_start', {
          hand,
          stats,
          opponent: Array.from(game.players.values())
            .find(p => p.username !== game.players.get(playerId).username).username
        });
      });
    }
  });

  socket.on('play_card', ({ gameId, card }) => {
    const game = games.get(gameId);
    if (!game || game.gameState !== 'playing') return;
    
    // Handle round logic here
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
