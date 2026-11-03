import * as THREE from 'three';

let cachedPaperTexture: THREE.CanvasTexture | null = null;
let cachedWatercolorTexture: THREE.CanvasTexture | null = null;

/**
 * Generates a subtle cold-pressed watercolor paper grain texture on the fly
 * so all 3D surfaces feel like tactile matte cardboard and illustrated paper.
 */
export function getPaperGrainTexture(): THREE.CanvasTexture {
  if (cachedPaperTexture) return cachedPaperTexture;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f8f4ec';
  ctx.fillRect(0, 0, size, size);

  // Subtle paper fibers and grain speckles
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const alpha = 0.02 + Math.random() * 0.045;
    const shade = Math.random() > 0.5 ? 255 : 210;
    ctx.fillStyle = `rgba(${shade}, ${shade - 5}, ${shade - 12}, ${alpha})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  // Soft watercolor wash blotches
  for (let i = 0; i < 36; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 16 + Math.random() * 44;
    const grad = ctx.createRadialGradient(x, y, 2, x, y, r);
    grad.addColorStop(0, 'rgba(235, 226, 210, 0.08)');
    grad.addColorStop(1, 'rgba(248, 244, 236, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  cachedPaperTexture = texture;
  return texture;
}

/**
 * Generates a soft radial watercolor cloud / nebula wash texture for Shadow Box layers.
 */
export function getWatercolorWashTexture(
  innerColor = '#fff6d6',
  outerColor = '#8fb8de'
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, size * 0.48);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.55, outerColor);
  grad.addColorStop(1, 'rgba(255,255,255,0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.48, 0, Math.PI * 2);
  ctx.fill();

  if (!cachedWatercolorTexture) {
    cachedWatercolorTexture = new THREE.CanvasTexture(canvas);
  }
  return new THREE.CanvasTexture(canvas);
}

/**
 * Helper properties for matte cardstock / illustrated paper materials.
 * Zero metalness, high roughness, subtle paper bump, soft emissive warmth.
 */
export function createPaperMaterialProps(
  color: string,
  options?: {
    emissive?: string;
    emissiveIntensity?: number;
    bumpScale?: number;
    opacity?: number;
    transparent?: boolean;
  }
) {
  const paperTex = getPaperGrainTexture();
  return {
    color,
    map: paperTex,
    bumpMap: paperTex,
    bumpScale: options?.bumpScale ?? 0.018,
    roughness: 0.94,
    metalness: 0.0,
    emissive: options?.emissive ?? color,
    emissiveIntensity: options?.emissiveIntensity ?? 0.08,
    transparent: options?.transparent ?? false,
    opacity: options?.opacity ?? 1,
  };
}
