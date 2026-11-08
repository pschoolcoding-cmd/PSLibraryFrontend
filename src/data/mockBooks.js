// Mock dataset of multilingual academic & classic library books (Uzbek, Russian, English)
// Provides immediate verification for Calibre-Web catalog views, sorting, taxonomy, and shelves.

const createBookCoverSvg = ({
  title,
  subtitle = '',
  author,
  publisher = 'ACADEMIC PRESS',
  bg = '#1E293B',
  accent = '#3B9C88',
  textColor = '#F8FAFC',
  badge = ''
}) => {
  const esc = (str) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const lines = [];
  const words = String(title).split(' ');
  let current = '';
  words.forEach((w) => {
    if ((current + ' ' + w).trim().length > 16) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = (current + ' ' + w).trim();
    }
  });
  if (current) lines.push(current);
  const displayLines = lines.slice(0, 4);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450">
    <rect width="300" height="450" fill="${bg}" />
    <rect x="0" y="0" width="12" height="450" fill="rgba(0,0,0,0.22)" />
    <rect x="12" y="0" width="2" height="450" fill="rgba(255,255,255,0.12)" />
    <rect x="26" y="24" width="250" height="402" fill="none" stroke="${accent}" stroke-width="1.5" stroke-opacity="0.55" />
    <rect x="26" y="24" width="250" height="28" fill="${accent}" fill-opacity="0.18" />
    <text x="151" y="42" font-family="Georgia, serif" font-size="9" font-weight="bold" fill="${textColor}" fill-opacity="0.8" text-anchor="middle" letter-spacing="2">${esc(badge || publisher)}</text>
    ${displayLines
      .map(
        (line, i) =>
          `<text x="151" y="${125 + i * 34}" font-family="Georgia, 'Times New Roman', serif" font-size="24" font-weight="bold" fill="${textColor}" text-anchor="middle">${esc(line)}</text>`
      )
      .join('')}
    ${
      subtitle
        ? `<text x="151" y="${135 + displayLines.length * 34}" font-family="Inter, sans-serif" font-size="11" fill="${textColor}" fill-opacity="0.75" text-anchor="middle" letter-spacing="0.5">${esc(subtitle)}</text>`
        : ''
    }
    <line x1="95" y1="315" x2="205" y2="315" stroke="${accent}" stroke-width="2" />
    <text x="151" y="348" font-family="Inter, sans-serif" font-size="13" font-weight="600" fill="${textColor}" fill-opacity="0.92" text-anchor="middle" letter-spacing="1">${esc(author.toUpperCase())}</text>
    <text x="151" y="408" font-family="Inter, sans-serif" font-size="9" fill="${textColor}" fill-opacity="0.55" text-anchor="middle" letter-spacing="1.5">${esc(publisher)}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const MOCK_BOOKS = [
  {
    _id: 'cw-book-01',
    bid: '9789943014121-1',
    name: "O'tkan kunlar",
    author: 'Abdulla Qodiriy',
    language: 'UZ',
    genre: ['Historical Novel', 'Uzbek Classics', 'Literature'],
    series: "O'zbek Mumtoz Adabiyoti",
    publisher: 'Sharq Nashriyoti',
    publishedYear: 1926,
    dateAdded: '2026-10-28',
    rating: 5,
    formats: ['EPUB', 'PDF'],
    shelves: ['Grade 10 Literature', 'World Classics'],
    borrowed: '0',
    isRead: true,
    isHot: true,
    downloads: 142,
    copyCount: 5,
    description:
      "O'zbek adabiyotining birinchi romani bo'lib, XIX asr o'rtalaridagi Turkiston tarixiy voqealari, Otabek va Kumushbibining fojiaviy muhabbati orqali el-yurt taqdiri aks ettirilgan.",
    image: createBookCoverSvg({
      title: "O'tkan kunlar",
      subtitle: 'Tarixiy Roman',
      author: 'Abdulla Qodiriy',
      publisher: 'SHARQ NASHRIYOTI • TOSHKENT',
      bg: '#132A3E',
      accent: '#D4A359',
      badge: "O'ZBEK MUMTOZ ADABIYOTI"
    })
  },
  {
    _id: 'cw-book-02',
    bid: '9789943261891-1',
    name: 'Kecha va kunduz',
    author: "Abdulhamid Cho'lpon",
    language: 'UZ',
    genre: ['Uzbek Classics', 'Literature', 'Historical Novel'],
    series: 'Jadid Adabiyoti Durdonalari',
    publisher: "G'afur G'ulom Nashriyoti",
    publishedYear: 1936,
    dateAdded: '2026-10-25',
    rating: 5,
    formats: ['EPUB', 'PDF'],
    shelves: ['Grade 10 Literature', 'World Classics'],
    borrowed: '0',
    isRead: true,
    isHot: true,
    downloads: 118,
    copyCount: 4,
    description:
      "Cho'lponning mashhur 'Kecha va kunduz' ('Bahor ochilganda') romani Zebi obrazining qismati orqali XX asr boshlaridagi ijtimoiy-ma'naviy hayotni yoritadi.",
    image: createBookCoverSvg({
      title: 'Kecha va kunduz',
      subtitle: 'Birinchi kitob: Kecha',
      author: "Abdulhamid Cho'lpon",
      publisher: "G'AFUR G'ULOM NASHRIYOTI",
      bg: '#1E3A2F',
      accent: '#52B788',
      badge: 'JADID ADABIYOTI'
    })
  },
  {
    _id: 'cw-book-03',
    bid: '9789943038127-2',
    name: 'Yulduzli tunlar (Bobur)',
    author: 'Pirimqul Qodirov',
    language: 'UZ',
    genre: ['Historical Biography', 'Uzbek Classics', 'History'],
    series: 'Buyuk Siymolar',
    publisher: 'Yangi Asr Avlodi',
    publishedYear: 1978,
    dateAdded: '2026-11-01',
    rating: 5,
    formats: ['PDF', 'EPUB'],
    shelves: ['Grade 10 Literature'],
    borrowed: '10-A Student (Azizbek K.)',
    isRead: false,
    isHot: true,
    downloads: 164,
    copyCount: 3,
    description:
      'Zahiriddin Muhammad Boburning murakkab hayot yo‘li, davlat arbobi va shoir sifatidagi faoliyati tarixiy manbalar hamda"Boburnoma" asosida badiiy tasvirlangan.',
    image: createBookCoverSvg({
      title: 'Yulduzli tunlar',
      subtitle: 'Zahiriddin Muhammad Bobur',
      author: 'Pirimqul Qodirov',
      publisher: 'YANGI ASR AVLODI',
      bg: '#1A2442',
      accent: '#60A5FA',
      badge: 'TARIXIY ROMAN'
    })
  },
  {
    _id: 'cw-book-04',
    bid: '9789943235014-1',
    name: 'Dunyoning ishlari',
    author: "O'tkir Hoshimov",
    language: 'UZ',
    genre: ['Prose', 'Memoir', 'Literature'],
    series: "O'zbek Zamonaviy Nasri",
    publisher: 'Adabiyot Uchqunlari',
    publishedYear: 1982,
    dateAdded: '2026-10-19',
    rating: 4,
    formats: ['EPUB'],
    shelves: ['Grade 10 Literature'],
    borrowed: '0',
    isRead: true,
    isHot: false,
    downloads: 89,
    copyCount: 6,
    description:
      "Muallifning onalar mehri, insoniy qadr-qimmat va bolalik xotiralariga bag'ishlangan eng samimiy qissa va hikoyalari turkumi.",
    image: createBookCoverSvg({
      title: 'Dunyoning ishlari',
      subtitle: 'Qissa va hikoyalar',
      author: "O'tkir Hoshimov",
      publisher: 'ADABIYOT UCHQUNLARI',
      bg: '#3B2F2F',
      accent: '#E09F3E',
      badge: 'MILLIY NASR'
    })
  },
  {
    _id: 'cw-book-05',
    bid: '9785170904686-1',
    name: 'Война и мир',
    author: 'Лев Толстой',
    language: 'RU',
    genre: ['Classic Literature', 'Historical Novel', 'Philosophy'],
    series: 'Библиотека Всемирной Литературы',
    publisher: 'Эксмо / АСТ',
    publishedYear: 1869,
    dateAdded: '2026-10-14',
    rating: 5,
    formats: ['EPUB', 'FB2', 'PDF'],
    shelves: ['Grade 10 Literature', 'World Classics'],
    borrowed: '0',
    isRead: true,
    isHot: true,
    downloads: 131,
    copyCount: 4,
    description:
      'Монументальный роман-эпопея Льва Николаевича Толстого, описывающий русское общество в эпоху войн против Наполеона в 1805–1812 годах.',
    image: createBookCoverSvg({
      title: 'Война и мир',
      subtitle: 'Роман-эпопея (Тома I–IV)',
      author: 'Лев Толстой',
      publisher: 'ИЗДАТЕЛЬСТВО ЭКСМО',
      bg: '#2B1E28',
      accent: '#C9ADA7',
      badge: 'КЛАССИЧЕСКАЯ ЛИТЕРАТУРА'
    })
  },
  {
    _id: 'cw-book-06',
    bid: '9785041166748-1',
    name: 'Преступление и наказание',
    author: 'Фёдор Достоевский',
    language: 'RU',
    genre: ['Classic Literature', 'Psychological Fiction', 'Philosophy'],
    series: 'Русская Классика',
    publisher: 'Азбука-Аттикус',
    publishedYear: 1866,
    dateAdded: '2026-10-30',
    rating: 5,
    formats: ['EPUB', 'PDF'],
    shelves: ['Grade 10 Literature', 'World Classics'],
    borrowed: '11-B Student (Malika T.)',
    isRead: false,
    isHot: true,
    downloads: 155,
    copyCount: 3,
    description:
      'Социально-психологический и социально-философский роман Ф.М. Достоевского о нравственном выборе, вине и духовном возрождении Родиона Раскольникова.',
    image: createBookCoverSvg({
      title: 'Преступление и наказание',
      subtitle: 'Роман в шести частях с эпилогом',
      author: 'Фёдор Достоевский',
      publisher: 'АЗБУКА-КЛАССИКА',
      bg: '#1F242D',
      accent: '#9E2A2B',
      badge: 'РУССКАЯ КЛАССИКА'
    })
  },
  {
    _id: 'cw-book-07',
    bid: '9785171183677-1',
    name: 'Сборник задач по физике (Олимпиадный курс)',
    author: 'В.И. Лукашик, Е.В. Иванова',
    language: 'RU',
    genre: ['Physics', 'STEM', 'Olympiad Prep'],
    series: 'Физико-математическая олимпиада',
    publisher: 'Просвещение',
    publishedYear: 2021,
    dateAdded: '2026-11-03',
    rating: 4,
    formats: ['PDF'],
    shelves: ['Olympiad Prep', 'STEM Reference'],
    borrowed: '0',
    isRead: false,
    isHot: false,
    downloads: 97,
    copyCount: 8,
    description:
      'Расширенный сборник экспериментальных и теоретических задач по механике, термодинамике, электродинамике и оптике для подготовки к олимпиадам.',
    image: createBookCoverSvg({
      title: 'Сборник задач по физике',
      subtitle: 'Олимпиадный практикум • 9–11 классы',
      author: 'В.И. Лукашик, Е.В. Иванова',
      publisher: 'ПРОСВЕЩЕНИЕ',
      bg: '#183446',
      accent: '#38BDF8',
      badge: 'ОЛИМПИАДНЫЙ РЕЗЕРВ'
    })
  },
  {
    _id: 'cw-book-08',
    bid: '9780395992470-1',
    name: "The Endurance: Shackleton's Legendary Antarctic Expedition",
    author: 'Caroline Alexander',
    language: 'EN',
    genre: ['History', 'Exploration', 'Non-Fiction'],
    series: 'Polar Expeditions Archive',
    publisher: 'Alfred A. Knopf',
    publishedYear: 1998,
    dateAdded: '2026-11-05',
    rating: 5,
    formats: ['EPUB', 'PDF'],
    shelves: ['World Classics'],
    borrowed: '0',
    isRead: true,
    isHot: true,
    downloads: 112,
    copyCount: 2,
    description:
      "The definitive account of Sir Ernest Shackleton's 1914 Imperial Trans-Antarctic Expedition and his crew's extraordinary survival aboard the Endurance.",
    image: createBookCoverSvg({
      title: 'THE ENDURANCE',
      subtitle: "Shackleton's Legendary Antarctic Expedition",
      author: 'Caroline Alexander',
      publisher: 'A KNOPF BOOK',
      bg: '#14171A',
      accent: '#BE123C',
      badge: 'HISTORICAL ARCHIVE'
    })
  },
  {
    _id: 'cw-book-09',
    bid: '9780262046305-1',
    name: 'Introduction to Algorithms (4th Edition)',
    author: 'Thomas H. Cormen, Charles E. Leiserson',
    language: 'EN',
    genre: ['Computer Science', 'Algorithms', 'STEM'],
    series: 'MIT Electrical Engineering & CS',
    publisher: 'MIT Press',
    publishedYear: 2022,
    dateAdded: '2026-11-06',
    rating: 5,
    formats: ['PDF', 'EPUB'],
    shelves: ['Olympiad Prep', 'STEM Reference'],
    borrowed: 'Olympiad Team (Sardor M.)',
    isRead: false,
    isHot: true,
    downloads: 208,
    copyCount: 3,
    description:
      'Comprehensive reference covering data structures, graph algorithms, dynamic programming, and computational complexity for Informatics Olympiad preparation.',
    image: createBookCoverSvg({
      title: 'Introduction to Algorithms',
      subtitle: 'Fourth Edition • CLRS',
      author: 'Cormen • Leiserson • Rivest • Stein',
      publisher: 'THE MIT PRESS',
      bg: '#1E293B',
      accent: '#0D9488',
      badge: 'COMPUTER SCIENCE'
    })
  },
  {
    _id: 'cw-book-10',
    bid: '9781934124093-1',
    name: 'The Art of Problem Solving, Vol. 2: And Beyond',
    author: 'Richard Rusczyk, Sandor Lehoczky',
    language: 'EN',
    genre: ['Mathematics', 'Olympiad Prep', 'STEM'],
    series: 'Art of Problem Solving',
    publisher: 'AoPS Incorporated',
    publishedYear: 2019,
    dateAdded: '2026-11-02',
    rating: 5,
    formats: ['PDF', 'EPUB'],
    shelves: ['Olympiad Prep', 'STEM Reference'],
    borrowed: '0',
    isRead: true,
    isHot: true,
    downloads: 175,
    copyCount: 5,
    description:
      'Essential training text for high school mathematics competitions (AMC, AIME, IMO), featuring inequalities, polynomials, number theory, and combinatorics.',
    image: createBookCoverSvg({
      title: 'The Art of Problem Solving',
      subtitle: 'Volume 2: And Beyond',
      author: 'Richard Rusczyk • Sandor Lehoczky',
      publisher: 'AOPS INCORPORATED',
      bg: '#172554',
      accent: '#F59E0B',
      badge: 'MATHEMATICS OLYMPIAD'
    })
  },
  {
    _id: 'cw-book-11',
    bid: '9781491964927-1',
    name: 'Refactoring JavaScript: Turning Bad Code Into Good Code',
    author: 'Evan Burchard',
    language: 'EN',
    genre: ['Computer Science', 'Programming', 'STEM'],
    series: "O'Reilly Software Engineering",
    publisher: "O'Reilly Media",
    publishedYear: 2017,
    dateAdded: '2026-10-20',
    rating: 4,
    formats: ['EPUB', 'MOBI', 'PDF'],
    shelves: ['Olympiad Prep', 'STEM Reference'],
    borrowed: '0',
    isRead: false,
    isHot: false,
    downloads: 74,
    copyCount: 2,
    description:
      'Practical guide to improving code quality, testing, asynchronous patterns, and functional programming architecture in modern JavaScript codebases.',
    image: createBookCoverSvg({
      title: 'Refactoring JavaScript',
      subtitle: 'Turning Bad Code Into Good Code',
      author: 'Evan Burchard',
      publisher: "O'REILLY MEDIA",
      bg: '#134E4A',
      accent: '#2DD4BF',
      badge: "O'REILLY"
    })
  },
  {
    _id: 'cw-book-12',
    bid: '9785170998647-1',
    name: 'Мастер и Маргарита',
    author: 'Михаил Булгаков',
    language: 'RU',
    genre: ['Classic Literature', 'Philosophical Novel', 'Literature'],
    series: 'Эксклюзивная Классика',
    publisher: 'АСТ',
    publishedYear: 1967,
    dateAdded: '2026-10-22',
    rating: 5,
    formats: ['EPUB', 'MOBI'],
    shelves: ['Grade 10 Literature', 'World Classics'],
    borrowed: '0',
    isRead: true,
    isHot: true,
    downloads: 138,
    copyCount: 3,
    description:
      'Бессмертный философский роман Михаила Афанасьевича Булгакова, переплетающий сатирическую хронику Москвы 1930-х годов и древнюю историю Понтия Пилата.',
    image: createBookCoverSvg({
      title: 'Мастер и Маргарита',
      subtitle: 'Полная авторская редакция',
      author: 'Михаил Булгаков',
      publisher: 'ИЗДАТЕЛЬСТВО АСТ',
      bg: '#27272A',
      accent: '#F59E0B',
      badge: 'МИРОВАЯ КЛАССИКА'
    })
  }
];

export { createBookCoverSvg };
export default MOCK_BOOKS;

