import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Personality } from '../types';

export function useLiveAudio(topic: string, personality: Personality) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  // Audio playback queue
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);

  const connect = useCallback(async () => {
    try {
      setError(null);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const systemInstruction = `You are a trivia game host with the following personality: ${personality.name} - ${personality.description}. 
The topic is ${topic}. 
Rules:
1. Introduce yourself briefly and ask the first trivia question.
2. Wait for the user to answer.
3. Evaluate their answer, tell them if they are right or wrong, and provide the correct answer if they are wrong.
4. Keep track of their score.
5. Ask the next question.
6. Keep your responses concise and entertaining. Stay in character at all times.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: personality.voice } },
          },
          systemInstruction,
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            startRecording(sessionPromise);
          },
          onmessage: async (message: LiveServerMessage) => {
            console.log('Live message:', message);
            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              playAudioChunk(base64Audio);
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              nextPlayTimeRef.current = 0;
            }

            // Handle transcription
            const modelText = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (modelText) {
              setTranscript((prev) => [...prev, { role: 'host', text: modelText }]);
            }
            
            // Handle input transcription (if available in the message structure)
            // The exact structure might vary, but usually it's in a transcription event
          },
          onclose: () => {
            setIsConnected(false);
            stopRecording();
          },
          onerror: (err) => {
            console.error('Live API Error:', err);
            setError('Connection error occurred.');
            setIsConnected(false);
            stopRecording();
          },
        },
      });

      sessionRef.current = sessionPromise;
    } catch (err: any) {
      console.error('Failed to connect:', err);
      setError(err.message || 'Failed to connect to Live API');
    }
  }, [topic, personality]);

  const disconnect = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => session.close());
      sessionRef.current = null;
    }
    stopRecording();
    setIsConnected(false);
  }, []);

  const startRecording = async (sessionPromise: Promise<any>) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          let s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        
        // Convert to base64
        const buffer = new ArrayBuffer(pcm16.length * 2);
        const view = new DataView(buffer);
        for (let i = 0; i < pcm16.length; i++) {
          view.setInt16(i * 2, pcm16[i], true);
        }
        
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
        }
        const base64Data = btoa(binary);

        sessionPromise.then((session) => {
          session.sendRealtimeInput({
            media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        });
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (processorRef.current && audioContextRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsRecording(false);
  };

  const playAudioChunk = async (base64Audio: string) => {
    if (!audioContextRef.current) return;
    
    try {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // The audio is 24kHz PCM 16-bit
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      const currentTime = audioContextRef.current.currentTime;
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime;
      }
      
      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += audioBuffer.duration;
      
    } catch (err) {
      console.error('Error playing audio chunk:', err);
    }
  };

  return {
    isConnected,
    isRecording,
    error,
    transcript,
    connect,
    disconnect
  };
}
