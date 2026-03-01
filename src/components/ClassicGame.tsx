import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Loader2, Volume2, CheckCircle2, XCircle, RefreshCcw } from 'lucide-react';
import { Personality } from '../types';
import { generateTriviaQuestions, generateHostDialogue, generateSpeech } from '../services/geminiService';

interface ClassicGameProps {
  topic: string;
  personality: Personality;
  onBack: () => void;
}

type Question = {
  question: string;
  answer: string;
  explanation: string;
};

export default function ClassicGame({ topic, personality, onBack }: ClassicGameProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [gameState, setGameState] = useState<'intro' | 'answering' | 'evaluation' | 'finished'>('intro');
  const [hostDialogue, setHostDialogue] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadQuestions();
  }, [topic]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const q = await generateTriviaQuestions(topic);
      if (q && q.length > 0) {
        setQuestions(q);
        await playIntro(q[0]);
      } else {
        setError('Failed to generate questions. Please try another topic.');
      }
    } catch (err) {
      setError('An error occurred while generating questions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (base64Audio: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    audioRef.current = audio;
    setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
    await audio.play();
  };

  const playIntro = async (q: Question) => {
    setGameState('intro');
    setHostDialogue('...');
    try {
      const dialogue = await generateHostDialogue(
        `${personality.name} - ${personality.description}`,
        'intro',
        q.question
      );
      setHostDialogue(dialogue || q.question);
      if (dialogue) {
        const audioData = await generateSpeech(dialogue, personality.voice);
        if (audioData) await playAudio(audioData);
      }
    } catch (err) {
      console.error('Failed to generate intro dialogue', err);
      setHostDialogue(q.question);
    }
    setGameState('answering');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || gameState !== 'answering') return;

    setGameState('evaluation');
    const currentQ = questions[currentIndex];
    
    // Simple evaluation logic (could be improved with AI)
    const normalizedUser = userAnswer.toLowerCase().trim();
    const normalizedAnswer = currentQ.answer.toLowerCase().trim();
    const correct = normalizedUser === normalizedAnswer || normalizedAnswer.includes(normalizedUser) || normalizedUser.includes(normalizedAnswer);
    
    setIsCorrect(correct);
    if (correct) setScore((s) => s + 1);

    try {
      const dialogue = await generateHostDialogue(
        `${personality.name} - ${personality.description}`,
        'evaluation',
        currentQ.question,
        currentQ.answer,
        userAnswer,
        correct
      );
      setHostDialogue(dialogue || (correct ? 'Correct!' : `Incorrect. The answer was ${currentQ.answer}.`));
      if (dialogue) {
        const audioData = await generateSpeech(dialogue, personality.voice);
        if (audioData) await playAudio(audioData);
      }
    } catch (err) {
      console.error('Failed to generate evaluation dialogue', err);
      setHostDialogue(correct ? 'Correct!' : `Incorrect. The answer was ${currentQ.answer}.`);
    }
  };

  const handleNext = async () => {
    setUserAnswer('');
    setIsCorrect(null);
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      await playIntro(questions[nextIndex]);
    } else {
      setGameState('finished');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-zinc-400 font-medium">Generating questions about {topic}...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 space-y-6">
        <p className="text-red-400">{error}</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 text-center max-w-lg mx-auto"
      >
        <h2 className="text-3xl font-bold mb-4">Game Over!</h2>
        <p className="text-xl text-zinc-300 mb-8">
          You scored <span className="text-indigo-400 font-bold">{score}</span> out of {questions.length}
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={loadQuestions}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors"
          >
            <RefreshCcw className="w-5 h-5" /> Play Again
          </button>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
          >
            New Topic
          </button>
        </div>
      </motion.div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between text-sm font-medium text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="bg-zinc-800 px-3 py-1 rounded-full text-zinc-300">
            {topic}
          </span>
          <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20">
            {personality.name}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>Score: {score}</span>
          <span>Question {currentIndex + 1} of {questions.length}</span>
        </div>
      </div>

      {/* Host Dialogue Area */}
      <motion.div
        layout
        className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-50" />
        
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl bg-zinc-800 transition-colors ${isSpeaking ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-zinc-900' : ''}`}>
            <Volume2 className={`w-6 h-6 ${isSpeaking ? 'text-indigo-400 animate-pulse' : 'text-zinc-500'}`} />
          </div>
          <div className="flex-1 space-y-4">
            <p className="text-lg md:text-xl font-medium leading-relaxed text-zinc-100">
              "{hostDialogue}"
            </p>
            {gameState === 'evaluation' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50 text-sm text-zinc-400"
              >
                <span className="font-semibold text-zinc-300">Fact Check:</span> {currentQ.explanation}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Question & Answer Area */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-white">{currentQ.question}</h3>
        </div>

        <AnimatePresence mode="wait">
          {gameState === 'answering' ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="relative"
            >
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl px-6 py-4 text-lg text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all pr-16"
                autoFocus
              />
              <button
                type="submit"
                disabled={!userAnswer.trim()}
                className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.form>
          ) : gameState === 'evaluation' ? (
            <motion.div
              key="evaluation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center space-y-6"
            >
              <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                <span className="text-lg font-medium">
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              
              <button
                onClick={handleNext}
                className="group flex items-center gap-2 px-8 py-4 bg-white text-zinc-950 hover:bg-zinc-200 rounded-2xl font-bold text-lg transition-colors"
              >
                Next Question
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
