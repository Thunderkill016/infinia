// Test R11-1: đánh tự động mặc định + đồ tự hút (học Vampire Survivors)
// Chạy: node tests/r111-autofight.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/combat.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[R111-TESTABLE-START\]([\s\S]*?)\/\/ \[R111-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [R111-TESTABLE-*] trong js/combat.js'); process.exit(1); }

const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) +
  '\n;globalThis.__r111 = { R111_AUTO_RANGE, R111_MAGNET_RANGE, R111_MAGNET_SPEED,' +
  ' R111_MAGNET_COLLECT, R111_AUTO_STATE, r111Toggle, r111Dist, r111InRange,' +
  ' r111NearestInRange, r111AimAngle, r111HitsIn, r111HitsToKill, r111MagnetStep };',
  sandbox);
const r = sandbox.__r111;

let pass = 0, fail = 0;
function eq(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ${want}`); }
}
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}
function near(name, got, want, eps = 1e-9) {
  if (Math.abs(got - want) <= eps) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ~${want}`); }
}

// 1. hằng số theo spec R11-1
eq('tầm tự đánh = 2.5m', r.R111_AUTO_RANGE, 2.5);
eq('tầm hút đồ = 2.5m', r.R111_MAGNET_RANGE, 2.5);
ok('tốc độ bay về > 0', r.R111_MAGNET_SPEED > 0);
ok('bán kính nhặt < tầm hút', r.R111_MAGNET_COLLECT < r.R111_MAGNET_RANGE);

// 2. toggle mặc định BẬT, đảo được
eq('mặc định BẬT', r.R111_AUTO_STATE.on, true);
eq('toggle → tắt', r.r111Toggle(), false);
eq('toggle → bật lại', r.r111Toggle(), true);
eq('state cuối = bật', r.R111_AUTO_STATE.on, true);

// 3. khoảng cách / trong tầm
near('dist 3-4-5', r.r111Dist(0, 0, 3, 4), 5);
ok('2m trong tầm 2.5m', r.r111InRange(0, 0, 2, 0, r.R111_AUTO_RANGE));
ok('biên 2.5m vẫn trong tầm', r.r111InRange(0, 0, 2.5, 0, r.R111_AUTO_RANGE));
ok('3m ngoài tầm', !r.r111InRange(0, 0, 3, 0, r.R111_AUTO_RANGE));

// 4. chọn mục tiêu gần nhất còn sống trong tầm
const mons = [
  { x: 5, z: 0, alive: true },            // ngoài tầm
  { x: 2, z: 0, alive: true },            // trong tầm
  { x: 1, z: 0, alive: false },           // chết → bỏ qua
  { x: 1.5, z: 0, alive: true },          // trong tầm và GẦN NHẤT → được chọn
];
eq('chọn con gần nhất còn sống (1.5m)', r.r111NearestInRange(mons, 0, 0, r.R111_AUTO_RANGE), mons[3]);
eq('không có con nào trong tầm → null', r.r111NearestInRange(mons, 100, 100, r.R111_AUTO_RANGE), null);
eq('danh sách rỗng → null', r.r111NearestInRange([], 0, 0, r.R111_AUTO_RANGE), null);
const pinned = [{ x: 1, z: 0, alive: true, shotPin: true }];
eq('bỏ qua quái ghim ?shot=', r.r111NearestInRange(pinned, 0, 0, r.R111_AUTO_RANGE), null);

// 5. góc ngắm khớp player.rotation.y (atan2(dx, dz))
near('ngắm (0,1) → 0', r.r111AimAngle(0, 1), 0);
near('ngắm (1,0) → π/2', r.r111AimAngle(1, 0), Math.PI / 2);
near('ngắm (0,-1) → π', r.r111AimAngle(0, -1), Math.PI);

// 6. MÔ PHỎNG: đứng yên giữa 3 quái 10s không bấm gì → hạ ít nhất 1 con
//    (đánh tự động = đòn tay: cooldown 0.5s → 20 đòn/10s; quái Vẩn hp ~40, đòn tay ~8 dmg)
const hits10s = r.r111HitsIn(10, 0.5);
eq('10s đánh được 20 đòn (cd 0.5s)', hits10s, 20);
ok('20 đòn × 8dmg hạ được quái 40hp',
  r.r111HitsToKill(40, 8) <= hits10s);
ok('kể cả quái 100hp cũng hạ được trong 10s với đòn tay mạnh (dmg 12)',
  r.r111HitsToKill(100, 12) <= hits10s);
eq('dmg 0 → không bao giờ hạ', r.r111HitsToKill(40, 0), Infinity);

// 7. MÔ PHỎNG HÚT ĐỒ: 5 vật rơi ở 2m tự bay về hết
{
  const px = 0, py = 0, pz = 0, dt = 1 / 60;
  const items = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    items.push({ x: Math.cos(a) * 2, y: 0.5, z: Math.sin(a) * 2 }); // 5 vật cách đều 2m
  }
  ok('cả 5 vật đều trong tầm hút 2.5m',
    items.every(it => r.r111InRange(px, pz, it.x, it.z, r.R111_MAGNET_RANGE)));
  let collected = 0, steps = 0;
  const alive = items.slice();
  while (alive.length && steps < 600) { // tối đa 10s mô phỏng
    steps++;
    for (let i = alive.length - 1; i >= 0; i--) {
      if (r.r111MagnetStep(alive[i], px, py, pz, dt)) { alive.splice(i, 1); collected++; }
    }
  }
  eq('5/5 vật bay về hết', collected, 5);
  ok(`bay về nhanh (< 120 bước = 2s), thực tế ${steps} bước`, steps < 120);
  // vật ngoài tầm thì không bị hút (r111MagnetStep chỉ gọi khi trong tầm — kiểm tra điều kiện gọi)
  ok('vật ở 5m ngoài tầm hút', !r.r111InRange(px, pz, 5, 0, r.R111_MAGNET_RANGE));
  // vật đã ở trong tay → true ngay
  ok('vật đã ở tay → nhặt ngay', r.r111MagnetStep({ x: 0.1, y: 1, z: 0.1 }, px, py, pz, dt));
}

console.log(`R111: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
