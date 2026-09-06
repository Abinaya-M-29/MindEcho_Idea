export interface TagStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
  glow: string;
}

export function getTagStyle(tag: string): TagStyle {
  const t = tag.toLowerCase();

  if (t.includes('mindful') || t.includes('calm') || t.includes('peace') || t.includes('grounded') || t.includes('seren')) {
    return {
      bg: 'bg-emerald-50/80 hover:bg-emerald-100/90',
      text: 'text-emerald-800',
      border: 'border-emerald-200/80',
      dot: 'bg-emerald-500',
      glow: 'hover:shadow-xs hover:shadow-emerald-500/20 hover:border-emerald-300',
    };
  }
  if (t.includes('product') || t.includes('focus') || t.includes('achiev') || t.includes('motivat') || t.includes('determin') || t.includes('clarit')) {
    return {
      bg: 'bg-sky-50/80 hover:bg-sky-100/90',
      text: 'text-sky-800',
      border: 'border-sky-200/80',
      dot: 'bg-sky-500',
      glow: 'hover:shadow-xs hover:shadow-sky-500/20 hover:border-sky-300',
    };
  }
  if (t.includes('anxious') || t.includes('stress') || t.includes('overwhelm') || t.includes('fear') || t.includes('worry') || t.includes('restless')) {
    return {
      bg: 'bg-amber-50/80 hover:bg-amber-100/90',
      text: 'text-amber-900',
      border: 'border-amber-200/80',
      dot: 'bg-amber-500',
      glow: 'hover:shadow-xs hover:shadow-amber-500/20 hover:border-amber-300',
    };
  }
  if (t.includes('grate') || t.includes('thank') || t.includes('inspir') || t.includes('joy') || t.includes('optimis') || t.includes('hope')) {
    return {
      bg: 'bg-purple-50/80 hover:bg-purple-100/90',
      text: 'text-purple-800',
      border: 'border-purple-200/80',
      dot: 'bg-purple-500',
      glow: 'hover:shadow-xs hover:shadow-purple-500/20 hover:border-purple-300',
    };
  }
  if (t.includes('vulnerab') || t.includes('sad') || t.includes('grief') || t.includes('lonel') || t.includes('heav')) {
    return {
      bg: 'bg-rose-50/80 hover:bg-rose-100/90',
      text: 'text-rose-800',
      border: 'border-rose-200/80',
      dot: 'bg-rose-500',
      glow: 'hover:shadow-xs hover:shadow-rose-500/20 hover:border-rose-300',
    };
  }
  if (t.includes('reflect') || t.includes('contemplat') || t.includes('curious') || t.includes('introspect') || t.includes('deep')) {
    return {
      bg: 'bg-indigo-50/80 hover:bg-indigo-100/90',
      text: 'text-indigo-800',
      border: 'border-indigo-200/80',
      dot: 'bg-indigo-500',
      glow: 'hover:shadow-xs hover:shadow-indigo-500/20 hover:border-indigo-300',
    };
  }
  if (t.includes('fatigue') || t.includes('tired') || t.includes('burnout') || t.includes('exhaust')) {
    return {
      bg: 'bg-orange-50/80 hover:bg-orange-100/90',
      text: 'text-orange-900',
      border: 'border-orange-200/80',
      dot: 'bg-orange-500',
      glow: 'hover:shadow-xs hover:shadow-orange-500/20 hover:border-orange-300',
    };
  }

  // Default clean pastel tag
  return {
    bg: 'bg-stone-100/80 hover:bg-stone-200/90',
    text: 'text-stone-700',
    border: 'border-stone-200/80',
    dot: 'bg-stone-400',
    glow: 'hover:shadow-xs hover:shadow-stone-400/20 hover:border-stone-300',
  };
}

