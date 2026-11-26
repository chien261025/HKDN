import React from 'react';

interface KoraAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

/** Avatar chính thức của Kora AI trong hệ thống SMART WMS. */
export const KoraAvatar: React.FC<KoraAvatarProps> = ({
  size = 'md',
  pulse = false,
}) => {
  const box =
    size === 'lg'
      ? 'size-16 rounded-2xl'
      : size === 'sm'
      ? 'size-7 rounded-full'
      : 'size-8 rounded-full';

  return (
    <div
      className={`${box} shrink-0 overflow-hidden bg-slate-100 ring-1 ring-slate-200/90 shadow-xs ${
        pulse ? 'ring-2 ring-blue-400 animate-pulse' : ''
      }`}
    >
      <img
        src="/kora-ai-avatar.jpg"
        alt="Kora AI"
        className="w-full h-full object-cover object-top"
      />
    </div>
  );
};

