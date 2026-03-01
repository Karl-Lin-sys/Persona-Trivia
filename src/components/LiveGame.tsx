import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Loader2, LogOut, Radio } from 'lucide-react';
import { Personality } from '../types';
import { useLiveAudio } from '../hooks/useLiveAudio';

interface LiveGameProps {
  topic: string;
  personality: Personality;
  onBack: () => void;
}

export default function LiveGame({ topic, personality, onBack }: LiveGameProps) {
  const { isConnected, isRecording, error, transcript, connect, disconnect } = useLiveAudio(topic, personality);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${isConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
            <Radio className={`w-6 h-6 ${isConnected ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Live Voice Mode</h2>
            <p className="text-sm text-zinc-400">
              {topic} • Hosted by {personality.name}
            </p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          End Game
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden min-h-[400px] flex flex-col">
        {/* Transcript Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 max-h-[500px]">
          {!isConnected && !error ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-zinc-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p>Connecting to {personality.name}...</p>
            </div>
          ) : transcript.length === 0 && isConnected ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-zinc-500">
              <p>Listening... Say hello to start!</p>
            </div>
          ) : (
            transcript.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-zinc-800 text-zinc-100 rounded-bl-sm'
                  }`}
                >
                  {msg.role === 'host' && (
                    <div className="text-xs font-medium text-indigo-400 mb-1">
                      {personality.name}
                    </div>
                  )}
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              </motion.div>
            ))
          )}
          <div ref={transcriptEndRef} />
        </div>

        {/* Status Bar */}
        <div className="bg-zinc-950 p-4 border-t border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-zinc-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {isRecording ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                <Mic className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">Listening</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-500 rounded-full">
                <MicOff className="w-4 h-4" />
                <span className="text-sm font-medium">Muted</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
