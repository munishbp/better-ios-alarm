// ─── Code Challenge Problem Bank for WAKE App ─────────────────────────────
// 35 short code-snippet problems with multiple-choice answers.
// Mix of Python and JavaScript covering 8 topic categories.

export interface CodeProblem {
  id: string;
  code: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number; // 0-3
  language: string;     // "python" or "javascript"
}

const PROBLEM_BANK: CodeProblem[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // ARRAY INDEXING & SLICING (5 problems)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'arr-01',
    code: `a = [10, 20, 30, 40, 50]
print(a[2])`,
    question: 'What is the output?',
    options: ['20', '30', '40', 'IndexError'],
    correctIndex: 1,
    language: 'python',
  },
  {
    id: 'arr-02',
    code: `a = [1, 2, 3, 4, 5]
print(a[-2])`,
    question: 'What is the output?',
    options: ['5', '4', '2', '3'],
    correctIndex: 1,
    language: 'python',
  },
  {
    id: 'arr-03',
    code: `a = [1, 2, 3, 4, 5]
print(a[1:4])`,
    question: 'What is the output?',
    options: ['[1, 2, 3, 4]', '[2, 3, 4]', '[2, 3, 4, 5]', '[1, 2, 3]'],
    correctIndex: 1,
    language: 'python',
  },
  {
    id: 'arr-04',
    code: `const a = [10, 20, 30];
console.log(a[3]);`,
    question: 'What is the output?',
    options: ['30', 'null', 'undefined', 'Error'],
    correctIndex: 2,
    language: 'javascript',
  },
  {
    id: 'arr-05',
    code: `a = [1, 2, 3, 4, 5]
print(a[::2])`,
    question: 'What is the output?',
    options: ['[2, 4]', '[1, 3, 5]', '[1, 2]', '[1, 3]'],
    correctIndex: 1,
    language: 'python',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // STRING OPERATIONS (6 problems)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'str-01',
    code: `s = "hello"
print(s[1:3])`,
    question: 'What is the output?',
    options: ['he', 'el', 'ell', 'hel'],
    correctIndex: 1,
    language: 'python',
  },
  {
    id: 'str-02',
    code: `s = "abcdef"
print(s[::-1])`,
    question: 'What is the output?',
    options: ['abcdef', 'fedcba', 'fdbeca', 'Error'],
    correctIndex: 1,
    language: 'python',
  },
  {
    id: 'str-03',
    code: `const s = "hello";
console.log(s.indexOf("l"));`,
    question: 'What is the output?',
    options: ['3', '2', '1', '-1'],
    correctIndex: 1,
    language: 'javascript',
  },
  {
    id: 'str-04',
    code: `s = "hello world"
print(s.split()[0])`,
    question: 'What is the output?',
    options: ['h', 'hello world', 'hello', 'world'],
    correctIndex: 2,
    language: 'python',
  },
  {
    id: 'str-05',
    code: `const s = "abc";
console.log(s.repeat(2));`,
    question: 'What is the output?',
    options: ['abc2', 'abcabc', 'aabbcc', 'abc abc'],
    correctIndex: 1,
    language: 'javascript',
  },
  {
    id: 'str-06',
    code: `s = "Python"
print(len(s))`,
    question: 'What is the output?',
    options: ['5', '6', '7', 'Error'],
    correctIndex: 1,
    language: 'python',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SORT / REVERSE BEHAVIOR (4 problems)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'sort-01',
    code: `a = [3, 1, 4, 1, 5]
b = a.sort()
print(b)`,
    question: 'What is the output?',
    options: ['[1, 1, 3, 4, 5]', 'None', '[3, 1, 4, 1, 5]', '[5, 4, 3, 1, 1]'],
    correctIndex: 1,
    language: 'python',
  },
  {
    id: 'sort-02',
    code: `const a = [3, 1, 4, 1, 5];
const b = a.sort();
console.log(b === a);`,
    question: 'What is the output?',
    options: ['false', 'true', 'undefined', 'Error'],
    correctIndex: 1,
    language: 'javascript',
  },
  {
    id: 'sort-03',
    code: `a = [3, 1, 2]
a.reverse()
print(a)`,
    question: 'What is the output?',
    options: ['[3, 1, 2]', 'None', '[1, 2, 3]', '[2, 1, 3]'],
    correctIndex: 3,
    language: 'python',
  },
  {
    id: 'sort-04',
    code: `const a = [10, 9, 2, 20];
a.sort();
console.log(a[0]);`,
    question: 'What is the output?',
    options: ['2', '9', '10', '20'],
    correctIndex: 2,
    language: 'javascript',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // LOOP OUTPUT (6 problems)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'loop-01',
    code: `x = 0
for i in range(5):
    x += i
print(x)`,
    question: 'What is the output?',
    options: ['15', '10', '5', '0'],
    correctIndex: 1,
    language: 'python',
  },
  {
    id: 'loop-02',
    code: `let s = "";
for (let i = 0; i < 4; i++) {
    s += i;
}
console.log(s);`,
    question: 'What is the output?',
    options: ['0123', '6', '123', '0 1 2 3'],
    correctIndex: 0,
    language: 'javascript',
  },
  {
    id: 'loop-03',
    code: `x = 1
for i in range(3):
    x *= 2
print(x)`,
    question: 'What is the output?',
    options: ['6', '8', '4', '2'],
    correctIndex: 1,
    language: 'python',
  },
  {
    id: 'loop-04',
    code: `let c = 0;
for (let i = 1; i <= 10; i++) {
    if (i % 3 === 0) c++;
}
console.log(c);`,
    question: 'What is the output?',
    options: ['4', '2', '3', '10'],
    correctIndex: 2,
    language: 'javascript',
  },
  {
    id: 'loop-05',
    code: `a = [1, 2, 3]
r = []
for x in a:
    r.append(x * x)
print(r)`,
    question: 'What is the output?',
    options: ['[1, 2, 3]', '[2, 4, 6]', '[1, 4, 9]', '[1, 4, 6]'],
    correctIndex: 2,
    language: 'python',
  },
  {
    id: 'loop-06',
    code: `let n = 64;
let c = 0;
while (n > 1) { n /= 2; c++; }
console.log(c);`,
    question: 'What is the output?',
    options: ['5', '6', '7', '32'],
    correctIndex: 1,
    language: 'javascript',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DICTIONARY / OBJECT ACCESS (4 problems)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'dict-01',
    code: `d = {"a": 1, "b": 2, "c": 3}
print(d["b"])`,
    question: 'What is the output?',
    options: ['1', '2', '3', 'KeyError'],
    correctIndex: 1,
    language: 'python',
  },
  {
    id: 'dict-02',
    code: `const o = {x: 10, y: 20};
console.log(o.z);`,
    question: 'What is the output?',
    options: ['null', '0', 'undefined', 'Error'],
    correctIndex: 2,
    language: 'javascript',
  },
  {
    id: 'dict-03',
    code: `d = {"a": 1, "b": 2}
d["a"] = 5
print(len(d))`,
    question: 'What is the output?',
    options: ['1', '3', '2', 'Error'],
    correctIndex: 2,
    language: 'python',
  },
  {
    id: 'dict-04',
    code: `const o = {a: 1, b: 2, c: 3};
console.log(Object.keys(o).length);`,
    question: 'What is the output?',
    options: ['2', '3', '6', 'undefined'],
    correctIndex: 1,
    language: 'javascript',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // TYPE COERCION / TRUTHY-FALSY (4 problems)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'type-01',
    code: `console.log(1 + "2");`,
    question: 'What is the output?',
    options: ['3', '12', '"12"', 'NaN'],
    correctIndex: 1,
    language: 'javascript',
  },
  {
    id: 'type-02',
    code: `console.log([] == false);`,
    question: 'What is the output?',
    options: ['true', 'false', 'undefined', 'Error'],
    correctIndex: 0,
    language: 'javascript',
  },
  {
    id: 'type-03',
    code: `print(bool(""))
print(bool("0"))`,
    question: 'What is the output?',
    options: ['False\\nFalse', 'True\\nTrue', 'False\\nTrue', 'True\\nFalse'],
    correctIndex: 2,
    language: 'python',
  },
  {
    id: 'type-04',
    code: `console.log(typeof null);`,
    question: 'What is the output?',
    options: ['"null"', '"undefined"', '"object"', '"boolean"'],
    correctIndex: 2,
    language: 'javascript',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // BASIC MATH / MODULO (3 problems)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'math-01',
    code: `print(17 % 5)`,
    question: 'What is the output?',
    options: ['3', '2', '5', '12'],
    correctIndex: 1,
    language: 'python',
  },
  {
    id: 'math-02',
    code: `print(2 ** 10)`,
    question: 'What is the output?',
    options: ['20', '100', '512', '1024'],
    correctIndex: 3,
    language: 'python',
  },
  {
    id: 'math-03',
    code: `console.log(Math.floor(7.9));
console.log(Math.ceil(7.1));`,
    question: 'What is the output?',
    options: ['7\\n7', '8\\n8', '7\\n8', '8\\n7'],
    correctIndex: 2,
    language: 'javascript',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SCOPE / VARIABLE SHADOWING (3 problems)
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'scope-01',
    code: `let x = 10;
function f() { let x = 20; return x; }
console.log(f(), x);`,
    question: 'What is the output?',
    options: ['20 20', '10 10', '20 10', '10 20'],
    correctIndex: 2,
    language: 'javascript',
  },
  {
    id: 'scope-02',
    code: `x = 5
def f():
    x = 10
f()
print(x)`,
    question: 'What is the output?',
    options: ['10', '5', '15', 'Error'],
    correctIndex: 1,
    language: 'python',
  },
  {
    id: 'scope-03',
    code: `let a = 1;
{ let a = 2; }
console.log(a);`,
    question: 'What is the output?',
    options: ['2', '1', 'undefined', 'Error'],
    correctIndex: 1,
    language: 'javascript',
  },
];

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Returns a random code problem from the bank.
 * Optionally pass an array of IDs to exclude (e.g. recently shown problems).
 */
export function getRandomProblem(excludeIds?: string[]): CodeProblem {
  let pool = PROBLEM_BANK;

  if (excludeIds && excludeIds.length > 0) {
    const excluded = new Set(excludeIds);
    const filtered = PROBLEM_BANK.filter((p) => !excluded.has(p.id));
    // Fall back to full bank if everything is excluded
    if (filtered.length > 0) {
      pool = filtered;
    }
  }

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * Checks whether the selected option index is the correct answer.
 */
export function checkCodeAnswer(problem: CodeProblem, selectedIndex: number): boolean {
  return problem.correctIndex === selectedIndex;
}

export { PROBLEM_BANK };
