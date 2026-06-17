import { useState } from 'react';

interface AgentIconProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASS = {
  sm: 'w-8 h-8 rounded-full',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-14 h-14 rounded-2xl',
} as const;

export default function AgentIcon({ src, alt, size = 'lg', className = '' }: AgentIconProps) {
  const [failed, setFailed] = useState(false);
  const fallback = (alt.trim()[0] || '?').toUpperCase();

  return (
    <div
      className={`overflow-hidden shrink-0 bg-[#FDFCFB] border border-black/[0.04] flex items-center justify-center ${SIZE_CLASS[size]} ${className}`}
    >
      {failed ? (
        <span className="text-sm font-bold text-black/45">{fallback}</span>
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
