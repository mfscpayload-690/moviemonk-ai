import React, { useRef, useEffect } from 'react';

export interface CinematicBackgroundProps {
  interactiveTarget?: { x: number; y: number } | null;
  targetType?: 'google' | 'github' | null;
}

interface BokehOrb {
  x: number;
  y: number;
  radius: number;
  baseRadius: number;
  color: string;
  alpha: number;
  baseAlpha: number;
  vx: number;
  vy: number;
  phase: number;
  pulseSpeed: number;
  depth: number; // 0.1 (distant, small, slow) to 1.0 (foreground, larger, responsive)
}

interface LightMote {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  vy: number;
  vx: number;
  flickerSpeed: number;
  flickerPhase: number;
}

// Curated cinematic palette: Deep Violet, Electric Indigo, Anamorphic Cyan, Cinema Magenta, Warm Amber
const CINEMATIC_COLORS = [
  'rgba(124, 58, 237, ',  // Royal Violet
  'rgba(79, 70, 229, ',   // Deep Indigo
  'rgba(6, 182, 212, ',   // Anamorphic Cyan
  'rgba(219, 39, 119, ',  // Cinema Magenta / Fuchsia
  'rgba(245, 158, 11, ',  // Projector Warm Amber
];

export default function CinematicBackground({
  interactiveTarget,
  targetType = null,
}: CinematicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const interactiveTargetRef = useRef(interactiveTarget);
  const targetTypeRef = useRef(targetType);
  const renderStaticFrameRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    interactiveTargetRef.current = interactiveTarget;
    targetTypeRef.current = targetType;
    renderStaticFrameRef.current?.();
  }, [interactiveTarget, targetType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number | null = null;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Respect user's motion preferences
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = motionQuery.matches;

    const isMobile = width < 768;
    const orbCount = isMobile ? 18 : 34;
    const moteCount = isMobile ? 25 : 60;

    // Generate soft optical bokeh orbs
    const orbs: BokehOrb[] = [];
    for (let i = 0; i < orbCount; i++) {
      const depth = Math.random() * 0.8 + 0.2;
      const baseRadius = (Math.random() * 70 + 40) * depth;
      orbs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: baseRadius,
        baseRadius,
        color: CINEMATIC_COLORS[Math.floor(Math.random() * CINEMATIC_COLORS.length)],
        alpha: (Math.random() * 0.25 + 0.08) * depth,
        baseAlpha: (Math.random() * 0.25 + 0.08) * depth,
        vx: (Math.random() - 0.5) * 0.3 * depth,
        vy: -Math.random() * 0.4 * depth - 0.1,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.015 + 0.005,
        depth,
      });
    }

    // Generate subtle cinematic dust motes (floating through projector beam)
    const motes: LightMote[] = [];
    for (let i = 0; i < moteCount; i++) {
      motes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.6,
        alpha: Math.random() * 0.4 + 0.1,
        vy: -Math.random() * 0.35 - 0.1,
        vx: (Math.random() - 0.5) * 0.2,
        flickerSpeed: Math.random() * 0.03 + 0.01,
        flickerPhase: Math.random() * Math.PI * 2,
      });
    }

    // Smooth cursor & projector interpolation
    let mouseX = width / 2;
    let mouseY = height * 0.4;
    let smoothX = mouseX;
    let smoothY = mouseY;
    let time = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // Main cinematic render loop
    const render = () => {
      animationFrameId = null;
      time += 0.015;

      // Smoothly interpolate spotlight position
      const interactiveTarget = interactiveTargetRef.current;
      const targetType = targetTypeRef.current;
      const targetX = interactiveTarget ? interactiveTarget.x : mouseX;
      const targetY = interactiveTarget ? interactiveTarget.y : mouseY;
      smoothX += (targetX - smoothX) * 0.06;
      smoothY += (targetY - smoothY) * 0.06;

      // ── 1. Clear with Deep Obsidian / Cosmic Cinema Base ──
      ctx.fillStyle = '#06060a';
      ctx.fillRect(0, 0, width, height);

      // ── 2. Render Ambient Cinematic Aurora Curtains ──
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      // Aurora Wave 1: Deep Violet / Indigo
      const grad1 = ctx.createRadialGradient(
        width * 0.2 + Math.sin(time * 0.4) * 80,
        height * 0.3 + Math.cos(time * 0.5) * 60,
        50,
        width * 0.25,
        height * 0.35,
        Math.max(width, height) * 0.65
      );
      grad1.addColorStop(0, 'rgba(124, 58, 237, 0.24)');
      grad1.addColorStop(0.5, 'rgba(79, 70, 229, 0.10)');
      grad1.addColorStop(1, 'rgba(6, 6, 10, 0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      // Aurora Wave 2: Cinema Fuchsia / Rose
      const grad2 = ctx.createRadialGradient(
        width * 0.8 + Math.cos(time * 0.35) * 90,
        height * 0.7 + Math.sin(time * 0.45) * 70,
        40,
        width * 0.75,
        height * 0.65,
        Math.max(width, height) * 0.6
      );
      grad2.addColorStop(0, 'rgba(219, 39, 119, 0.20)');
      grad2.addColorStop(0.6, 'rgba(147, 51, 234, 0.08)');
      grad2.addColorStop(1, 'rgba(6, 6, 10, 0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Aurora Wave 3: Anamorphic Cyan Beam
      const grad3 = ctx.createRadialGradient(
        width * 0.5 + Math.sin(time * 0.5) * 120,
        height * 0.85 + Math.cos(time * 0.3) * 50,
        20,
        width * 0.5,
        height * 0.8,
        Math.max(width, height) * 0.5
      );
      grad3.addColorStop(0, 'rgba(6, 182, 212, 0.16)');
      grad3.addColorStop(0.6, 'rgba(59, 130, 246, 0.06)');
      grad3.addColorStop(1, 'rgba(6, 6, 10, 0)');
      ctx.fillStyle = grad3;
      ctx.fillRect(0, 0, width, height);

      // ── 3. Interactive Projector Spotlight Cone ──
      const spotlightRadius = interactiveTarget ? 380 : 300;
      const spotGrad = ctx.createRadialGradient(
        smoothX,
        smoothY,
        0,
        smoothX,
        smoothY,
        spotlightRadius
      );

      if (targetType === 'google') {
        // Multi-chromatic Google hover aura
        spotGrad.addColorStop(0, 'rgba(66, 133, 244, 0.28)');
        spotGrad.addColorStop(0.35, 'rgba(234, 67, 53, 0.15)');
        spotGrad.addColorStop(0.7, 'rgba(52, 168, 83, 0.08)');
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (targetType === 'github') {
        // High-contrast Silver & Violet GitHub aura
        spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        spotGrad.addColorStop(0.4, 'rgba(168, 85, 247, 0.18)');
        spotGrad.addColorStop(0.8, 'rgba(99, 102, 241, 0.08)');
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        // Ambient projector lamp
        spotGrad.addColorStop(0, 'rgba(167, 139, 250, 0.18)');
        spotGrad.addColorStop(0.5, 'rgba(124, 58, 237, 0.09)');
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.arc(smoothX, smoothY, spotlightRadius, 0, Math.PI * 2);
      ctx.fill();

      // ── 4. Optical Bokeh Orbs (Lens Aperture Blur) ──
      orbs.forEach((orb) => {
        if (!prefersReducedMotion) {
          orb.x += orb.vx;
          orb.y += orb.vy;

          // Parallax shift toward cursor
          const dx = (smoothX - width / 2) * (orb.depth * 0.015);
          const dy = (smoothY - height / 2) * (orb.depth * 0.015);

          // Wrap around viewport edges seamlessly
          if (orb.y + orb.radius < -50) {
            orb.y = height + orb.radius + Math.random() * 30;
            orb.x = Math.random() * width;
          }
          if (orb.x - orb.radius > width + 50) orb.x = -orb.radius;
          if (orb.x + orb.radius < -50) orb.x = width + orb.radius;

          orb.phase += orb.pulseSpeed;
          const pulse = Math.sin(orb.phase) * 0.2 + 0.8;
          orb.radius = orb.baseRadius * pulse;
          orb.alpha = orb.baseAlpha * (0.8 + Math.sin(orb.phase * 0.7) * 0.2);

          const renderX = orb.x + dx;
          const renderY = orb.y + dy;

          const bokehGrad = ctx.createRadialGradient(
            renderX,
            renderY,
            0,
            renderX,
            renderY,
            orb.radius
          );
          bokehGrad.addColorStop(0, `${orb.color}${orb.alpha})`);
          bokehGrad.addColorStop(0.5, `${orb.color}${orb.alpha * 0.45})`);
          bokehGrad.addColorStop(1, `${orb.color}0)`);

          ctx.fillStyle = bokehGrad;
          ctx.beginPath();
          ctx.arc(renderX, renderY, orb.radius, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Static soft glow for reduced motion
          const bokehGrad = ctx.createRadialGradient(
            orb.x,
            orb.y,
            0,
            orb.x,
            orb.y,
            orb.baseRadius
          );
          bokehGrad.addColorStop(0, `${orb.color}${orb.baseAlpha * 0.7})`);
          bokehGrad.addColorStop(1, `${orb.color}0)`);
          ctx.fillStyle = bokehGrad;
          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.baseRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // ── 5. Cinematic Projector Dust Motes ──
      if (!prefersReducedMotion) {
        ctx.fillStyle = 'rgba(245, 243, 255, 0.75)';
        motes.forEach((mote) => {
          mote.y += mote.vy;
          mote.x += mote.vx;

          if (mote.y < 0) {
            mote.y = height + 5;
            mote.x = Math.random() * width;
          }
          if (mote.x < 0) mote.x = width;
          if (mote.x > width) mote.x = 0;

          mote.flickerPhase += mote.flickerSpeed;
          const flicker = Math.sin(mote.flickerPhase) * 0.3 + 0.7;
          const currentAlpha = mote.alpha * flicker;

          ctx.fillStyle = `rgba(226, 232, 240, ${currentAlpha})`;
          ctx.beginPath();
          ctx.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      ctx.restore();

      // ── 6. Subtle Cinematic Vignette ──
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.35,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(0.7, 'rgba(5, 5, 8, 0.45)');
      vignette.addColorStop(1, 'rgba(3, 3, 5, 0.85)');

      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      if (!prefersReducedMotion && !document.hidden) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    renderStaticFrameRef.current = () => {
      if (prefersReducedMotion) render();
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (prefersReducedMotion) render();
    };

    const stopAnimation = () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    const onMotionPreferenceChange = () => {
      prefersReducedMotion = motionQuery.matches;
      stopAnimation();
      if (prefersReducedMotion) {
        render();
      } else if (!document.hidden) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    // Pause animation when tab is inactive to conserve battery and CPU
    const onVisibilityChange = () => {
      stopAnimation();
      if (!document.hidden && !prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    motionQuery.addEventListener('change', onMotionPreferenceChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (!prefersReducedMotion) render();

    return () => {
      renderStaticFrameRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('resize', resize);
      motionQuery.removeEventListener('change', onMotionPreferenceChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      stopAnimation();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="cinematic-canvas"
      aria-hidden="true"
    />
  );
}
