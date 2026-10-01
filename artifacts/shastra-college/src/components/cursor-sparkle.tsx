import { useEffect, useRef, useState } from "react";

type CursorSparkleProps = {
  enabled: boolean;
  primaryColor: string;
  accentColor: string;
};

type SparkleParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
  life: number;
  size: number;
  rotation: number;
  spin: number;
  color: string;
  shape: "star" | "diamond";
};

const MAX_PARTICLES = 52;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function drawStar(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
) {
  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.beginPath();
  context.moveTo(0, -size);
  context.quadraticCurveTo(size * 0.13, -size * 0.13, size, 0);
  context.quadraticCurveTo(size * 0.13, size * 0.13, 0, size);
  context.quadraticCurveTo(-size * 0.13, size * 0.13, -size, 0);
  context.quadraticCurveTo(-size * 0.13, -size * 0.13, 0, -size);
  context.closePath();
  context.fill();
  context.restore();
}

export function CursorSparkle({
  enabled,
  primaryColor,
  accentColor,
}: CursorSparkleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(query.matches);
    updatePreference();
    query.addEventListener?.("change", updatePreference);
    return () => query.removeEventListener?.("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!enabled || reducedMotion) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    let frameId = 0;
    let previousX = Number.NaN;
    let previousY = Number.NaN;
    const particles: SparkleParticle[] = [];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const render = (now: number) => {
      frameId = 0;
      context.clearRect(0, 0, width, height);

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        const progress = (now - particle.born) / particle.life;
        if (progress >= 1) {
          particles.splice(index, 1);
          continue;
        }

        const fadeIn = Math.min(progress * 7, 1);
        const fadeOut = Math.min((1 - progress) * 3.5, 1);
        const opacity = Math.min(fadeIn, fadeOut) * 0.72;
        const scale = progress < 0.2 ? 0.55 + progress * 2.25 : 1;

        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.982;
        particle.vy = particle.vy * 0.982 - 0.006;
        particle.rotation += particle.spin;

        context.globalAlpha = opacity;
        context.fillStyle = particle.color;
        context.shadowColor = particle.color;
        context.shadowBlur = particle.shape === "star" ? 9 : 5;
        if (particle.shape === "star") {
          drawStar(
            context,
            particle.x,
            particle.y,
            particle.size * scale,
            particle.rotation,
          );
        } else {
          context.save();
          context.translate(particle.x, particle.y);
          context.rotate(particle.rotation);
          context.fillRect(
            -particle.size * scale * 0.55,
            -particle.size * scale * 0.55,
            particle.size * scale * 1.1,
            particle.size * scale * 1.1,
          );
          context.restore();
        }
        context.shadowBlur = 0;
        if (particle.shape === "star" && particle.size > 3.5 && progress < 0.72) {
          context.globalAlpha = opacity * 0.72;
          context.fillStyle = "#ffffff";
          drawStar(
            context,
            particle.x,
            particle.y,
            particle.size * scale * 0.28,
            particle.rotation * -0.5,
          );
        }
      }

      context.globalAlpha = 1;
      if (particles.length > 0) frameId = window.requestAnimationFrame(render);
    };

    const addParticle = (x: number, y: number) => {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.34,
        vy: -0.12 - Math.random() * 0.38,
        born: performance.now(),
        life: 480 + Math.random() * 260,
        size: 1.7 + Math.random() * 2.4,
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.035,
        color: Math.random() > 0.48 ? accentColor : primaryColor,
        shape: Math.random() > 0.36 ? "star" : "diamond",
      });
      if (!frameId) frameId = window.requestAnimationFrame(render);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;

      const x = event.clientX;
      const y = event.clientY;
      if (Number.isNaN(previousX)) {
        previousX = x;
        previousY = y;
        return;
      }

      const dx = x - previousX;
      const dy = y - previousY;
      const distance = Math.hypot(dx, dy);
      if (distance < 13) return;

      const steps = Math.min(2, Math.floor(distance / 20));
      for (let step = 1; step <= Math.max(steps, 1); step += 1) {
        const amount = step / Math.max(steps, 1);
        addParticle(previousX + dx * amount, previousY + dy * amount);
      }
      previousX = x;
      previousY = y;
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      if (frameId) window.cancelAnimationFrame(frameId);
      particles.length = 0;
      context.clearRect(0, 0, width, height);
    };
  }, [enabled, reducedMotion, primaryColor, accentColor]);

  if (!enabled || reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 900,
        pointerEvents: "none",
      }}
    />
  );
}