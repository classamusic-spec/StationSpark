/**
 * The gate exists to keep a nine-year-old out of the age-band setting and the
 * three-step "Erase everything". It used to ask `8 × 9` — and this app teaches
 * multiplication and division to exactly that child, in `hydrant-match`,
 * `pizza-fractions` and `divide-share`. A gate made of the week's homework is
 * not a gate.
 *
 * These tests pin the property that matters: the question is always outside
 * anything the curriculum reaches, and it is never the same one twice running.
 */
import { SYLLABUS_CEILING, makeQuestion } from '../gateQuestion';

describe('the parent gate stays outside the syllabus', () => {
  it('always asks something past the curriculum ceiling', () => {
    for (let i = 0; i < 500; i += 1) {
      const q = makeQuestion();
      expect(q.answer).toBeGreaterThan(SYLLABUS_CEILING);
    }
  });

  it('always asks a two-digit × two-digit product', () => {
    for (let i = 0; i < 500; i += 1) {
      const q = makeQuestion();
      const m = /What is (\d+) × (\d+)\?/.exec(q.prompt);
      expect(m).not.toBeNull();
      const a = Number(m?.[1]);
      const b = Number(m?.[2]);
      expect(a).toBeGreaterThanOrEqual(13);
      expect(b).toBeGreaterThanOrEqual(13);
      expect(a).toBeLessThan(100);
      expect(b).toBeLessThan(100);
      // and the stated answer is actually correct — a gate that rejects the
      // right answer locks a parent out of their own settings
      expect(q.answer).toBe(a * b);
    }
  });

  it('is not a short memorisable set', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i += 1) seen.add(makeQuestion().prompt);
    // the old gate had exactly six; anything in that neighbourhood is memorisable
    expect(seen.size).toBeGreaterThan(100);
  });
});
