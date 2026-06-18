import { getDisplayAvatarUrl, type MeProfile } from '../../lib/profileStore';

interface UserAvatarProps {
  profile?: MeProfile;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClass = {
  sm: 'w-7 h-7',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
} as const;

export default function UserAvatar({ profile, size = 'sm', className = '' }: UserAvatarProps) {
  const src = getDisplayAvatarUrl(profile);
  return (
    <img
      src={src}
      alt=""
      className={`${sizeClass[size]} rounded-full object-cover bg-[#F2F0ED] shrink-0 ${className}`}
    />
  );
}
