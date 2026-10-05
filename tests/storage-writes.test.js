import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getBestScore,
  getRecordScore,
  getTodayDailyRun,
  saveBestScore,
  saveTodayDailyRun,
  STORAGE_WRITE_STATUS
} from '../src/storage.js';

const originalLocalStorage = globalThis.localStorage;

class FakeLocalStorage {
  constructor(){
    this.values = new Map();
    this.failReads = false;
    this.failWrites = false;
    this.ignoreWrites = false;
    this.writeCount = 0;
  }

  getItem(key){
    if(this.failReads) throw new Error('read failed');
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value){
    if(this.failWrites) throw new Error('write failed');
    this.writeCount += 1;
    if(!this.ignoreWrites) this.values.set(key, String(value));
  }
}

let storage;

test.beforeEach(() => {
  storage = new FakeLocalStorage();
  globalThis.localStorage = storage;
});

test.after(() => {
  if(originalLocalStorage === undefined) delete globalThis.localStorage;
  else globalThis.localStorage = originalLocalStorage;
});

test('best-score writes are verified and lower or equal scores are idempotent', () => {
  assert.equal(saveBestScore('normal', 1200), STORAGE_WRITE_STATUS.saved);
  assert.equal(getBestScore('normal'), 1200);
  assert.equal(storage.writeCount, 1);

  assert.equal(saveBestScore('normal', 1200), STORAGE_WRITE_STATUS.unchanged);
  assert.equal(saveBestScore('normal', 900), STORAGE_WRITE_STATUS.unchanged);
  assert.equal(storage.writeCount, 1);

  assert.equal(saveBestScore('daily', 800), STORAGE_WRITE_STATUS.saved);
  assert.equal(getBestScore('daily'), 800);
});

test('the player record is the higher score between normal and daily', () => {
  saveBestScore('normal', 4840);
  saveBestScore('daily', 6180);
  assert.equal(getRecordScore(), 6180);

  saveBestScore('normal', 7000);
  assert.equal(getRecordScore(), 7000);
  assert.equal(getBestScore('daily'), 6180);
});

test('best-score read, write and verification failures are explicit', () => {
  storage.failReads = true;
  assert.equal(saveBestScore('normal', 1200), STORAGE_WRITE_STATUS.failed);

  storage.failReads = false;
  storage.failWrites = true;
  assert.equal(saveBestScore('normal', 1200), STORAGE_WRITE_STATUS.failed);

  storage.failWrites = false;
  storage.ignoreWrites = true;
  assert.equal(saveBestScore('normal', 1200), STORAGE_WRITE_STATUS.failed);
});

test('Daily writes are verified and an identical durable run is unchanged', () => {
  assert.equal(saveTodayDailyRun(1234.4), STORAGE_WRITE_STATUS.saved);
  assert.deepEqual(getTodayDailyRun(), {
    date: new Date().toISOString().slice(0, 10),
    score: 1234
  });
  assert.equal(storage.writeCount, 1);

  assert.equal(saveTodayDailyRun(1234.4), STORAGE_WRITE_STATUS.unchanged);
  assert.equal(storage.writeCount, 1);
});

test('Daily read, write and verification failures are explicit', () => {
  storage.failReads = true;
  assert.equal(saveTodayDailyRun(500), STORAGE_WRITE_STATUS.failed);

  storage.failReads = false;
  storage.failWrites = true;
  assert.equal(saveTodayDailyRun(500), STORAGE_WRITE_STATUS.failed);

  storage.failWrites = false;
  storage.ignoreWrites = true;
  assert.equal(saveTodayDailyRun(500), STORAGE_WRITE_STATUS.failed);
});
