import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('https://your-render-server.onrender.com');

const RPSGame = () => {
  const [gameState, setGameState] = useState('init'); // init, joining, playing, finished
  const [username, setUsername] = useState('');
  const [gameId, setGameId] = useState('');
  const [hand, setHand] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [opponent, setOpponent] = useState('');
  const [currentRound, setCurrentRound] = useState(0);
  const [gameHistory, setGameHistory] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    socket.on('game_start', ({ hand, stats, opponent }) => {
      setGameState('playing');
      setHand(hand);
      setStatistics(stats);
      setOpponent(opponent);
      setMessage('Game started! Choose your card.');
    });

    socket.on('round_result', ({ result, optimalChoice, newStats }) => {
      setGameHistory(prev => [...prev, { round: currentRound, result, optimalChoice }]);
      setStatistics(newStats);
      setCurrentRound(prev => prev + 1);
    });

    socket.on('error', ({ message }) => {
      setMessage(message);
    });

    return () => {
      socket.off('game_start');
      socket.off('round_result');
      socket.off('error');
    };
  }, []);

  const handleJoinGame = (e) => {
    e.preventDefault();
    if (!username || !gameId) {
      setMessage('Please enter both username and game ID');
      return;
    }
    socket.emit('join_game', { username, gameId });
    setGameState('joining');
    setMessage('Waiting for opponent...');
  };

  const playCard = (card) => {
    if (gameState !== 'playing') return;
    socket.emit('play_card', { gameId, card });
  };

  const renderCardStats = () => {
    if (!statistics) return null;
    return (
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold mb-2">Card Statistics:</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold">Your Hand:</h4>
            <p>Rock: {statistics.hand.rock}</p>
            <p>Paper: {statistics.hand.paper}</p>
            <p>Scissors: {statistics.hand.scissors}</p>
          </div>
          <div>
            <h4 className="font-semibold">Remaining in Deck:</h4>
            <p>Rock: {statistics.deck.rock}</p>
            <p>Paper: {statistics.deck.paper}</p>
            <p>Scissors: {statistics.deck.scissors}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderGameHistory = () => {
    if (gameHistory.length === 0) return null;
    return (
      <div className="mt-4">
        <h3 className="font-bold mb-2">Game History:</h3>
        <div className="space-y-2">
          {gameHistory.map((round, index) => (
            <div key={index} className="p-2 bg-gray-100 rounded">
              <p>Round {round.round + 1}: {round.result}</p>
              <p className="text-sm text-gray-600">
                Optimal choice was: {round.optimalChoice}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (gameState === 'init') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold mb-4">Join Game</h1>
          <form onSubmit={handleJoinGame}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Game ID
                </label>
                <input
                  type="text"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Join Game
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Round {currentRound + 1}/10</h1>
            <p>Playing against: {opponent}</p>
          </div>
          
          {message && (
            <div className="mb-4 p-4 bg-blue-100 text-blue-700 rounded">
              {message}
            </div>
          )}

          {gameState === 'playing' && (
            <div className="mb-4">
              <h2 className="font-bold mb-2">Your Hand:</h2>
              <div className="flex flex-wrap gap-2">
                {hand.map((card, index) => (
                  <button
                    key={index}
                    onClick={() => playCard(card)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow hover:bg-gray-50"
                  >
                    {card}
                  </button>
                ))}
              </div>
            </div>
          )}

          {renderCardStats()}
          {renderGameHistory()}
        </div>
      </div>
    </div>
  );
};

export default RPSGame;