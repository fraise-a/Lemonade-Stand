// Optional developer preview only. GitHub Pages serves the game without this file.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
const files = new Set(['index.html','styles.css','app.js','engine.js','economy.js','weather-gate.js','audio.js','rain.svg','language.js','scene.svg','scene-hot.svg','scene-cloudy.svg','scene-storm.svg','lemon.svg']);
const types = { html: 'text/html', css: 'text/css', js: 'text/javascript', svg: 'image/svg+xml' };
http.createServer(async (req,res) => {
  const path = new URL(req.url,'http://localhost').pathname.slice(1) || 'index.html';
  if (!files.has(path)) { res.writeHead(404); res.end('Not found'); return; }
  try { const data = await readFile(new URL(path,import.meta.url)); res.writeHead(200,{'Content-Type':types[path.split('.').pop()],'Cache-Control':'no-store'}); res.end(data); }
  catch { res.writeHead(500); res.end('Unable to read asset'); }
}).listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173'));
