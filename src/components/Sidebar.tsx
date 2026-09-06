import React, { useState } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  Trash2,
  Settings,
  LogOut,
  Calendar,
  Sparkles,
  Tag,
  BarChart3,
  Award,
  ChevronRight,
  Shield,
  Heart,
} from 'lucide-react';
import { JournalSession, UserProfile } from '../types';
import { getTagStyle } from '../utils/emotion';

interface SidebarProps {
  sessions: JournalSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  userProfile: UserProfile | null;
  onOpenPrivacySettings: () => void;
  onOpenAnalytics?: () => void;
  onOpenWeeklySummary?: () => void;
  onSignOut: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isGuest?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  userProfile,
  onOpenPrivacySettings,
  onOpenAnalytics,
  onOpenWeeklySummary,
  onSignOut,
  isOpenMobile,
  onCloseMobile,
  isGuest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Aggregate all unique tags from user sessions for quick filtering
  const allUniqueTags: string[] = Array.from(
    new Set<string>(
      sessions.flatMap((s) => s.tags || [])
    )
  ).slice(0, 8);

  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (session.tags && session.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (session.messages && session.messages.some((m) => m.text.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesTag =
      !selectedTagFilter ||
      (session.tags && session.tags.some((t) => t.toLowerCase() === selectedTagFilter.toLowerCase()));

    return matchesSearch && matchesTag;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed lg:static inset-y-0 left-0 z-40 w-80 h-full max-h-full min-h-0 bg-white/75 backdrop-blur-2xl border-r border-purple-100/70 shadow-xl shadow-purple-900/5 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header: App Branding & New Entry */}
        <div className="p-4 border-b border-purple-100/60 bg-white/60 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-700 via-indigo-700 to-pink-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-200" />
              </div>
              <div>
                <h1 className="font-semibold text-base text-stone-900 tracking-tight font-serif">MindEcho</h1>
                <p className="text-[11px] text-purple-700 font-medium">Personal Gemini Journal</p>
              </div>
            </div>

            {isGuest && (
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Sandbox
              </span>
            )}
          </div>

          <button
            id="new-reflection-btn"
            onClick={() => {
              onNewSession();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-sm font-semibold transition-all shadow-md shadow-stone-900/10 cursor-pointer active:scale-[0.99] hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4" />
            <span>New Reflection</span>
          </button>

          {/* Quick Insights Nav Shortcuts */}
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            {onOpenAnalytics && (
              <button
                onClick={() => {
                  onOpenAnalytics();
                  onCloseMobile();
                }}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50/80 hover:bg-purple-100 text-purple-900 border border-purple-200/80 text-[11px] font-semibold transition-all duration-200 cursor-pointer shadow-2xs hover:scale-[1.02]"
              >
                <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
                <span>Mood Trends</span>
              </button>
            )}
            {onOpenWeeklySummary && (
              <button
                onClick={() => {
                  onOpenWeeklySummary();
                  onCloseMobile();
                }}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-pink-50/80 hover:bg-pink-100 text-pink-900 border border-pink-200/80 text-[11px] font-semibold transition-all duration-200 cursor-pointer shadow-2xs hover:scale-[1.02]"
              >
                <Award className="w-3.5 h-3.5 text-pink-600" />
                <span>Weekly AI</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Mood Filter */}
        <div className="p-3 border-b border-purple-100/40 bg-purple-50/30 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="sidebar-search-input"
              type="text"
              placeholder="Search reflections & tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white/90 border border-purple-200/80 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:border-purple-400 focus:ring-1 focus:ring-purple-300/40 transition-all shadow-2xs"
            />
          </div>

          {/* Quick Mood Filter Pills */}
          {allUniqueTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() => setSelectedTagFilter(null)}
                className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all duration-200 cursor-pointer ${
                  selectedTagFilter === null
                    ? 'bg-stone-900 text-white border-stone-900 font-semibold shadow-2xs'
                    : 'bg-white/80 text-stone-600 border-stone-200 hover:bg-white'
                }`}
              >
                All
              </button>
              {allUniqueTags.map((tag) => {
                const style = getTagStyle(tag);
                const isSelected = selectedTagFilter?.toLowerCase() === tag.toLowerCase();
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTagFilter(isSelected ? null : tag)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 font-semibold shadow-2xs'
                        : `${style.bg} ${style.text} ${style.border} ${style.glow}`
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sessions List */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5 overscroll-contain">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <BookOpen className="w-8 h-8 text-purple-300 mx-auto mb-2.5" />
              <p className="text-xs font-semibold text-stone-700">No reflections found</p>
              <p className="text-[11px] text-stone-400 mt-1">
                {searchQuery || selectedTagFilter
                  ? 'Try adjusting your search or mood filter'
                  : 'Start your first mindful dialogue above'}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const dateFormatted = new Date(session.updatedAt || session.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={session.id}
                  id={`session-item-${session.id}`}
                  onClick={() => {
                    onSelectSession(session.id);
                    onCloseMobile();
                  }}
                  className={`group relative flex flex-col p-3 rounded-2xl transition-all duration-200 cursor-pointer border text-left ${
                    isActive
                      ? 'bg-white/95 border-purple-300 shadow-md shadow-purple-900/5 scale-[1.01]'
                      : 'border-transparent hover:bg-white/70 hover:border-purple-200/60 hover:scale-[1.005]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h2 className="text-xs font-semibold text-stone-800 line-clamp-1 group-hover:text-purple-950">
                      {session.title || 'Untitled Reflection'}
                    </h2>
                    <span className="text-[10px] text-stone-400 shrink-0 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {dateFormatted}
                    </span>
                  </div>

                  {/* Message snippet preview */}
                  <p className="text-[11px] text-stone-500 line-clamp-1 mb-2 font-normal">
                    {session.messages && session.messages.length > 0
                      ? session.messages[session.messages.length - 1].text
                      : 'Empty journal entry'}
                  </p>

                  {/* Mood Tags & Delete Action */}
                  <div className="flex items-center justify-between mt-auto pt-1">
                    <div className="flex flex-wrap gap-1 items-center">
                      {(session.tags || []).slice(0, 2).map((tag, idx) => {
                        const style = getTagStyle(tag);
                        return (
                          <span
                            key={idx}
                            className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${style.bg} ${style.text} ${style.border}`}
                          >
                            <span className={`w-1 h-1 rounded-full ${style.dot}`} />
                            #{tag}
                          </span>
                        );
                      })}
                      {(session.tags || []).length > 2 && (
                        <span className="text-[9px] text-stone-400">
                          +{(session.tags || []).length - 2}
                        </span>
                      )}
                    </div>

                    <button
                      title="Delete entry"
                      onClick={(e) => onDeleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 rounded-lg transition-opacity hover:bg-stone-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* User Footer Profile & Privacy Settings */}
        <div className="p-3 border-t border-purple-100/70 bg-white/80 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt={userProfile.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-purple-200 object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-200 to-pink-200 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'M'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-stone-800 truncate">
                  {userProfile?.displayName || 'Reflective Soul'}
                </p>
                <p className="text-[10px] text-stone-400 truncate">
                  {sessions.length} {sessions.length === 1 ? 'reflection' : 'reflections'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              <button
                id="sidebar-privacy-btn"
                onClick={onOpenPrivacySettings}
                title="Privacy & Data Settings"
                className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                id="sidebar-signout-btn"
                onClick={onSignOut}
                title="Sign out"
                className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
