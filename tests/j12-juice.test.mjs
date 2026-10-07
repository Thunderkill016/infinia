// Test logic J12: juice combat rẻ — squash khi trúng đòn + telegraph báo cắn (v12)
// Chạy: node tests/j12-juice.test.mjs  (exit 0 = pass)
import { readFileSync } from 'fs';
import { runInNewContext } from 'vm';

const src = readFileSync(new URL('../js/combat.js', import.meta.url), 'utf-8');

// 1) Đoạn testable J12 (hằng + helper thuần, không dùng THREE/browser)
const m = src.match(/\/\/ \[J12-TESTABLE-START\]([\s\S]*?)\/\/ \[J12-TESTABLE-END\]/);
if (!m) { console.error('FAIL: không tìm thấy đoạn [J12-TESTABLE-*] trong js/combat.js'); process.exit(1); }
const sandbox = {};
runInNewContext(
  m[1].slice(m[1].indexOf('\n') + 1) +
  '\n;globalThis.__j12 = { J12_SQUASH_T, J12_TELE_S, j12SquashK, j12TelegraphOn };',
  sandbox);
const { J12_SQUASH_T, J12_TELE_S, j12SquashK, j12TelegraphOn } = sandbox.__j12;

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; console.error(`FAIL ${name}`); }
}
function near(name, got, want, eps = 1e-9) {
  if (Math.abs(got - want) <= eps) { pass++; }
  else { fail++; console.error(`FAIL ${name}: got ${got}, want ~${want}`); }
}

// --- A. Hằng số đúng spec ---
ok('thời gian nảy squash = 0.18s', J12_SQUASH_T === 0.18);
ok('báo đỏ trước khi cắn = 0.4s', J12_TELE_S === 0.4);

// --- B. j12SquashK: đường cong dẹp → nảy lại ---
ok('hết nảy (t<=0) → 1', j12SquashK(0) === 1 && j12SquashK(-5) === 1);
near('đầu nhịp (t=max) → 1', j12SquashK(J12_SQUASH_T), 1);
near('giữa nhịp → dẹp 35% (0.65)', j12SquashK(J12_SQUASH_T / 2), 0.65);
ok('giữa nhịp là điểm dẹp nhất', j12SquashK(0.09) < j12SquashK(0.15) && j12SquashK(0.09) < j12SquashK(0.03));
ok('luôn trong [0.65, 1]', j12SquashK(0.01) >= 0.65 && j12SquashK(0.01) <= 1);

// --- C. j12TelegraphOn: trong tầm + sắp cắn mới báo ---
ok('trong tầm + atkCd 0.3 → báo', j12TelegraphOn(1.0, 0.3, 1.5, false) === true);
ok('ngoài tầm → không báo', j12TelegraphOn(5.0, 0.1, 1.5, false) === false);
ok('vừa cắn xong (atkCd reset 1.2) → không báo', j12TelegraphOn(1.0, 1.2, 1.5, false) === false);
ok('atkCd = 0 (chưa bao giờ đánh) → không báo', j12TelegraphOn(1.0, 0, 1.5, false) === false);
ok('quái ghim chụp ảnh → không báo', j12TelegraphOn(1.0, 0.2, 1.5, true) === false);
ok('đúng ngưỡng 0.4s → báo', j12TelegraphOn(1.0, 0.4, 1.5, false) === true);

// --- D. combat.js đấu nối đúng ---
ok('trúng đòn gán squashT', /m\.squashT = J12_SQUASH_T;/.test(src));
ok('makeMonster lưu tỉ lệ gốc + trạng thái J12', /squashT: 0, tele: false, sx0: bs\.x, sy0: bs\.y, sz0: bs\.z/.test(src));
ok('updateMonsters decay squashT', /if \(m\.squashT > 0\) m\.squashT -= dt;/.test(src));
ok('telegraph tính theo tầm từng loại (dơi 1.8 / bộ 1.5)',
  /j12TelegraphOn\(dp, m\.atkCd, m\.kind === 'doi' \? 1\.8 : 1\.5/.test(src));
ok('flash trắng trúng đòn vẫn ưu tiên hơn báo đỏ', /if \(m\.flash <= 0\) m\.blobMat\.emissive\.setHex\(m\.tele/.test(src));
ok('dơi/cua trả đúng dáng gốc khi hết nảy (không lệch dần)', /m\.body\.scale\.set\(m\.sx0, m\.sy0, m\.sz0\)/.test(src));

console.log(`J12: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
