import React, { useEffect, useState } from 'react';
import { tw } from '@twind/core';

const CelebrationEffect = ({ isVisible, onComplete }) => {
  const [animationStage, setAnimationStage] = useState('initial');

  useEffect(() => {
    if (isVisible) {
      setAnimationStage('celebrating');
      
      const timer = setTimeout(() => {
        setAnimationStage('fading');
        setTimeout(() => {
          onComplete && onComplete();
        }, 500);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={tw(`fixed inset-0 pointer-events-none z-50 flex items-center justify-center ${
      animationStage === 'fading' ? 'opacity-0 transition-opacity duration-500' : ''
    }`)}>
      {/* Confetti Animation */}
      <div className={tw('absolute inset-0')}>
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className={tw(`absolute w-2 h-2 opacity-90 ${
              animationStage === 'celebrating' ? 'animate-bounce' : ''
            }`)}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'][Math.floor(Math.random() * 7)],
              borderRadius: Math.random() > 0.5 ? '50%' : '0',
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Central Celebration Message */}
      <div className={tw(`bg-white rounded-3xl shadow-2xl p-8 text-center transform ${
        animationStage === 'celebrating' ? 'scale-100 animate-pulse' : 'scale-95'
      } transition-transform duration-300`)}>
        <div className={tw('text-6xl mb-4 animate-bounce')}>🎉</div>
        <h2 className={tw('text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2')}>
          Amazing Job!
        </h2>
        <p className={tw('text-lg text-gray-600 mb-4')}>
          You completed a task! 
        </p>
        <div className={tw('flex justify-center items-center gap-2 text-2xl')}>
          <span className={tw('animate-spin')}>⭐</span>
          {/* <span className={tw('font-bold text-green-600')}>+$5.00</span> */}
          <span className={tw('animate-spin')}>⭐</span>
        </div>
      </div>

      {/* Floating Emojis */}
      <div className={tw('absolute inset-0')}>
        {['🎊', '🎉', '⭐', '🏆', '💰', '🎯'].map((emoji, i) => (
          <div
            key={i}
            className={tw(`absolute text-4xl ${
              animationStage === 'celebrating' ? 'animate-ping' : ''
            }`)}
            style={{
              left: `${20 + (i * 15)}%`,
              top: `${30 + Math.sin(i) * 20}%`,
              animationDelay: `${i * 0.3}s`
            }}
          >
            {emoji}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CelebrationEffect; 