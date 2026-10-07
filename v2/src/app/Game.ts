// V2 foundation: Game điều phối loop/input/render/save (không chứa logic quest/combat).
// Vertical slice sẽ cắm gameplay (NPC, quest, ao, combat) vào step() ở vòng sau.
import * as THREE from 'three';
import { GameLoop } from './GameLoop.js';
import { createStore, loadSave, writeSave, type Store, type V1Save } from '../core/save.js';
import { InputManager } from '../input/InputManager.js';
import { GameRenderer } from '../rendering/Renderer.js';
import { buildVillage, groundY } from '../world/village.js';
import { Hud } from '../ui/hud.js';
import { installWebLifecycle } from '../platform/web.js';

const PLAYER_SPEED = 6.5; // giữ cảm giác di chuyển V1
const WORLD_BOUND = 55;

export class Game {
  private readonly renderer: GameRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly input: InputManager;
  private readonly loop: GameLoop;
  private readonly hud = new Hud();
  private readonly store: Store;
  private save: V1Save;
  private readonly player = new THREE.Group();
  private simX = 0;
  private simZ = 0;
  private prevX = 0;
  private prevZ = 0;
  private uninstallLifecycle: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.renderer = new GameRenderer(container);
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);
    this.scene.background = new THREE.Color(0x87b5e0);
    this.scene.fog = new THREE.Fog(0xd8e8ee, 60, 220);

    const sun = new THREE.DirectionalLight(0xfff3d0, 2.2);
    sun.position.set(40, 50, 20);
    sun.castShadow = true;
    this.scene.add(sun, sun.target);
    this.scene.add(new THREE.HemisphereLight(0xb8d4f0, 0x8a7a5a, 0.9));

    const village = buildVillage();
    this.scene.add(village.group);

    // Người chơi placeholder: capsule áo xanh + nón lá (giữ dấu ấn V1, model thật ở slice sau)
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.34, 0.5, 6, 12),
      new THREE.MeshStandardMaterial({ color: 0x2f6fed, roughness: 0.85 }),
    );
    body.position.y = 1.3;
    body.castShadow = true;
    const hat = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 0.3, 14),
      new THREE.MeshStandardMaterial({ color: 0xd9b95c, roughness: 0.85, side: THREE.DoubleSide }),
    );
    hat.position.y = 2.0;
    this.player.add(body, hat);
    this.scene.add(this.player);

    this.store = createStore();
    this.save = loadSave(this.store);
    this.simX = this.prevX = this.save.x;
    this.simZ = this.prevZ = this.save.z;

    this.input = new InputManager(container);
    this.loop = new GameLoop(
      (dt) => this.step(dt),
      (alpha) => this.render(alpha),
    );
    window.addEventListener('resize', () => this.onResize());
  }

  start(): void {
    this.uninstallLifecycle = installWebLifecycle(() => this.persist());
    this.hud.set('INFINIA V2 foundation — WASD/joystick để đi');
    this.loop.start();
  }

  dispose(): void {
    this.loop.stop();
    this.uninstallLifecycle?.();
  }

  private step(dt: number): void {
    this.input.pollKeys();
    this.prevX = this.simX;
    this.prevZ = this.simZ;
    const speed = PLAYER_SPEED * (this.save.shop.shoes ? 1.15 : 1); // giữ luật V1: Giày cỏ +15%
    this.simX = THREE.MathUtils.clamp(this.simX + this.input.move.x * speed * dt, -WORLD_BOUND, WORLD_BOUND);
    this.simZ = THREE.MathUtils.clamp(this.simZ + this.input.move.z * speed * dt, -WORLD_BOUND, WORLD_BOUND);
    if (this.input.consumeAction()) this.hud.set(`ACTION lúc ${new Date().toLocaleTimeString('vi-VN')}`);
    if (this.input.consumeDodge()) this.hud.set('Né!');
  }

  private render(alpha: number): void {
    // Nội suy vị trí hiển thị giữa 2 step — mượt trên màn 120Hz+ mà logic vẫn 60Hz cố định.
    const rx = this.prevX + (this.simX - this.prevX) * alpha;
    const rz = this.prevZ + (this.simZ - this.prevZ) * alpha;
    this.player.position.set(rx, groundY(rx, rz), rz);
    this.camera.position.set(rx, groundY(rx, rz) + 5.2, rz - 9);
    this.camera.lookAt(rx, groundY(rx, rz) + 1.6, rz);
    this.renderer.render(this.scene, this.camera);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.resize();
  }

  private persist(): void {
    this.save.x = this.simX;
    this.save.z = this.simZ;
    writeSave(this.store, this.save);
  }
}
