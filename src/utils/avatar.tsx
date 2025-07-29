import React from 'react';

/**
 * Checks if a string is a URL
 */
export const isUrl = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Renders an avatar - either as an image if it's a URL, or as text/emoji if it's a string
 */
export const renderAvatar = (avatar: string, className?: string): React.ReactNode => {
  if (isUrl(avatar)) {
    return (
      <img
        src={avatar}
        alt="Avatar"
        className={`avatar-image ${className || ''}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 'inherit'
        }}
        onError={(e) => {
          // Fallback to a default emoji if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.parentElement) {
            target.parentElement.textContent = '👤';
          }
        }}
      />
    );
  }

  return avatar;
};
