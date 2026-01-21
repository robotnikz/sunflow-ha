import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

// This test is intentionally simple: Home Assistant Ingress serves the app under a sub-path.
// If the built HTML uses absolute paths like "/assets/..." or "/favicon.svg", the UI breaks.

describe('ingress build (static paths)', () => {
  it('dist/index.html uses only relative asset URLs', () => {
    const distIndex = path.join(process.cwd(), 'dist', 'index.html');
    expect(fs.existsSync(distIndex)).toBe(true);

    const html = fs.readFileSync(distIndex, 'utf8');

    // Disallow absolute href/src that start at the root.
    // Allow protocol URLs (http/https) and anchors (#).
    const hasAbsoluteHref = /href\s*=\s*"\/(?!\/)/.test(html);
    const hasAbsoluteSrc = /src\s*=\s*"\/(?!\/)/.test(html);

    expect(hasAbsoluteHref).toBe(false);
    expect(hasAbsoluteSrc).toBe(false);
  });
});
