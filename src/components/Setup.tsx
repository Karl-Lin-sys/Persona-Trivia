import { useState } from 'react';
import { motion } from 'motion/react';
import { Mic, Play, Sparkles } from 'lucide-react';
import { Personality, PERSONALITIES, TOPICS } from '../types';

interface SetupProps {
  onStartClassic: (topic: string, personality: Personality) => void;
  onStartLive: (topic: string, personality: Personality) => void;
}

export default function Setup({ onStartClassic, onStartLive }: SetupProps) {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [customTopic, setCustomTopic] = useState('');
  const [personalityId, setPersonalityId] = useState(PERSONALITIES[0].id);

  const selectedPersonality = PERSONALITIES.find((p) => p.id === personalityId)!;
  const finalTopic = topic === 'Custom Topic...' ? customTopic : topic;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-2xl mx-auto"
    >
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-sm">
        <h2 className="text-2xl font-medium mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          Game Setup
        </h2>

        <div className="space-y-8">
          {/* Topic Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Choose a Topic
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TOPICS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    topic === t
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-white border border-zinc-700/50'
                  }`}
                >
                  {t}
                </button>
              ))}
              <button
                onClick={() => setTopic('Custom Topic...')}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  topic === 'Custom Topic...'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 hover:text-white border border-zinc-700/50'
                }`}
              >
                Custom...
              </button>
            </div>
            {topic === 'Custom Topic...' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-2"
              >
                <input
                  type="text"
                  placeholder="Enter any topic (e.g., 90s Sitcoms, Quantum Physics)"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </motion.div>
            )}
          </div>

          {/* Personality Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-zinc-400 uppercase tracking-wider">
              Choose Your Host
            </label>
            <div className="grid gap-3">
              {PERSONALITIES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersonalityId(p.id)}
                  className={`flex flex-col items-start p-4 rounded-xl transition-all duration-200 text-left ${
                    personalityId === p.id
                      ? 'bg-zinc-800 border-2 border-indigo-500 shadow-lg shadow-indigo-500/10'
                      : 'bg-zinc-900/50 border-2 border-transparent hover:bg-zinc-800/80'
                  }`}
                >
                  <span className="font-medium text-white text-lg">{p.name}</span>
                  <span className="text-sm text-zinc-400 mt-1">{p.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={() => onStartClassic(finalTopic, selectedPersonality)}
          disabled={!finalTopic.trim()}
          className="group relative flex items-center justify-center gap-3 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-4 rounded-2xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-700 to-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Play className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Play Classic Mode</span>
        </button>

        <button
          onClick={() => onStartLive(finalTopic, selectedPersonality)}
          disabled={!finalTopic.trim()}
          className="group relative flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-lg shadow-indigo-500/20"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          <Mic className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Play Live Voice Mode</span>
        </button>
      </div>
    </motion.div>
  );
}
