export interface Question {
  prompt: string;
  answer: number;
}

/**
 * THE GATE MUST BE OUTSIDE THE SYLLABUS.
 *
 * It used to be six fixed questions: 7 × 6, 8 × 9, 12 × 4, 15 + 27, 9 × 7,
 * 96 ÷ 8. Band C is nine- and ten-year-olds, and this app *teaches* exactly
 * that material — `hydrant-match` drills multiplication, `pizza-fractions` and
 * `divide-share` drill division. A gate made of the week's homework is not a
 * gate. Six fixed prompts are also short enough for a child to memorise.
 *
 * So it is generated instead, from two-digit × two-digit multiplication: well
 * past anything the curriculum reaches, trivial for an adult with a moment or a
 * phone, and different every time. Still friendly, still one question, still no
 * punishment for getting it wrong — this is a speed bump for a child, not a
 * lock against an adult.
 *
 * It lives in its own module so it can be tested without dragging the whole
 * native component tree into the test runner.
 */
/**
 * The highest product any times-table in this app reaches. Both factors start
 * above it so the gate can never land inside the syllabus by chance — the first
 * cut used 11 and 12 as floors, and 11 × 12, 11 × 13 and 12 × 12 all sit at or
 * under this line. Three combinations out of six thousand, which is a 22 %
 * chance of a run producing one. Rare enough to look like a flaky test, and it
 * was reported as one.
 */
export const SYLLABUS_CEILING = 144; // 12 × 12

export function makeQuestion(): Question {
  const a = 13 + Math.floor(Math.random() * 76); // 13–88
  const b = 13 + Math.floor(Math.random() * 76); // 13–88, so the product is ≥ 169
  return { prompt: `What is ${a} × ${b}?`, answer: a * b };
}
