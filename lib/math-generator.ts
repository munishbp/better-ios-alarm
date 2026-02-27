// ─── Math Problem Generator for WAKE App ──────────────────────────────────
// Generates arithmetic and algebra problems algorithmically across 5 difficulty levels.

export interface MathProblem {
  question: string;   // e.g. "247 × 18"
  answer: number;     // e.g. 4446
  display: string;    // e.g. "247 × 18 = ?"
  difficulty: number; // 1-5
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Returns a random integer in [min, max] (inclusive on both ends). */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Picks a random element from an array. */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Problem Generators by Type ────────────────────────────────────────────

function additionTwoDigit(): MathProblem {
  const a = randomInt(10, 99);
  const b = randomInt(10, 99);
  const answer = a + b;
  const question = `${a} + ${b}`;
  return { question, answer, display: `${question} = ?`, difficulty: 1 };
}

function additionThreePlusTwoDigit(): MathProblem {
  const a = randomInt(100, 999);
  const b = randomInt(10, 99);
  const answer = a + b;
  const question = `${a} + ${b}`;
  return { question, answer, display: `${question} = ?`, difficulty: 2 };
}

function multiplicationTwoByOne(): MathProblem {
  const a = randomInt(10, 99);
  const b = randomInt(2, 9);
  const answer = a * b;
  const question = `${a} \u00d7 ${b}`;
  return { question, answer, display: `${question} = ?`, difficulty: 2 };
}

function multiplicationTwoByTwo(): MathProblem {
  const a = randomInt(10, 99);
  const b = randomInt(10, 99);
  const answer = a * b;
  const question = `${a} \u00d7 ${b}`;
  return { question, answer, display: `${question} = ?`, difficulty: 3 };
}

function subtractionThreeMinusTwo(): MathProblem {
  const a = randomInt(100, 999);
  const b = randomInt(10, 99);
  // Ensure result is positive
  const answer = a - b;
  const question = `${a} - ${b}`;
  return { question, answer, display: `${question} = ?`, difficulty: 3 };
}

function multiplicationThreeByTwo(): MathProblem {
  const a = randomInt(100, 999);
  const b = randomInt(10, 99);
  const answer = a * b;
  const question = `${a} \u00d7 ${b}`;
  return { question, answer, display: `${question} = ?`, difficulty: 4 };
}

function algebraSimple(): MathProblem {
  // Form: ax + b = c, solve for x. a in [2,5], answer is integer.
  const a = randomInt(2, 5);
  const x = randomInt(1, 30);
  const b = randomInt(1, 50);
  const c = a * x + b;
  const question = `${a}x + ${b} = ${c}`;
  return {
    question,
    answer: x,
    display: `${question}, x = ?`,
    difficulty: 4,
  };
}

function multiplicationThreeByTwoHard(): MathProblem {
  const a = randomInt(100, 999);
  const b = randomInt(10, 99);
  const answer = a * b;
  const question = `${a} \u00d7 ${b}`;
  return { question, answer, display: `${question} = ?`, difficulty: 5 };
}

function algebraHard(): MathProblem {
  // Form: ax + b = c, solve for x. a > 5, answer is integer.
  const a = randomInt(6, 15);
  const x = randomInt(1, 25);
  const b = randomInt(1, 99);
  const c = a * x + b;
  const question = `${a}x + ${b} = ${c}`;
  return {
    question,
    answer: x,
    display: `${question}, x = ?`,
    difficulty: 5,
  };
}

function divisionClean(): MathProblem {
  // Generate divisor and quotient first, then compute dividend for clean division.
  const divisor = randomInt(12, 99);
  const quotient = randomInt(10, 99);
  const dividend = divisor * quotient;
  const question = `${dividend} \u00f7 ${divisor}`;
  return {
    question,
    answer: quotient,
    display: `${question} = ?`,
    difficulty: 5,
  };
}

// ─── Main Generator ────────────────────────────────────────────────────────

/**
 * Generates a random math problem at the given difficulty level (1-5).
 * Difficulty is clamped to [1, 5].
 */
export function generateMathProblem(difficulty: number): MathProblem {
  const level = Math.max(1, Math.min(5, Math.round(difficulty)));

  switch (level) {
    case 1:
      return additionTwoDigit();

    case 2:
      return pick([additionThreePlusTwoDigit, multiplicationTwoByOne])();

    case 3:
      return pick([multiplicationTwoByTwo, subtractionThreeMinusTwo])();

    case 4:
      return pick([multiplicationThreeByTwo, algebraSimple])();

    case 5:
      return pick([multiplicationThreeByTwoHard, algebraHard, divisionClean])();

    default:
      return additionTwoDigit();
  }
}

/**
 * Checks whether the user's answer matches the problem's correct answer.
 * Uses a small epsilon for floating-point safety.
 */
export function checkAnswer(problem: MathProblem, userAnswer: number): boolean {
  return Math.abs(problem.answer - userAnswer) < 0.01;
}
