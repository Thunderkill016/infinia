import { describe, expect, it } from 'vitest';
import { q5Accept, q5CanTurnIn, q5Kill, q5New, q5TrackerText, q5TurnIn } from './quests.js';

describe('quest Giếng bẩn (port V1 Q5)', () => {
  it('none → active → done đúng luật', () => {
    let q = q5New();
    expect(q5CanTurnIn(q)).toBe(false);
    q = q5Accept(q);
    q = q5Kill(q5Kill(q5Kill(q, true), true), true);
    expect(q5CanTurnIn(q)).toBe(true);
    expect(q5TurnIn(q).state).toBe('done');
  });

  it('ngoài ao không đếm, không fail', () => {
    expect(q5Kill(q5Accept(q5New()), false).kills).toBe(0);
  });

  it('tracker text đúng', () => {
    expect(q5TrackerText(q5New())).toBe('');
    expect(q5TrackerText({ state: 'done', kills: 3 })).toContain('hoàn thành');
  });
});
