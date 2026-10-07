// Test logic P2: 2 loại quái mới (Dơi Sương Đêm + Cua Đá Già) — hàm thuần trích từ app.js
// Chạy: node tests/p2-monsters.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../app.js', import.meta.url), 'utf-8');
const m = src.match(/\/\/ \[P2-TESTABLE-START\]([\s\S]*?)\/\/ \[P2-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [P2-TESTABLE-*] trong app.js'); process.exit(1); }

const sandbox = {};
// Marker nằm một mình trên dòng nên không còn sót chữ — eval thẳng đoạn code thuần;
// const/function trong vm không tự gắn vào sandbox → export tường minh qua globalThis
runInNewContext(
  m[1] + '\n;globalThis.__p2 = { isNightAt, timeUntilNight, P2_KINDS, P2_CRAB_ARMOR, ' +
  'P2_CRAB_FRONT_ARC, angDiff, crabFrontFactor, batHittable, P2_NIGHT_START, P2_NIGHT_END, P2_BAT_REACH };',
  sandbox);
const p2 = sandbox.__p2;

let pass = 0, fail = 0;
function eq(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ${want}`); }
}
function near(name, got, want, eps = 1e-9) {
  if (Math.abs(got - want) <= eps) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ~${want}`); }
}

// 1. isNightAt: đêm 0.55–0.95, ngày còn lại
eq('đêm 0.70', p2.isNightAt(0.70), true);
eq('ngày 0.30', p2.isNightAt(0.30), false);
eq('ngày 0.02 (bình minh)', p2.isNightAt(0.02), false);
eq('biên trái 0.55 = đêm', p2.isNightAt(0.55), true);
eq('biên phải 0.95 = ngày', p2.isNightAt(0.95), false);
eq('0.96 ngày', p2.isNightAt(0.96), false);
eq('wrap t âm (-0.3 = 0.7 đêm)', p2.isNightAt(-0.3), true);
eq('t=1 wrap = t=0', p2.isNightAt(1), p2.isNightAt(0));

// 2. timeUntilNight: hẹn respawn dơi đúng tới đầu đêm
near('0.30 → 90s tới đêm', p2.timeUntilNight(0.30, 360), 90);
eq('đang đêm → 0', p2.timeUntilNight(0.70, 360), 0);
near('0.97 → qua nửa đêm tới đêm sau', p2.timeUntilNight(0.97, 360), (1 - 0.97 + 0.55) * 360);
eq('biên 0.55 → 0', p2.timeUntilNight(0.55, 360), 0);

// 3. Số liệu quái: đủ 3 loại, tên tiếng Việt có dấu, cân bằng quanh quái cũ
const K = p2.P2_KINDS;
eq('đủ 3 loại', Object.keys(K).sort().join(','), 'cua,doi,vun');
eq('tên dơi', K.doi.name, 'Dơi Sương Đêm');
eq('tên cua', K.cua.name, 'Cua Đá Già');
eq('tên quái cũ giữ nguyên', K.vun.name, 'Quái Vẩn');
const dau = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
for (const k of ['doi', 'cua', 'vun']) {
  if (dau.test(K[k].name)) pass++;
  else { fail++; console.error(`FAIL tên ${k} thiếu dấu tiếng Việt: ${K[k].name}`); }
}
eq('tên 3 loại khác nhau', new Set([K.doi.name, K.cua.name, K.vun.name]).size, 3);
// cân bằng: dơi máu ít hơn Vẩn, cua máu nhiều hơn Vẩn; dơi nhanh, cua chậm; xp quanh mức cũ
eq('dơi hp < Vẩn hp', K.doi.hp < K.vun.hp, true);
eq('cua hp > Vẩn hp', K.cua.hp > K.vun.hp, true);
eq('dơi nhanh hơn Vẩn', K.doi.speed > K.vun.speed, true);
eq('cua chậm hơn Vẩn', K.cua.speed < K.vun.speed, true);
eq('dơi atk nhỉnh hơn Vẩn (thử thách)', K.doi.atk > K.vun.atk, true);
eq('xp quái mới quanh mức cũ', K.doi.xp >= K.vun.xp && K.cua.xp >= K.vun.xp, true);
eq('số lượng 4+2+2', K.vun.count + K.doi.count + K.cua.count, 8);

// 4. Giáp hướng cua: mặt trước giảm damage, sau lưng full
// quái tại (0,0) đang nhìn hướng +z (facing=0 theo quy ước atan2(dx,dz))
eq('cua mặt trước → 0.4', p2.crabFrontFactor('cua', 0, 5, 0, 0, 0), p2.P2_CRAB_ARMOR);
near('cua sau lưng → 1', p2.crabFrontFactor('cua', 0, -5, 0, 0, 0), 1);
near('cua bên hông 90° → 1 (ngoài cung 75°)', p2.crabFrontFactor('cua', 5, 0, 0, 0, 0), 1);
near('cua chéo 45° → vẫn mặt trước', p2.crabFrontFactor('cua', 3, 3, 0, 0, 0), p2.P2_CRAB_ARMOR);
eq('quái Vẩn không giáp', p2.crabFrontFactor('vun', 0, 5, 0, 0, 0), 1);
eq('dơi không giáp', p2.crabFrontFactor('doi', 0, 5, 0, 0, 0), 1);
// cua quay hướng khác: facing=π (nhìn -z), player ở (0,5) lúc này là SAU lưng
near('cua quay lưng về player → 1', p2.crabFrontFactor('cua', 0, 5, 0, 0, Math.PI), 1);
near('cua quay lưng, player -z → mặt trước', p2.crabFrontFactor('cua', 0, -5, 0, 0, Math.PI), p2.P2_CRAB_ARMOR);

// 5. Tầm với đòn chém vs dơi bay: bay cao quá thì không trúng, lao xuống mới trúng
eq('dơi bay cao (2.3 vs tay 1.0) → chém không tới', p2.batHittable('doi', 2.3, 1.0), false);
eq('dơi lao xuống (0.6) → chém trúng', p2.batHittable('doi', 0.6, 1.0), true);
eq('dơi ở trong tầm 1.0 → trúng', p2.batHittable('doi', 2.0, 1.0), true);
eq('quái bộ luôn trúng (không check cao)', p2.batHittable('vun', 99, 1.0), true);
eq('cua luôn trúng', p2.batHittable('cua', 99, 1.0), true);

// 6. angDiff chuẩn hoá góc
near('angDiff 0/0', p2.angDiff(0, 0), 0);
near('angDiff π/-π → 0', p2.angDiff(Math.PI, -Math.PI), 0);
near('angDiff wrap', p2.angDiff(3.5, -3.5), Math.abs(3.5 + 3.5 - 2 * Math.PI));

console.log(`p2-monsters: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
