// V2 foundation: renderer abstraction — production WebGLRenderer, DPR cap theo tier.
// Không viết kỹ thuật khóa chặt vào WebGL: sau này migrate material sang TSL + WebGPU.
import * as THREE from 'three';

export type QualityTier = 'low' | 'med' | 'high';

export const TIER_DPR: Record<QualityTier, number> = { low: 1.0, med: 1.5, high: 2.0 };
export const TIER_SHADOW: Record<QualityTier, number> = { low: 0, med: 1024, high: 2048 };

export class GameRenderer {
  readonly renderer: THREE.WebGLRenderer;
  tier: QualityTier = 'med';

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap; // rẻ hơn PCFSoft, hợp mobile
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.9;
    container.appendChild(this.renderer.domElement);
    window.addEventListener('resize', () => this.resize());
    this.applyTier(this.tier);
  }

  applyTier(tier: QualityTier): void {
    this.tier = tier;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, TIER_DPR[tier]));
    this.renderer.shadowMap.enabled = TIER_SHADOW[tier] > 0;
  }

  shadowSize(): number {
    return TIER_SHADOW[this.tier];
  }

  resize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.renderer.render(scene, camera);
  }
}
