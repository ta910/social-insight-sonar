/**
 * Postbuild fix for Next.js 16.2.2 + React 19 bug:
 * /_global-error fails to prerender (useContext null) but is still registered
 * as a static route in the manifests, causing Vercel to fail with ENOENT.
 * This script removes /_global-error from all manifests and deletes the
 * orphaned server/app/_global-error/ directory.
 */
import { readFileSync, writeFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';

const nextDir = join(process.cwd(), '.next');

function fixManifest(filename, fn) {
  const filepath = join(nextDir, filename);
  if (!existsSync(filepath)) return;
  const data = JSON.parse(readFileSync(filepath, 'utf8'));
  fn(data);
  writeFileSync(filepath, JSON.stringify(data));
  console.log(`[fix-prerender] patched ${filename}`);
}

// Remove /_global-error from prerender-manifest routes
fixManifest('prerender-manifest.json', (d) => {
  delete d.routes?.['/_global-error'];
});

// Remove /_global-error from routes-manifest staticRoutes
fixManifest('routes-manifest.json', (d) => {
  if (Array.isArray(d.staticRoutes)) {
    d.staticRoutes = d.staticRoutes.filter((r) => r.page !== '/_global-error');
  }
});

// Remove /_global-error/page from app-path-routes-manifest
fixManifest('app-path-routes-manifest.json', (d) => {
  delete d['/_global-error/page'];
});

// Remove /_global-error/page from server/app-paths-manifest
fixManifest('server/app-paths-manifest.json', (d) => {
  delete d['/_global-error/page'];
});

// Delete the orphaned _global-error directory from server/app
const globalErrorDir = join(nextDir, 'server', 'app', '_global-error');
if (existsSync(globalErrorDir)) {
  rmSync(globalErrorDir, { recursive: true, force: true });
  console.log('[fix-prerender] deleted server/app/_global-error/');
}
