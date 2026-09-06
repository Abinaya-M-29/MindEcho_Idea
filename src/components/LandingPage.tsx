import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  Mic,
  BarChart3,
  Download,
  ArrowRight,
  Lock,
  BookOpen,
  Volume2,
  Compass,
  Award,
  Heart,
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface LandingPageProps {
  onSignedIn: () => void;
  onEnterGuestMode?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignedIn, onEnterGuestMode }) => {
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      onSignedIn();
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      if (err.code === 'auth/popup-blocked') {
        setAuthError('Popup was blocked by browser. Please allow popups for this site, or try opening in a new tab.');
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completing.');
      } else {
        setAuthError(err.message || 'Authentication encountered an error.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="landing-page"
      className="min-h-screen h-screen overflow-x-hidden overflow-y-auto bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 text-stone-800 flex flex-col font-sans selection:bg-purple-200 relative"
    >
      {/* Decorative Pastel Ambient Orbs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 left-10 w-[450px] h-[450px] bg-pink-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[400px] h-[400px] bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation */}
      <header className="border-b border-white/60 bg-white/70 backdrop-blur-xl sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-700 via-indigo-700 to-pink-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg tracking-tight text-stone-900">MindEcho</span>
              <span className="ml-2 text-[10px] uppercase tracking-wider text-purple-700 font-bold px-2 py-0.5 rounded-full bg-purple-100/80 border border-purple-200/60">
                Gemini Journal
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              id="header-sign-in-btn"
              onClick={handleSignIn}
              disabled={loading}
              className="inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-stone-900 bg-white/90 hover:bg-white border border-purple-200/80 rounded-xl shadow-xs transition-all hover:scale-105 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Connecting...' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="pt-16 pb-16 px-6 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-purple-200/70 text-purple-900 text-xs font-semibold mb-6 shadow-xs">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Private & Encrypted &bull; User-Isolated Cloud Firestore</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif tracking-tight text-stone-950 mb-6 leading-[1.15]">
            A sacred sanctuary for <br className="hidden sm:inline" />
            honest thoughts & inner clarity.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-600 mb-10 leading-relaxed font-normal">
            Speak aloud or write deep reflections. MindEcho pairs Gemini 3.6 Flash with audio transcription,
            text-to-speech playback, automated emotional synthesis, and daily intention tracking.
          </p>

          {authError && (
            <div className="max-w-md mx-auto mb-6 p-4 bg-rose-50/90 backdrop-blur-md border border-rose-200 rounded-2xl text-xs text-rose-800 text-left shadow-xs">
              <p className="font-bold mb-1">Authentication Notice:</p>
              <p>{authError}</p>
              {onEnterGuestMode && (
                <button
                  onClick={onEnterGuestMode}
                  className="mt-2 text-xs font-semibold text-rose-900 underline hover:no-underline"
                >
                  Or enter Sandbox Mode for immediate preview &rarr;
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="hero-sign-in-btn"
              onClick={handleSignIn}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 text-sm sm:text-base font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12 0 14.5s.7 4.8 1.9 7.2l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z"
                />
              </svg>
              <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
              <ArrowRight className="w-4 h-4 text-stone-400" />
            </button>

            {onEnterGuestMode && (
              <button
                id="guest-preview-btn"
                onClick={onEnterGuestMode}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm sm:text-base font-semibold text-stone-700 bg-white/80 hover:bg-white border border-purple-200/80 rounded-2xl transition-all hover:scale-105 shadow-xs cursor-pointer"
              >
                <span>Try Sandbox Preview</span>
              </button>
            )}
          </div>
        </section>

        {/* Interactive Reflection Teaser Glass Card */}
        <section className="max-w-4xl mx-auto px-6 mb-20">
          <div className="backdrop-blur-md bg-white/75 border border-white/60 rounded-3xl p-6 sm:p-8 shadow-xl shadow-purple-500/5 transition-all">
            <div className="flex items-center justify-between border-b border-purple-100/60 pb-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs animate-pulse" />
                <span className="text-xs sm:text-sm font-semibold text-stone-800 font-serif">Sample Reflection Dialogue</span>
                <span className="text-xs text-stone-400">&bull; Today at 6:45 PM</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-sky-50/90 text-sky-800 border border-sky-200 shadow-2xs">
                  #Productive
                </span>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-50/90 text-amber-800 border border-amber-200 shadow-2xs">
                  #Anxious
                </span>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-50/90 text-emerald-800 border border-emerald-200 shadow-2xs">
                  #Mindful
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-white/80 border border-purple-100 text-stone-800 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Your Journal Entry</span>
                  <span className="text-[11px] text-amber-800 font-medium inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/70 border border-amber-200">
                    <Mic className="w-3 h-3" /> Voice recorded
                  </span>
                </div>
                <p className="leading-relaxed">
                  "Today was intense. Launched the project on time, but I feel strangely anxious instead of relieved.
                  I keep questioning whether I did enough or if something will break tomorrow morning."
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/60 to-pink-50/60 border border-purple-200/80 text-stone-800 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">MindEcho Reflection</span>
                    <span className="text-[10px] text-stone-500 italic">via Gemini 3.6 Flash</span>
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">
                    <Volume2 className="w-3 h-3" /> TTS Audio Readback
                  </div>
                </div>
                <p className="leading-relaxed text-stone-700 mb-3">
                  It is completely natural to experience post-launch adrenaline. When we invest deeply in a goal, our nervous system stays on high alert even after the finish line. Acknowledge this tension not as an omen of failure, but as the residual momentum of your dedication.
                </p>
                <div className="p-3 bg-white/90 rounded-xl border border-purple-100 text-xs text-stone-700">
                  <span className="font-semibold text-purple-900">Mindful Prompt:</span> What is one tangible win from today that you can allow yourself to savor for five minutes before planning tomorrow?
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section className="border-t border-purple-100/60 py-16 px-6 bg-white/50 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-serif text-stone-900 mb-3">Designed for peace of mind & emotional clarity</h2>
              <p className="text-stone-600 text-xs sm:text-sm max-w-xl mx-auto">
                Built with user-isolated Firestore rules, local privacy controls, speech synthesis, and intelligent psychological reflection.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="backdrop-blur-md bg-white/80 p-6 rounded-3xl border border-purple-100/80 shadow-md shadow-purple-500/5 hover:scale-[1.02] transition-all duration-200">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 shadow-xs">
                  <Mic className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2 text-base">Voice Notes & Audio Playback</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Record spoken thoughts into the microphone. Listen back to Gemini's responses with natural text-to-speech audio synthesis and playback rate controls.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="backdrop-blur-md bg-white/80 p-6 rounded-3xl border border-purple-100/80 shadow-md shadow-purple-500/5 hover:scale-[1.02] transition-all duration-200">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mb-4 shadow-xs">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2 text-base">Mood Trends & Weekly AI Summary</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Track reflection streaks and recurring emotions with interactive analytics. Generate comprehensive weekly syntheses celebrating growth milestones and self-care steps.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="backdrop-blur-md bg-white/80 p-6 rounded-3xl border border-purple-100/80 shadow-md shadow-purple-500/5 hover:scale-[1.02] transition-all duration-200">
                <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-800 flex items-center justify-center mb-4 shadow-xs">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-stone-900 mb-2 text-base">User Isolation & Data Sovereignty</h3>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  Protected by strict Firestore security rules bound to your Google account UID. Export structured JSON or printable PDFs, or wipe data in 1-click anytime.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-100/60 py-8 px-6 bg-white/70 backdrop-blur-md text-xs text-stone-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-stone-700">MindEcho AI Journal &bull; Built on Google Cloud, Firebase & Gemini</span>
          </div>
          <div>Strict user isolation: reflections are never shared or trained upon.</div>
        </div>
      </footer>
    </div>
  );
};
