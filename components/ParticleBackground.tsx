import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  color: string;
  alpha: number;
  friction: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  power: number;
}

interface ParticleBackgroundProps {
  magneticTarget: { x: number; y: number } | null;
}

export default function ParticleBackground({ magneticTarget }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false }); // optimization
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const isMobile = width < 768;
    const particleCount = isMobile ? 45 : 120;
    const particles: Particle[] = [];
    let shockwaves: Shockwave[] = [];

    const colors = [
      '#7c3aed', // Primary Violet
      '#db2777', // Accent Pink
      '#3b82f6', // Bright Blue
      '#a78bfa', // Light Purple
      '#ffffff', // White
    ];

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const isPortrait = Math.random() > 0.5;
      const zScale = Math.random() * 0.8 + 0.2; // 0.2 (distant) to 1.0 (foreground)
      
      const baseMin = isMobile ? 4 : 10;
      const baseMax = isMobile ? 12 : 25;
      
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: zScale,
        baseX: Math.random() * width,
        baseY: Math.random() * height,
        vx: 0,
        vy: 0,
        width: (isPortrait ? Math.random() * baseMin + baseMin : Math.random() * baseMax + baseMin) * zScale,
        height: (isPortrait ? Math.random() * baseMax + baseMin : Math.random() * baseMin + baseMin) * zScale,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: (Math.random() * 0.15 + (isMobile ? 0.05 : 0.05)) * zScale, // distant elements are dimmer
        friction: Math.random() * 0.06 + 0.85, 
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;

    let lastMouseMove = Date.now();
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      lastMouseMove = Date.now();
    };

    let isTouching = false;
    const handleTouchStart = (e: TouchEvent) => {
      isTouching = true;
      if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
        shockwaves.push({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          radius: 0,
          power: 1.0
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      isTouching = false;
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const render = () => {
      // Clear with solid mesh background to allow alpha:false ctx optimization
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);

      const isMobileNow = width < 768;

      // Current Gravity Target
      const targetX = magneticTarget ? magneticTarget.x : mouseX;
      const targetY = magneticTarget ? magneticTarget.y : mouseY;
      
      const baseRadius = isMobileNow ? 150 : 250;
      const gravityRadius = magneticTarget ? (isMobileNow ? 150 : 350) : baseRadius;

      // Ensure particles spread out when idle, but strictly follow the mouse on desktop!
      let gravityStrength = 0.0;
      const isMouseActive = Date.now() - lastMouseMove < 1500; // Mouse moved in last 1.5s

      if (magneticTarget) {
        gravityStrength = 0.35; // Button hover (Strongest)
      } else if (isTouching) {
        gravityStrength = 0.15; // Mobile Swiping (Strong)
      } else if (!isMobileNow && isMouseActive) {
        gravityStrength = 0.10; // Desktop Cursor Active (Moderate)
      }

      // Process shockwaves
      for (let s = shockwaves.length - 1; s >= 0; s--) {
        const wave = shockwaves[s];
        wave.radius += 20; // expand rapidly
        wave.power -= 0.02; // fade out
        
        // Draw the visual ripple expanding
        if (wave.power > 0) {
          ctx.beginPath();
          ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(124, 58, 237, ${wave.power * 0.2})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          shockwaves.splice(s, 1);
        }
      }

      // Process particles
      particles.forEach((p) => {
        // --- 1. SHOCKWAVE PHYSICS ---
        shockwaves.forEach(wave => {
          const dx = p.x - wave.x;
          const dy = p.y - wave.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          // If particle gets hit by the expanding wave
          if (dist > wave.radius - 30 && dist < wave.radius + 30) {
            const pushForce = (wave.power * 15) / Math.max(dist, 10);
            p.vx += dx * pushForce * (1/p.z); // Lighter particles get pushed harder
            p.vy += dy * pushForce * (1/p.z);
            p.alpha = Math.min(1.0, p.alpha + 0.2); // Flash upon impact
          }
        });

        // --- 2. GRAVITY WELL PHYSICS ---
        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < gravityRadius && gravityStrength > 0) {
          const force = (gravityRadius - distance) / gravityRadius;
          const pullX = dx * force * gravityStrength;
          const pullY = dy * force * gravityStrength;

          // Parallax depth: foreground moves faster toward gravity
          p.vx += pullX * p.z;
          p.vy += pullY * p.z;
          
          p.alpha = Math.min(0.5 * p.z, p.alpha + 0.01); 
        } else {
           // Gentle elastic return to original base drifting path
           const driftX = p.baseX + Math.cos(Date.now() * 0.0005 + p.y) * 50;
           const driftY = p.baseY + Math.sin(Date.now() * 0.0005 + p.x) * 50;
           
           const returnDx = driftX - p.x;
           const returnDy = driftY - p.y;
           
           // The return force is extremely gentle so the shockwave feels chaotic for a while
           p.vx += returnDx * 0.0002;
           p.vy += returnDy * 0.0002;
           
           // Restore default alpha relative to z-index
           const targetAlpha = (isMobileNow ? 0.05 : 0.15) * p.z;
           if (p.alpha > targetAlpha) p.alpha -= 0.005;
        }

        p.vx *= p.friction;
        p.vy *= p.friction;

        p.x += p.vx;
        p.y += p.vy;

        // --- 3. RENDERING ---
        ctx.save();
        ctx.globalAlpha = p.alpha;
        
        ctx.fillStyle = p.color;
        ctx.beginPath();
        const r = 4 * p.z; // corner radius scales with depth
        ctx.roundRect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height, r);
        ctx.fill();
        
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [magneticTarget]);

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      aria-hidden="true"
      style={{ background: 'transparent' }}
    />
  );
}
