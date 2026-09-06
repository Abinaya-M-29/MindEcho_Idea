import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  signOutUser,
  syncUserProfile,
  getUserSessions,
  saveJournalSession,
  deleteJournalSession,
  deleteAllUserData,
} from './lib/firebase';
import { JournalSession, UserProfile, ChatMessage } from './types';
import { LandingPage } from './components/LandingPage';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { PrivacySettingsModal } from './components/PrivacySettingsModal';
import { MoodAnalyticsModal } from './components/MoodAnalyticsModal';
import { WeeklySummaryModal } from './components/WeeklySummaryModal';
import { safeFetchJson } from './utils/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  const [sessions, setSessions] = useState<JournalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isReflecting, setIsReflecting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // UI modal state
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [isWeeklySummaryModalOpen, setIsWeeklySummaryModalOpen] = useState(false);

  // 1. Session Guard & Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthLoading(true);
      if (user) {
        setCurrentUser(user);
        setIsGuestMode(false);
        try {
          const profile = await syncUserProfile(user);
          setUserProfile(profile);
          const loadedSessions = await getUserSessions(user.uid);
          setSessions(loadedSessions);
          if (loadedSessions.length > 0) {
            setActiveSessionId(loadedSessions[0].id);
          } else {
            // Auto-create initial session
            const newId = `session-${Date.now()}`;
            const initialSession: JournalSession = {
              id: newId,
              userId: user.uid,
              title: 'Morning Reflection',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              messages: [],
              tags: ['Mindful'],
            };
            await saveJournalSession(initialSession);
            setSessions([initialSession]);
            setActiveSessionId(newId);
          }
        } catch (err: any) {
          console.error('Error loading user data:', err);
          setSaveError('Failed to load reflections from Cloud Firestore.');
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Guest Sandbox Mode fallback initializer
  const handleEnterGuestMode = () => {
    setIsGuestMode(true);
    const guestUser: UserProfile = {
      uid: 'sandbox-guest-user',
      email: 'guest@mindecho.local',
      displayName: 'Sandbox Explorer',
      photoURL: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      reflectionCount: 1,
    };
    setUserProfile(guestUser);

    const demoSession: JournalSession = {
      id: `sandbox-session-${Date.now()}`,
      userId: 'sandbox-guest-user',
      title: 'Welcome to MindEcho',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['Mindful', 'Reflective'],
      dominantSentiment: 'Calm',
      messages: [
        {
          id: 'demo-msg-1',
          role: 'assistant',
          text: `Welcome to MindEcho. This is your personal sanctuary for honest thoughts and thoughtful self-reflection.\n\nYou can type your thoughts or use the microphone to speak your journal entries aloud. I am powered by Gemini 3.6 Flash and will listen with empathetic attention, automatically tag your emotions, and offer gentle reflection prompts.`,
          timestamp: new Date().toISOString(),
          tags: ['Welcome', 'Mindful'],
          sentiment: 'Encouraging',
        },
      ],
    };
    setSessions([demoSession]);
    setActiveSessionId(demoSession.id);
  };

  // Create New Journal Session
  const handleNewSession = () => {
    const userId = currentUser ? currentUser.uid : 'sandbox-guest-user';
    const newSessionId = `session-${Date.now()}`;
    const newSession: JournalSession = {
      id: newSessionId,
      userId,
      title: `Reflection ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      tags: [],
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSessionId);

    if (currentUser) {
      saveJournalSession(newSession).catch((err) => {
        console.error('Failed to create session:', err);
      });
    }
  };

  // Delete specific session
  const handleDeleteSession = async (sessionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this reflection?')) return;

    try {
      if (currentUser) {
        await deleteJournalSession(sessionId);
      }
      const updated = sessions.filter((s) => s.id !== sessionId);
      setSessions(updated);
      if (activeSessionId === sessionId) {
        if (updated.length > 0) {
          setActiveSessionId(updated[0].id);
        } else {
          handleNewSession();
        }
      }
    } catch (err: any) {
      console.error('Delete failed:', err);
      setSaveError('Failed to delete reflection session.');
    }
  };

  // Update session title
  const handleUpdateTitle = async (newTitle: string) => {
    if (!activeSessionId) return;
    const session = sessions.find((s) => s.id === activeSessionId);
    if (!session) return;

    const updatedSession: JournalSession = {
      ...session,
      title: newTitle,
      updatedAt: new Date().toISOString(),
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? updatedSession : s))
    );

    if (currentUser) {
      try {
        await saveJournalSession(updatedSession);
      } catch (err) {
        console.error('Failed to update title:', err);
      }
    }
  };

  // Save Daily Intention to session
  const handleSaveIntention = async (intention: string) => {
    if (!activeSessionId) return;
    const session = sessions.find((s) => s.id === activeSessionId);
    if (!session) return;

    const updatedSession: JournalSession = {
      ...session,
      intention,
      updatedAt: new Date().toISOString(),
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? updatedSession : s))
    );

    if (currentUser) {
      try {
        await saveJournalSession(updatedSession);
      } catch (err) {
        console.error('Failed to save intention:', err);
      }
    }
  };

  // Current Active Session
  const currentSession = sessions.find((s) => s.id === activeSessionId) || null;

  // Multi-Turn Text Reflection Handler
  const handleSendMessage = async (text: string) => {
    if (!currentSession) return;

    setSaveError(null);
    setIsReflecting(true);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    // Optimistic UI update
    const updatedMessages = [...(currentSession.messages || []), userMessage];
    const updatedSession: JournalSession = {
      ...currentSession,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
      // Auto-generate title from first message if untitled
      title:
        currentSession.messages.length === 0
          ? text.slice(0, 36).replace(/[\r\n]+/g, ' ') + (text.length > 36 ? '...' : '')
          : currentSession.title,
    };

    setSessions((prev) =>
      prev.map((s) => (s.id === currentSession.id ? updatedSession : s))
    );

    try {
      // Call server-side API proxy with conversation history using safe JSON client
      const reflectionResult = await safeFetchJson<any>('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: updatedMessages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-reply`,
        role: 'assistant',
        text: reflectionResult.reply || 'Thank you for expressing your thoughts.',
        timestamp: new Date().toISOString(),
        tags: reflectionResult.tags || ['Mindful'],
        sentiment: reflectionResult.sentiment || 'Reflective',
      };

      // Merge new mood tags into session tags (unique set)
      const mergedTags = Array.from(
        new Set([...(updatedSession.tags || []), ...(reflectionResult.tags || [])])
      );

      const finalizedSession: JournalSession = {
        ...updatedSession,
        messages: [...updatedMessages, assistantMessage],
        tags: mergedTags,
        dominantSentiment: reflectionResult.sentiment || updatedSession.dominantSentiment,
        updatedAt: new Date().toISOString(),
      };

      setSessions((prev) =>
        prev.map((s) => (s.id === currentSession.id ? finalizedSession : s))
      );

      // Persist to Firestore
      if (currentUser) {
        await saveJournalSession(finalizedSession);
      }
    } catch (err: any) {
      console.error('Reflection error:', err);
      setSaveError(err.message || 'Failed to complete reflection. Please try again.');
    } finally {
      setIsReflecting(false);
    }
  };

  // Audio / Voice-to-Text Reflection Handler
  const handleSendVoice = async (audioBase64: string, mimeType: string) => {
    if (!currentSession) return;

    setSaveError(null);
    setIsReflecting(true);

    try {
      const result = await safeFetchJson<any>('/api/transcribe-reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType,
          history: (currentSession.messages || []).map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      const userVoiceMessage: ChatMessage = {
        id: `msg-${Date.now()}-voice`,
        role: 'user',
        text: result.transcription || 'Spoken journal entry',
        timestamp: new Date().toISOString(),
        isVoiceEntry: true,
      };

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-reply`,
        role: 'assistant',
        text: result.reply || 'Thank you for sharing your spoken reflection.',
        timestamp: new Date().toISOString(),
        tags: result.tags || ['Spoken Entry', 'Reflective'],
        sentiment: result.sentiment || 'Reflective',
      };

      const updatedMessages = [
        ...(currentSession.messages || []),
        userVoiceMessage,
        assistantMessage,
      ];

      const mergedTags = Array.from(
        new Set([...(currentSession.tags || []), ...(result.tags || [])])
      );

      const finalizedSession: JournalSession = {
        ...currentSession,
        messages: updatedMessages,
        tags: mergedTags,
        dominantSentiment: result.sentiment || currentSession.dominantSentiment,
        title:
          currentSession.messages.length === 0
            ? (result.transcription?.slice(0, 36) || 'Spoken Reflection') + '...'
            : currentSession.title,
        updatedAt: new Date().toISOString(),
      };

      setSessions((prev) =>
        prev.map((s) => (s.id === currentSession.id ? finalizedSession : s))
      );

      if (currentUser) {
        await saveJournalSession(finalizedSession);
      }
    } catch (err: any) {
      console.error('Voice reflection failed:', err);
      setSaveError(err.message || 'Failed to process voice recording.');
      throw err;
    } finally {
      setIsReflecting(false);
    }
  };

  // Delete Account and all User Firestore Data
  const handleDeleteAccountAndData = async () => {
    if (currentUser) {
      await deleteAllUserData(currentUser.uid);
      await signOutUser();
    }
    setSessions([]);
    setActiveSessionId(null);
    setCurrentUser(null);
    setUserProfile(null);
    setIsGuestMode(false);
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error(err);
    }
    setCurrentUser(null);
    setUserProfile(null);
    setIsGuestMode(false);
    setSessions([]);
  };

  // Auth Loading Screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex flex-col items-center justify-center p-6 text-stone-700">
        <div className="w-10 h-10 border-3 border-stone-300 border-t-stone-800 rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Connecting to MindEcho...</p>
      </div>
    );
  }

  // Public Landing Page (Unauthenticated & not in guest preview)
  if (!currentUser && !isGuestMode) {
    return (
      <LandingPage
        onSignedIn={() => {}}
        onEnterGuestMode={handleEnterGuestMode}
      />
    );
  }

  // Protected Dashboard Application
  return (
    <div className="flex h-full w-full max-w-full overflow-hidden bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-blue-50/40 font-sans antialiased text-stone-900">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onNewSession={handleNewSession}
        onDeleteSession={handleDeleteSession}
        userProfile={userProfile}
        onOpenPrivacySettings={() => setIsPrivacyModalOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        onOpenWeeklySummary={() => setIsWeeklySummaryModalOpen(true)}
        onSignOut={handleSignOut}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        isGuest={isGuestMode}
      />

      <ChatWindow
        session={currentSession}
        onSendMessage={handleSendMessage}
        onSendVoice={handleSendVoice}
        onUpdateTitle={handleUpdateTitle}
        onSaveIntention={handleSaveIntention}
        onDeleteCurrentSession={() => {
          if (activeSessionId) {
            handleDeleteSession(activeSessionId);
          }
        }}
        onToggleSidebarMobile={() => setIsSidebarOpenMobile((prev) => !prev)}
        onOpenAnalytics={() => setIsAnalyticsModalOpen(true)}
        onOpenWeeklySummary={() => setIsWeeklySummaryModalOpen(true)}
        isLoading={isReflecting}
        saveError={saveError}
        onRetrySave={() => {
          if (currentSession && currentUser) {
            saveJournalSession(currentSession)
              .then(() => setSaveError(null))
              .catch((err) => setSaveError(err.message));
          }
        }}
      />

      {/* Privacy, Export & Account Deletion Modal */}
      <PrivacySettingsModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        userProfile={userProfile}
        sessions={sessions}
        onDeleteAccountAndData={handleDeleteAccountAndData}
        isGuest={isGuestMode}
      />

      {/* Daily Mood & Streak Analytics Modal */}
      <MoodAnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
        sessions={sessions}
      />

      {/* Weekly Psychological Insight & AI Summary Modal */}
      <WeeklySummaryModal
        isOpen={isWeeklySummaryModalOpen}
        onClose={() => setIsWeeklySummaryModalOpen(false)}
        sessions={sessions}
      />
    </div>
  );
}
