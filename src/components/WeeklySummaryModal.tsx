import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Award,
  Heart,
  TrendingUp,
  CheckCircle2,
  Printer,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Flower2,
} from 'lucide-react';
import { JournalSession, WeeklyInsightSummary } from '../types';
import { safeFetchJson } from '../utils/api';

interface WeeklySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: JournalSession[];
}

export const WeeklySummaryModal: React.FC<WeeklySummaryModalProps> = ({
  isOpen,
  onClose,
  sessions,
}) => {
  const [summaryData, setSummaryData] = useState<WeeklyInsightSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerateSummary = async () => {
    if (sessions.length === 0) {
      setError('Please create at least one reflection session before generating a summary.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await safeFetchJson<WeeklyInsightSummary>('/api/weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessions: sessions.map((s) => ({
            title: s.title,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
            tags: s.tags,
            dominantSentiment: s.dominantSentiment,
            messages: s.messages,
          })),
        }),
      });

      setSummaryData(data);
    } catch (err: any) {
      console.error('Failed to generate weekly summary:', err);
      setError(err.message || 'Unable to generate synthesis summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!summaryData) return;
    const text = `MindEcho Weekly Insight Summary\nOverall Vibe: ${summaryData.overallVibe}\n\nSynthesis:\n${summaryData.summary}\n\nEmotional Patterns:\n${summaryData.emotionalPatterns.map((p) => `• ${p}`).join('\n')}\n\nGrowth Milestones:\n${summaryData.growthMilestones.map((m) => `• ${m}`).join('\n')}\n\nActionable Self-Care Takeaways:\n${summaryData.selfCareActions.map((a) => `• ${a}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-sm animate-fadeIn">
      <div
        id="weekly-summary-modal"
        className="bg-gradient-to-br from-white via-pink-50/30 to-purple-50/40 border border-white/80 w-full max-w-2xl rounded-3xl shadow-2xl shadow-purple-900/10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-pink-100/60 flex items-center justify-between bg-white/75 backdrop-blur-md">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                <span>Weekly Psychological Insight & AI Summary</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  Gemini Synthesis
                </span>
              </h2>
              <p className="text-xs text-stone-500">Holistic emotional trajectory and personal growth takeaways</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 p-6 overflow-y-auto space-y-6 text-sm text-stone-800 overscroll-contain">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!summaryData && !loading && (
            <div className="text-center py-10 px-4">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-pink-100 via-purple-100 to-indigo-100 text-purple-700 flex items-center justify-center mx-auto mb-4 border border-purple-200/60 shadow-xs">
                <Flower2 className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-serif text-stone-900 mb-2">Synthesize Your Recent Thoughts</h3>
              <p className="text-xs text-stone-600 max-w-md mx-auto mb-6 leading-relaxed">
                MindEcho will analyze emotional patterns across your {sessions.length} saved reflection {sessions.length === 1 ? 'entry' : 'entries'}, celebrating milestones and crafting tailored self-care advice.
              </p>
              <button
                id="trigger-generate-weekly-summary-btn"
                onClick={handleGenerateSummary}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Generate Weekly Synthesis</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-14 px-4 space-y-4">
              <Sparkles className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-stone-900">Synthesizing Emotional Trajectory...</h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Reading across your journal entries, uncovering repeated motifs, and generating mindful milestones.
                </p>
              </div>
            </div>
          )}

          {summaryData && !loading && (
            <div className="space-y-6">
              {/* Overall Vibe Hero */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white shadow-md shadow-purple-950/10">
                <span className="text-[11px] uppercase tracking-wider font-semibold opacity-90 block mb-1">
                  Overall Emotional Vibe
                </span>
                <h3 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">
                  "{summaryData.overallVibe}"
                </h3>
              </div>

              {/* Empathetic Summary */}
              <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-purple-100/80 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>Empathetic Reflection Synthesis</span>
                </h4>
                <div className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {summaryData.summary}
                </div>
              </div>

              {/* Emotional Patterns */}
              <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-purple-100/80 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                  <span>Recognized Emotional Patterns</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {summaryData.emotionalPatterns.map((pattern, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/60 text-xs text-purple-900 font-medium flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                      <span>{pattern}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Growth Milestones */}
              <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-purple-100/80 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Celebrated Growth Milestones</span>
                </h4>
                <div className="space-y-2">
                  {summaryData.growthMilestones.map((milestone, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-center gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-medium">{milestone}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Self-Care Actions */}
              <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-md border border-purple-100/80 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Actionable Self-Care Takeaways</span>
                </h4>
                <div className="space-y-2">
                  {summaryData.selfCareActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60 text-xs text-emerald-900 flex items-start gap-2.5"
                    >
                      <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-bold text-[10px] shrink-0">
                        Step {idx + 1}
                      </span>
                      <span className="font-medium">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-pink-100/60 bg-white/75 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {summaryData && (
              <>
                <button
                  onClick={handleCopyText}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleGenerateSummary}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Re-generate summary"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
