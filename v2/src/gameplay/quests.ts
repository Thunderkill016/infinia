// V2 foundation: port logic quest "Giếng bẩn" (Q5 slice) từ V1 sang TypeScript.
// Giữ nguyên rule: none → active → done, chỉ đếm kill quanh ao, không fail-state.
export const Q5_NEED = 3;
export const Q5_AO_R = 25;
export const Q5_REWARD_XP = 40;
export const Q5_REWARD_INF = 60;

export type QuestState = 'none' | 'active' | 'done';

export interface SliceQuest {
  state: QuestState;
  kills: number;
}

export function q5New(): SliceQuest {
  return { state: 'none', kills: 0 };
}

export function q5Accept(q: SliceQuest): SliceQuest {
  if (q.state !== 'none') return q;
  return { state: 'active', kills: 0 };
}

export function q5Kill(q: SliceQuest, nearPond: boolean): SliceQuest {
  if (q.state !== 'active' || !nearPond) return q;
  return { ...q, kills: q.kills + 1 };
}

export function q5CanTurnIn(q: SliceQuest): boolean {
  return q.state === 'active' && q.kills >= Q5_NEED;
}

export function q5TurnIn(q: SliceQuest): SliceQuest {
  if (!q5CanTurnIn(q)) return q;
  return { ...q, state: 'done' };
}

export function q5TrackerText(q: SliceQuest): string {
  if (q.state === 'none') return '';
  if (q.state === 'done') return '💧 Giếng sạch: ✓ hoàn thành!';
  return `💧 Giếng bẩn: dọn quái quanh ao ${Math.min(q.kills, Q5_NEED)}/${Q5_NEED}`;
}
