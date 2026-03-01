import { useState } from 'react';
import Setup from './components/Setup';
import ClassicGame from './components/ClassicGame';
import LiveGame from './components/LiveGame';
import { GameMode, Personality, PERSONALITIES, TOPICS } from './types';

export default function App() {
  const [mode, setMode] = useState<GameMode>('setup');
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [personality, setPersonality] = useState<Personality>(PERSONALITIES[0]);

  const handleStartClassic = (t: string, p: Personality) => {
    setTopic(t);
    setPersonality(p);
    setMode('classic');
  };

  const handleStartLive = (t: string, p: Personality) => {
    setTopic(t);
    setPersonality(p);
    setMode('live');
  };

  const handleBackToSetup = () => {
    setMode('setup');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Persona Trivia
          </h1>
          <p className="mt-2 text-zinc-400">
            A dynamic trivia game hosted by AI personalities.
          </p>
        </header>

        <main>
          {mode === 'setup' && (
            <Setup
              onStartClassic={handleStartClassic}
              onStartLive={handleStartLive}
            />
          )}
          {mode === 'classic' && (
            <ClassicGame
              topic={topic}
              personality={personality}
              onBack={handleBackToSetup}
            />
          )}
          {mode === 'live' && (
            <LiveGame
              topic={topic}
              personality={personality}
              onBack={handleBackToSetup}
            />
          )}
        </main>
      </div>
    </div>
  );
}
