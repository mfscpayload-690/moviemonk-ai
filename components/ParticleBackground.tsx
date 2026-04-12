import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
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

interface ParticleBackgroundProps {
  magneticTarget: { x: number; y: number } | null;
}

export default function ParticleBackground({ magneticTarget }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = [];
    const particleCount = 120; // Number of "shards" / "posters"

    const colors = [
      '#7c3aed', // Primary Violet
      '#db2777', // Accent Pink
      '#3b82f6', // Bright Blue
      '#a78bfa', // Light Purple
      '#ffffff', // White
    ];

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      const isPortrait = Math.random() > 0.5; // Simulate poster vs landscape frame
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        baseX: Math.random() * width,
        baseY: Math.random() * height,
        vx: 0,
        vy: 0,
        width: isPortrait ? Math.random() * 15 + 10 : Math.random() * 25 + 15,
        height: isPortrait ? Math.random() * 25 + 15 : Math.random() * 15 + 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.15 + 0.05, // Subtle transparency
        friction: Math.random() * 0.06 + 0.85, // Varies drag slightly per particle
      });
    }

    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Current Gravity Target (Button center or Mouse cursor)
      const targetX = magneticTarget ? magneticTarget.x : mouseX;
      const targetY = magneticTarget ? magneticTarget.y : mouseY;
      
      // Radius of the gravity well
      const gravityRadius = magneticTarget ? 350 : 250; 
      const gravityStrength = magneticTarget ? 0.35 : 0.08;

      particles.forEach((p) => {
        // Distance to target
        const dx = targetX - p.x;
        const dy = targetY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Apply Gravity Force if within radius
        if (distance < gravityRadius) {
          const force = (gravityRadius - distance) / gravityRadius; // 0 to 1
          const pullX = dx * force * gravityStrength;
          const pullY = dy * force * gravityStrength;

          p.vx += pullX;
          p.vy += pullY;
          
          // Slightly boost alpha when excited by gravity well
          p.alpha = Math.min(0.5, p.alpha + 0.01); 
        } else {
          // Slowly return to base position / calm state
          const returnDx = p.baseX - p.x;
          const returnDy = p.baseY - p.y;
          p.vx += returnDx * 0.002;
          p.vy += returnDy * 0.002;
          
          // Return to subtle alpha
          if (p.alpha > 0.15) p.alpha -= 0.005;
        }

        // Apply friction
        p.vx *= p.friction;
        p.vy *= p.friction;

        // Add subtle constant drift map
        const timeOffset = Date.now() * 0.0005;
        p.vx += Math.cos(timeOffset + p.baseX) * 0.05;
        p.vy += Math.sin(timeOffset + p.baseY) * 0.05;

        // Apply velocities
        p.x += p.vx;
        p.y += p.vy;

        // Draw particle (Rounded Rect / Shard)
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        
        // Simple distinct rounded rect rendering
        ctx.beginPath();
        const r = 4; // corner radius
        ctx.roundRect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height, r);
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [magneticTarget]);

  return (
    <canvas
      ref={canvasRef}
      className="particle-canvas"
      aria-hidden="true"
    />
  );
}
