import React, { useEffect, useRef, useState } from 'react';
import DilloLogo from '../assets/Logo.png';

const loaderSizes = {
  sm: { mark: 86, logo: 66, progress: 84 },
  md: { mark: 130, logo: 98, progress: 124 },
  lg: { mark: 190, logo: 145, progress: 150 },
  xl: { mark: 310, logo: 230, progress: 230 },
};

export function LogoLoader({ size = 'md', label = 'Loading...', className = '' }) {
  const dims = loaderSizes[size] || loaderSizes.md;
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className="preloader-mark"
        aria-label={label}
        style={{
          '--loader-mark-size': `${dims.mark}px`,
          '--loader-logo-size': `${dims.logo}px`,
        }}
      >
        <div className="preloader-orbit" />
        <div className="preloader-logo-wrap">
          <img src={DilloLogo} alt="Dillo" className="preloader-logo" />
        </div>
      </div>

      <div
        className="preloader-progress"
        aria-hidden="true"
        style={{ '--loader-progress-width': `${dims.progress}px` }}
      >
        <span />
      </div>

      {label && (
        <p className="font-body text-xs text-gray-400 mt-3 animate-pulse">{label}</p>
      )}
    </div>
  );
}

export default function Preloader({ onDone }) {
  const [hiding, setHiding] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const hideTimer = setTimeout(() => setHiding(true), 2200);
    const doneTimer = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone();
      }
    }, 3000);

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  const handleTransitionEnd = () => {
    if (hiding && !doneRef.current) {
      doneRef.current = true;
      onDone();
    }
  };

  return (
    <div
      onTransitionEnd={handleTransitionEnd}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        opacity: hiding ? 0 : 1,
        transition: 'opacity 0.7s ease',
        pointerEvents: hiding ? 'none' : 'all',
      }}
    >
      <LogoLoader size="xl" label="" />
    </div>
  );
}
