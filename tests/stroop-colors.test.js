import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');

function rule(selector){
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`(^|\\n)${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  return match ? match[2] : '';
}

test('stroop : les encres utilisent des couleurs fixes, pas la palette inversee', () => {
  assert.match(rule('.stroop-word.ink-black'), /color:\s*#0B0B0A/i);
  assert.match(rule('.stroop-word.ink-cream'), /color:\s*#F2ECDE/i);
  assert.doesNotMatch(rule('.stroop-word.ink-black'), /var\(--/);
  assert.doesNotMatch(rule('.stroop-word.ink-cream'), /var\(--/);
});

test('stroop hardcore : NOIR est sombre sur bande claire, CRÈME est claire sans bande', () => {
  const black = rule('html.hardcore .stroop-word.ink-black');
  const cream = rule('html.hardcore .stroop-word.ink-cream');
  assert.match(black, /color:\s*#0B0B0A/i);
  assert.match(black, /background:\s*#F2ECDE/i);
  assert.match(cream, /color:\s*#F2ECDE/i);
  assert.match(cream, /background:\s*transparent/i);
});
