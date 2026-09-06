import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  Moon,
  Compass,
  Target,
  Shuffle,
  Smile,
  Check,
  Plus,
  Flame,
  ArrowRight,
} from 'lucide-react';

interface DailyReflectionStarterProps {
  onSelectPrompt: (promptText: string) => void;
  currentIntention?: string;
  onSaveIntention?: (intention: string) => void;
}

interface PromptCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  prompts: string[];
}

const CATEGORIES: PromptCategory[] = [
  {
    id: 'gratitude',
    label: 'Gratitude & Joy',
    icon: Heart,
    color: 'from-pink-500/15 to-rose-500/10 text-rose-700 border-rose-200/80',
    prompts: [
      'What small, unexpected moment brought you genuine warmth or relief today?',
      'Who is someone you felt quietly grateful for recently, and why?',
      'Describe a physical sensation (sunlight, warm tea, fresh air) you savored today.',
      'What is a strength in yourself that you often take for granted?',
    ],
  },
  {
    id: 'stress',
    label: 'Overcoming Stress',
    icon: Flame,
    color: 'from-amber-500/15 to-orange-500/10 text-amber-800 border-amber-200/80',
    prompts: [
      'What situation is taking up the most mental bandwidth right now, and what part of it is actually within your control?',
      'If your anxiety could speak honestly, what is it trying to protect you from?',
      'What is one pressure you are putting on yourself that you could soften today?',
      'Where in your body are you holding tension, and what would letting it go feel like?',
    ],
  },
  {
    id: 'evening',
    label: 'Evening Reflection',
    icon: Moon,
    color: 'from-purple-500/15 to-indigo-500/10 text-purple-800 border-purple-200/80',
    prompts: [
      'What is one thing you did today that you are proud of, even if nobody else noticed?',
      'What feeling or conversation do you need to leave behind before resting tonight?',
      'How did your energy ebb and flow today, and what drained or restored you?',
      'What is one thing you can look forward to tomorrow with gentle anticipation?',
    ],
  },
  {
    id: 'goals',
    label: 'Goal Alignment',
    icon: Target,
    color: 'from-sky-500/15 to-blue-500/10 text-sky-800 border-sky-200/80',
    prompts: [
      'Are your current daily actions aligned with who you want to become this season?',
      'What is one courageous boundary you could set to protect your creative energy?',
      'What is a goal that currently excites you, and what is the single next micro-step?',
      'What old habit are you gently outgrowing right now?',
    ],
  },
  {
    id: 'mindfulness',
    label: 'Mindfulness & Grounding',
    icon: Compass,
    color: 'from-emerald-500/15 to-teal-500/10 text-emerald-800 border-emerald-200/80',
    prompts: [
      'Pause and take three deep breaths. What does the present moment feel like right now?',
      'What is a truth you have been avoiding saying out loud to yourself?',
      'How can you offer yourself the same unconditional compassion you give to others?',
      'What does stillness mean to you today?',
    ],
  },
];

export const DailyReflectionStarter: React.FC<DailyReflectionStarterProps> = ({
  onSelectPrompt,
  currentIntention,
  onSaveIntention,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('gratitude');
  const [promptSeed, setPromptSeed] = useState<number>(0);
  const [intentionDraft, setIntentionDraft] = useState<string>(currentIntention || '');
  const [isEditingIntention, setIsEditingIntention] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  const activeCategory = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];
  const displayedPrompts = activeCategory.prompts;

  const handleShuffle = () => {
    setPromptSeed((prev) => prev + 1);
  };

  const handleSaveIntentionClick = () => {
    if (onSaveIntention && intentionDraft.trim()) {
      onSaveIntention(intentionDraft.trim());
      setIsEditingIntention(false);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-2 transition-all animate-fadeIn">
      {/* Intention Pill Banner */}
      <div className="mb-3 p-3 sm:p-3.5 rounded-2xl bg-white/75 backdrop-blur-md border border-white/80 shadow-sm shadow-purple-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 block">
              Today's Sacred Intention
            </span>
            {isEditingIntention ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={intentionDraft}
                  onChange={(e) => setIntentionDraft(e.target.value)}
                  placeholder="e.g., Lead with patience and breathe before reacting"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveIntentionClick()}
                  autoFocus
                  className="px-2.5 py-1 text-xs text-stone-800 bg-purple-50/60 border border-purple-200 rounded-lg focus:outline-hidden focus:border-purple-400 w-64 sm:w-80"
                />
                <button
                  onClick={handleSaveIntentionClick}
                  className="px-2.5 py-1 bg-purple-700 text-white rounded-lg text-xs font-semibold hover:bg-purple-800 cursor-pointer shadow-2xs"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingIntention(false)}
                  className="px-2 py-1 text-stone-500 text-xs hover:text-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <p
                onClick={() => setIsEditingIntention(true)}
                className="text-xs font-medium text-stone-800 truncate cursor-pointer hover:text-purple-700 transition-colors"
                title="Click to change your daily intention"
              >
                {currentIntention || intentionDraft || 'Click here to set your mindful daily intention...'}
              </p>
            )}
          </div>
        </div>

        {!isEditingIntention && (
          <button
            onClick={() => setIsEditingIntention(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/80 transition-all cursor-pointer shrink-0 self-end sm:self-center"
          >
            {currentIntention ? 'Edit Intention' : '+ Set Intention'}
          </button>
        )}
      </div>

      {/* Prompts Explorer Glass Card with Height Discipline */}
      <div className="bg-white/75 backdrop-blur-xl border border-white/60 rounded-3xl p-4 sm:p-5 shadow-lg shadow-purple-500/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 mb-3">
          <div>
            <h3 className="text-sm sm:text-base font-serif text-stone-900 flex items-center gap-2">
              <span>Daily Reflection Starters</span>
              <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200">
                Curated AI Prompts
              </span>
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Select a prompt to ignite your journaling turn, or tap shuffle for new perspectives.
            </p>
          </div>

          <button
            onClick={handleShuffle}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white hover:bg-purple-50 text-stone-700 hover:text-purple-800 border border-stone-200 text-xs font-medium transition-all shadow-2xs hover:scale-105 cursor-pointer shrink-0"
            title="Shuffle prompts"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
        </div>

        {/* Category Pills Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-3 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = cat.id === selectedCategory;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-xs scale-[1.02]'
                    : 'bg-white/80 text-stone-600 hover:bg-white hover:text-stone-900 border border-stone-200/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Prompts Grid with max-height constraint */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 sm:max-h-52 overflow-y-auto pr-1 overscroll-contain">
          {displayedPrompts.map((prompt, idx) => {
            return (
              <button
                key={`${selectedCategory}-${idx}-${promptSeed}`}
                onClick={() => onSelectPrompt(prompt)}
                className="group p-3 text-left rounded-2xl bg-gradient-to-br from-white/90 to-purple-50/30 hover:from-white hover:to-purple-100/50 border border-purple-100/80 hover:border-purple-300 text-xs text-stone-700 hover:text-stone-950 transition-all duration-200 shadow-2xs hover:shadow-md hover:scale-[1.01] flex flex-col justify-between gap-1.5 cursor-pointer"
              >
                <p className="leading-relaxed font-normal line-clamp-3">"{prompt}"</p>
                <div className="flex items-center justify-between text-[10px] text-purple-600 opacity-70 group-hover:opacity-100 transition-opacity pt-1 border-t border-purple-100/50">
                  <span className="font-semibold">Write this thought</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
