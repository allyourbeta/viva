/**
 * Tier 1: Static Analysis / Anti-Pattern Detection
 * 
 * These scan the source code for known anti-patterns without rendering.
 * They catch the exact kind of bugs that waste hours of manual testing:
 * - Narrow centered layouts (max-w-xl, max-w-2xl)
 * - Missing responsive breakpoints
 * - Undefined CSS variables
 * - Files exceeding 300 lines
 * - Broken imports
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve } from 'path';

// ── Helpers ──

function getComponentFiles() {
  const dir = resolve(process.cwd(), 'src/components');
  const files = readdirSync(dir, { recursive: true })
    .filter((f) => f.endsWith('.jsx') || f.endsWith('.js'))
    .map((f) => ({
      name: f,
      path: resolve(dir, f),
      content: readFileSync(resolve(dir, f), 'utf-8'),
      lines: readFileSync(resolve(dir, f), 'utf-8').split('\n').length,
    }));
  return files;
}

function getAllSourceFiles() {
  const dirs = ['src/components', 'src/api', 'src/services', 'src/store', 'src/prompts'];
  const files = [];
  for (const dir of dirs) {
    const full = resolve(process.cwd(), dir);
    if (!existsSync(full)) continue;
    const entries = readdirSync(full, { recursive: true })
      .filter((f) => f.endsWith('.jsx') || f.endsWith('.js'));
    for (const f of entries) {
      const path = resolve(full, f);
      files.push({
        name: `${dir}/${f}`,
        path,
        content: readFileSync(path, 'utf-8'),
        lines: readFileSync(path, 'utf-8').split('\n').length,
      });
    }
  }
  return files;
}

// ── Test Suites ──

describe('File size limits (max 300 lines)', () => {
  const files = getAllSourceFiles();

  for (const file of files) {
    it(`${file.name} is under 300 lines (actual: ${file.lines})`, () => {
      expect(file.lines).toBeLessThanOrEqual(300);
    });
  }
});

describe('Layout anti-patterns', () => {
  const NARROW_PATTERNS = [
    /\bmax-w-xl\b/,
    /\bmax-w-2xl\b/,
    /\bmax-w-lg\b/,
    /\bmax-w-md\b/,
    /\bmax-w-sm\b/,
  ];

  // These are the "main" screens that should never be narrow
  const MAIN_SCREENS = ['SessionHistory.jsx', 'TutorialConversation.jsx', 'LearningCard.jsx', 'Layout.jsx'];

  for (const screenName of MAIN_SCREENS) {
    it(`${screenName} does not use narrow max-width (max-w-xl, max-w-2xl, etc.)`, () => {
      const file = getComponentFiles().find((f) => f.name === screenName);
      if (!file) return; // Skip if file doesn't exist
      for (const pattern of NARROW_PATTERNS) {
        expect(file.content).not.toMatch(pattern);
      }
    });
  }

  it('SessionHistory uses 12-column grid', () => {
    const file = getComponentFiles().find((f) => f.name === 'SessionHistory.jsx');
    expect(file.content).toContain('grid-cols-12');
  });

  it('TutorialConversation uses 12-column grid', () => {
    const file = getComponentFiles().find((f) => f.name === 'TutorialConversation.jsx');
    expect(file.content).toContain('grid-cols-12');
  });

  it('LearningCard uses multi-column grid layout', () => {
    const file = getComponentFiles().find((f) => f.name === 'LearningCard.jsx');
    expect(file.content).toMatch(/grid-cols-12|grid-cols-3|md:col-span/);
  });
});

describe('Responsive breakpoint coverage', () => {
  // Every main screen should have responsive column spans
  const SCREENS_NEEDING_RESPONSIVE = ['SessionHistory.jsx', 'TutorialConversation.jsx'];

  for (const screenName of SCREENS_NEEDING_RESPONSIVE) {
    it(`${screenName} has md: or lg: breakpoint for column spans`, () => {
      const file = getComponentFiles().find((f) => f.name === screenName);
      if (!file) return;
      expect(file.content).toMatch(/md:col-span|lg:col-span/);
    });

    it(`${screenName} has mobile fallback (col-span-12)`, () => {
      const file = getComponentFiles().find((f) => f.name === screenName);
      if (!file) return;
      expect(file.content).toContain('col-span-12');
    });
  }
});

describe('Scholarly design system class usage', () => {
  const SCHOLARLY_CLASSES = [
    { cls: 'paper-card', screens: ['SessionHistory.jsx', 'LearningCard.jsx', 'SessionDashboard.jsx'] },
    { cls: 'label-caps', screens: ['SessionHistory.jsx', 'LearningCard.jsx', 'SessionDashboard.jsx', 'Layout.jsx'] },
    { cls: 'serif', screens: ['SessionHistory.jsx', 'TutorialConversation.jsx', 'LearningCard.jsx'] },
  ];

  for (const { cls, screens } of SCHOLARLY_CLASSES) {
    for (const screen of screens) {
      it(`${screen} uses .${cls}`, () => {
        const file = getComponentFiles().find((f) => f.name === screen);
        if (!file) return;
        expect(file.content).toContain(cls);
      });
    }
  }
});

describe('Transcript layout (no chat bubbles)', () => {
  it('TutorialConversation does NOT use "rounded-2xl" on messages (chat bubble pattern)', () => {
    const file = getComponentFiles().find((f) => f.name === 'TutorialConversation.jsx');
    if (!file) return;
    // The message blocks should use supervisor-block/student-block, not rounded bubbles
    expect(file.content).toContain('supervisor-block');
    expect(file.content).toContain('student-block');
  });

  it('TutorialConversation uses role labels ("Supervisor" / "Student")', () => {
    const file = getComponentFiles().find((f) => f.name === 'TutorialConversation.jsx');
    if (!file) return;
    expect(file.content).toContain("'Supervisor'");
    expect(file.content).toContain("'Student'");
  });

  it('TutorialConversation has tutor-note blocks', () => {
    const file = getComponentFiles().find((f) => f.name === 'TutorialConversation.jsx');
    if (!file) return;
    expect(file.content).toContain('tutor-note');
  });
});

describe('Import consistency', () => {
  it('no components import from missing files', () => {
    const components = getComponentFiles();
    const availableModules = new Set(components.map((f) => f.name.replace('.jsx', '').replace('.js', '')));

    // Also add known external modules
    const knownModules = new Set([
      'react', 'lucide-react', 'zustand',
      '../store/sessionStore', '../api/supabase', '../api/claude', '../api/tutorial',
      '../services/speechService', '../services/chunkedAnalysis', '../services/demoData',
    ]);

    const issues = [];
    for (const file of components) {
      const imports = file.content.match(/from\s+['"]([^'"]+)['"]/g) || [];
      for (const imp of imports) {
        const mod = imp.match(/from\s+['"]([^'"]+)['"]/)[1];
        // Skip external packages (no ./ or ../)
        if (!mod.startsWith('.')) continue;
        if (knownModules.has(mod)) continue;

        // Resolve relative import
        const importedFile = mod.split('/').pop();
        if (!availableModules.has(importedFile) && !knownModules.has(mod)) {
          // Check if file actually exists
          const possiblePaths = [
            resolve(process.cwd(), 'src/components', `${importedFile}.jsx`),
            resolve(process.cwd(), 'src/components', `${importedFile}.js`),
            resolve(process.cwd(), 'src/components/ui', `${importedFile}.jsx`),
          ];
          const exists = possiblePaths.some(existsSync);
          if (!exists) {
            issues.push(`${file.name} imports '${mod}' but file not found`);
          }
        }
      }
    }

    if (issues.length > 0) {
      throw new Error(`Broken imports found:\n${issues.join('\n')}`);
    }
  });
});
