import React, { useMemo, useState } from 'react';
import {
  X,
  Flame,
  BarChart3,
  Calendar,
  Sparkles,
  PieChart,
  Heart,
  Smile,
  Tag,
  TrendingUp,
  Award,
} from 'lucide-react';
import { JournalSession } from '../types';
import { getTagStyle } from '../utils/emotion';

interface MoodAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: JournalSession[];
}

export const MoodAnalyticsModal: React.FC<MoodAnalyticsModalProps> = ({
  isOpen,
  onClose,
  sessions,
}) => {
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'all'>('7days');

  // Compute Streak
  const streakCount = useMemo(() => {
    if (sessions.length === 0) return 0;

    const uniqueDates: string[] = Array.from(
      new Set<string>(
        sessions.map((s) => {
          const d = new Date(s.updatedAt || s.createdAt);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })
      )
    ).sort().reverse();

    if (uniqueDates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    // Active streak must include either today or yesterday
    const startsFrom = uniqueDates[0] === todayStr ? 0 : uniqueDates[0] === yesterdayStr ? 0 : -1;
    if (startsFrom === -1) return 1; // at least 1 recent day completed

    streak = 1;
    for (let i = startsFrom; i < uniqueDates.length - 1; i++) {
      const current = new Date(uniqueDates[i]);
      const next = new Date(uniqueDates[i + 1]);
      const diffTime = Math.abs(current.getTime() - next.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [sessions]);

  // Compute Total Words & Stats
  const { totalWords, totalMessages, dominantSentimentOverall } = useMemo(() => {
    let words = 0;
    let msgs = 0;
    const sentimentCounts: Record<string, number> = {};

    sessions.forEach((s) => {
      if (s.dominantSentiment) {
        sentimentCounts[s.dominantSentiment] = (sentimentCounts[s.dominantSentiment] || 0) + 1;
      }
      (s.messages || []).forEach((m) => {
        msgs++;
        if (m.text) {
          words += m.text.trim().split(/\s+/).length;
        }
      });
    });

    const topSentiment = Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalWords: words,
      totalMessages: msgs,
      dominantSentimentOverall: topSentiment ? topSentiment[0] : 'Reflective',
    };
  }, [sessions]);

  // Emotion Tag Breakdown
  const emotionBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalTags = 0;

    sessions.forEach((s) => {
      (s.tags || []).forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
        totalTags++;
      });
      (s.messages || []).forEach((m) => {
        (m.tags || []).forEach((tag) => {
          counts[tag] = (counts[tag] || 0) + 1;
          totalTags++;
        });
      });
    });

    if (totalTags === 0) return [];

    return Object.entries(counts)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: Math.round((count / totalTags) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);
  }, [sessions]);

  // 7-Day Activity Trend
  const last7DaysData = useMemo(() => {
    const days: { label: string; date: string; count: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' });

      const matches = sessions.filter((s) => {
        const sDate = new Date(s.updatedAt || s.createdAt);
        return (
          `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}` ===
          dateKey
        );
      });

      days.push({
        label: dayLabel,
        date: dateKey,
        count: matches.length,
      });
    }
    return days;
  }, [sessions]);

  const maxDayCount = Math.max(...last7DaysData.map((d) => d.count), 1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-sm animate-fadeIn">
      <div
        id="mood-analytics-modal"
        className="bg-gradient-to-br from-white via-purple-50/40 to-pink-50/40 border border-white/80 w-full max-w-2xl rounded-3xl shadow-2xl shadow-purple-900/10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-purple-100/60 flex items-center justify-between bg-white/70 backdrop-blur-md">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                <span>Daily Mood & Reflection Analytics</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  Insights
                </span>
              </h2>
              <p className="text-xs text-stone-500">Track your emotional trajectory, streaks, and mindful habits</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 p-6 overflow-y-auto space-y-6 text-sm text-stone-800 overscroll-contain">
          {/* Top Hero Stats Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Streak Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-amber-900">Active Streak</span>
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
              <div>
                <span className="text-2xl font-bold text-amber-950 font-serif">
                  {streakCount} {streakCount === 1 ? 'Day' : 'Days'}
                </span>
                <p className="text-[10px] text-amber-700 mt-0.5">Consecutive journaling 🔥</p>
              </div>
            </div>

            {/* Total Entries */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-purple-900">Total Entries</span>
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
              <div>
                <span className="text-2xl font-bold text-purple-950 font-serif">
                  {sessions.length}
                </span>
                <p className="text-[10px] text-purple-700 mt-0.5">Saved reflections</p>
              </div>
            </div>

            {/* Total Words */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-sky-900">Words Written</span>
                <Sparkles className="w-4 h-4 text-sky-500" />
              </div>
              <div>
                <span className="text-2xl font-bold text-sky-950 font-serif">
                  {totalWords.toLocaleString()}
                </span>
                <p className="text-[10px] text-sky-700 mt-0.5">{totalMessages} messages shared</p>
              </div>
            </div>

            {/* Dominant Sentiment */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-emerald-900">Dominant Vibe</span>
                <Heart className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold text-emerald-950 truncate block">
                  {dominantSentimentOverall}
                </span>
                <p className="text-[10px] text-emerald-700 mt-0.5">Primary mindset</p>
              </div>
            </div>
          </div>

          {/* 7-Day Activity Rhythm Bar Chart */}
          <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-purple-100/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span>Weekly Journaling Cadence</span>
              </h3>
              <span className="text-[11px] text-stone-400">Past 7 Days</span>
            </div>

            <div className="flex items-end justify-between gap-2 h-28 pt-4 pb-1">
              {last7DaysData.map((d, index) => {
                const heightPercent = Math.max((d.count / maxDayCount) * 100, 10);
                const hasEntries = d.count > 0;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-bold text-stone-600">
                      {d.count > 0 ? d.count : ''}
                    </span>
                    <div className="w-full max-w-[36px] bg-stone-100 rounded-lg overflow-hidden flex items-end h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-lg transition-all duration-500 ${
                          hasEntries
                            ? 'bg-gradient-to-t from-purple-600 to-pink-500 shadow-xs'
                            : 'bg-stone-200/60'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-stone-500">{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Emotion Tag Breakdown */}
          <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-purple-100/80 shadow-xs">
            <h3 className="font-semibold text-stone-900 text-xs sm:text-sm mb-3 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-purple-600" />
              <span>Recurring Emotional Themes & Tags</span>
            </h3>

            {emotionBreakdown.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-4 text-center">
                Reflections are waiting to be tagged. Complete a journal entry to discover recurring emotions.
              </p>
            ) : (
              <div className="space-y-3">
                {emotionBreakdown.map((item, idx) => {
                  const style = getTagStyle(item.tag);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-stone-800 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                          #{item.tag}
                        </span>
                        <span className="text-stone-500 font-mono text-[11px]">
                          {item.count} {item.count === 1 ? 'time' : 'times'} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${item.percentage}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${style.dot}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-purple-100/60 bg-white/70 backdrop-blur-md flex items-center justify-between">
          <span className="text-[11px] text-stone-500">Mindful habits compound over time &bull; Keep reflecting</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
