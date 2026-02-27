/**
 * Type declarations for the nerdamer symbolic math library.
 * @types/nerdamer is not available on npm, so we declare the types locally.
 *
 * See: https://nerdamer.com/documentation.html
 */
declare module 'nerdamer' {
  interface Expression {
    text(outputType?: string): string;
    evaluate(): Expression;
    toTeX(): string;
    symbol: unknown;
  }

  interface Nerdamer {
    (expression: string, subs?: Record<string, string>, option?: string): Expression;
    setVar(name: string, value: string | number): void;
    getVar(name: string): Expression;
    clearVars(): void;
    solve(expression: string, variable: string): Expression;
    diff(expression: string, variable: string, n?: number): Expression;
    integrate(expression: string, variable: string): Expression;
  }

  const nerdamer: Nerdamer;
  export = nerdamer;
}
