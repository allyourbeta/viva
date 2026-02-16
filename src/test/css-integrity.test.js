/**
 * Tier 0: CSS Build Integrity Tests
 * 
 * These catch the exact class of bug we hit today:
 * Tailwind syntax mismatch (v3 vs v4) → zero utility classes → unstyled HTML.
 * 
 * Run AFTER `vite build`. These read the dist/ CSS output and verify
 * critical classes and variables actually made it into the stylesheet.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve } from 'path';

// ── Helpers ──

function getBuiltCSS() {
  const distDir = resolve(process.cwd(), 'dist/assets');
  if (!existsSync(distDir)) return null;
  const files = readdirSync(distDir);
  const cssFile = files.find((f) => f.endsWith('.css'));
  if (!cssFile) return null;
  return readFileSync(resolve(distDir, cssFile), 'utf-8');
}

function getAllComponentFiles() {
  const dir = resolve(process.cwd(), 'src/components');
  const files = readdirSync(dir).filter((f) => f.endsWith('.jsx'));
  return files.map((f) => ({
    name: f,
    content: readFileSync(resolve(dir, f), 'utf-8'),
  }));
}

function getIndexCSS() {
  const cssPath = resolve(process.cwd(), 'src/index.css');
  return readFileSync(cssPath, 'utf-8');
}

// ── Test Suites ──

describe('CSS Source Syntax (Tailwind v4 compatibility)', () => {
  let css;
  beforeAll(() => { css = getIndexCSS(); });

  it('uses @import "tailwindcss" (v4 syntax, NOT @tailwind directives)', () => {
    expect(css).toContain('@import "tailwindcss"');
    expect(css).not.toMatch(/@tailwind\s+(base|components|utilities)/);
  });

  it('defines colors in @theme block', () => {
    expect(css).toMatch(/@theme\s*\{/);
    expect(css).toContain('--color-paper');
    expect(css).toContain('--color-ink');
    expect(css).toContain('--color-surface');
  });

  it('defines raw CSS vars in :root for inline style usage', () => {
    expect(css).toMatch(/:root\s*\{/);
    expect(css).toContain('--ink-muted:');
    expect(css).toContain('--rule:');
    expect(css).toContain('--indigo:');
    expect(css).toContain('--paper:');
    expect(css).toContain('--white-glass:');
  });

  it('defines custom component classes', () => {
    expect(css).toContain('.paper-card');
    expect(css).toContain('.label-caps');
    expect(css).toContain('.serif');
    expect(css).toContain('.supervisor-block');
    expect(css).toContain('.student-block');
    expect(css).toContain('.tutor-note');
  });

  it('defines badge and pill classes', () => {
    expect(css).toContain('.badge-gap');
    expect(css).toContain('.badge-probe');
    expect(css).toContain('.badge-level');
    expect(css).toContain('.pill-mastered');
    expect(css).toContain('.pill-probing');
  });

  it('defines animations', () => {
    expect(css).toContain('fadeIn');
    expect(css).toContain('.animate-fade-in');
    expect(css).toContain('.animate-pulse-record');
  });

  it('imports Google Fonts', () => {
    expect(css).toContain('Source+Serif+4');
    expect(css).toContain('DM+Sans');
  });
});

describe('Built CSS Output (run `npm run build` first)', () => {
  let css;
  beforeAll(() => { css = getBuiltCSS(); });

  it('dist/assets contains a CSS file', () => {
    expect(css).not.toBeNull();
  });

  it('CSS is not trivially small (Tailwind actually generated classes)', () => {
    // The broken v3 syntax produced ~6.8KB. Working v4 produces ~21KB.
    // If under 10KB, Tailwind probably isn't scanning classes.
    expect(css.length).toBeGreaterThan(10000);
  });

  // ── Critical layout classes ──

  it('has grid-cols-12 (main layout system)', () => {
    expect(css).toContain('grid-template-columns:repeat(12');
  });

  it('has col-span-5 and col-span-7 (home screen split)', () => {
    expect(css).toMatch(/col-span-5|span 5/);
    expect(css).toMatch(/col-span-7|span 7/);
  });

  it('has col-span-8 and col-span-4 (tutorial screen split)', () => {
    expect(css).toMatch(/col-span-8|span 8/);
    expect(css).toMatch(/col-span-4|span 4/);
  });

  it('has responsive md: breakpoint variants', () => {
    // Tailwind v4 uses @media(min-width:48rem) for md:
    expect(css).toContain('48rem');
  });

  // ── Critical spacing classes ──

  it('has padding utilities (p-4, p-6, px-6, py-4)', () => {
    expect(css).toContain('.p-4');
    expect(css).toContain('.p-6');
    expect(css).toContain('.px-6');
  });

  it('has gap utilities', () => {
    expect(css).toContain('.gap-4');
    expect(css).toContain('.gap-6');
  });

  // ── Custom component classes survived build ──

  it('has .paper-card in output', () => {
    expect(css).toContain('.paper-card');
  });

  it('has .label-caps in output', () => {
    expect(css).toContain('.label-caps');
  });

  it('has .serif in output', () => {
    expect(css).toContain('.serif');
  });

  it('has .supervisor-block and .student-block', () => {
    expect(css).toContain('.supervisor-block');
    expect(css).toContain('.student-block');
  });

  it('has .tutor-note', () => {
    expect(css).toContain('.tutor-note');
  });

  // ── Theme variables in output ──

  it('defines --paper color variable', () => {
    expect(css).toContain('--paper');
    expect(css).toContain('#f7f1e3');
  });

  it('defines --ink-muted variable', () => {
    expect(css).toContain('--ink-muted');
  });

  it('defines font families', () => {
    expect(css).toContain('Source Serif 4');
    expect(css).toContain('DM Sans');
  });
});

describe('CSS Variable Consistency (every var(--x) in JSX exists in CSS)', () => {
  let cssContent;
  let components;

  beforeAll(() => {
    cssContent = getIndexCSS();
    components = getAllComponentFiles();
  });

  it('every inline style var(--x) reference has a matching CSS definition', () => {
    const missingVars = [];

    for (const { name, content } of components) {
      // Find all var(--something) in style={{}} attributes
      const varRefs = content.match(/var\(--[\w-]+\)/g) || [];
      const uniqueVars = [...new Set(varRefs)];

      for (const ref of uniqueVars) {
        const varName = ref.replace('var(', '').replace(')', '');
        // Check if this variable is defined somewhere in CSS (either :root or @theme)
        // The var name without -- prefix should appear as a definition like: --name:
        if (!cssContent.includes(`${varName}:`)) {
          missingVars.push({ file: name, variable: varName });
        }
      }
    }

    if (missingVars.length > 0) {
      const details = missingVars.map((v) => `  ${v.file}: ${v.variable}`).join('\n');
      throw new Error(`Found CSS variables used in JSX that are not defined in index.css:\n${details}`);
    }
  });
});
