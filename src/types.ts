export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isVoiceEntry?: boolean;
  transcription?: string;
  tags?: string[];
  sentiment?: string;
}

export interface JournalSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  tags: string[];
  dominantSentiment?: string;
  summary?: string;
  intention?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
  reflectionCount?: number;
}

export interface EmotionTagMeta {
  name: string;
  color: string;
  bg: string;
  border: string;
  glow?: string;
}

export interface WeeklyInsightSummary {
  overallVibe: string;
  summary: string;
  emotionalPatterns: string[];
  growthMilestones: string[];
  selfCareActions: string[];
}

export interface MoodFrequency {
  tag: string;
  count: number;
  percentage: number;
}

export interface DayActivity {
  dateString: string;
  shortDate: string;
  dayName: string;
  count: number;
  tags: string[];
}
