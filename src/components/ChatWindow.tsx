import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  Sparkles,
  Download,
  Printer,
  Trash2,
  Menu,
  Copy,
  Check,
  Tag,
  Smile,
  Edit2,
  AlertCircle,
  BarChart3,
  Flame,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Compass,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { JournalSession, ChatMessage } from '../types';
import { getTagStyle } from '../utils/emotion';
import { VoiceRecorder } from './VoiceRecorder';
import { exportSessionToJSON, printSessionToPDF } from '../utils/export';
import { DailyReflectionStarter } from './DailyReflectionStarter';
import { ttsService, TTSState } from '../utils/speech';

interface ChatWindowProps {
  session: JournalSession | null;
  onSendMessage: (text: string) => Promise<void>;
  onSendVoice: (audioBase64: string, mimeType: string) => Promise<void>;
  onUpdateTitle: (newTitle: string) => void;
  onSaveIntention?: (intention: string) => void;
  onDeleteCurrentSession: () => void;
  onToggleSidebarMobile: () => void;
  onOpenAnalytics: () => void;
  onOpenWeeklySummary: () => void;
  isLoading: boolean;
  saveError: string | null;
  onRetrySave?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  session,
  onSendMessage,
  onSendVoice,
  onUpdateTitle,
  onSaveIntention,
  onDeleteCurrentSession,
  onToggleSidebarMobile,
  onOpenAnalytics,
  onOpenWeeklySummary,
  isLoading,
  saveError,
  onRetrySave,
}) => {
  const [inputText, setInputText] = useState('');
  const [isVoiceRecordingActive, setIsVoiceRecordingActive] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showPromptsDrawer, setShowPromptsDrawer] = useState(false);
  const [ttsState, setTtsState] = useState<TTSState>(ttsService.getState());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const unsubscribe = ttsService.subscribe((state) => {
      setTtsState(state);
    });
    return () => {
      unsubscribe();
      ttsService.stop();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, isLoading]);

  useEffect(() => {
    if (session) {
      setTitleDraft(session.title || 'Untitled Reflection');
    }
  }, [session?.id, session?.title]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const textToSend = inputText.trim();
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await onSendMessage(textToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSaveTitle = () => {
    if (titleDraft.trim()) {
      onUpdateTitle(titleDraft.trim());
    }
    setIsEditingTitle(false);
  };

  const handleSelectPrompt = (prompt: string) => {
    setInputText(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight + 20, 180)}px`;
    }
  };

  const toggleSpeech = (id: string, text: string) => {
    if (ttsState.isPlaying && ttsState.activeId === id) {
      if (ttsState.isPaused) {
        ttsService.resume();
      } else {
        ttsService.pause();
      }
    } else {
      ttsService.speak(id, text, ttsState.rate);
    }
  };

  const cycleRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rates = [0.85, 1.0, 1.25];
    const currentIndex = rates.indexOf(ttsState.rate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    ttsService.setRate(nextRate);
  };

  return (
    <main
      id="main-chat-window"
      className="flex-1 flex flex-col h-full min-h-0 min-w-0 bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-pink-50/50 relative overflow-hidden text-stone-900"
    >
      {/* Decorative Pastel Ambient Orbs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Session Header with Glassmorphism */}
      <header className="px-4 sm:px-6 pt-3 pb-3 sm:pt-3.5 sm:pb-3.5 bg-white/85 border-b border-white/60 backdrop-blur-xl flex items-center justify-between shrink-0 z-10 shadow-xs min-h-[3.75rem]">
        <div className="flex items-center space-x-3 overflow-hidden">
          <button
            onClick={onToggleSidebarMobile}
            className="lg:hidden p-1.5 text-stone-600 hover:text-stone-900 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
            title="Open Reflections Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {isEditingTitle ? (
            <div className="flex items-center space-x-2">
              <input
                id="session-title-edit-input"
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                autoFocus
                className="px-2.5 py-1 text-xs sm:text-sm font-semibold text-stone-900 border border-purple-300 rounded-xl bg-purple-50/70 focus:outline-hidden focus:border-purple-500"
              />
              <button
                onClick={handleSaveTitle}
                className="text-xs px-2.5 py-1 bg-purple-800 text-white rounded-xl hover:bg-purple-900 cursor-pointer font-medium shadow-2xs"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 truncate">
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-sm sm:text-base font-semibold text-stone-900 truncate hover:text-purple-700 cursor-pointer flex items-center gap-1.5 group transition-colors"
                title="Click to rename reflection"
              >
                <span>{session?.title || 'Mindful Reflection Session'}</span>
                <Edit2 className="w-3.5 h-3.5 text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h2>

              {session?.dominantSentiment && (
                <span className="hidden sm:inline-flex text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-purple-100/70 text-purple-800 border border-purple-200/80">
                  Mood: {session.dominantSentiment}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          {/* Daily Prompts Drawer Toggle */}
          <button
            id="toggle-prompts-btn"
            onClick={() => setShowPromptsDrawer((prev) => !prev)}
            title="Inspirational Prompts & Intentions"
            className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all duration-200 cursor-pointer border ${
              showPromptsDrawer
                ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-2xs'
                : 'bg-white/80 hover:bg-white text-stone-700 border-stone-200/80 shadow-2xs'
            }`}
          >
            <Compass className="w-4 h-4 text-purple-600" />
            <span className="hidden md:inline">Prompts</span>
            {showPromptsDrawer ? (
              <ChevronUp className="w-3 h-3 text-purple-500" />
            ) : (
              <ChevronDown className="w-3 h-3 text-stone-400" />
            )}
          </button>

          {/* Mood Analytics Modal Button */}
          <button
            id="open-analytics-btn"
            onClick={onOpenAnalytics}
            title="Mood Trends & Streak Analytics"
            className="p-2 rounded-xl bg-white/80 hover:bg-white text-stone-700 hover:text-stone-950 border border-stone-200/80 text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs hover:scale-105 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span className="hidden lg:inline">Trends</span>
          </button>

          {/* Weekly Summary Button */}
          <button
            id="open-weekly-summary-btn"
            onClick={onOpenWeeklySummary}
            title="Generate AI Weekly Insight Summary"
            className="p-2 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-900 border border-purple-200 text-xs font-medium flex items-center gap-1.5 transition-all shadow-2xs hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="hidden lg:inline">Weekly Insight</span>
          </button>

          {session && (
            <>
              <button
                id="export-session-json-btn"
                onClick={() => exportSessionToJSON(session)}
                title="Export this reflection as JSON"
                className="p-2 text-stone-600 hover:text-stone-900 hover:bg-white/80 rounded-xl text-xs font-medium transition-colors cursor-pointer border border-transparent hover:border-stone-200"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                id="export-session-pdf-btn"
                onClick={() => printSessionToPDF(session)}
                title="Print or Save as PDF"
                className="p-2 text-stone-600 hover:text-stone-900 hover:bg-white/80 rounded-xl text-xs font-medium transition-colors cursor-pointer border border-transparent hover:border-stone-200"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                id="delete-session-btn"
                onClick={onDeleteCurrentSession}
                title="Delete this reflection session"
                className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Persistence Error Banner */}
      {saveError && (
        <div className="px-4 py-2 bg-rose-50/95 border-b border-rose-200 text-rose-700 text-xs flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
          {onRetrySave && (
            <button
              onClick={onRetrySave}
              className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-semibold hover:bg-rose-700 cursor-pointer shadow-2xs"
            >
              Retry Save
            </button>
          )}
        </div>
      )}

      {/* Prompts Drawer (Toggleable) */}
      {showPromptsDrawer && (
        <div className="px-4 sm:px-8 pt-3.5 pb-2.5 border-b border-purple-100/60 bg-white/70 backdrop-blur-md z-10 animate-fadeIn max-h-[30vh] overflow-y-auto shrink-0 shadow-inner">
          <DailyReflectionStarter
            onSelectPrompt={(p) => {
              handleSelectPrompt(p);
              setShowPromptsDrawer(false);
            }}
            currentIntention={session?.intention}
            onSaveIntention={onSaveIntention}
          />
        </div>
      )}

      {/* Messages Stream Container with explicit top spacing to prevent clipping */}
      <div id="messages-scroll-area" className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-8 pt-5 sm:pt-6 pb-6 space-y-6 z-0 overscroll-contain">
        {!session || !session.messages || session.messages.length === 0 ? (
          /* Empty Session State with Pastel Aesthetic & Daily Reflection Starter (restricted height) */
          <div className="max-w-3xl mx-auto pt-1 pb-2">
            <div className="max-h-[38vh] sm:max-h-[42vh] overflow-y-auto pr-1 overscroll-contain">
              <DailyReflectionStarter
                onSelectPrompt={handleSelectPrompt}
                currentIntention={session?.intention}
                onSaveIntention={onSaveIntention}
              />
            </div>
          </div>
        ) : (
          /* Conversation Bubble Stream */
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Session Intention Banner if set */}
            {session.intention && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-100/75 via-pink-100/60 to-indigo-100/75 border border-purple-200/80 text-purple-950 flex items-center justify-between text-xs shadow-2xs mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-purple-600/15 text-purple-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                  </div>
                  <span className="font-semibold text-purple-900">Today's Sacred Intention:</span>
                  <span className="italic text-purple-950 font-medium">"{session.intention}"</span>
                </div>
              </div>
            )}

            {session.messages.map((msg: ChatMessage) => {
              const isUser = msg.role === 'user';
              const isTtsActive = ttsState.activeId === msg.id && ttsState.isPlaying;

              return (
                <div
                  key={msg.id}
                  id={`msg-${msg.id}`}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} transition-all`}
                >
                  {/* Sender Metadata */}
                  <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-stone-400">
                    <span className="font-semibold text-stone-600">
                      {isUser ? 'You' : 'MindEcho'}
                    </span>
                    {msg.isVoiceEntry && (
                      <span className="inline-flex items-center gap-1 text-amber-800 font-medium px-2 py-0.5 bg-amber-100/70 border border-amber-200 rounded-full text-[10px]">
                        <Mic className="w-2.5 h-2.5" /> Spoken Voice
                      </span>
                    )}
                    <span>&bull;</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Bubble Content with Glassmorphic Pastel Styling */}
                  <div
                    className={`relative rounded-3xl p-4 sm:p-5 text-sm leading-relaxed max-w-[92%] sm:max-w-[85%] transition-all duration-200 ${
                      isUser
                        ? 'bg-gradient-to-r from-purple-900 via-indigo-900 to-stone-900 text-white rounded-tr-xs shadow-md shadow-purple-950/10'
                        : 'bg-white/85 backdrop-blur-md border border-white/80 text-stone-800 rounded-tl-xs shadow-md shadow-purple-900/5 hover:shadow-lg'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Extracted Emotion / Mood Tags */}
                    {!isUser && msg.tags && msg.tags.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-purple-100/60 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-stone-500 mr-1 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-purple-600" /> Mood:
                        </span>
                        {msg.tags.map((tag, tagIndex) => {
                          const style = getTagStyle(tag);
                          return (
                            <span
                              key={tagIndex}
                              className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition-all duration-200 cursor-default flex items-center gap-1.5 hover:scale-105 ${style.bg} ${style.text} ${style.border} ${style.glow}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                              #{tag}
                            </span>
                          );
                        })}
                        {msg.sentiment && (
                          <span className="text-[11px] text-stone-400 ml-1">
                            ({msg.sentiment})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message Actions Bar (Listen / TTS & Copy) */}
                    {!isUser && (
                      <div className="mt-3 pt-2 flex items-center justify-between border-t border-stone-100/80">
                        {/* Audio TTS Playback Bar */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleSpeech(msg.id, msg.text)}
                            title={isTtsActive ? (ttsState.isPaused ? 'Resume listening' : 'Pause audio') : 'Listen to reflection'}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                              isTtsActive
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'bg-purple-50/90 text-purple-700 hover:bg-purple-100 border border-purple-200/80'
                            }`}
                          >
                            {isTtsActive ? (
                              ttsState.isPaused ? (
                                <>
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Resume</span>
                                </>
                              ) : (
                                <>
                                  <Pause className="w-3 h-3 fill-current" />
                                  <span>Pause</span>
                                </>
                              )
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                                <span>Listen</span>
                              </>
                            )}
                          </button>

                          {/* Sound wave pulsating visualizer when speaking */}
                          {isTtsActive && !ttsState.isPaused && (
                            <div className="flex items-center space-x-1 px-1.5">
                              <span className="w-0.5 h-3 bg-purple-600 rounded-full animate-pulse" />
                              <span className="w-0.5 h-4 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                              <span className="w-0.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                            </div>
                          )}

                          {/* Stop Button */}
                          {isTtsActive && (
                            <button
                              onClick={() => ttsService.stop()}
                              title="Stop listening"
                              className="p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
                            >
                              <Square className="w-3 h-3" />
                            </button>
                          )}

                          {/* Speed Toggle */}
                          <button
                            onClick={cycleRate}
                            title="Change voice speed"
                            className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                          >
                            {ttsState.rate}x
                          </button>
                        </div>

                        {/* Copy button */}
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          title="Copy reflection"
                          className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                        >
                          {copiedMessageId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Optimistic Thinking State */}
            {isLoading && (
              <div className="flex flex-col items-start animate-fadeIn">
                <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-stone-400">
                  <span className="font-semibold text-purple-700">MindEcho</span>
                  <span>&bull; Reflecting...</span>
                </div>
                <div className="bg-white/90 backdrop-blur-md border border-purple-200 rounded-3xl rounded-tl-xs p-4 sm:p-5 shadow-sm max-w-md">
                  <div className="flex items-center space-x-3 text-xs text-stone-700">
                    <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                    <span>Listening with empathy and distilling emotional insights...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Input Area with Glassmorphism Styling */}
      <footer className="px-4 pt-2.5 pb-2.5 sm:px-6 sm:pt-3 sm:pb-3 bg-white/85 backdrop-blur-xl border-t border-white/60 shrink-0 z-10">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Active Voice Recording Bar */}
          {isVoiceRecordingActive ? (
            <VoiceRecorder
              onSendVoice={async (base64, mime) => {
                await onSendVoice(base64, mime);
                setIsVoiceRecordingActive(false);
              }}
              onCancel={() => setIsVoiceRecordingActive(false)}
              disabled={isLoading}
            />
          ) : (
            <div className="relative flex items-end bg-white/90 backdrop-blur-md border border-purple-200/80 rounded-2xl focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-400/20 shadow-sm transition-all p-2">
              <textarea
                ref={textareaRef}
                id="journal-input-textarea"
                rows={1}
                value={inputText}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Write your honest journal thoughts, or tap the microphone to speak..."
                disabled={isLoading}
                className="flex-1 bg-transparent border-none text-stone-800 text-sm placeholder-stone-400 focus:outline-hidden px-3 py-1.5 resize-none max-h-44 min-h-[38px]"
              />

              <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                {/* Voice Record Button */}
                <button
                  id="voice-record-btn"
                  type="button"
                  onClick={() => setIsVoiceRecordingActive(true)}
                  disabled={isLoading}
                  title="Record Spoken Journal Entry"
                  className="p-2 text-stone-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Send Button */}
                <button
                  id="send-journal-btn"
                  type="button"
                  onClick={handleSend}
                  disabled={!inputText.trim() || isLoading}
                  title="Send reflection to Gemini"
                  className="p-2.5 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-900 text-white rounded-xl shadow-xs transition-all disabled:opacity-30 disabled:hover:from-purple-700 cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Helper caption */}
          <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
            <span>Press Enter to send &bull; Shift + Enter for new paragraph</span>
            <span className="hidden sm:inline">Powered by Gemini 3.8 Flash &bull; Cloud Firestore</span>
          </div>
        </div>
      </footer>
    </main>
  );
};
