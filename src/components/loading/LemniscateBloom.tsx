'use client';

import React, { useEffect, useRef } from 'react';

const SVG_NS = 'http://www.w3.org/2000/svg'; 

const config = { 
  name: "Lemniscate Bloom", 
  tag: "Bernoulli Lemniscate", 
  rotate: false, 
  particleCount: 70, 
  trailSpan: 0.4, 
  durationMs: 5600, 
  rotationDurationMs: 34000, 
  pulseDurationMs: 5000, 
  strokeWidth: 4.8, 
  lemniscateA: 20, 
  lemniscateBoost: 7, 
  point(progress: number, detailScale: number) { 
    const t = progress * Math.PI * 2; 
    const scale = config.lemniscateA + detailScale * config.lemniscateBoost; 
    const denom = 1 + Math.pow(Math.sin(t), 2); 
    return { 
      x: 50 + (scale * Math.cos(t)) / denom, 
      y: 50 + (scale * Math.sin(t) * Math.cos(t)) / denom, 
    }; 
  }, 
}; 

function normalizeProgress(progress: number) { 
  return ((progress % 1) + 1) % 1; 
} 

function getDetailScale(time: number) { 
  const pulseProgress = 
    (time % config.pulseDurationMs) / config.pulseDurationMs; 

  const pulseAngle = pulseProgress * Math.PI * 2; 

  return 0.52 + (
    (Math.sin(pulseAngle + 0.55) + 1) / 2
  ) * 0.48; 
} 

function getRotation(time: number) { 
  if (!config.rotate) return 0; 

  return -(
    (time % config.rotationDurationMs) /
    config.rotationDurationMs
  ) * 360; 
} 

function buildPath(detailScale: number, steps = 480) { 
  return Array.from(
    { length: steps + 1 }, 
    (_, index) => { 
      const point = config.point(
        index / steps, 
        detailScale
      ); 

      return `${index === 0 ? 'M' : 'L'} ${
        point.x.toFixed(2)
      } ${
        point.y.toFixed(2)
      }`; 
    }
  ).join(' '); 
} 

function getParticle(index: number, progress: number, detailScale: number) { 
  const tailOffset = 
    index / (config.particleCount - 1); 

  const point = config.point(
    normalizeProgress(
      progress - tailOffset * config.trailSpan
    ), 
    detailScale
  ); 

  const fade = Math.pow(1 - tailOffset, 0.56); 

  return { 
    x: point.x, 
    y: point.y, 
    radius: 0.9 + fade * 2.7, 
    opacity: 0.04 + fade * 0.96, 
  }; 
}

export function LemniscateBloom({ size = 180 }: { size?: number | string }) {
  const groupRef = useRef<SVGGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mediaQuery.matches;
    const handler = (e: MediaQueryListEvent) => { reducedMotionRef.current = e.matches; };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const group = groupRef.current;
    const path = pathRef.current;
    if (!group || !path) return;

    path.setAttribute('stroke-width', String(config.strokeWidth)); 

    // Create particles dynamically exactly like original implementation
    const particles = Array.from(
      { length: config.particleCount }, 
      () => { 
        const circle = document.createElementNS(SVG_NS, 'circle'); 
        circle.setAttribute('fill', 'currentColor'); 
        group.appendChild(circle); 
        return circle; 
      }
    ); 

    let animationFrameId: number;
    const startedAt = performance.now(); 

    function render(now: number) { 
      let time = now - startedAt; 
      
      // Pause animation if reduced motion is preferred
      if (reducedMotionRef.current) {
        time = 0; 
      }

      const progress = (time % config.durationMs) / config.durationMs; 
      const detailScale = getDetailScale(time); 

      group!.setAttribute(
        'transform', 
        `rotate(${getRotation(time)} 50 50)`
      ); 

      path!.setAttribute(
        'd', 
        buildPath(detailScale)
      ); 

      particles.forEach((node, index) => { 
        const particle = getParticle(
          index, 
          progress, 
          detailScale
        ); 

        node.setAttribute(
          'cx', 
          particle.x.toFixed(2)
        ); 

        node.setAttribute(
          'cy', 
          particle.y.toFixed(2)
        ); 

        node.setAttribute(
          'r', 
          particle.radius.toFixed(2)
        ); 

        node.setAttribute(
          'opacity', 
          particle.opacity.toFixed(3)
        ); 
      }); 

      animationFrameId = requestAnimationFrame(render); 
    } 

    animationFrameId = requestAnimationFrame(render); 

    return () => {
      cancelAnimationFrame(animationFrameId);
      // Clean up DOM nodes on unmount to prevent leaks in React StrictMode
      particles.forEach(node => {
        if (group.contains(node)) {
          group.removeChild(node);
        }
      });
    };
  }, []);

  return (
    <div style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}>
      <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <g ref={groupRef} id="group">
          <path ref={pathRef} id="path" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" opacity="0.1"></path>
        </g>
      </svg>
    </div>
  );
}
