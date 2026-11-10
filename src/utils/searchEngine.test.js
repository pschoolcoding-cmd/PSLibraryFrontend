import assert from 'node:assert/strict';
import {
  normalizeApostrophes,
  latinToCyrillic,
  cyrillicToLatin,
  toCanonicalLatin,
  matchesDualScript,
  matchesBookQuery,
  runSearchEngineTests
} from './searchEngine.js';

export function executeTestSuite() {
  // 1. Apostrophe & Modifier Normalization
  const apostropheSamples = ["o'g'ri", 'o‘g‘ri', 'o’g’ri', 'oʻgʻri', 'o`g`ri'];
  const normalizedSamples = apostropheSamples.map(normalizeApostrophes);
  normalizedSamples.forEach((val) => {
    assert.equal(val, "o'g'ri", `Expected ${val} to normalize to "o'g'ri"`);
  });

  // 2. Digraph & Compound Bidirectional Rules
  const digraphPairs = [
    { lat: 'shahar', cyr: 'шаҳар' },
    { lat: 'choyxona', cyr: 'чойхона' },
    { lat: 'yoshlik', cyr: 'ёшлик' },
    { lat: 'yulduz', cyr: 'юлдуз' },
    { lat: 'yangi', cyr: 'янги' },
    { lat: "o'tkan", cyr: 'ўткан' },
    { lat: "g'afur", cyr: 'ғафур' },
    { lat: 'tsirk', cyr: 'цирк' }
  ];

  digraphPairs.forEach(({ lat, cyr }) => {
    assert.equal(latinToCyrillic(lat), cyr, `latinToCyrillic("${lat}") should equal "${cyr}"`);
    assert.equal(cyrillicToLatin(cyr), lat, `cyrillicToLatin("${cyr}") should equal "${lat}"`);
    assert.equal(matchesDualScript(lat, cyr), true, `matchesDualScript("${lat}", "${cyr}") should be true`);
    assert.equal(matchesDualScript(cyr, lat), true, `matchesDualScript("${cyr}", "${lat}") should be true`);
  });

  // 3. Prompt Specific Examples
  assert.equal(matchesDualScript('Oʻtkan kunlar', 'Ўткан кунлар'), true);
  assert.equal(matchesDualScript('Ўткан кунлар', 'Oʻtkan kunlar'), true);
  assert.equal(matchesDualScript('Физика', 'Fizika'), true);
  assert.equal(matchesDualScript('Fizika', 'Физика'), true);
  assert.equal(toCanonicalLatin("o'g'ri"), toCanonicalLatin('oʻgʻri'));
  assert.equal(toCanonicalLatin('oʻgʻri'), toCanonicalLatin('o`g`ri'));

  // 4. Book Record Search Matching
  const sampleBook = {
    name: 'Oʻtkan kunlar',
    author: 'Abdulla Qodiriy',
    bid: '9789943014121-1',
    genre: ['Historical Novel', 'Uzbek Classics']
  };
  assert.equal(matchesBookQuery(sampleBook, 'Ўткан кунлар', 'all'), true);
  assert.equal(matchesBookQuery(sampleBook, 'Абдулла Қодирий', 'author'), true);
  assert.equal(matchesBookQuery(sampleBook, '978-9943-01412-1', 'isbn'), true);

  // 5. Run full built-in suite
  const summary = runSearchEngineTests();
  assert.equal(summary.allPassed, true, 'All built-in search engine test cases must pass');

  return summary;
}

// Run immediately if executed directly in Node
const isMain =
  typeof process !== 'undefined' &&
  process.argv &&
  process.argv[1] &&
  process.argv[1].includes('searchEngine.test');

if (isMain) {
  const summary = executeTestSuite();
  console.log(`✅ All ${summary.passed}/${summary.total} Dual-Script Search Engine tests passed!`);
}

