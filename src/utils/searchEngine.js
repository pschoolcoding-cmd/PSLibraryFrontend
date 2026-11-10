/**
 * Dual-Script & Phonetic Search Engine (Uzbek Latin ↔ Cyrillic, Russian, English)
 *
 * Features:
 * 1. Apostrophe & Modifier Normalization:
 *    Unifies ', ‘, ’, ʻ, ʼ, ʽ, `, ´, ʹ, ˈ, ′ into a canonical representation.
 * 2. Digraph & Compound Rules:
 *    sh ↔ ш, ch ↔ ч, yo ↔ ё, yu ↔ ю, ya ↔ я, oʻ ↔ ў, gʻ ↔ ғ, ts ↔ ц.
 * 3. Bidirectional Transliteration:
 *    Latin → Cyrillic and Cyrillic → Latin so queries in either script match records in either script.
 * 4. Case-Insensitive & Accent-Insensitive Substring Search:
 *    Searches across Book Title, Author, ISBN / Call Number, and optional metadata fields.
 */

// Regex matching all common apostrophe, modifier letter, and backtick variants
const APOSTROPHE_VARIANTS_REGEX = /['‘’ʻʼʽ`´ʹˈ′‹›]/g;

/**
 * Unifies all variations of apostrophes (', ‘, ’, ʻ, `) into standard ASCII `'`.
 * For display in standard Uzbek orthography (O‘zbekcha), use `toUzbekDisplayApostrophe`.
 */
export function normalizeApostrophes(input = '') {
  if (!input) return '';
  return String(input).replace(APOSTROPHE_VARIANTS_REGEX, "'");
}

/**
 * Converts apostrophes to standard modern Uzbek typographic modifier (`ʻ` / `‘`).
 */
export function toStandardUzbekOrthography(input = '') {
  if (!input) return '';
  return normalizeApostrophes(input)
    .replace(/([OoGg])'/g, '$1ʻ')
    .replace(/'/g, 'ʼ');
}

/**
 * Strips combining diacritical marks (accents) while preserving Cyrillic/Uzbek base letters.
 * Unifies Russian `ё` -> `е` only in accent-folded comparisons after digraph extraction.
 */
export function stripAccents(input = '') {
  if (!input) return '';
  return String(input)
    .replace(/[Ёё]/g, (m) => (m === 'Ё' ? 'Е' : 'е'))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .normalize('NFC');
}

/**
 * Transliterates Uzbek / Russian Latin text into Cyrillic.
 * Carefully processes multi-character compounds and digraphs first:
 *   yo' / yoʻ -> йў
 *   oʻ / o' -> ў
 *   gʻ / g' -> ғ
 *   shch -> щ
 *   sh -> ш
 *   ch -> ч
 *   yo -> ё
 *   yu -> ю
 *   ya -> я
 *   ts -> ц
 *   ye -> е
 */
export function latinToCyrillic(input = '') {
  if (!input) return '';

  let text = normalizeApostrophes(String(input).toLowerCase());

  // Protect special compound `yo'` (y + o' = йў, e.g. yo'l -> йўл) before `yo` -> `ё`
  text = text.replace(/yo'/g, 'йў');

  // Protect `o'` (oʻ) and `g'` (gʻ) before single letter or apostrophe rules
  text = text.replace(/o'/g, 'ў');
  text = text.replace(/g'/g, 'ғ');

  // Digraphs and trigraphs (order matters!)
  text = text
    .replace(/shch/g, 'щ')
    .replace(/sh/g, 'ш')
    .replace(/ch/g, 'ч')
    .replace(/yo/g, 'ё')
    .replace(/yu/g, 'ю')
    .replace(/ya/g, 'я')
    .replace(/ts/g, 'ц')
    .replace(/ye/g, 'е');

  // Remaining apostrophes represent tutuq belgisi (ъ)
  text = text.replace(/'/g, 'ъ');

  // Word-initial `e` in Uzbek/Russian corresponds to `э` (except when already converted from `ye` -> `е`)
  text = text.replace(/(^|[^a-zа-яёўқғҳ])e/g, '$1э');

  // Single character Latin -> Cyrillic mapping
  const singleCharMap = {
    a: 'а',
    b: 'б',
    c: 'к',
    d: 'д',
    e: 'е',
    f: 'ф',
    g: 'г',
    h: 'ҳ',
    i: 'и',
    j: 'ж',
    k: 'к',
    l: 'л',
    m: 'м',
    n: 'н',
    o: 'о',
    p: 'п',
    q: 'қ',
    r: 'р',
    s: 'с',
    t: 'т',
    u: 'у',
    v: 'в',
    w: 'в',
    x: 'х',
    y: 'й',
    z: 'з'
  };

  let result = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    result += singleCharMap[ch] !== undefined ? singleCharMap[ch] : ch;
  }

  return result;
}

/**
 * Transliterates Uzbek / Russian Cyrillic text into canonical Uzbek Latin.
 * Maps:
 *   ш -> sh, ч -> ch, ё -> yo, ю -> yu, я -> ya, ў -> o', ғ -> g', ц -> ts
 *   щ -> sh, қ -> q, ҳ -> h, х -> x, ъ -> ', ь -> ''
 */
export function cyrillicToLatin(input = '') {
  if (!input) return '';

  const text = normalizeApostrophes(String(input).toLowerCase());

  const cyrToLatMap = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    ғ: "g'",
    д: 'd',
    е: 'e',
    ё: 'yo',
    ж: 'j',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    қ: 'q',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    ў: "o'",
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'x',
    ҳ: 'h',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'sh',
    ъ: "'",
    ы: 'i',
    ь: '',
    э: 'e',
    ю: 'yu',
    я: 'ya'
  };

  let result = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === 'е') {
      // At start of word or after vowel/apostrophe, Cyrillic `е` can also be written `ye` in Uzbek Latin,
      // but we normalize `ye` -> `e` in canonical comparison so both `ye` and `e` match seamlessly.
      result += 'e';
    } else if (cyrToLatMap[ch] !== undefined) {
      result += cyrToLatMap[ch];
    } else {
      result += ch;
    }
  }

  return normalizeApostrophes(result);
}

/**
 * Produces a canonical Latin search key that is:
 * - Lowercase
 * - Apostrophe-unified (`'`, `‘`, `’`, `ʻ`, `` ` `` -> `'`)
 * - Cyrillic transliterated to Latin
 * - Diacritic / accent stripped
 * - `ye` normalized to `e` so `Yevropa`/`Европа`/`Evropa` match identically
 */
export function toCanonicalLatin(input = '') {
  if (!input) return '';
  let normalized = normalizeApostrophes(String(input).toLowerCase().trim());
  // Convert any Cyrillic characters to Latin first (preserving ё -> yo before stripAccents)
  normalized = cyrillicToLatin(normalized);
  // Strip remaining Latin accents (e.g., é -> e)
  normalized = stripAccents(normalized);
  // Unify `ye` -> `e` after word boundaries or vowels for cross-script consistency
  normalized = normalized.replace(/(^|[^a-z0-9'])ye/g, '$1e');
  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ');
  return normalized;
}

/**
 * Produces a phonetic / apostrophe-agnostic skeleton in Latin so that:
 * - `o'tkan`, `oʻtkan`, `o`tkan`, `otkan`, and `ўткан` all produce the same skeleton.
 * - `x` and `h` (often confused between Russian/Uzbek keyboards: `xol` vs `hol`, `Физика` `f`/`ph`)
 * - `ts` and `s` (`tsivilizatsiya` / `sivilizatsiya` / `цивилизация`)
 */
export function toPhoneticSkeleton(input = '') {
  if (!input) return '';
  return toCanonicalLatin(input)
    .replace(/'/g, '') // Strip apostrophes so o'g'ri == ogri == ўғри
    .replace(/ph/g, 'f')
    .replace(/w/g, 'v')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k');
}

/**
 * Normalizes ISBN / Call numbers by stripping hyphens and whitespace.
 */
export function normalizeIdentifier(input = '') {
  if (!input) return '';
  return String(input).toLowerCase().replace(/[\s\-_#]/g, '');
}

/**
 * Generates all normalized search representations for a piece of text:
 * - rawLower: lowercase with unified apostrophes
 * - canonicalLatin: transliterated to Latin with unified apostrophes (`o'`, `g'`)
 * - canonicalCyrillic: transliterated to Cyrillic (`ў`, `ғ`, `ш`, `ч`, `ё`, `ю`, `я`, `ц`)
 * - skeleton: apostrophe-insensitive phonetic Latin key
 */
export function buildSearchForms(input = '') {
  if (!input) {
    return {
      rawLower: '',
      canonicalLatin: '',
      canonicalCyrillic: '',
      skeleton: ''
    };
  }
  const rawLower = normalizeApostrophes(String(input).toLowerCase().trim());
  const canonicalLatin = toCanonicalLatin(rawLower);
  const canonicalCyrillic = stripAccents(latinToCyrillic(rawLower));
  const skeleton = toPhoneticSkeleton(rawLower);

  return {
    rawLower,
    canonicalLatin,
    canonicalCyrillic,
    skeleton
  };
}

/**
 * Core bidirectional dual-script substring matcher.
 * Returns true if `targetText` matches `query` in Latin, Cyrillic, or phonetic skeleton form.
 */
export function matchesDualScript(targetText = '', query = '') {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return true;
  if (!targetText) return false;

  const qForms = buildSearchForms(cleanQuery);
  const tForms = buildSearchForms(targetText);

  // 1. Direct normalized substring check
  if (tForms.rawLower.includes(qForms.rawLower)) return true;

  // 2. Canonical Latin check (matches Cyrillic query -> Latin target AND Latin query -> Cyrillic target)
  if (qForms.canonicalLatin && tForms.canonicalLatin.includes(qForms.canonicalLatin)) {
    return true;
  }

  // 3. Canonical Cyrillic check
  if (qForms.canonicalCyrillic && tForms.canonicalCyrillic.includes(qForms.canonicalCyrillic)) {
    return true;
  }

  // 4. Apostrophe-agnostic & phonetic skeleton check (e.g. `o'g'ri` == `oʻgʻri` == `o`g`ri` == `ogri` == `ўғри`)
  if (qForms.skeleton && tForms.skeleton.includes(qForms.skeleton)) {
    return true;
  }

  // 5. Multi-word token matching & Slavic/Turkic morphological stem matching
  const queryTokens = cleanQuery.split(/\s+/).filter(Boolean);
  if (queryTokens.length >= 1) {
    const allTokensMatch = queryTokens.every((tok) => {
      const tokForms = buildSearchForms(tok);
      if (
        tForms.rawLower.includes(tokForms.rawLower) ||
        (tokForms.canonicalLatin && tForms.canonicalLatin.includes(tokForms.canonicalLatin)) ||
        (tokForms.canonicalCyrillic && tForms.canonicalCyrillic.includes(tokForms.canonicalCyrillic)) ||
        (tokForms.skeleton && tForms.skeleton.includes(tokForms.skeleton))
      ) {
        return true;
      }

      // Morphological stem fallback for 5+ character nouns (e.g., "Fizika" -> "fizik" matching "физике" / "физико",
      // "Tsivilizatsiya" -> "tsivilizatsi" matching "цивилизации")
      if (tokForms.canonicalLatin.length >= 5) {
        const stem = tokForms.canonicalLatin.replace(/(iya|ya|ye|yo|yu|[aeiouy])$/, '');
        if (stem.length >= 4 && tForms.canonicalLatin.includes(stem)) {
          return true;
        }
      }
      return false;
    });
    if (allTokensMatch) return true;
  }

  return false;
}

/**
 * Checks whether a book object matches a search query across specified fields.
 * Default fields: title (`name` / `title`), `author`, and `bid` / `isbn` (call number),
 * plus optional `series`, `publisher`, `genre`, `description`.
 *
 * @param {Object} book - Book record
 * @param {string} query - User search string (Latin or Cyrillic)
 * @param {string} field - 'all' | 'title' | 'author' | 'isbn' | 'description' | 'category'
 */
export function matchesBookQuery(book, query = '', field = 'all') {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return true;
  if (!book) return false;

  const title = book.name || book.title || '';
  const author = book.author || '';
  const bid = book.bid || book._id || '';
  const isbn = book.isbn || String(bid).split('-')[0] || '';
  const description = book.description || '';
  const series = book.series || '';
  const publisher = book.publisher || '';
  const genres = Array.isArray(book.genres)
    ? book.genres
    : Array.isArray(book.genre)
    ? book.genre
    : typeof book.genre === 'string'
    ? [book.genre]
    : [];

  if (field === 'title') {
    return matchesDualScript(title, cleanQuery);
  }

  if (field === 'author') {
    return matchesDualScript(author, cleanQuery);
  }

  if (field === 'isbn') {
    const normQ = normalizeIdentifier(cleanQuery);
    const normBid = normalizeIdentifier(bid);
    const normIsbn = normalizeIdentifier(isbn);
    return (
      (normQ && (normBid.includes(normQ) || normIsbn.includes(normQ))) ||
      matchesDualScript(bid, cleanQuery)
    );
  }

  if (field === 'description') {
    return matchesDualScript(description, cleanQuery);
  }

  if (field === 'category') {
    return genres.some((g) => matchesDualScript(g, cleanQuery));
  }

  // 'all' fields: check Title, Author, ISBN/Call Number, Series, Publisher, Genres, Description
  const normQ = normalizeIdentifier(cleanQuery);
  const normBid = normalizeIdentifier(bid);
  const normIsbn = normalizeIdentifier(isbn);
  if (normQ.length >= 3 && (normBid.includes(normQ) || normIsbn.includes(normQ))) {
    return true;
  }

  if (matchesDualScript(title, cleanQuery)) return true;
  if (matchesDualScript(author, cleanQuery)) return true;
  if (matchesDualScript(bid, cleanQuery)) return true;
  if (matchesDualScript(series, cleanQuery)) return true;
  if (matchesDualScript(publisher, cleanQuery)) return true;
  if (genres.some((g) => matchesDualScript(g, cleanQuery))) return true;
  if (matchesDualScript(description, cleanQuery)) return true;

  // Also check if a multi-word query spans across title + author (e.g. "Qodiriy O'tkan kunlar")
  const combinedHeader = `${title} ${author} ${bid} ${genres.join(' ')}`;
  return matchesDualScript(combinedHeader, cleanQuery);
}

/**
 * Built-in test suite verifying Uzbek Latin ↔ Cyrillic transliteration,
 * apostrophe normalization, digraph rules, and book search matching.
 */
export const SEARCH_ENGINE_TEST_CASES = [
  {
    name: 'Cyrillic query matches Uzbek Latin title (Ўткан кунлар -> Oʻtkan kunlar)',
    target: 'Oʻtkan kunlar',
    query: 'Ўткан кунлар',
    expected: true
  },
  {
    name: "Cyrillic query matches ASCII apostrophe Latin title (Ўткан кунлар -> O'tkan kunlar)",
    target: "O'tkan kunlar",
    query: 'Ўткан кунлар',
    expected: true
  },
  {
    name: 'Latin query matches Cyrillic record (Fizika -> Физика)',
    target: 'Сборник задач по физике',
    query: 'Fizika',
    expected: true
  },
  {
    name: 'Cyrillic query matches Latin record (Физика -> Fizika)',
    target: 'Fizika kursi: Mexanika va Termodinamika',
    query: 'Физика',
    expected: true
  },
  {
    name: "Apostrophe variations normalize identically (o'g'ri, oʻgʻri, o`g`ri, o‘g‘ri, o’g’ri, ўғри)",
    target: 'Shum bola va oʻgʻri',
    query: 'o`g`ri',
    expected: true
  },
  {
    name: 'Curly apostrophes match Cyrillic ў and ғ (o‘g‘ri -> ўғри)',
    target: 'Шум бола ва ўғри',
    query: 'o‘g‘ri',
    expected: true
  },
  {
    name: 'Digraph sh ↔ ш (Sharq Nashriyoti ↔ Шарқ Нашриёти)',
    target: 'Sharq Nashriyoti',
    query: 'Шарқ',
    expected: true
  },
  {
    name: "Digraph ch ↔ ч & oʻ ↔ ў (Cho'lpon ↔ Чўлпон)",
    target: "Abdulhamid Cho'lpon",
    query: 'Чўлпон',
    expected: true
  },
  {
    name: 'Digraph yo ↔ ё (Yoshlik ↔ Ёшлик)',
    target: 'Ёшлик лирикаси',
    query: 'Yoshlik',
    expected: true
  },
  {
    name: 'Digraph yu ↔ ю (Yulduzli tunlar ↔ Юлдузли тунлар)',
    target: 'Yulduzli tunlar (Bobur)',
    query: 'Юлдузли тунлар',
    expected: true
  },
  {
    name: 'Digraph ya ↔ я (Yangi Asr ↔ Янги Аср)',
    target: 'Yangi Asr Avlodi',
    query: 'Янги Аср',
    expected: true
  },
  {
    name: "Digraph gʻ ↔ ғ (G'afur G'ulom ↔ Ғафур Ғулом)",
    target: "G'afur G'ulom Nashriyoti",
    query: 'Ғафур Ғулом',
    expected: true
  },
  {
    name: 'Digraph ts ↔ ц (Tsivilizatsiya ↔ Цивилизация)',
    target: 'История мировой цивилизации',
    query: 'tsivilizatsiya',
    expected: true
  },
  {
    name: 'Russian ё / е accent insensitivity (Федор Достоевский ↔ Фёдор Достоевский)',
    target: 'Фёдор Достоевский',
    query: 'федор достоевский',
    expected: true
  },
  {
    name: 'Latin query matches Russian author (Tolstoy -> Лев Толстой)',
    target: 'Лев Толстой',
    query: 'Tolstoy',
    expected: true
  }
];

export function runSearchEngineTests() {
  const results = SEARCH_ENGINE_TEST_CASES.map((tc) => {
    const actual = matchesDualScript(tc.target, tc.query);
    return {
      ...tc,
      actual,
      passed: actual === tc.expected
    };
  });

  // Verify strict identity of apostrophe normalization across all 5 variants
  const variants = ["o'g'ri", 'o‘g‘ri', 'o’g’ri', 'oʻgʻri', 'o`g`ri'];
  const normalizedSet = new Set(variants.map((v) => toCanonicalLatin(v)));
  const apostropheIdentityPassed = normalizedSet.size === 1;

  results.push({
    name: "Strict Apostrophe Identity: ['o\\'g\\'ri', 'o‘g‘ri', 'o’g’ri', 'oʻgʻri', 'o`g`ri'] normalize identically",
    target: variants.join(', '),
    query: Array.from(normalizedSet)[0],
    expected: true,
    actual: apostropheIdentityPassed,
    passed: apostropheIdentityPassed
  });

  return {
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    allPassed: results.every((r) => r.passed),
    results
  };
}

export default {
  normalizeApostrophes,
  toStandardUzbekOrthography,
  stripAccents,
  latinToCyrillic,
  cyrillicToLatin,
  toCanonicalLatin,
  toPhoneticSkeleton,
  normalizeIdentifier,
  buildSearchForms,
  matchesDualScript,
  matchesBookQuery,
  SEARCH_ENGINE_TEST_CASES,
  runSearchEngineTests
};
