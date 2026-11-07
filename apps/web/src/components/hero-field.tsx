import { useEffect, useRef } from "react";

type Point = { x: number; y: number; ox: number; oy: number; r: number; phase: number };

/**
 * Pointer-reactive geometric field for the home hero.
 * Triangular lattice + orbital nodes — brand geometry as a living system map.
 */
export function HeroField({
  accent = "#0d9f8f",
  primary = "#07111f",
  secondary = "#1d4ed8",
  active = false,
}: {
  accent?: string;
  primary?: string;
  secondary?: string;
  active?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const surface = canvas;
    const host = wrap;
    const graphics = ctx;

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let frame = 0;
    let running = true;
    let pointerX = 0.5;
    let pointerY = 0.45;
    let targetX = 0.5;
    let targetY = 0.45;
    let t = 0;

    const nodes: Point[] = [];
    const edges: Array<[number, number]> = [];

    function buildLattice() {
      nodes.length = 0;
      edges.length = 0;
      const cx = 0.5;
      const cy = 0.46;
      const size = 0.34;
      const rows = [[0], [-0.5, 0.5], [-1, 0, 1], [-1.5, -0.5, 0.5, 1.5]];
      const positions: Array<{ x: number; y: number }> = [];
      rows.forEach((row, rowIndex) => {
        const y = cy - size * 0.72 + (rowIndex / (rows.length - 1)) * size * 1.35;
        row.forEach((slot) => {
          positions.push({
            x: cx + slot * size * 0.42,
            y,
          });
        });
      });
      for (let i = 0; i < 8; i += 1) {
        const a = (Math.PI * 2 * i) / 8 - Math.PI / 2;
        positions.push({
          x: cx + Math.cos(a) * 0.42,
          y: cy + Math.sin(a) * 0.36,
        });
      }

      positions.forEach((p, index) => {
        nodes.push({
          x: p.x,
          y: p.y,
          ox: p.x,
          oy: p.y,
          r: index < 10 ? 3.2 + (index % 3) * 0.6 : 2.4,
          phase: index * 0.7,
        });
      });

      const join = (a: number, b: number) => {
        if (a >= 0 && b >= 0 && a < nodes.length && b < nodes.length) edges.push([a, b]);
      };
      join(0, 1);
      join(0, 2);
      join(1, 2);
      join(1, 3);
      join(1, 4);
      join(2, 4);
      join(2, 5);
      join(3, 4);
      join(4, 5);
      join(3, 6);
      join(3, 7);
      join(4, 7);
      join(4, 8);
      join(5, 8);
      join(5, 9);
      join(6, 7);
      join(7, 8);
      join(8, 9);
      for (let i = 0; i < 8; i += 1) {
        const orbit = 10 + i;
        const rim = [6, 7, 8, 9, 5, 2, 0, 3][i] ?? 0;
        join(orbit, rim);
        join(orbit, 10 + ((i + 1) % 8));
      }
    }

    function resize() {
      const rect = host.getBoundingClientRect();
      width = Math.max(280, rect.width);
      height = Math.max(280, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.floor(width * dpr);
      surface.height = Math.floor(height * dpr);
      surface.style.width = `${width}px`;
      surface.style.height = `${height}px`;
      graphics.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildLattice();
    }

    function draw() {
      if (!running) return;
      t += reduced ? 0 : 0.016;
      pointerX += (targetX - pointerX) * 0.08;
      pointerY += (targetY - pointerY) * 0.08;

      graphics.clearRect(0, 0, width, height);

      const grad = graphics.createRadialGradient(
        width * 0.55,
        height * 0.2,
        10,
        width * 0.5,
        height * 0.5,
        width * 0.7,
      );
      grad.addColorStop(0, withAlpha(accent, active ? 0.22 : 0.12));
      grad.addColorStop(0.45, withAlpha(secondary, 0.08));
      grad.addColorStop(1, "transparent");
      graphics.fillStyle = grad;
      graphics.fillRect(0, 0, width, height);

      const pull = reduced ? 0 : 0.045;
      nodes.forEach((node) => {
        const wobbleX = reduced ? 0 : Math.sin(t * 1.1 + node.phase) * 0.004;
        const wobbleY = reduced ? 0 : Math.cos(t * 0.9 + node.phase) * 0.004;
        node.x = node.ox + (pointerX - 0.5) * pull + wobbleX;
        node.y = node.oy + (pointerY - 0.5) * pull + wobbleY;
      });

      graphics.beginPath();
      const apex = nodes[0];
      const leftBase = nodes[6];
      const rightBase = nodes[9];
      if (apex && leftBase && rightBase) {
        graphics.moveTo(apex.x * width, apex.y * height);
        graphics.lineTo(leftBase.x * width, leftBase.y * height);
        graphics.lineTo(rightBase.x * width, rightBase.y * height);
        graphics.closePath();
        graphics.fillStyle = withAlpha(primary, 0.05);
        graphics.fill();
      }

      graphics.lineWidth = 1;
      edges.forEach(([i, j], edgeIndex) => {
        const p = nodes[i];
        const q = nodes[j];
        if (!p || !q) return;
        const pulse = reduced ? 0.35 : 0.28 + Math.sin(t * 1.4 + edgeIndex * 0.35) * 0.12;
        graphics.strokeStyle = withAlpha(
          edgeIndex % 3 === 0 ? accent : primary,
          active ? pulse + 0.12 : pulse,
        );
        graphics.beginPath();
        graphics.moveTo(p.x * width, p.y * height);
        graphics.lineTo(q.x * width, q.y * height);
        graphics.stroke();
      });

      nodes.forEach((node, index) => {
        const x = node.x * width;
        const y = node.y * height;
        const glow = reduced ? 0 : 0.5 + Math.sin(t * 2 + node.phase) * 0.5;
        const radius = node.r + (active && index < 10 ? 0.8 : 0);
        if (!reduced) {
          graphics.beginPath();
          graphics.fillStyle = withAlpha(index < 10 ? accent : secondary, 0.12 + glow * 0.1);
          graphics.arc(x, y, radius * 3.2, 0, Math.PI * 2);
          graphics.fill();
        }
        graphics.beginPath();
        graphics.fillStyle =
          index === 0 ? accent : index < 10 ? withAlpha(primary, 0.9) : withAlpha(secondary, 0.75);
        graphics.arc(x, y, radius, 0, Math.PI * 2);
        graphics.fill();
        if (index === 0) {
          graphics.beginPath();
          graphics.strokeStyle = withAlpha(accent, 0.55);
          graphics.lineWidth = 1.5;
          graphics.arc(x, y, radius + 5 + glow * 2, 0, Math.PI * 2);
          graphics.stroke();
        }
      });

      const left = nodes[1];
      const right = nodes[2];
      if (left && right) {
        graphics.strokeStyle = withAlpha(accent, active ? 0.55 : 0.35);
        graphics.lineWidth = 2;
        graphics.beginPath();
        graphics.moveTo(left.x * width, left.y * height);
        graphics.lineTo(right.x * width, right.y * height);
        graphics.stroke();
      }

      if (!reduced) frame = window.requestAnimationFrame(draw);
    }

    function onPointer(event: PointerEvent) {
      const rect = host.getBoundingClientRect();
      targetX = (event.clientX - rect.left) / Math.max(rect.width, 1);
      targetY = (event.clientY - rect.top) / Math.max(rect.height, 1);
    }

    function onLeave() {
      targetX = 0.5;
      targetY = 0.45;
    }

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    draw();

    host.addEventListener("pointermove", onPointer);
    host.addEventListener("pointerleave", onLeave);

    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("pointermove", onPointer);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [accent, primary, secondary, active]);

  return (
    <div ref={wrapRef} className="hero-field" aria-hidden="true">
      <canvas ref={canvasRef} className="hero-field__canvas" />
    </div>
  );
}

function withAlpha(color: string, alpha: number): string {
  if (color.startsWith("#") && (color.length === 7 || color.length === 4)) {
    const hex =
      color.length === 4
        ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
        : color;
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}
