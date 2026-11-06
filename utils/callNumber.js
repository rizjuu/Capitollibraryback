/**
 * Misamis Oriental Provincial Library
 * Dewey Decimal Classification (DDC) and Call Number Utility
 * Follows the official LMS Provincial Library Details specification:
 * Format: [Section Code] [DDC Number] [Cutter Number] [Publication Year]
 * Example: CIR 550 A123b 2020
 */

// Section Prefix mapping
const SECTION_CODES = {
  circulation: "CIR",
  filipiniana: "FIL",
  reference: "REF",
  reserved: "RES",
  periodical: "PER",
  special: "SC",
};

// Section Sublocations
const SECTION_SUBLOCATIONS = {
  "Circulation Section": "Circulation Section, 2nd Floor",
  "Filipiniana Section": "Filipiniana Section, 2nd Floor",
  "Reference Section": "Reference Section, 2nd Floor",
  "Reserved Section": "Reserved Section, 2nd Floor",
  "Periodical Section": "Periodical Section, Ground Floor",
  "Special Collection Section": "Special Collection Section, 2nd Floor",
};

// Official 6 Sections and their categories from the Provincial Library PDF
const LIBRARY_SECTIONS_CONFIG = [
  {
    name: "Circulation Section",
    code: "CIR",
    floor: "2nd Floor",
    sublocation: "Circulation Section, 2nd Floor",
    description: "Contains the library's main collection of books (e.g., fiction, textbooks for elementary/high school/college, and general reading) that users can borrow or check out.",
    categories: [
      "Science & Technology",
      "Medicine - Health",
      "Communication - Grammar",
      "Language - Literature",
      "Information & Communication Technology",
      "Commerce - Mathematics",
      "General Circulation",
      "Fictions (Ground Floor)"
    ]
  },
  {
    name: "Filipiniana Section",
    code: "FIL",
    floor: "2nd Floor",
    sublocation: "Filipiniana Section, 2nd Floor",
    description: "Houses collections related to the Philippines, including books, documents, and studies on Filipino history, culture, literature, government, and local authors.",
    categories: [
      "Ensiklopedya - Wika",
      "Bokabularyo - Diksyunaryo",
      "Balarila - Ingles - Panitikan",
      "Florante at Laura",
      "Rizaliana",
      "Ibong Adarna",
      "Kasaysayan",
      "General Filipinana",
      "About Philippines"
    ]
  },
  {
    name: "Reference Section",
    code: "REF",
    floor: "2nd Floor",
    sublocation: "Reference Section, 2nd Floor",
    description: "Houses collections of materials for quick facts and background information, such as dictionaries, encyclopedias, atlases, and manuals. For in-library use only.",
    categories: [
      "Encyclopedia",
      "Handbooks - Manuals",
      "Dictionaries",
      "Almanacs - Atlas",
      "General References",
      "Theses & Dissertations (3rd Floor)"
    ]
  },
  {
    name: "Reserved Section",
    code: "RES",
    floor: "2nd Floor",
    sublocation: "Reserved Section, 2nd Floor",
    description: "Contains heavily used, high-demand, or restricted course materials placed on reserve for in-library study.",
    categories: [
      "M.R Books"
    ]
  },
  {
    name: "Periodical Section",
    code: "PER",
    floor: "Ground Floor",
    sublocation: "Periodical Section, Ground Floor",
    description: "Contains collections of regularly published materials like newspapers, magazines, journals, and newsletters for current research updates.",
    categories: [
      "Journals - Arts",
      "Journals - Science & Technology",
      "Journals - Law",
      "Journals - Reader's Digest",
      "Journals - Food",
      "Journals - Philippine Government Matters",
      "Journals - Philippine SONA & Development Plan",
      "Assorted Journals",
      "Newspapers",
      "Magazines",
      "Leaflets, Brochures & Clippings"
    ]
  },
  {
    name: "Special Collection Section",
    code: "SC",
    floor: "2nd Floor",
    sublocation: "Special Collection Section, 2nd Floor",
    description: "Houses materials that are unique, important, or specifically collected for their cultural, historical, social, or community value.",
    categories: [
      "Law Books",
      "GAD Corner",
      "Peace & Order Corner",
      "Children's Corner",
      "Governor's Collection"
    ]
  }
];

function resolveSectionCode(section) {
  const s = String(section || "").toLowerCase();
  if (s.includes("filipiniana")) return "FIL";
  if (s.includes("reference")) return "REF";
  if (s.includes("periodical")) return "PER";
  if (s.includes("special collection") || s.includes("special")) return "SC";
  if (s.includes("reserved") || s.includes("m.r")) return "RES";
  return "CIR";
}

function resolveSublocation(section, category, shelf) {
  const s = String(section || "").toLowerCase();
  const c = String(category || "").toLowerCase();

  if (c.includes("theses") || c.includes("dissertation")) {
    return "Reference Section, 3rd Floor";
  }
  if (c.includes("fiction")) {
    return "Circulation Section, Ground Floor";
  }
  if (s.includes("periodical")) {
    return "Periodical Section, Ground Floor";
  }
  if (s.includes("filipiniana")) {
    return "Filipiniana Section, 2nd Floor";
  }
  if (s.includes("reference")) {
    return "Reference Section, 2nd Floor";
  }
  if (s.includes("special")) {
    return "Special Collection Section, 2nd Floor";
  }
  if (s.includes("reserved")) {
    return "Reserved Section, 2nd Floor";
  }
  return "Circulation Section, 2nd Floor";
}

/**
 * Resolve Dewey Decimal Classification number based on official DDC classes & PDF chart:
 * 000 - Computer Science, Information & General Works
 * 100 - Philosophy & Psychology
 * 200 - Religion
 * 300 - Social Sciences (Law: 340, Economics: 330)
 * 400 - Language
 * 500 - Science (Math: 510, Physics: 530, Chem: 540, Earth: 550, Life: 570, Botany: 580, Zoology: 590)
 * 600 - Technology (Medicine: 610, Anatomy: 611, Health: 613, Engineering: 620, Business: 650)
 * 700 - The Arts
 * 800 - Literature
 * 900 - History & Geography
 */
function resolveDeweyDecimal(category, section, title) {
  const text = `${category || ""} ${title || ""} ${section || ""}`.toLowerCase();

  // Specific 500s (Science) from PDF examples
  if (text.includes("earth science") || text.includes("geology")) return "550";
  if (text.includes("volcano") || text.includes("seismology")) return "551.21";
  if (text.includes("weather") || text.includes("climate") || text.includes("meteorology")) return "551.6";
  if (text.includes("ocean") || text.includes("marine")) return "551.46";
  if (text.includes("ecology") || text.includes("ecosystem") || text.includes("environment")) return "577";
  if (text.includes("plant") || text.includes("botan")) return "580";
  if (text.includes("animal") || text.includes("zoolog")) return "590";
  if (text.includes("human anatomy") || text.includes("anatomy")) return "611";
  if (text.includes("health and wellness") || text.includes("wellness")) return "613";
  if (text.includes("medicine") || text.includes("health") || text.includes("nursing") || text.includes("medical")) return "610";
  if (text.includes("physics")) return "530";
  if (text.includes("chemistry")) return "540";
  if (text.includes("mathematics") || text.includes("algebra") || text.includes("calculus") || text.includes("geometry") || text.includes("trigonometry")) return "510";
  if (text.includes("engineering")) return "620";
  if (text.includes("information & communication") || text.includes("computer") || text.includes("programming") || text.includes("ict")) return "004";

  // Social sciences & Law
  if (text.includes("law") || text.includes("constitution") || text.includes("penal") || text.includes("statute") || text.includes("jurisprudence")) return "340";
  if (text.includes("commerce") || text.includes("business") || text.includes("accounting") || text.includes("management")) return "650";
  if (text.includes("economics")) return "330";
  if (text.includes("government") || text.includes("governor") || text.includes("sona")) return "352";
  if (text.includes("peace") || text.includes("gender") || text.includes("gad") || text.includes("social")) return "360";

  // Filipiniana / Philippines / History
  if (text.includes("rizal") || text.includes("rizaliana")) return "920";
  if (text.includes("florante") || text.includes("ibong adarna") || text.includes("panitikan")) return "899.21";
  if (text.includes("kasaysayan") || text.includes("philippines") || text.includes("filipiniana")) return "959.9";

  // Reference materials
  if (text.includes("dictionary") || text.includes("diksyunaryo") || text.includes("bokabularyo")) return "423";
  if (text.includes("grammar") || text.includes("balarila") || text.includes("wika") || text.includes("language")) return "400";
  if (text.includes("encyclopedia") || text.includes("ensiklopedya")) return "030";
  if (text.includes("handbook") || text.includes("manual")) return "030";
  if (text.includes("almanac") || text.includes("atlas")) return "912";
  if (text.includes("theses") || text.includes("dissertation")) return "378";

  // Periodicals
  if (text.includes("periodical") || text.includes("journal") || text.includes("magazine") || text.includes("newspaper") || text.includes("digest")) return "050";

  // Arts & Children
  if (text.includes("children") || text.includes("kids")) return "028.5";
  if (text.includes("arts") || text.includes("music") || text.includes("drawing") || text.includes("painting")) return "700";
  if (text.includes("fiction") || text.includes("novel") || text.includes("literature")) return "813";

  // Section default fallbacks
  const s = String(section || "").toLowerCase();
  if (s.includes("filipiniana")) return "959.9";
  if (s.includes("reference")) return "030";
  if (s.includes("periodical")) return "050";
  if (s.includes("special")) return "340";
  if (s.includes("reserved")) return "020";
  return "500";
}

/**
 * Generate Cutter Number from Author and Title:
 * First letter of author surname (Uppercase) + 2 or 3 digits (alphabetic hash) + first letter of title (lowercase)
 * Example: Arthur Holmes, Earth Science -> A123b (or H65e)
 */
function generateCutterNumber(author, title) {
  const cleanAuthor = String(author || "Unknown").replace(/[^a-zA-Z]/g, "");
  const authorInitial = (cleanAuthor[0] || "A").toUpperCase();

  // Create a stable 2-3 digit number from author's surname
  let hashNum = 0;
  for (let i = 0; i < cleanAuthor.length; i++) {
    hashNum = (hashNum * 37 + cleanAuthor.charCodeAt(i)) % 890;
  }
  const digits = String(100 + Math.abs(hashNum)).slice(0, 3);

  const cleanTitle = String(title || "Book").replace(/[^a-zA-Z]/g, "");
  const titleLetter = (cleanTitle[0] || "b").toLowerCase();

  return `${authorInitial}${digits}${titleLetter}`;
}

/**
 * Generates official Call Number adhering to:
 * CIR 550 A123b 2020
 */
function generateCallNumber(book = {}) {
  const prefix = resolveSectionCode(book.section);
  const ddc = resolveDeweyDecimal(book.category, book.section, book.title);
  const cutter = generateCutterNumber(book.author, book.title);
  const year =
    book.publicationYear ||
    book.publication_year ||
    (book.dateAdded || book.date_added
      ? new Date(book.dateAdded || book.date_added).getFullYear()
      : 2020);

  return `${prefix} ${ddc} ${cutter} ${year}`;
}

module.exports = {
  SECTION_CODES,
  SECTION_SUBLOCATIONS,
  LIBRARY_SECTIONS_CONFIG,
  resolveSectionCode,
  resolveSublocation,
  resolveDeweyDecimal,
  generateCutterNumber,
  generateCallNumber
};
