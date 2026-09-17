// Check the files a GitHub Pages visitor actually receives, not only source modules.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { Script } from 'node:vm';

test('static entrypoint has a recoverable startup screen and a standalone game script', () => {
  const root = new URL('../', import.meta.url);
  const html = readFileSync(new URL('index.html', root), 'utf8');
  const css = readFileSync(new URL('styles.css', root), 'utf8');
  const scriptTags = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)];
  assert.equal(scriptTags.length, 1);
  assert.equal(scriptTags[0][1], './app.js');
  assert.match(scriptTags[0][0], /\bdefer\b/);
  assert.doesNotMatch(scriptTags[0][0], /type="module"/);
  assert.match(html, /id="startup-message"/);
  assert.match(html, /<button[^>]*onclick="location.reload\(\)"[^>]*>Reload game<\/button>/);
  assert.match(scriptTags[0][0], /onerror="gameLoadFailed\(\)"/);
  const assets = [
    ...[...html.matchAll(/(?:href|src)="\.\/([^"\s]+)"/g)].map(match => match[1]),
    ...[...css.matchAll(/url\(['"]?\.\/([^)'"\s]+)['"]?\)/g)].map(match => match[1]),
    '.nojekyll',
  ];
  for (const asset of assets) assert.ok(existsSync(new URL(asset, root)), `Missing published asset: ${asset}`);
  // A classic script must compile without import/export or top-level await.
  assert.doesNotThrow(() => new Script(readFileSync(new URL('app.js', root), 'utf8')));
});
