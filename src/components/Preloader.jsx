import React, { useEffect, useRef, useState } from 'react';
import DilloVideo from '../assets/Dillo_Logo.mp4';

const loaderSizes = {
  sm: { mark: 86, logo: 66, progress: 84 },
  md: { mark: 130, logo: 98, progress: 124 },
  lg: { mark: 190, logo: 145, progress: 150 },
  xl: { mark: 310, logo: 230, progress: 230 },
};

export function LogoLoader({ size = 'md', label = 'Loading...', className = '' }) {
  const dims = loaderSizes[size] || loaderSizes.md;
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={`bg-white flex flex-col items-center justify-center ${className}`}
      style={{
        '--loader-mark-size': `${dims.mark}px`,
        '--loader-logo-size': `${dims.logo}px`,
        '--loader-progress-width': `${dims.progress}px`,
      }}
    >
      <div className="preloader-mark" aria-label={label}>
        <div className="preloader-logo-wrap">
          <video
            className={`preloader-logo ${loaded ? 'is-loaded' : ''}`}
            src={DilloVideo}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onLoadedData={() => setLoaded(true)}
          />
        </div>
      </div>
      <div className="preloader-progress" aria-hidden="true">
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
    const hideTimer = setTimeout(() => setHiding(true), 10000);
    const doneTimer = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone();
      }
    }, 10000);
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
      className="preloader-screen"
      onTransitionEnd={handleTransitionEnd}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
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
