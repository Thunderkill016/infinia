// js/config.js — hằng số cấu hình INFINIA (không THREE; block M5 testable được, xem bên dưới)
// Được tách từ app.js — coordinator trích, các module import từ đây.

export const SAVE_KEY = 'infinia_save_v1';

export const DAY_LEN = 360; // 6 phút = 1 ngày game

export const QUALITY_LEVELS = {
  low:  { shadow: 512,  dpr: 1,    grass: false, label: 'Thấp' },
  med:  { shadow: 1024, dpr: 1.75, grass: true,  label: 'Vừa' }, // M5: dpr 2→1.75 — vẫn nét, nhẹ fill-rate ~25% (giữ logic M1, chỉ đổi số)
  high: { shadow: 1536, dpr: 2,    grass: true,  label: 'Cao' }, // M5: shadow 2048→1536 — đủ mịn, nhẹ hơn cho mobile
};
export const QUALITY_ORDER = ['low', 'med', 'high'];

// [M5-TESTABLE-START]
// M5: ngân sách hiệu năng mobile — bảng preset nhẹ cho máy yếu (hàm thuần, không THREE/DOM).
// Test trích block này qua regex rồi eval (giống M2/M3/G2): lột `export ` đầu dòng rồi chạy trong vm.
// Số mới (2026-10-07, mục tiêu 30fps Android tầm trung):
//   - high shadow 2048→1536: mắt thường khó phân biệt trên màn đt, nhẹ hơn rõ rệt.
//   - med dpr 2→1.75: vẫn nét trên màn DPR cao, nhẹ fill-rate ~25% so với dpr 2.
//   - med shadow 1024 + low 512 giữ nguyên (đã đủ rẻ).
// Bảng M5_BUDGET PHẢI khớp QUALITY_LEVELS ở trên — test m5-perf khóa cả hai.
// Ý (3) khóa 30fps khi yếu (tick30/half-dt) ĐÃ BỎ vì đụng main.js (ràng buộc M5: không chạm main).
export const M5_BUDGET = {
  low:  { shadow: 512,  dpr: 1,    grass: false },
  med:  { shadow: 1024, dpr: 1.75, grass: true },
  high: { shadow: 1536, dpr: 2,    grass: true },
};
export function presetBudget(level) { // trả {shadow,dpr,grass} theo preset; preset lạ → Vừa cho an toàn (giống lodThresholds)
  const b = M5_BUDGET[level] || M5_BUDGET.med;
  return { shadow: b.shadow, dpr: b.dpr, grass: b.grass }; // trả bản sao để bên gọi không sửa được bảng gốc
}
// [M5-TESTABLE-END]

export const POND = { x: 48, z: 40 }; // ao làng phía đông

export const WORLD = 220; // kích thước mặt đất

export const ROBES = [0xc0392b, 0x2980b9, 0x27ae60, 0x8e44ad, 0xd35400, 0x16a085, 0x7f8c8d];

export const NPCN = 25;

export const HAT_COLORS = [0xe6d49a, 0x2e3a52, 0x9a7440]; // nón lá vàng rơm / khăn đóng xanh đen / mũ rơm nâu
export const HAIR_COLORS = [0x1a1a1a, 0x8a8a8a, 0xd8d8d8, 0x6b4a2f]; // đen / hoa râm / bạc / nâu

export const NAMED = {
  0: { name: 'Bà Lụa', home: [6, 12], lines: [
    'An đấy à? Về rồi đấy à... Làng này chỉ sống khi còn người ở lại, con ạ.',
    'Đi chào hỏi bà con trong làng đi con, ai cũng mong con về.' ] },
  1: { name: 'Cu Tít', home: [-9, 11], lines: [
    'Anh An! Anh về thật rồi à? Trâu Cà Phê của em nhớ anh lắm đó!',
    'Khi nào rảnh anh ra bìa rừng chơi với em nha!' ] },
  2: { name: 'Ông Đồ Nho', home: [11, -4], lines: [
    'Về là tốt rồi. Đất này còn Mạch, làng này còn người — cháu nhớ lời ông dặn.',
    'Sách có câu: "đi một ngày đàng, học một sàng khôn". Cháu đi quanh làng học hỏi đi.' ] },
  3: { name: 'Bà Tám Xén', home: [14, 8], lines: [ // v3: NPC hàng xén — bán đồ, không lang thang
    'Mua nắm xôi, bà kể cho nghe chuyện này... Hàng bà cái gì cũng có, chỉ thiếu tiền thôi!' ] },
  // G3: 5 NPC mới theo COT_TRUYEN_VA_LAU_DAI mục 2.1 — vị trí nhà cố định quanh làng
  4: { name: 'Cụ Chánh Tín', home: [3, 3], lines: [ // trưởng làng, giao quest chính
    'Cháu... về là tốt rồi. Làng mình... còn nhờ vào cháu.',
    'Đất này còn Mạch, làng này còn người. Cháu cứ thong thả làm quen bà con.' ] },
  5: { name: 'Chú Sáu Búa', home: [8, -12], lines: [ // thợ rèn — cộc cằn nhưng ấm áp
    'Ừ. Muốn rèn gì thì để đó.',
    'Tay tôi tật rồi, nhưng lò vẫn đỏ. Quái đến... thì đánh.' ] },
  6: { name: 'Cô Lan Thảo', home: [-8, 6], lines: [ // cô lang — dịu dàng
    'Cháu có đau ở đâu không? Cô xem cho.',
    'Thuốc đắng dã tật — cháu nhớ lời cô dặn đấy.' ] },
  7: { name: 'Chú Tư Lưới', home: [38, 33], lines: [ // ngư dân ở bờ ao phía đông — phóng khoáng
    'Trời đất ơi! Cá bỏ đi hết rồi, chỉ còn Cá Bóng mắt đỏ!',
    'Bến Phúc ngày xưa cá nhiều lắm... cháu muốn nghe chuyện không?' ] },
  8: { name: 'Anh Hai Ruộng', home: [-18, -2], lines: [ // nông dân phía tây làng — chất phác
    'Để tôi. Việc nặng cứ để tôi lo.',
    'Ruộng lúa năm nay lạ lắm... đất có mùi lạ, cháu ngửi thấy không?' ] },
};

export const GENERIC_LINES = [
  'Chào cháu! Làng mình dạo này vui lắm.',
  'Mạch làng đang yếu dần... cháu về là tốt rồi.',
  'Hôm qua Cu Tít lại dắt trâu đi lạc, cả làng phải đi tìm.',
  'Cháu ghé hàng bà Tám Xén chưa? Bánh ít lá gai ngon lắm.',
  'Đình làng sắp có hội, cháu ở lại chơi nhé.',
];

// v3: vật phẩm shop Bà Tám Xén
export const SHOP_ITEMS = [
  { id: 'shoes', name: 'Giày cỏ', desc: '+15% tốc độ chạy', price: 150 },
  { id: 'charm', name: 'Bùa Mạch', desc: '+25% ∞ rơi từ quái', price: 200 },
];

export const PMAX = 90;

export const FFN = 70;
