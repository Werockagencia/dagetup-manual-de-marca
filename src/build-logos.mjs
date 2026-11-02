// Genera los logos maestros de Da Get Up a partir de los vectores del EPK.ai (página 7).
// Fuente: src/epk-logo-raw.svg (búho + "Da Get Up" en tipografía de puntos, convertido con pdftocairo).
// Uso: node src/build-logos.mjs   →  descargas/vector/*.svg
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const raw = readFileSync(join(root, 'src/epk-logo-raw.svg'), 'utf8');

const glyph = {};
for (const m of raw.matchAll(/<g id="(glyph-0-\d+)">([\s\S]*?)<\/g>/g)) {
  glyph[m[1]] = [...m[2].matchAll(/ d="([^"]+)"/g)].map((x) => x[1]).join(' ');
}
const owl = raw.match(/<path id="owl" d="([^"]+)"/)[1];
const word = [...raw.matchAll(/<use xlink:href="#(glyph-0-\d+)" x="([^"]+)" y="([^"]+)"\/>/g)]
  .filter((m) => glyph[m[1]])
  .map((m) => `<path transform="translate(${(+m[2]).toFixed(3)} ${(+m[3]).toFixed(3)})" d="${glyph[m[1]]}"/>`)
  .join('');

// Cajas medidas con Chrome (getBBox) sobre el archivo original.
const BOX = {
  owl: [358.2227, 338.5391, 408.5547, 147.0313],
  word: [300.3833, 522.1846, 514.4527, 57.375],
  all: [300.3833, 338.5391, 514.4527, 241.0205],
};
const PAD = { owl: 0.06, word: 0.04, all: 0.06 };
const COLORS = { hueso: '#EDE6DA', negro: '#0B0B0C', acido: '#D4FF00', blanco: '#FFFFFF' };

function svg(kind, color, bg) {
  const [x, y, w, h] = BOX[kind];
  const p = Math.round(Math.max(w, h) * PAD[kind] * 1000) / 1000;
  const vb = [x - p, y - p, w + 2 * p, h + 2 * p].map((n) => +n.toFixed(3));
  const body = kind === 'owl' ? `<path d="${owl}"/>` : kind === 'word' ? word : `<path d="${owl}"/>${word}`;
  const rect = bg ? `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="${bg}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" width="${(vb[2] * 4).toFixed(0)}" height="${(vb[3] * 4).toFixed(0)}">${rect}<g fill="${color}">${body}</g></svg>\n`;
}

const out = join(root, 'descargas/vector');
mkdirSync(out, { recursive: true });
const NAMES = { all: 'DaGetUp_Logo', owl: 'DaGetUp_Buho', word: 'DaGetUp_Letras' };
const files = [];
for (const kind of Object.keys(NAMES)) {
  for (const [cn, c] of Object.entries(COLORS)) {
    const f = `${NAMES[kind]}_${cn}.svg`;
    writeFileSync(join(out, f), svg(kind, c));
    files.push(f);
  }
}
// Versiones con fondo (para redes y avatares)
writeFileSync(join(out, 'DaGetUp_Logo_hueso-sobre-negro.svg'), svg('all', COLORS.hueso, COLORS.negro));
writeFileSync(join(out, 'DaGetUp_Logo_negro-sobre-acido.svg'), svg('all', COLORS.negro, COLORS.acido));
writeFileSync(join(out, 'DaGetUp_Buho_avatar.svg'), svg('owl', COLORS.hueso, COLORS.negro));
files.push('DaGetUp_Logo_hueso-sobre-negro.svg', 'DaGetUp_Logo_negro-sobre-acido.svg', 'DaGetUp_Buho_avatar.svg');

// Módulo para el manual web
const js = `window.DGU_LOGO=${JSON.stringify({ owl, word, box: BOX })};\n`;
mkdirSync(join(root, 'assets'), { recursive: true });
writeFileSync(join(root, 'assets/logo.js'), js);
console.log(files.length + ' svg →', out);
