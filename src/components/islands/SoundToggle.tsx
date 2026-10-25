import { useEffect, useState } from 'react';
import { music } from '@/lib/music';
import { SOUND_ICONS } from '@/lib/soundIcons';
import s from './SoundToggle.module.css';

/** Round mute / unmute button for the background music; hidden when there's no music. */
export default function SoundToggle({ className = '' }: { className?: string }) {
  const [st, setSt] = useState({ available: false, muted: false, playing: false });
  useEffect(() => music.subscribe(setSt), []);
  if (!st.available) return null;
  const icon = st.muted ? 'off' : st.playing ? 'playing' : 'on';
  return (
    <button
      type="button"
      className={`${s.btn} ${className}`}
      data-icon={icon}
      onClick={(e) => { e.stopPropagation(); music.toggle(); }}
      aria-label={st.muted ? 'Turn music on' : 'Mute music'}
      aria-pressed={!st.muted}
    >
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" dangerouslySetInnerHTML={{ __html: SOUND_ICONS[icon] }} />
    </button>
  );
}
