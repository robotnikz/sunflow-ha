// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

describe('services/api.ts (ingress base path)', () => {
  it('prefixes API calls with /api/hassio_ingress/<token>/ when running under Home Assistant ingress', async () => {
    // Ensure module-level API_BASE is computed from an ingress URL.
    window.history.pushState({}, '', '/api/hassio_ingress/abc123');

    vi.resetModules();

    const fetchMock = vi.fn(async () => ({ ok: true, json: vi.fn(async () => ({})) }) as any);
    vi.stubGlobal('fetch', fetchMock);

    const { saveConfig } = await import('../services/api');

    await saveConfig({} as any);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/hassio_ingress/abc123/api/config');
  });
});
