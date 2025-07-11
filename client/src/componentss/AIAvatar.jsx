import React from 'react';
import { tw } from '@twind/core';

const AIAvatar = ({ size = 'medium', animated = false }) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-32 h-32'
  };

  return (
    <div className={tw(`relative ${sizeClasses[size]}`)}>
      <div className={tw(`absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full ${animated ? 'animate-pulse' : ''}`)}>
        <div className={tw('absolute inset-1 bg-white rounded-full flex items-center justify-center')}>
          <svg
            viewBox="0 0 100 100"
            className={tw('w-full h-full p-4')}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* AI Robot Avatar */}
            <circle cx="50" cy="35" r="20" fill="#8B5CF6" opacity="0.8" />
            <rect x="35" y="45" width="30" height="35" rx="10" fill="#8B5CF6" opacity="0.8" />
            
            {/* Eyes */}
            <circle cx="42" cy="32" r="3" fill="white" />
            <circle cx="58" cy="32" r="3" fill="white" />
            <circle cx="42" cy="33" r="2" fill="#1F2937" />
            <circle cx="58" cy="33" r="2" fill="#1F2937" />
            
            {/* Smile */}
            <path
              d="M 40 40 Q 50 45 60 40"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            
            {/* Arms */}
            <rect x="25" y="50" width="8" height="20" rx="4" fill="#8B5CF6" opacity="0.6" />
            <rect x="67" y="50" width="8" height="20" rx="4" fill="#8B5CF6" opacity="0.6" />
            
            {/* Antenna */}
            <line x1="50" y1="15" x2="50" y2="25" stroke="#8B5CF6" strokeWidth="2" />
            <circle cx="50" cy="12" r="3" fill="#8B5CF6" />
            
            {/* Body details */}
            <rect x="45" y="55" width="10" height="10" rx="2" fill="white" opacity="0.8" />
            <rect x="47" y="57" width="6" height="6" rx="1" fill="#8B5CF6" />
          </svg>
        </div>
      </div>
      
      {/* Floating animation elements */}
      {animated && (
        <>
          <div className={tw('absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full animate-bounce')} />
          <div className={tw('absolute -bottom-2 -left-2 w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-100')} />
          <div className={tw('absolute top-1/2 -right-3 w-2 h-2 bg-pink-400 rounded-full animate-bounce delay-200')} />
        </>
      )}
    </div>
  );
};

export default AIAvatar; 