/**
 * A tiny, safe arithmetic expression evaluator for derived ("calculated")
 * custom fields. Mirrors the PHP FormulaEvaluator on the backend so the form
 * can show a live preview.
 *
 * Supports numbers, variables (field keys), the operators + - * / % ^,
 * parentheses, unary minus, and the functions min, max, sum, round, abs,
 * ceil, floor and if. There is no use of eval(); the input is tokenised and
 * parsed.
 */

type Token =
  | { type: 'num'; value: number }
  | { type: 'var'; value: string }
  | { type: string; value: string | number };

function tokenize(expression: string): Token[] {
  const trimmed = expression.trim();
  if (trimmed === '') throw new Error('The formula is empty.');

  const tokens: Token[] = [];
  let i = 0;

  while (i < expression.length) {
    const char = expression[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let num = '';
      while (i < expression.length && /[0-9.]/.test(expression[i])) {
        num += expression[i];
        i++;
      }
      if (!/^-?\d*\.?\d+$/.test(num)) throw new Error(`Invalid number '${num}'.`);
      tokens.push({ type: 'num', value: parseFloat(num) });
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      let name = '';
      while (i < expression.length && /[A-Za-z0-9_]/.test(expression[i])) {
        name += expression[i];
        i++;
      }
      tokens.push({ type: 'var', value: name });
      continue;
    }

    if ('+-*/%^(),'.includes(char)) {
      tokens.push({ type: char, value: char });
      i++;
      continue;
    }

    if ('<>!='.includes(char)) {
      let op = char;
      i++;
      if (i < expression.length && expression[i] === '=' && '<>!'.includes(op)) {
        op += '=';
        i++;
      } else if (op === '=' && i < expression.length && expression[i] === '=') {
        op = '==';
        i++;
      }
      tokens.push({ type: op, value: op });
      continue;
    }

    throw new Error(`Unexpected character '${char}'.`);
  }

  return tokens;
}

function toNumber(value: unknown, name: string): number {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value === null || value === undefined || value === '') return 0;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  throw new Error(`Value '${name}' is not numeric.`);
}

class Parser {
  private pos = 0;
  private readonly tokens: Token[];
  private readonly variables: Record<string, unknown>;

  constructor(tokens: Token[], variables: Record<string, unknown>) {
    this.tokens = tokens;
    this.variables = variables;
  }

  parse(): number {
    const value = this.parseComparison();
    if (this.pos < this.tokens.length) {
      throw new Error(`Unexpected token near position ${this.pos}.`);
    }
    return value;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private peekType(): string | undefined {
    return this.tokens[this.pos]?.type;
  }

  private next(): Token {
    return this.tokens[this.pos++];
  }

  private parseComparison(): number {
    let left = this.parseExpression();

    while (['>', '<', '>=', '<=', '==', '!='].includes(this.peekType() ?? '')) {
      const op = this.next().type;
      const right = this.parseExpression();

      const result =
        op === '>'
          ? left > right
          : op === '<'
            ? left < right
            : op === '>='
              ? left >= right
              : op === '<='
                ? left <= right
                : op === '=='
                  ? left === right
                  : left !== right;

      left = result ? 1 : 0;
    }

    return left;
  }

  private parseExpression(): number {
    let left = this.parseTerm();

    while (this.peekType() === '+' || this.peekType() === '-') {
      const op = this.next().type;
      const right = this.parseTerm();
      left = op === '+' ? left + right : left - right;
    }

    return left;
  }

  private parseTerm(): number {
    let left = this.parsePower();

    while (this.peekType() === '*' || this.peekType() === '/' || this.peekType() === '%') {
      const op = this.next().type;
      const right = this.parsePower();

      if (op === '/') {
        if (right === 0) throw new Error('Division by zero.');
        left = left / right;
      } else if (op === '%') {
        if (right === 0) throw new Error('Modulo by zero.');
        left = left % right;
      } else {
        left = left * right;
      }
    }

    return left;
  }

  private parsePower(): number {
    const base = this.parseUnary();

    if (this.peekType() === '^') {
      this.next();
      return Math.pow(base, this.parsePower());
    }

    return base;
  }

  private parseUnary(): number {
    if (this.peekType() === '-') {
      this.next();
      return -this.parseUnary();
    }
    if (this.peekType() === '+') {
      this.next();
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const token = this.peek();

    if (!token) throw new Error('Unexpected end of formula.');

    if (token.type === 'num') {
      this.next();
      return Number(token.value);
    }

    if (token.type === '(') {
      this.next();
      const value = this.parseComparison();
      if (this.peekType() !== ')') throw new Error('Missing closing parenthesis.');
      this.next();
      return value;
    }

    if (token.type === 'var') {
      this.next();
      const name = String(token.value);

      if (this.peekType() === '(') return this.parseFunction(name);

      if (!(name in this.variables)) throw new Error(`Unknown value '${name}' in formula.`);

      return toNumber(this.variables[name], name);
    }

    throw new Error('Unexpected token in formula.');
  }

  private parseFunction(name: string): number {
    this.next(); // consume '('

    // if() is lazy: only the chosen branch is evaluated, so guard
    // expressions like if(x>0, y/x, 0) are safe against division by zero.
    if (name.toLowerCase() === 'if') {
      const condition = this.parseComparison();

      let value: number;
      if (condition !== 0) {
        value = this.parseComparison();
        this.skipRemainingArgs();
      } else {
        this.skipOneArgument();
        this.next(); // consume ','
        value = this.parseComparison();
        this.skipRemainingArgs();
      }

      if (this.peekType() !== ')') throw new Error(`Missing closing parenthesis for '${name}'.`);
      this.next();

      return value;
    }

    const args: number[] = [];

    if (this.peekType() !== ')') {
      args.push(this.parseComparison());
      while (this.peekType() === ',') {
        this.next();
        args.push(this.parseComparison());
      }
    }

    if (this.peekType() !== ')') {
      throw new Error(`Missing closing parenthesis for '${name}'.`);
    }
    this.next();

    return applyFunction(name, args);
  }

  /** Skip one function argument's tokens (stops before ',' or ')' at depth 0). */
  private skipOneArgument(): void {
    let depth = 0;
    while (this.pos < this.tokens.length) {
      const type = this.peekType();
      if (depth === 0 && (type === ',' || type === ')')) return;
      if (type === '(') depth++;
      else if (type === ')') depth--;
      this.pos++;
    }
  }

  /** Skip any remaining arguments (stops before the closing ')' at depth 0). */
  private skipRemainingArgs(): void {
    let depth = 0;
    while (this.pos < this.tokens.length) {
      const type = this.peekType();
      if (depth === 0 && type === ')') return;
      if (type === '(') depth++;
      else if (type === ')') depth--;
      this.pos++;
    }
  }
}

function applyFunction(name: string, args: number[]): number {
  switch (name.toLowerCase()) {
    case 'min':
      return args.length === 0 ? 0 : Math.min(...args);
    case 'max':
      return args.length === 0 ? 0 : Math.max(...args);
    case 'sum':
      return args.reduce((a, b) => a + b, 0);
    case 'round': {
      const decimals = Math.trunc(args[1] ?? 0);
      const factor = Math.pow(10, decimals);
      return Math.round((args[0] ?? 0) * factor) / factor;
    }
    case 'abs':
      return Math.abs(args[0] ?? 0);
    case 'ceil':
      return Math.ceil(args[0] ?? 0);
    case 'floor':
      return Math.floor(args[0] ?? 0);
    default:
      throw new Error(`Unknown function '${name}'.`);
  }
}

/** Evaluate an expression against a map of variable values. */
export function evaluateFormula(
  expression: string,
  variables: Record<string, unknown> = {},
): number {
  return new Parser(tokenize(expression), variables).parse();
}

/** The variable names referenced by an expression. */
export function referencedVariables(expression: string): string[] {
  const vars = new Set<string>();
  for (const token of tokenize(expression)) {
    if (token.type === 'var') vars.add(String(token.value));
  }
  return [...vars];
}

/**
 * Compute every calculated field, resolving dependencies between them, the
 * same way the backend does on submit. Returns the computed values keyed by
 * field key, or null when a formula cannot be resolved (e.g. cycle).
 */
export function computeCalculatedFields(
  fields: { key: string; formula?: string; precision?: number }[],
  values: Record<string, unknown>,
): Record<string, number> {
  const byKey = new Map(fields.map((f) => [f.key, f]));
  const context: Record<string, unknown> = { ...values };
  const resolved = new Set<string>();
  const visiting = new Set<string>();

  const resolve = (key: string) => {
    if (resolved.has(key)) return;
    if (visiting.has(key)) throw new Error(`Circular reference detected for '${key}'.`);

    const field = byKey.get(key)!;
    const formula = field.formula ?? '';
    if (formula.trim() === '') throw new Error(`The calculated field '${key}' has no formula.`);

    visiting.add(key);
    for (const ref of referencedVariables(formula)) {
      if (byKey.has(ref)) resolve(ref);
    }
    context[key] = evaluateFormula(formula, context);
    resolved.add(key);
    visiting.delete(key);
  };

  for (const field of fields) {
    try {
      resolve(field.key);
    } catch {
      return {};
    }
  }

  const out: Record<string, number> = {};
  for (const field of fields) {
    const value = context[field.key];
    const decimals = field.precision ?? 2;
    const factor = Math.pow(10, decimals);
    out[field.key] = Math.round((typeof value === 'number' ? value : 0) * factor) / factor;
  }
  return out;
}
