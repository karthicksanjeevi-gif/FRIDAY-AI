import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Sparkles, X, Volume2, VolumeX } from 'lucide-react';
import { Message, Sender } from '../types';

interface VoiceAgentOverlayProps {
  messages: Message[];
  isLoading: boolean;
  isDarkMode: boolean;
  toggleLive: () => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isSpeakerOn: boolean;
  setIsSpeakerOn: (on: boolean) => void;
}

const VoiceAgentOverlay: React.FC<VoiceAgentOverlayProps> = ({
  messages,
  isLoading,
  isDarkMode,
  toggleLive,
  isMuted,
  setIsMuted,
  isSpeakerOn,
  setIsSpeakerOn
}) => {

  // Deriving the voice agent state
  const lastMsg = messages[messages.length - 1];
  let agentState: 'listening' | 'speaking' | 'thinking' = 'listening';

  if (isLoading) {
    agentState = 'thinking';
  } else if (lastMsg) {
    if (lastMsg.role === Sender.Bot && lastMsg.isStreaming) {
      agentState = 'speaking';
    } else if (lastMsg.role === Sender.User && lastMsg.isStreaming) {
      agentState = 'listening';
    }
  }

  // Get the last user speech and last bot speech
  const lastUserMsg = [...messages].reverse().find((m) => m.role === Sender.User);
  const lastBotMsg = [...messages].reverse().find((m) => m.role === Sender.Bot);

  const isSpeaking = agentState === 'speaking';
  const isThinking = agentState === 'thinking';
  const isListening = agentState === 'listening';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col justify-between p-6 md:p-12 overflow-y-auto bg-slate-950/95 backdrop-blur-2xl text-white font-sans selection:bg-indigo-500/30"
      >
        {/* Futuristic Background Gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div
            animate={{
              scale: isSpeaking ? [1.2, 1.4, 1.2] : [1, 1.1, 1],
              rotate: [0, 90, 180, 270, 360]
            }}
            transition={{
              duration: isSpeaking ? 15 : 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-1/4 -left-1/4 w-[80vw] h-[80vw] rounded-full bg-gradient-to-tr from-blue-600/10 to-indigo-600/10 blur-[120px]"
          />
          <motion.div
            animate={{
              scale: isSpeaking ? [1.1, 1.3, 1.1] : [1, 1.1, 1],
              rotate: [360, 270, 180, 90, 0]
            }}
            transition={{
              duration: isSpeaking ? 20 : 30,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-1/4 -right-1/4 w-[80vw] h-[80vw] rounded-full bg-gradient-to-tr from-purple-600/10 to-pink-600/10 blur-[120px]"
          />
        </div>

        {/* Top Header Bar */}
        <header className="relative z-10 flex items-center justify-between w-full flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400">Friday Live</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-400/80 text-xs tracking-[0.2em] font-medium font-mono uppercase">
            <Sparkles size={14} className="text-indigo-400 animate-pulse" />
            Audio Intelligence
          </div>

          <button
            onClick={toggleLive}
            className="p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60 text-slate-400 hover:text-white transition-all shadow-md active:scale-95"
            title="Close Voice Mode"
          >
            <X size={18} />
          </button>
        </header>

        {/* Main Content Center (The Orb & State) */}
        <main className="relative z-10 flex flex-col items-center justify-center flex-1 py-12">
          <div className="relative flex items-center justify-center">
            {/* Pulsing Outer Ripples */}
            <AnimatePresence>
              {isSpeaking && (
                <>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute w-48 h-48 rounded-full border border-indigo-500/30 blur-sm pointer-events-none"
                  />
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.4 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.6, ease: 'easeOut' }}
                    className="absolute w-48 h-48 rounded-full border border-purple-500/20 blur-sm pointer-events-none"
                  />
                </>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isListening && (
                <motion.div
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute w-56 h-56 rounded-full bg-indigo-500/5 blur-xl pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Glowing Backdrop for the Orb */}
            <motion.div
              className="absolute w-[240px] h-[240px] rounded-full bg-gradient-to-tr from-indigo-500/30 via-purple-500/20 to-pink-500/30 blur-[40px] pointer-events-none"
              animate={{
                scale: isSpeaking ? [1, 1.25, 1.1, 1.3, 1] : isThinking ? [1, 1.1, 1.05, 1.1, 1] : [1, 1.06, 1.02, 1.06, 1]
              }}
              transition={{
                duration: isSpeaking ? 3 : isThinking ? 5 : 8,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            />

            {/* Morphing Liquid Orb */}
            <motion.div
              className="relative w-44 h-44 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center overflow-hidden shadow-[0_0_60px_rgba(79,70,229,0.5)] border border-white/10"
              animate={{
                borderRadius: isSpeaking
                  ? ["42% 58% 70% 30% / 45% 45% 55% 55%", "70% 30% 52% 48% / 60% 40% 60% 40%", "50% 50% 30% 70% / 50% 60% 40% 60%", "42% 58% 70% 30% / 45% 45% 55% 55%"]
                  : isThinking
                  ? ["50% 50% 50% 50% / 50% 50% 50% 50%", "45% 55% 45% 55% / 55% 45% 55% 45%", "55% 45% 55% 45% / 45% 55% 45% 55%", "50% 50% 50% 50% / 50% 50% 50% 50%"]
                  : ["45% 55% 60% 40% / 50% 45% 55% 50%", "50% 50% 45% 55% / 45% 55% 50% 50%", "55% 45% 50% 50% / 55% 50% 45% 55%", "45% 55% 60% 40% / 50% 45% 55% 50%"],
                scale: isSpeaking ? [1, 1.08, 0.96, 1.08, 1] : [1, 1.03, 0.98, 1.03, 1]
              }}
              transition={{
                duration: isSpeaking ? 4 : isThinking ? 3 : 6,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              {/* Inner Glowing cores */}
              <div className="absolute w-28 h-28 bg-gradient-to-tr from-cyan-400 via-blue-400 to-indigo-500 rounded-full blur-md opacity-80 mix-blend-screen" />
              
              <motion.div
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.3)_0%,transparent_60%)]"
                animate={{ scale: [0.8, 1.25, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Sparkling overlay */}
              <Sparkles size={36} className="text-white/40 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
            </motion.div>
          </div>

          {/* Dynamic Status Title */}
          <div className="mt-8 text-center">
            <h2 className="text-2xl font-semibold tracking-wide bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              {isMuted ? "Paused" : (
                <>
                  {isListening && "Listening..."}
                  {isSpeaking && "Friday is speaking"}
                  {isThinking && "Thinking..."}
                </>
              )}
            </h2>
            <p className="text-xs text-indigo-400/80 mt-1 font-mono tracking-wider uppercase font-semibold">
              {isMuted ? "Microphone muted" : "Connected & Secure"}
            </p>
          </div>
        </main>

        {/* Real-time speech transcription container */}
        <section className="relative z-10 max-w-2xl mx-auto w-full mb-8 flex-shrink-0">
          <div className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-900/40 border border-slate-800/50 backdrop-blur-xl shadow-2xl overflow-y-auto max-h-[160px] md:max-h-[220px]">
            {/* User Speech Bubble */}
            <div className="flex flex-col gap-1 min-h-[45px]">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">You</span>
              <p className="text-sm font-medium text-slate-300 italic">
                {lastUserMsg ? `"${lastUserMsg.content}"` : "Start speaking, I'm listening..."}
              </p>
            </div>

            {/* Separator line */}
            <div className="h-px bg-slate-800/50 w-full" />

            {/* Bot Response Bubble */}
            <div className="flex flex-col gap-1 min-h-[60px]">
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">Friday</span>
              <p className="text-base font-semibold text-slate-100 leading-relaxed">
                {lastBotMsg ? lastBotMsg.content : "Hello, how can I help you today?"}
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Control Bar & Soundwave indicators */}
        <footer className="relative z-10 flex items-center justify-between max-w-4xl mx-auto w-full px-6 flex-shrink-0">
          {/* Left Soundwave Indicator */}
          <div className="hidden sm:flex items-center gap-1 h-12 w-28 justify-start">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-gradient-to-t from-blue-500 to-indigo-500"
                animate={{
                  height: isSpeaking ? [8, 36, 12, 28, 8] : isThinking ? [6, 18, 8, 12, 6] : isMuted ? 4 : [4, 12, 6, 8, 4]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.12,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>

          {/* Action Center Controls */}
          <div className="flex items-center justify-center gap-6 mx-auto">
            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full border transition-all duration-300 shadow-lg active:scale-95
                ${isMuted 
                  ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:bg-red-500/20' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            {/* End Call Button */}
            <button
              onClick={toggleLive}
              className="p-5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)] border border-red-500/40 hover:scale-105 active:scale-90 transition-all duration-300"
              title="End Voice Call"
            >
              <PhoneOff size={26} />
            </button>

            {/* Speaker/Volume Toggle */}
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-4 rounded-full border transition-all duration-300 shadow-lg active:scale-95
                ${!isSpeakerOn 
                  ? 'bg-slate-800/40 border-slate-700 text-slate-500 hover:bg-slate-850' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              title={isSpeakerOn ? "Turn Speaker Off" : "Turn Speaker On"}
            >
              {isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </button>
          </div>

          {/* Right Soundwave Indicator */}
          <div className="hidden sm:flex items-center gap-1 h-12 w-28 justify-end">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full bg-gradient-to-t from-purple-500 to-pink-500"
                animate={{
                  height: isSpeaking ? [8, 36, 12, 28, 8] : isThinking ? [6, 18, 8, 12, 6] : isMuted ? 4 : [4, 12, 6, 8, 4]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: (5 - i) * 0.12, // reverse wave
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceAgentOverlay;
