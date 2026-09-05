import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Agentation } from 'agentation';

const DEFAULT_ENDPOINT = 'http://127.0.0.1:4747';
const MOUNT_ID = 'agentation-root';

/**
 * Mount the Agentation toolbar into a container appended to <body>.
 * Idempotent: a second call is a no-op.
 * @param {{ endpoint?: string }} [options] endpoint is the agentation-mcp HTTP server
 */
export function mount(options = {}) {
  if (document.getElementById(MOUNT_ID)) return;
  const host = document.createElement('div');
  host.id = MOUNT_ID;
  document.body.appendChild(host);
  createRoot(host).render(
    createElement(Agentation, { endpoint: options.endpoint || DEFAULT_ENDPOINT })
  );
}
