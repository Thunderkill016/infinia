// V2 foundation: cảnh làng tối thiểu chứng minh Storybook Diorama seed.
// Palette từ R2 art bible: ngói #B5432F, vôi #E8D3A0, lá đa #3E7A34.
// Vertical slice (nhà modular, tre, ao, NPC) làm ở vòng sau — ở đây chỉ cần
// đất + 1 nhà ngói + 1 người chơi để loop/input/render chạy thật.
import * as THREE from 'three';

export const PALETTE = {
  tileRoof: 0xb5432f,
  limeWall: 0xe8d3a0,
  leafGreen: 0x3e7a34,
  grassA: 0x74a047,
  grassB: 0x3d7a30,
  wood: 0x6e4a2a,
} as const;

export interface Village {
  group: THREE.Group;
  groundY(x: number, z: number): number;
}

/** Nền đất phẳng + dốc nhẹ ra xa (giữ nguyên cảm giác V1). */
export function buildGround(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(120, 120, 48, 48);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes['position'] as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const low = new THREE.Color(PALETTE.grassB);
  const high = new THREE.Color(PALETTE.grassA);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, groundY(x, z));
    tmp.copy(low).lerp(high, THREE.MathUtils.clamp((groundY(x, z) + 2) / 6, 0, 1));
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }),
  );
  mesh.receiveShadow = true;
  return mesh;
}

export function groundY(x: number, z: number): number {
  return Math.sin(x * 0.06) * Math.cos(z * 0.07) * 1.2;
}

/** 1 nhà ngói seed: tường vôi + mái ngói đỏ 2 dốc + sân gạch (modular kit ở vòng sau). */
export function buildStorybookHouse(): THREE.Group {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(4.6, 2.7, 3.6),
    new THREE.MeshStandardMaterial({ color: PALETTE.limeWall, roughness: 0.95 }),
  );
  wall.position.y = 1.35;
  wall.castShadow = wall.receiveShadow = true;
  const roofMat = new THREE.MeshStandardMaterial({ color: PALETTE.tileRoof, roughness: 0.85 });
  const r1 = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.14, 2.5), roofMat);
  r1.position.set(0, 3.6, -1.0);
  r1.rotation.x = 0.62;
  const r2 = r1.clone();
  r2.position.z = 1.0;
  r2.rotation.x = -0.62;
  r1.castShadow = r2.castShadow = true;
  const yard = new THREE.Mesh(
    new THREE.BoxGeometry(6.4, 0.16, 5.2),
    new THREE.MeshStandardMaterial({ color: 0xa55233, roughness: 1 }),
  );
  yard.position.set(0, 0.08, 1.2);
  yard.receiveShadow = true;
  g.add(wall, r1, r2, yard);
  return g;
}

export function buildVillage(): Village {
  const group = new THREE.Group();
  group.add(buildGround());
  const house = buildStorybookHouse();
  house.position.set(0, groundY(0, -6), -6);
  group.add(house);
  return { group, groundY };
}
