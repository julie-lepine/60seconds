import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNextDaily, findMyRank, generalRankText, dailyCaptionText } from '../src/home-info.js';

test('temps avant le prochain défi : minuit UTC', () => {
  assert.equal(formatNextDaily(new Date(Date.UTC(2026, 10, 10, 19, 45, 0))), '4h15');
  assert.equal(formatNextDaily(new Date(Date.UTC(2026, 10, 10, 23, 59, 30))), '0h00');
  assert.equal(formatNextDaily(new Date(Date.UTC(2026, 10, 10, 0, 0, 0))), '24h00');
  assert.equal(formatNextDaily(new Date(Date.UTC(2026, 11, 31, 22, 5, 0))), '1h55');
});

test('rang du joueur retrouvé dans les lignes du classement', () => {
  const rows = [{ rank: 1, username: 'A', total: 300 }, { rank: 12, username: 'Julie', total: 300 }];
  assert.deepEqual(findMyRank(rows, 'Julie'), { rank: 12, total: 300, percent: 4 });
  assert.equal(findMyRank(rows, 'Zoé'), null);
  assert.equal(findMyRank(rows, ''), null);
  assert.equal(findMyRank(null, 'Julie'), null);
});

test('textes de rang : pourcentage si assez de joueurs, sinon la place', () => {
  assert.equal(generalRankText(null), '—');
  assert.equal(generalRankText({ rank: 149, total: 1240, percent: 13 }), 'TOP 13 %');
  assert.equal(generalRankText({ rank: 3, total: 8, percent: null }), '#3');
  assert.equal(dailyCaptionText(null, 'NEXT 4h15'), 'NEXT 4h15');
  assert.equal(dailyCaptionText({ rank: 12, total: 300, percent: 4 }, 'NEXT 4h15'), '#12 · TOP 4 % · NEXT 4h15');
  assert.equal(dailyCaptionText({ rank: 2, total: 5, percent: null }, 'NEXT 1h00'), '#2 · NEXT 1h00');
});
