import React, { useEffect, useRef, useState } from 'react';

const getStageScale = (baseWidth, baseHeight, availableWidth, availableHeight) => {
  const widthScale = availableWidth / baseWidth;
  const heightScale = availableHeight / baseHeight;

  return Math.min(widthScale, heightScale, 1);
};

const FixedStage = ({ baseWidth, baseHeight, children, className = '' }) => {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return undefined;

    const updateScale = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      setScale(
        getStageScale(
          baseWidth,
          baseHeight,
          rect.width,
          Math.max(window.innerHeight - 8, 0),
        ),
      );
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [baseWidth, baseHeight]);

  return (
    <div ref={containerRef} className={`flex w-full justify-center ${className}`}>
      <div
        className="relative"
        style={{
          width: baseWidth * scale,
          height: baseHeight * scale,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: baseWidth,
            height: baseHeight,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default FixedStage;
