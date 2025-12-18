import React, { useState, useEffect, useRef } from 'react';
import { Trophy, AlertCircle, CheckCircle, XCircle, Play, Loader2, RefreshCcw, Shield } from 'lucide-react';
import { generateChallenge, validateAnswer } from './services/geminiService';
import { GameState, GameStatus, Challenge, ValidationResult, GameHistoryItem } from './types';
import ScoreChart from './components/ScoreChart';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: GameStatus.START,
    level: 1,
    score: 0,
    currentChallenge: null,
    history: [],
    lastFeedback: null,
  });

  const [playerInput, setPlayerInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Focus input ref
  const inputRef = useRef<HTMLInputElement>(null);

  const startGame = async () => {
    setGameState({
      status: GameStatus.LOADING_CHALLENGE,
      level: 1,
      score: 0,
      currentChallenge: null,
      history: [],
      lastFeedback: null,
    });
    setPlayerInput('');
    await loadChallenge(1, []);
  };

  const loadChallenge = async (level: number, currentHistory: GameHistoryItem[]) => {
    try {
      // Collect previously used teams to avoid repetition
      const usedTeams = currentHistory.flatMap(h => [h.teamA, h.teamB]);
      
      const challenge = await generateChallenge(level, usedTeams);
      
      setGameState(prev => ({
        ...prev,
        status: GameStatus.PLAYING,
        level: level,
        currentChallenge: challenge,
        lastFeedback: null
      }));
    } catch (err) {
      setError("Failed to load level. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerInput.trim() || !gameState.currentChallenge) return;

    setGameState(prev => ({ ...prev, status: GameStatus.VALIDATING }));

    const { teamA, teamB } = gameState.currentChallenge;
    const result = await validateAnswer(teamA, teamB, playerInput);

    const newHistoryItem: GameHistoryItem = {
      level: gameState.level,
      score: result.isCorrect ? gameState.score + 10 : gameState.score,
      teamA,
      teamB,
      playerAnswer: playerInput,
      isCorrect: result.isCorrect
    };

    if (result.isCorrect) {
      // Correct Answer Logic
      setGameState(prev => ({
        ...prev,
        status: GameStatus.ROUND_FEEDBACK,
        score: prev.score + 10,
        history: [...prev.history, newHistoryItem],
        lastFeedback: result
      }));

      // Wait 3 seconds then go to next level
      setTimeout(async () => {
        if (gameState.level >= 10) {
          setGameState(prev => ({ ...prev, status: GameStatus.VICTORY }));
        } else {
          setGameState(prev => ({ ...prev, status: GameStatus.LOADING_CHALLENGE }));
          setPlayerInput('');
          await loadChallenge(gameState.level + 1, [...gameState.history, newHistoryItem]);
        }
      }, 4000);

    } else {
      // Game Over Logic
      setGameState(prev => ({
        ...prev,
        status: GameStatus.GAME_OVER,
        history: [...prev.history, newHistoryItem],
        lastFeedback: result
      }));
    }
  };

  // Auto-focus input when playing
  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState.status]);

  // Renders

  const renderStartScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in">
      <div className="relative">
        <div className="absolute -inset-4 bg-emerald-500/20 blur-xl rounded-full"></div>
        <Shield className="w-24 h-24 text-emerald-400 relative z-10" />
      </div>
      <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
        Career Link
      </h1>
      <p className="text-slate-400 max-w-md text-lg leading-relaxed">
        Test your football knowledge. Link two clubs with one player. 
        <br/><span className="text-emerald-400 font-semibold">10 Levels</span> of increasing difficulty.
      </p>
      <button
        onClick={startGame}
        className="group relative px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center gap-3 text-lg"
      >
        <span>Start Campaign</span>
        <Play className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      <p className="text-slate-400 animate-pulse">Scouting clubs for Level {gameState.level}...</p>
    </div>
  );

  const renderGameScreen = () => {
    if (!gameState.currentChallenge) return null;

    const isFeedback = gameState.status === GameStatus.ROUND_FEEDBACK;
    const isValidating = gameState.status === GameStatus.VALIDATING;

    return (
      <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in">
        {/* Level Indicator */}
        <div className="flex justify-between items-center text-sm font-semibold tracking-widest text-slate-500 uppercase">
          <span>Level {gameState.level}/10</span>
          <span className="text-emerald-400">Current Score: {gameState.score}</span>
        </div>

        {/* Challenge Card */}
        <div className="bg-slate-800/50 border border-slate-700 p-8 rounded-2xl shadow-xl backdrop-blur-sm relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="text-center flex-1">
              <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-slate-600 shadow-inner">
                <span className="text-2xl font-bold text-slate-300">{gameState.currentChallenge.teamA.charAt(0)}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">{gameState.currentChallenge.teamA}</h2>
            </div>
            
            <div className="text-slate-500 font-black text-2xl italic">VS</div>

            <div className="text-center flex-1">
              <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-slate-600 shadow-inner">
                <span className="text-2xl font-bold text-slate-300">{gameState.currentChallenge.teamB.charAt(0)}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">{gameState.currentChallenge.teamB}</h2>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="relative">
          <form onSubmit={handleSubmit} className="relative z-20">
            <input
              ref={inputRef}
              type="text"
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              disabled={isFeedback || isValidating}
              placeholder="Who played for both?"
              className="w-full bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 rounded-xl px-6 py-4 text-xl text-white placeholder-slate-600 outline-none transition-all shadow-lg"
            />
            <button
              type="submit"
              disabled={!playerInput.trim() || isFeedback || isValidating}
              className="absolute right-3 top-3 bottom-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white px-6 rounded-lg font-bold transition-colors"
            >
              {isValidating ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Link'}
            </button>
          </form>
        </div>

        {/* Feedback Message (Transition) */}
        {isFeedback && gameState.lastFeedback && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 p-4 rounded-xl flex items-start gap-4 animate-slide-up">
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-emerald-400">Excellent!</h3>
              <p className="text-emerald-100 text-sm">{gameState.lastFeedback.message}</p>
              <p className="text-slate-400 text-xs mt-2">Next level loading...</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGameOver = (isVictory: boolean) => (
    <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in text-center">
      <div className="flex justify-center">
        {isVictory ? (
          <Trophy className="w-24 h-24 text-yellow-400 drop-shadow-lg" />
        ) : (
          <XCircle className="w-24 h-24 text-red-500 drop-shadow-lg" />
        )}
      </div>
      
      <div>
        <h2 className="text-4xl font-bold text-white mb-2">{isVictory ? "Legendary Status!" : "Game Over"}</h2>
        <p className="text-slate-400 text-lg">
          Final Score: <span className="text-emerald-400 font-bold text-2xl">{gameState.score}</span>
        </p>
      </div>

      {!isVictory && gameState.lastFeedback && (
         <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-xl text-left">
           <div className="flex items-start gap-4">
             <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-1" />
             <div>
               <h3 className="font-bold text-red-400">Incorrect Link</h3>
               <p className="text-red-100 text-sm mb-2">{gameState.lastFeedback.message}</p>
               {gameState.lastFeedback.alternativeAnswer && (
                 <p className="text-slate-300 text-sm">
                   Correct Link: <span className="text-white font-bold">{gameState.lastFeedback.alternativeAnswer}</span>
                 </p>
               )}
             </div>
           </div>
         </div>
      )}

      {/* Chart */}
      <ScoreChart history={gameState.history} />

      <button
        onClick={startGame}
        className="inline-flex items-center gap-2 px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold transition-all"
      >
        <RefreshCcw className="w-5 h-5" />
        <span>Try Again</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <Shield className="w-6 h-6 text-emerald-500" />
             <span className="font-bold text-lg tracking-tight text-white hidden sm:block">Career Link</span>
          </div>
          <div className="flex items-center gap-4">
            {gameState.status !== GameStatus.START && (
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                <Trophy className="w-4 h-4 text-emerald-400" />
                <span className="font-mono font-bold text-emerald-400">{gameState.score} pts</span>
              </div>
            )}
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors text-sm">
              About
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 flex items-center gap-3">
             <AlertCircle className="w-5 h-5" />
             {error}
             <button onClick={() => setError(null)} className="ml-auto text-sm underline">Dismiss</button>
          </div>
        )}

        {gameState.status === GameStatus.START && renderStartScreen()}
        {gameState.status === GameStatus.LOADING_CHALLENGE && renderLoading()}
        {(gameState.status === GameStatus.PLAYING || 
          gameState.status === GameStatus.VALIDATING || 
          gameState.status === GameStatus.ROUND_FEEDBACK) && renderGameScreen()}
        {(gameState.status === GameStatus.GAME_OVER || 
          gameState.status === GameStatus.VICTORY) && renderGameOver(gameState.status === GameStatus.VICTORY)}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-slate-600 text-sm">
        <p>Powered by Gemini 2.0 Flash</p>
      </footer>
    </div>
  );
};

export default App;
