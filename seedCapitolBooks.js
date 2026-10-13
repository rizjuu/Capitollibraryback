require("dotenv").config();
const { supabase } = require("./db/supabase");

const capitolBooks = [
  {
    "barcode": "LIB-CAP-0001",
    "accessionNumber": "ACC-CAP-0001",
    "title": "Next Century Mathematics: Advanced Algebra, Trigonometry, and Statistics",
    "author": "Fernando B. Orines",
    "authors": [
      "Fernando B. Orines",
      "Zenaida B. Diaz",
      "Maharlika P. Mojica"
    ],
    "category": "Mathematics",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-01",
    "publisher": "Phoenix Publishing House",
    "publicationYear": 2003,
    "status": "available",
    "available": true,
    "description": "Comprehensive high school and pre-college mathematics textbook covering advanced algebra, trigonometric functions and identities, and foundational statistics and probability with real-world applications.",
    "coverUrl": "/capitolbooks/0fff27e2-1b6a-4434-8a71-5bef19b5767c.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0002",
    "accessionNumber": "ACC-CAP-0002",
    "title": "Gender, Sexuality and Reproductive Health in South East Asia (Volume 1)",
    "author": "Pilar Ramos-Jimenez",
    "authors": [
      "Pilar Ramos-Jimenez",
      "Celeste Maria V. Condor"
    ],
    "category": "Health & Medicine",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-04",
    "publisher": "APNET / Social Development Research Center",
    "publicationYear": 2001,
    "status": "available",
    "available": true,
    "description": "An exploratory and evaluative research collection focusing on gender dynamics, sexual health rights, and reproductive health policies across South East Asian communities (GAD Corner).",
    "coverUrl": "/capitolbooks/14f86efa-5589-4440-b2f5-5ec3b320fb85.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0003",
    "accessionNumber": "ACC-CAP-0003",
    "title": "Mathematics of Physics and Modern Engineering (Second Edition)",
    "author": "I. S. Sokolnikoff",
    "authors": [
      "I. S. Sokolnikoff",
      "R. M. Redheffer"
    ],
    "category": "Science & Engineering",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02",
    "publisher": "McGraw-Hill Book Company",
    "publicationYear": 1966,
    "status": "available",
    "available": true,
    "description": "Classic authoritative treatise covering ordinary differential equations, infinite series, vector analysis, partial differential equations, complex variables, and linear algebra for physicists and engineers.",
    "coverUrl": "/capitolbooks/24d17ecb-257c-45a8-982f-59e28372bd69.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0004",
    "accessionNumber": "ACC-CAP-0004",
    "title": "Gateways to Algebra and Geometry: An Integrated Approach",
    "author": "Ron Larson",
    "authors": [
      "Ron Larson",
      "Laurie Boswell",
      "Timothy D. Kanold",
      "Lee Stiff"
    ],
    "category": "Mathematics",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-01",
    "publisher": "McDougal, Littell & Company",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "Integrated secondary mathematics curriculum connecting numerical patterns, algebraic problem solving, geometric constructions, and visual reasoning.",
    "coverUrl": "/capitolbooks/2c3ec738-e5e2-4d16-ae78-463cd61f4bf6.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0005",
    "accessionNumber": "ACC-CAP-0005",
    "title": "Foundations and Fundamental Concepts of Mathematics (Third Edition)",
    "author": "Howard Eves",
    "authors": [
      "Howard Eves"
    ],
    "category": "Mathematics",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02",
    "publisher": "PWS-KENT Publishing",
    "publicationYear": 1990,
    "status": "available",
    "available": true,
    "description": "Historical and philosophical examination of the genesis of mathematical ideas, axiomatic systems, Euclidean and non-Euclidean geometry, set theory, and mathematical logic.",
    "coverUrl": "/capitolbooks/32c7d16b-ba9b-4c26-b91b-85e88a1b4b04.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0006",
    "accessionNumber": "ACC-CAP-0006",
    "title": "Analytic Trigonometry with Applications (Seventh Edition)",
    "author": "Raymond A. Barnett",
    "authors": [
      "Raymond A. Barnett",
      "Michael R. Ziegler",
      "Karl E. Byleen"
    ],
    "category": "Mathematics",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02",
    "publisher": "John Wiley & Sons",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "Thorough textbook emphasizing trigonometric functions, circular equations, vector applications, complex numbers, and graphing techniques.",
    "coverUrl": "/capitolbooks/367e4d2b-0cf1-4246-8a18-9d9ce5f2d1d1.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0007",
    "accessionNumber": "ACC-CAP-0007",
    "title": "Sociology, Culture and Family Planning: A Conceptual, Experiential and Interactive Approach",
    "author": "Wilfredo R. San Juan",
    "authors": [
      "Wilfredo R. San Juan",
      "Ma. Luz J. Centeno",
      "Melchor Q. Teñoso",
      "Marietta G. Anterola"
    ],
    "category": "Filipiniana",
    "section": "Filipiniana Section",
    "shelf": "Shelf F-02",
    "publisher": "Books Atbp. Publishing Corp.",
    "publicationYear": 2007,
    "status": "available",
    "available": true,
    "description": "Filipiniana sociological textbook analyzing Filipino social institutions, cultural values, demographic trends, family life, and reproductive health policies.",
    "coverUrl": "/capitolbooks/4b031309-5e81-49fb-9a11-397f5f9efd95.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0008",
    "accessionNumber": "ACC-CAP-0008",
    "title": "Applied Calculus for Business, Economics, Life Sciences, and Social Sciences (Seventh Edition)",
    "author": "Raymond A. Barnett",
    "authors": [
      "Raymond A. Barnett",
      "Michael R. Ziegler",
      "Karl E. Byleen"
    ],
    "category": "Mathematics",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-02",
    "publisher": "Prentice Hall",
    "publicationYear": 2000,
    "status": "available",
    "available": true,
    "description": "College-level applied calculus focusing on differential and integral methods, marginal analysis, optimization, and real-world models in business and the social sciences.",
    "coverUrl": "/capitolbooks/4b1660c8-c7f3-47bc-8f0d-f0cee3e512a9.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0009",
    "accessionNumber": "ACC-CAP-0009",
    "title": "Doing the Right Thing: Taking Care of Your Elderly Parents Even If They Didn't Take Care of You",
    "author": "Roberta Satow, Ph.D.",
    "authors": [
      "Roberta Satow, Ph.D."
    ],
    "category": "Social Sciences",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf B-01",
    "publisher": "St. Martin's Press",
    "publicationYear": 2005,
    "status": "available",
    "available": true,
    "description": "Insightful guide blending clinical psychology and personal narratives to assist adult children handling eldercare responsibilities, emotional conflict, and family relationships.",
    "coverUrl": "/capitolbooks/4f27e119-a19b-4ef9-bc0c-6e894c5a3ff5.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0010",
    "accessionNumber": "ACC-CAP-0010",
    "title": "Using & Understanding Mathematics: A Quantitative Reasoning Approach (Fifth Edition)",
    "author": "Jeffrey Bennett",
    "authors": [
      "Jeffrey Bennett",
      "William Briggs"
    ],
    "category": "Mathematics",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-01",
    "publisher": "Pearson",
    "publicationYear": 2011,
    "status": "available",
    "available": true,
    "description": "Quantitative reasoning guide empowering readers with practical mathematical thinking for statistics, personal finance, probability, exponential growth, and everyday decision making.",
    "coverUrl": "/capitolbooks/6a2aa548-aaae-4c8c-a63b-7c62fa5c7001.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0011",
    "accessionNumber": "ACC-CAP-0011",
    "title": "Principles of Accounting (Nineteenth Edition)",
    "author": "John J. Wild",
    "authors": [
      "John J. Wild",
      "Ken W. Shaw",
      "Barbara Chiappetta"
    ],
    "category": "Business & Economics",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf B-02",
    "publisher": "McGraw-Hill Education",
    "publicationYear": 2009,
    "status": "available",
    "available": true,
    "description": "Foundational accounting principles text covering double-entry bookkeeping, financial statements, balance sheets, cash flow analysis, and corporate reporting standards.",
    "coverUrl": "/capitolbooks/6f080b15-755c-449f-bd49-225f7c00e501.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0012",
    "accessionNumber": "ACC-CAP-0012",
    "title": "Infants and Mothers: Differences in Development (Revised Edition)",
    "author": "T. Berry Brazelton, M.D.",
    "authors": [
      "T. Berry Brazelton, M.D."
    ],
    "category": "Health & Medicine",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf H-01",
    "publisher": "Delta / Delacorte Press",
    "publicationYear": 1983,
    "status": "available",
    "available": true,
    "description": "Classic pediatric reference by Dr. Brazelton illustrating infant temperamental variations, cognitive milestones, sensory reactions, and maternal bonding throughout the first twelve months.",
    "coverUrl": "/capitolbooks/739ba3b9-02d5-409a-b2fc-9bb2057c5005.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0013",
    "accessionNumber": "ACC-CAP-0013",
    "title": "The Complete Guide to Children's Health: A Comprehensive A-Z Reference to Illnesses, Symptoms, Prevention and Treatments",
    "author": "Norman Saunders, MD",
    "authors": [
      "Norman Saunders, MD",
      "Jeremy Friedman, MB.ChB"
    ],
    "category": "Health & Medicine",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-01",
    "publisher": "Great Ormond Street Hospital Children's Charity",
    "publicationYear": 2002,
    "status": "available",
    "available": true,
    "description": "Authoritative A-to-Z medical reference written by pediatric hospital specialists, covering childhood diseases, symptom evaluations, behavioral issues, first aid, and preventative care.",
    "coverUrl": "/capitolbooks/80b57b9e-d641-4f81-9f95-afbd17a969b1.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0014",
    "accessionNumber": "ACC-CAP-0014",
    "title": "Law in America: An Illustrated Celebration",
    "author": "Bernard Schwartz",
    "authors": [
      "Bernard Schwartz"
    ],
    "category": "Law",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-02",
    "publisher": "Hugh Lauter Levin Associates",
    "publicationYear": 1994,
    "status": "available",
    "available": true,
    "description": "Comprehensive historical tribute to American legal history, featuring landmark Supreme Court trials, constitutional jurisprudence, famous justices, and civil liberties milestones.",
    "coverUrl": "/capitolbooks/8e41f45f-3308-4cfb-9ba9-004563dc1f37.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0015",
    "accessionNumber": "ACC-CAP-0015",
    "title": "Glencoe Mathematics: Applications and Connections (Course 1 - California Edition)",
    "author": "William Collins",
    "authors": [
      "William Collins",
      "Patricia Frey",
      "Arthur Howard"
    ],
    "category": "Mathematics",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-01",
    "publisher": "Glencoe / McGraw-Hill",
    "publicationYear": 2001,
    "status": "available",
    "available": true,
    "description": "Middle school curriculum connecting arithmetic, ratios, introductory algebra, statistical charts, geometry, and real-life mathematical reasoning.",
    "coverUrl": "/capitolbooks/a8c3cb32-768d-4a26-874f-b52986f4d118.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0016",
    "accessionNumber": "ACC-CAP-0016",
    "title": "Adolescence (Fourth Edition)",
    "author": "Laurence Steinberg",
    "authors": [
      "Laurence Steinberg"
    ],
    "category": "Social Sciences",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf B-01",
    "publisher": "McGraw-Hill",
    "publicationYear": 1996,
    "status": "available",
    "available": true,
    "description": "Essential developmental psychology textbook investigating adolescent biology, cognitive growth, emotional autonomy, peer cultures, family dynamics, and identity development.",
    "coverUrl": "/capitolbooks/cd5bbd3c-45c6-4957-96d1-52546f84568a.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0017",
    "accessionNumber": "ACC-CAP-0017",
    "title": "Calculus and Its Applications (Ninth Edition)",
    "author": "Larry J. Goldstein",
    "authors": [
      "Larry J. Goldstein",
      "David C. Lay",
      "David I. Schneider"
    ],
    "category": "Mathematics",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-02",
    "publisher": "Prentice Hall",
    "publicationYear": 2001,
    "status": "available",
    "available": true,
    "description": "Rigorous introductory calculus book presenting derivatives, optimization, curve sketching, integral calculus, and multivariable functions with intuitive real-world applications.",
    "coverUrl": "/capitolbooks/ceb0ff15-59d0-4585-afb3-59d88fa5600c.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0018",
    "accessionNumber": "ACC-CAP-0018",
    "title": "Essential Reproduction (Fourth Edition)",
    "author": "Martin H. Johnson",
    "authors": [
      "Martin H. Johnson",
      "Barry J. Everitt"
    ],
    "category": "Health & Medicine",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-01",
    "publisher": "Blackwell Science",
    "publicationYear": 1995,
    "status": "available",
    "available": true,
    "description": "Concise yet comprehensive biological and medical textbook covering reproductive anatomy, endocrinology, gametogenesis, fertilization, pregnancy, and lactation.",
    "coverUrl": "/capitolbooks/eaae364a-af78-41c0-abff-d04b474a79ad.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0019",
    "accessionNumber": "ACC-CAP-0019",
    "title": "Adolescence, Adolescents (Second Edition)",
    "author": "Barbara Schneider Fuhrmann",
    "authors": [
      "Barbara Schneider Fuhrmann"
    ],
    "category": "Social Sciences",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf B-01",
    "publisher": "Harcourt Brace Jovanovich",
    "publicationYear": 1990,
    "status": "available",
    "available": true,
    "description": "Comprehensive sociological and psychological examination of youth development, covering cognitive progress, school environment, interpersonal relationships, and adolescent health.",
    "coverUrl": "/capitolbooks/ef1bd045-4a8f-4f52-bbe8-5aa49b6573e4.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0020",
    "accessionNumber": "ACC-CAP-0020",
    "title": "Women Power in Social Welfare & Development (Revised Edition)",
    "author": "Amelia Delda Felizmeña",
    "authors": [
      "Amelia Delda Felizmeña"
    ],
    "category": "Filipiniana",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-04",
    "publisher": "Philippine Social Work Publications",
    "publicationYear": 1995,
    "status": "available",
    "available": true,
    "description": "Filipiniana sociological work highlighting women leaders and workers in the Philippines, their contributions to social welfare programs, community leadership, and social development (GAD Corner).",
    "coverUrl": "/capitolbooks/f5049100-26a6-416b-a05e-e405226d164b.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0021",
    "accessionNumber": "ACC-CAP-0021",
    "title": "Pennsylvania Notetaking Guide: McDougal Littell Algebra 1",
    "author": "Ron Larson",
    "authors": [
      "Ron Larson",
      "Laurie Boswell",
      "Timothy D. Kanold",
      "Lee Stiff"
    ],
    "category": "Mathematics",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-01",
    "publisher": "McDougal Littell",
    "publicationYear": 2007,
    "status": "available",
    "available": true,
    "description": "Interactive notetaking guide for secondary students focusing on algebraic reasoning, equations, polynomials, inequalities, graphing, and standardized assessment preparation.",
    "coverUrl": "/capitolbooks/fa1bcfcf-863c-4b2f-bce0-da8afbfe3762.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0022",
    "accessionNumber": "ACC-CAP-0022",
    "title": "The Psychology of Women (Third Edition)",
    "author": "Margaret W. Matlin",
    "authors": [
      "Margaret W. Matlin"
    ],
    "category": "Social Sciences",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-04",
    "publisher": "Wadsworth / Harcourt Brace",
    "publicationYear": 1996,
    "status": "available",
    "available": true,
    "description": "Authoritative study examining gender stereotypes, cognitive performance, career development, relationships, physical and mental health, and societal influences across women's lifespans (GAD Corner).",
    "coverUrl": "/capitolbooks/fc99c6d3-7885-4025-8566-6dbe73cdd941.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0023",
    "accessionNumber": "ACC-CAP-0023",
    "title": "Transforming Local Government Executives Into Effective Managers",
    "author": "Isidro D. Cariño, DBA, Ph.D.",
    "authors": [
      "Isidro D. Cariño, DBA, Ph.D."
    ],
    "category": "Public Administration",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-01",
    "publisher": "SGV & Co. / College of Public Administration, UP",
    "publicationYear": 1994,
    "status": "available",
    "available": true,
    "description": "Leadership and management handbook for provincial governors, city mayors, and local government executives focused on effective public governance, administrative ethics, and community leadership (Governor's Collection).",
    "coverUrl": "/capitolbooks/0068e05b-dae5-4f03-a85b-60e4bccbcd43.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0024",
    "accessionNumber": "ACC-CAP-0024",
    "title": "El Filibusterismo (Sinugbuanon Edition)",
    "author": "Jose Rizal",
    "authors": [
      "Jose Rizal"
    ],
    "category": "Filipiniana",
    "section": "Filipiniana Section",
    "shelf": "Shelf F-01",
    "publisher": "National Historical Institute",
    "publicationYear": 1998,
    "status": "available",
    "available": true,
    "description": "Cebuano/Sinugbuanon Visayan translation of Dr. Jose Rizal's revolutionary masterwork depicting the subversive return of Simoun and the struggle against colonial tyranny.",
    "coverUrl": "/capitolbooks/02eec1ae-57ce-4a34-b15b-d66e86a61986.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0025",
    "accessionNumber": "ACC-CAP-0025",
    "title": "Chambers Dictionary of Etymology: The Origins and Development of Over 25,000 English Words",
    "author": "Robert K. Barnhart",
    "authors": [
      "Robert K. Barnhart"
    ],
    "category": "Reference",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-01",
    "publisher": "Chambers Harrap Publishers",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "Major etymological reference charting the historical derivations, phonetic shifts, and semantic evolution of more than twenty-five thousand vocabulary entries across English language history.",
    "coverUrl": "/capitolbooks/0604754c-bb30-4175-9739-cf4f515cd75c.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0026",
    "accessionNumber": "ACC-CAP-0026",
    "title": "The Malayan Connection: Ang Pilipinas sa Dunia Melayu",
    "author": "Zeus A. Salazar",
    "authors": [
      "Zeus A. Salazar"
    ],
    "category": "Filipiniana",
    "section": "Filipiniana Section",
    "shelf": "Shelf F-01",
    "publisher": "Palimbagan ng Lahi",
    "publicationYear": 1998,
    "status": "available",
    "available": true,
    "description": "Pantayong Pananaw historical treatise by Dr. Zeus Salazar exploring the pre-colonial cultural, linguistic, maritime, and geopolitical linkages connecting the Philippine archipelago to the broader Malay world.",
    "coverUrl": "/capitolbooks/07ef3dc8-2b33-4040-98be-08f81bee94e7.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0027",
    "accessionNumber": "ACC-CAP-0027",
    "title": "Biochemistry (Third Edition, Thomson Asian Edition)",
    "author": "Reginald H. Garrett",
    "authors": [
      "Reginald H. Garrett",
      "Charles M. Grisham"
    ],
    "category": "Science & Engineering",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-02",
    "publisher": "Thomson Brooks/Cole",
    "publicationYear": 2005,
    "status": "available",
    "available": true,
    "description": "Comprehensive molecular biochemistry textbook covering biomolecules, enzymes, metabolic pathways, bioenergetics, and recombinant DNA technology with clinical connections.",
    "coverUrl": "/capitolbooks/094c2969-f25f-40cd-b1e4-688530305e5a.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0028",
    "accessionNumber": "ACC-CAP-0028",
    "title": "Harcourt Science (Elementary School Edition)",
    "author": "Robert M. Jones",
    "authors": [
      "Robert M. Jones",
      "Joyce K. Malcolm",
      "Gerald H. Krockover"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01",
    "publisher": "Harcourt School Publishers",
    "publicationYear": 2002,
    "status": "available",
    "available": true,
    "description": "Vibrant elementary school science textbook featuring interactive STEM investigations, Earth and Life science fundamentals, hands-on lab projects, and colorful wildlife photography.",
    "coverUrl": "/capitolbooks/126d6f39-2082-4532-b976-9b4b9e000519.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0029",
    "accessionNumber": "ACC-CAP-0029",
    "title": "El Filibusterismo (Sinugbuanon - Copy 2)",
    "author": "Jose Rizal",
    "authors": [
      "Jose Rizal"
    ],
    "category": "Filipiniana",
    "section": "Filipiniana Section",
    "shelf": "Shelf F-01",
    "publisher": "National Historical Institute",
    "publicationYear": 1998,
    "status": "available",
    "available": true,
    "description": "Cebuano/Sinugbuanon Visayan translation of Jose Rizal's classic novel on the Philippine nationalist awakening and social critique under Spanish colonial administration.",
    "coverUrl": "/capitolbooks/12913db7-2735-4685-8b72-83997fbade1b.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0030",
    "accessionNumber": "ACC-CAP-0030",
    "title": "Noli Me Tangere (Cebuano Visayan Edition)",
    "author": "Jose Rizal",
    "authors": [
      "Jose Rizal"
    ],
    "category": "Filipiniana",
    "section": "Filipiniana Section",
    "shelf": "Shelf F-01",
    "publisher": "National Historical Institute",
    "publicationYear": 1998,
    "status": "available",
    "available": true,
    "description": "Definitive Cebuano Visayan edition of Jose Rizal's foundational masterpiece exposing 19th-century societal injustices in the Philippines through the journey of Crisostomo Ibarra.",
    "coverUrl": "/capitolbooks/141e469f-ecb8-4042-8fc2-0439ab87c9de.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0031",
    "accessionNumber": "ACC-CAP-0031",
    "title": "Barangay Justice: The Amicable Settlement of Disputes",
    "author": "Antonio Orendain",
    "authors": [
      "Antonio Orendain"
    ],
    "category": "Law",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-02",
    "publisher": "Alpha Omega Publications",
    "publicationYear": 1978,
    "status": "available",
    "available": true,
    "description": "Pioneering Philippine legal guide on Presidential Decree 1508 and the Katarungang Pambarangay system for mediation, conciliation, and community-level dispute resolution.",
    "coverUrl": "/capitolbooks/17889892-bbb3-45d0-8b4d-ddd90ca63cc9.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0032",
    "accessionNumber": "ACC-CAP-0032",
    "title": "Physical Chemistry (Fifth Edition)",
    "author": "Ira N. Levine",
    "authors": [
      "Ira N. Levine"
    ],
    "category": "Science & Engineering",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-02",
    "publisher": "McGraw-Hill",
    "publicationYear": 2002,
    "status": "available",
    "available": true,
    "description": "Standard university textbook detailing thermodynamics, quantum chemistry, spectroscopy, statistical mechanics, and chemical reaction kinetics.",
    "coverUrl": "/capitolbooks/1a1dc087-5c74-414e-930d-c131876cf256.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0033",
    "accessionNumber": "ACC-CAP-0033",
    "title": "Biographical Dictionary of American Sports: Outdoor Sports",
    "author": "David L. Porter",
    "authors": [
      "David L. Porter"
    ],
    "category": "Sports & Reference",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-01",
    "publisher": "Greenwood Press",
    "publicationYear": 1988,
    "status": "available",
    "available": true,
    "description": "Comprehensive biographical directory chronicling the careers, championship achievements, and historical influence of notable outdoor sports athletes and coaches.",
    "coverUrl": "/capitolbooks/1bc091a9-af65-431f-bb28-eb90bfd7e9b8.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0034",
    "accessionNumber": "ACC-CAP-0034",
    "title": "The Labor Code of the Philippines and Its Implementing Rules and Regulations (1999 Edition)",
    "author": "Vicente B. Foz",
    "authors": [
      "Vicente B. Foz"
    ],
    "category": "Law",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-02",
    "publisher": "Philippine Law Gazette",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "Complete codified statutory reference containing the Philippine Labor Code (PD 442), omnibus implementation regulations, worker statutory benefits, and collective bargaining rights.",
    "coverUrl": "/capitolbooks/1f4ed9d8-399f-4006-ad2c-824a9c498a2c.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0035",
    "accessionNumber": "ACC-CAP-0035",
    "title": "The Philippine Economy in the 1970's",
    "author": "Gerardo P. Sicat",
    "authors": [
      "Gerardo P. Sicat"
    ],
    "category": "Economics",
    "section": "Filipiniana Section",
    "shelf": "Shelf F-02",
    "publisher": "Institute of Economic Development and Research, UP",
    "publicationYear": 1972,
    "status": "available",
    "available": true,
    "description": "Filipiniana economic analysis examining agrarian reform, trade balances, industrial policies, foreign investments, and development trajectories in 1970s Philippines.",
    "coverUrl": "/capitolbooks/276a17f6-4e06-4fe5-beb3-8f1ecab269a0.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0036",
    "accessionNumber": "ACC-CAP-0036",
    "title": "La Solidaridad: Quincenario democratico (Volume IV 1892)",
    "author": "Jose Rizal",
    "authors": [
      "Jose Rizal",
      "Marcelo H. Del Pilar",
      "Graciano Lopez Jaena",
      "Mariano Ponce"
    ],
    "category": "Historical Periodicals",
    "section": "Periodical Section (Includes Journal, Magazine, Leaflets, Brochures, Clippings)",
    "shelf": "Shelf P-01",
    "publisher": "Fundacion Santiago / National Historical Institute",
    "publicationYear": 1892,
    "status": "available",
    "available": true,
    "description": "Bilingual Spanish-English archival publication of the Propaganda Movement's historic biweekly newspaper issues published in Barcelona and Madrid during the year 1892.",
    "coverUrl": "/capitolbooks/2a6a5054-72ec-4626-bb64-51e7b449ff17.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0037",
    "accessionNumber": "ACC-CAP-0037",
    "title": "Barangay Justice: The Amicable Settlement of Disputes (Reference Copy)",
    "author": "Antonio Orendain",
    "authors": [
      "Antonio Orendain"
    ],
    "category": "Law",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-02",
    "publisher": "Alpha Omega Publications",
    "publicationYear": 1978,
    "status": "available",
    "available": true,
    "description": "Library reference copy of the authoritative handbook on amicable settlements, jurisdiction, and procedures before the Lupon Tagapayapa in Philippine barangays.",
    "coverUrl": "/capitolbooks/32357553-7812-48bb-8d7d-d2ea82324fc1.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0038",
    "accessionNumber": "ACC-CAP-0038",
    "title": "La Solidaridad: Quincenario democratico (Volume V 1893)",
    "author": "Jose Rizal",
    "authors": [
      "Jose Rizal",
      "Marcelo H. Del Pilar",
      "Mariano Ponce"
    ],
    "category": "Historical Periodicals",
    "section": "Periodical Section (Includes Journal, Magazine, Leaflets, Brochures, Clippings)",
    "shelf": "Shelf P-01",
    "publisher": "Fundacion Santiago / National Historical Institute",
    "publicationYear": 1893,
    "status": "available",
    "available": true,
    "description": "Facsimile and English translation of the 1893 volume of La Solidaridad, featuring vital articles advocating democratic representation, secular education, and civic reforms.",
    "coverUrl": "/capitolbooks/32417b56-cdeb-43db-82c2-9a3d0af1d22f.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0039",
    "accessionNumber": "ACC-CAP-0039",
    "title": "Ultimate Mandarin Chinese: Beginner-Intermediate",
    "author": "Living Language",
    "authors": [
      "Living Language Course Editors"
    ],
    "category": "Languages & Linguistics",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02",
    "publisher": "Living Language / Random House",
    "publicationYear": 2008,
    "status": "available",
    "available": true,
    "description": "Complete textbook and reference guide featuring 40 realistic dialogues, Pinyin pronunciation, essential grammar rules, character practice, and cultural notes.",
    "coverUrl": "/capitolbooks/3936a410-567d-4375-84a9-02c8140b316d.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0040",
    "accessionNumber": "ACC-CAP-0040",
    "title": "Philippine Rice R&D Highlights 1994",
    "author": "Philippine Rice Research Institute (PhilRice)",
    "authors": [
      "Philippine Rice Research Institute"
    ],
    "category": "Agriculture & Research",
    "section": "Periodical Section (Includes Journal, Magazine, Leaflets, Brochures, Clippings)",
    "shelf": "Shelf P-02",
    "publisher": "PhilRice (Philippine Rice Research Institute)",
    "publicationYear": 1995,
    "status": "available",
    "available": true,
    "description": "Annual research and development journal document highlighting agronomy breakthroughs, pest management, hybrid grain breeding, and seed technologies across the Philippines.",
    "coverUrl": "/capitolbooks/3b363841-1175-4e18-9634-3cca34a7ac1d.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0041",
    "accessionNumber": "ACC-CAP-0041",
    "title": "Mga Siday ni Jose Rizal",
    "author": "Jose Rizal",
    "authors": [
      "Jose Rizal"
    ],
    "category": "Filipiniana",
    "section": "Filipiniana Section",
    "shelf": "Shelf F-01",
    "publisher": "National Historical Institute",
    "publicationYear": 1996,
    "status": "available",
    "available": true,
    "description": "Anthology of Dr. Jose Rizal's poems and literary works translated into Visayan/Waray siday poetry, highlighting his patriotic and lyrical verses.",
    "coverUrl": "/capitolbooks/3cbe8f60-fdf9-4b98-b0ea-212e494ad9e5.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0042",
    "accessionNumber": "ACC-CAP-0042",
    "title": "Brunner & Suddarth's Textbook of Medical-Surgical Nursing (10th Edition, Volume 1)",
    "author": "Suzanne C. Smeltzer",
    "authors": [
      "Suzanne C. Smeltzer",
      "Brenda G. Bare"
    ],
    "category": "Medical Reference",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-01",
    "publisher": "Lippincott Williams & Wilkins",
    "publicationYear": 2004,
    "status": "available",
    "available": true,
    "description": "Authoritative major medical reference textbook on pathophysiological concepts, clinical nursing management, surgical care, pharmacology, and patient care planning.",
    "coverUrl": "/capitolbooks/3fe67722-db50-46ff-a6b4-c11565b4daf6.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0043",
    "accessionNumber": "ACC-CAP-0043",
    "title": "The True Story of Heavenly Culture, World Peace, Restoration of Light (HWPL): Peace and Cessation of War",
    "author": "Heavenly Culture, World Peace, Restoration of Light",
    "authors": [
      "HWPL International Peace Delegation"
    ],
    "category": "Peace & Order",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-03",
    "publisher": "HWPL Publishing",
    "publicationYear": 2018,
    "status": "available",
    "available": true,
    "description": "Documentation of global peace initiatives, conflict cessation agreements, civil mediation, and the Declaration of Peace and Cessation of War (DPCW) (Peace & Order Corner).",
    "coverUrl": "/capitolbooks/3ff4c4cc-0885-4237-82d7-f3ce7a9930fb.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0044",
    "accessionNumber": "ACC-CAP-0044",
    "title": "Andrews' Diseases of the Skin: Clinical Dermatology (Eighth Edition)",
    "author": "Harry L. Arnold",
    "authors": [
      "Harry L. Arnold",
      "Richard B. Odom",
      "William D. James"
    ],
    "category": "Medical Reference",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-01",
    "publisher": "W.B. Saunders Company",
    "publicationYear": 1990,
    "status": "available",
    "available": true,
    "description": "Comprehensive medical reference on clinical dermatopathology, cutaneous manifestations, cutaneous oncology, bacterial and fungal infections, and topical therapy.",
    "coverUrl": "/capitolbooks/416dbef1-b037-4761-ace7-68ffd2de54b8.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0045",
    "accessionNumber": "ACC-CAP-0045",
    "title": "Foye's Principles of Medicinal Chemistry (Fifth Edition)",
    "author": "David A. Williams",
    "authors": [
      "David A. Williams",
      "Thomas L. Lemke"
    ],
    "category": "Medical Reference",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-01",
    "publisher": "Lippincott Williams & Wilkins",
    "publicationYear": 2002,
    "status": "available",
    "available": true,
    "description": "Foundational pharmaceutical chemistry reference analyzing drug molecular structures, target receptors, pharmacokinetics, stereochemistry, and drug metabolism.",
    "coverUrl": "/capitolbooks/42bcdbb0-1819-4211-9f75-9f9e7a927fe5.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0046",
    "accessionNumber": "ACC-CAP-0046",
    "title": "Head and Neck Cancer: A Multidisciplinary Approach (Second Edition)",
    "author": "Louis B. Harrison",
    "authors": [
      "Louis B. Harrison",
      "Roy B. Sessions",
      "Waun Ki Hong"
    ],
    "category": "Medical Reference",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-02",
    "publisher": "Lippincott Williams & Wilkins",
    "publicationYear": 2004,
    "status": "available",
    "available": true,
    "description": "Multidisciplinary clinical oncology treatise detailing surgical resections, radiation oncology, chemotherapeutic protocols, and reconstructive surgery for head and neck malignancies.",
    "coverUrl": "/capitolbooks/462ceea2-acec-4010-ae7e-6adac2878ae0.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0047",
    "accessionNumber": "ACC-CAP-0047",
    "title": "Business Law and the Regulatory Environment: Concepts and Cases (Ninth Edition)",
    "author": "Michael B. Metzger",
    "authors": [
      "Michael B. Metzger",
      "Jane P. Mallor",
      "A. James Barnes",
      "Thomas Bowers",
      "Michael J. Phillips",
      "Arlen W. Langvardt"
    ],
    "category": "Law",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-02",
    "publisher": "Richard D. Irwin / McGraw-Hill",
    "publicationYear": 1995,
    "status": "available",
    "available": true,
    "description": "Comprehensive casebook examining corporate law, contracts, property rights, tort liability, antitrust regulations, and governmental business supervision.",
    "coverUrl": "/capitolbooks/4978d5a0-07be-4de4-b26e-dba9a1da8537.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0048",
    "accessionNumber": "ACC-CAP-0048",
    "title": "Modern Criminal Procedure: Cases, Comments, and Questions (Tenth Edition)",
    "author": "Yale Kamisar",
    "authors": [
      "Yale Kamisar",
      "Wayne R. LaFave",
      "Jerold H. Israel",
      "Nancy J. King"
    ],
    "category": "Law",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-02",
    "publisher": "West Group",
    "publicationYear": 2002,
    "status": "available",
    "available": true,
    "description": "Authoritative American Casebook Series treatise on search and seizure, constitutional arrest protections, interrogation rights, confessions, grand juries, and trial proceedings.",
    "coverUrl": "/capitolbooks/4d016b00-a127-4359-a499-1c825796e228.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0049",
    "accessionNumber": "ACC-CAP-0049",
    "title": "The World Almanac and Book of Facts 2007",
    "author": "World Almanac Books",
    "authors": [
      "World Almanac Editorial Staff"
    ],
    "category": "Reference",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-01",
    "publisher": "World Almanac Books",
    "publicationYear": 2007,
    "status": "available",
    "available": true,
    "description": "Essential desk almanac and compendium of worldwide statistics, demographic data, global historical events, economic records, and scientific milestones.",
    "coverUrl": "/capitolbooks/502ae3c2-2e8a-4072-afd9-7f79bf1455a0.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0050",
    "accessionNumber": "ACC-CAP-0050",
    "title": "Principles of Surgery (Sixth Edition, International Edition)",
    "author": "Seymour I. Schwartz",
    "authors": [
      "Seymour I. Schwartz",
      "G. Tom Shires",
      "Frank C. Spencer"
    ],
    "category": "Medical Reference",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-02",
    "publisher": "McGraw-Hill",
    "publicationYear": 1994,
    "status": "available",
    "available": true,
    "description": "Benchmark surgical textbook covering trauma life support, perioperative care, organ transplantation, oncology surgery, and advanced gastrointestinal operations.",
    "coverUrl": "/capitolbooks/52b3c951-201e-4876-97fa-63e58ab96dfd.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0051",
    "accessionNumber": "ACC-CAP-0051",
    "title": "Harcourt Science (Georgia Edition - Red-Eyed Tree Frog)",
    "author": "Robert M. Jones",
    "authors": [
      "Robert M. Jones",
      "Joyce K. Malcolm",
      "Gerald H. Krockover"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01",
    "publisher": "Harcourt School Publishers",
    "publicationYear": 2000,
    "status": "available",
    "available": true,
    "description": "Primary school science curriculum connecting ecosystems, animal adaptations, earth science, and physical properties with vibrant visuals and inquiry labs.",
    "coverUrl": "/capitolbooks/55e35495-8591-43bd-96b8-d694485311e1.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0052",
    "accessionNumber": "ACC-CAP-0052",
    "title": "The Oxford Dictionary of Islam",
    "author": "John L. Esposito",
    "authors": [
      "John L. Esposito"
    ],
    "category": "Reference",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-01",
    "publisher": "Oxford University Press",
    "publicationYear": 2003,
    "status": "available",
    "available": true,
    "description": "Authoritative academic reference covering Islamic theology, historical dynasties, jurisprudence (shariah), philosophy, regional cultures, and modern social institutions.",
    "coverUrl": "/capitolbooks/57c84cda-b709-4b27-abb5-ba88c7224362.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0053",
    "accessionNumber": "ACC-CAP-0053",
    "title": "Harcourt Science (Grade 4 Edition - Chameleon)",
    "author": "Robert M. Jones",
    "authors": [
      "Robert M. Jones",
      "Joyce K. Malcolm"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01",
    "publisher": "Harcourt School Publishers",
    "publicationYear": 2002,
    "status": "available",
    "available": true,
    "description": "Elementary science textbook exploring living things, habitats, weather patterns, matter and energy, and technology applications designed for young learners.",
    "coverUrl": "/capitolbooks/58b13e08-e387-4574-b2db-fb6d35cbf47e.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0054",
    "accessionNumber": "ACC-CAP-0054",
    "title": "The Earth: An Introduction to Physical Geology (Fourth Edition)",
    "author": "Edward J. Tarbuck",
    "authors": [
      "Edward J. Tarbuck",
      "Frederick K. Lutgens"
    ],
    "category": "Science & Engineering",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-02",
    "publisher": "Macmillan Publishing Company",
    "publicationYear": 1993,
    "status": "available",
    "available": true,
    "description": "Comprehensive introduction to physical geology analyzing plate tectonics, mineralogy, igneous and sedimentary formations, earthquakes, and geomorphology.",
    "coverUrl": "/capitolbooks/59c96c5d-a1d9-479f-a021-e9c309df7204.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0055",
    "accessionNumber": "ACC-CAP-0055",
    "title": "Biology: Concepts and Applications",
    "author": "Cecie Starr",
    "authors": [
      "Cecie Starr",
      "Ralph Taggart"
    ],
    "category": "Science & Engineering",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-02",
    "publisher": "Wadsworth Publishing",
    "publicationYear": 2000,
    "status": "available",
    "available": true,
    "description": "Foundational university biology text focusing on cellular architecture, genetics, evolutionary theory, plant physiology, animal biology, and ecological balances.",
    "coverUrl": "/capitolbooks/5c218a19-ed0d-4d8b-8f58-5106b3ac2901.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0056",
    "accessionNumber": "ACC-CAP-0056",
    "title": "Civil Code of the Philippines: Republic Act No. 386 as Amended (Fifth 1990 Edition)",
    "author": "CBSI Editorial Staff",
    "authors": [
      "CBSI Editorial Staff"
    ],
    "category": "Law",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-02",
    "publisher": "Central Book Supply, Inc.",
    "publicationYear": 1990,
    "status": "available",
    "available": true,
    "description": "Complete legal compilation of Republic Act No. 386 including the Family Code of the Philippines (EO 209), property rights, obligations and contracts, and succession law.",
    "coverUrl": "/capitolbooks/6435fada-0ebf-4406-8acb-bec125d2be27.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0057",
    "accessionNumber": "ACC-CAP-0057",
    "title": "Theory and Practice of Public Administration in the Philippines",
    "author": "Avelino P. Tendero",
    "authors": [
      "Avelino P. Tendero"
    ],
    "category": "Public Administration",
    "section": "Filipiniana Section",
    "shelf": "Shelf F-02",
    "publisher": "Fiscal Administration Foundation / UP",
    "publicationYear": 1993,
    "status": "available",
    "available": true,
    "description": "Filipiniana treatise on Philippine civil service systems, bureaucratic behavior, government decentralization under the Local Government Code, and public sector management.",
    "coverUrl": "/capitolbooks/69c84dd2-d438-4b8e-9f49-b26344e5c580.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0058",
    "accessionNumber": "ACC-CAP-0058",
    "title": "Fundamentals of Pediatrics: Competency-based (Volume 1)",
    "author": "Xerxes R. Navarro",
    "authors": [
      "Xerxes R. Navarro",
      "Aurora F. Bauzon",
      "Juliet S. Aguilar",
      "Olympia Q. Malanyaon"
    ],
    "category": "Medical Reference",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-02",
    "publisher": "Pediatric Association of the Philippines",
    "publicationYear": 2001,
    "status": "available",
    "available": true,
    "description": "Authoritative Philippine pediatric clinical textbook outlining childhood growth milestones, neonatal resuscitation, infectious disease management, and nutritional health.",
    "coverUrl": "/capitolbooks/6ca22900-e0ba-4fea-8f89-bec13f26fd00.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0059",
    "accessionNumber": "ACC-CAP-0059",
    "title": "The Law on Income Taxation (1998 Edition)",
    "author": "Benjamin D. Teodoro",
    "authors": [
      "Benjamin D. Teodoro",
      "Hector S. De Leon"
    ],
    "category": "Law",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-02",
    "publisher": "Rex Book Store",
    "publicationYear": 1998,
    "status": "available",
    "available": true,
    "description": "Comprehensive commentary on Philippine National Internal Revenue Code tax provisions, gross income computations, corporate deductions, withholding taxes, and case solutions.",
    "coverUrl": "/capitolbooks/7ba6bdeb-f2ab-4c26-8bd3-eaf3a3dea916.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0060",
    "accessionNumber": "ACC-CAP-0060",
    "title": "La Solidaridad: Quincenario democratico (Volume I 1889)",
    "author": "Jose Rizal",
    "authors": [
      "Jose Rizal",
      "Marcelo H. Del Pilar",
      "Graciano Lopez Jaena"
    ],
    "category": "Historical Periodicals",
    "section": "Periodical Section (Includes Journal, Magazine, Leaflets, Brochures, Clippings)",
    "shelf": "Shelf P-01",
    "publisher": "Fundacion Santiago / National Historical Institute",
    "publicationYear": 1889,
    "status": "available",
    "available": true,
    "description": "The historic premier volume of the biweekly newspaper of the Philippine Reform Movement, published in Barcelona in 1889 by Graciano Lopez Jaena and fellow reformists.",
    "coverUrl": "/capitolbooks/7c807bcf-cde6-4d32-a14e-da120b8c6243.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0061",
    "accessionNumber": "ACC-CAP-0061",
    "title": "The High Cost of Motoring in the Philippines",
    "author": "Armando Ang",
    "authors": [
      "Armando Ang"
    ],
    "category": "Filipiniana",
    "section": "Filipiniana Section",
    "shelf": "Shelf F-02",
    "publisher": "Overpopulated Philippines Publications",
    "publicationYear": 2005,
    "status": "available",
    "available": true,
    "description": "Socio-economic expose analyzing metropolitan traffic congestion, car maintenance costs, fuel taxes, urban planning failures, and public transport alternatives in the Philippines.",
    "coverUrl": "/capitolbooks/827d01b0-6bc3-46cf-b880-508c15ccb289.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0062",
    "accessionNumber": "ACC-CAP-0062",
    "title": "La Solidaridad: Quincenario democratico (Volume III 1891)",
    "author": "Jose Rizal",
    "authors": [
      "Jose Rizal",
      "Marcelo H. Del Pilar",
      "Graciano Lopez Jaena"
    ],
    "category": "Historical Periodicals",
    "section": "Periodical Section (Includes Journal, Magazine, Leaflets, Brochures, Clippings)",
    "shelf": "Shelf P-01",
    "publisher": "Fundacion Santiago / National Historical Institute",
    "publicationYear": 1891,
    "status": "available",
    "available": true,
    "description": "Archival volume compiling 1891 issues of La Solidaridad under Marcelo H. del Pilar's editorship, containing sharp debates on friar estates and Filipino civil rights.",
    "coverUrl": "/capitolbooks/8ba0c263-7603-406b-82da-6d943c4a996e.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0063",
    "accessionNumber": "ACC-CAP-0063",
    "title": "Guyton and Hall Textbook of Medical Physiology (Twelfth Edition)",
    "author": "John E. Hall",
    "authors": [
      "John E. Hall"
    ],
    "category": "Medical Reference",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-01",
    "publisher": "Saunders / Elsevier",
    "publicationYear": 2011,
    "status": "available",
    "available": true,
    "description": "World-renowned physiology textbook explaining human circulatory dynamics, renal mechanisms, neurophysiology, endocrine controls, and cellular homeostatic mechanisms.",
    "coverUrl": "/capitolbooks/92b43670-0cfb-4100-94b2-641ac13fc3a3.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0064",
    "accessionNumber": "ACC-CAP-0064",
    "title": "The Philippines In the 6th to 16th Centuries",
    "author": "E. P. Patanñe",
    "authors": [
      "E. P. Patanñe"
    ],
    "category": "Filipiniana",
    "section": "Filipiniana Section",
    "shelf": "Shelf F-01",
    "publisher": "LFS Communications",
    "publicationYear": 1996,
    "status": "available",
    "available": true,
    "description": "Exhaustive historical study of pre-colonial Philippine polities, Asian maritime trade networks, porcelain artifacts, metal crafts, and indigenous societal structures.",
    "coverUrl": "/capitolbooks/957bcc2b-af4c-4ebb-a839-4609f3a4338c.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0065",
    "accessionNumber": "ACC-CAP-0065",
    "title": "How to Protect Your Property and Business from Lawsuits: Judgment Proof (Philippine Asset Protection Law)",
    "author": "Jim V. Lopez",
    "authors": [
      "Jim V. Lopez"
    ],
    "category": "Law",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-02",
    "publisher": "Anvil Publishing",
    "publicationYear": 2001,
    "status": "available",
    "available": true,
    "description": "Practical legal treatise on shielding corporate and personal assets from litigation, managing creditors, structuring trusts, and complying with Philippine commercial law.",
    "coverUrl": "/capitolbooks/967eaea3-5d5e-4df4-af17-783968c8d48d.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0066",
    "accessionNumber": "ACC-CAP-0066",
    "title": "From Macapagal to Macapagal-Arroyo: My 42 years inside Malacañang",
    "author": "Carmen \"Ching\" de los Santos-Suva",
    "authors": [
      "Carmen \"Ching\" de los Santos-Suva"
    ],
    "category": "Political Science & Governance",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-01",
    "publisher": "Anvil Publishing",
    "publicationYear": 2006,
    "status": "available",
    "available": true,
    "description": "Firsthand insider memoir covering four decades of presidential governance, state events, crisis handling, and leadership transitions across seven Philippine presidents (Governor's Collection).",
    "coverUrl": "/capitolbooks/98a69e9a-1770-4e58-8ff9-f53a701583d7.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0067",
    "accessionNumber": "ACC-CAP-0067",
    "title": "Clinical Anesthesia (Sixth Edition)",
    "author": "Paul G. Barash",
    "authors": [
      "Paul G. Barash",
      "Bruce F. Cullen",
      "Robert K. Stoelting"
    ],
    "category": "Medical Reference",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-02",
    "publisher": "Lippincott Williams & Wilkins",
    "publicationYear": 2009,
    "status": "available",
    "available": true,
    "description": "Definitive clinical anesthesia reference covering airway management, regional anesthesia techniques, hemodynamics, monitoring protocols, and critical care medicine.",
    "coverUrl": "/capitolbooks/9c273aed-e469-46d5-9ef8-45266987e535.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0068",
    "accessionNumber": "ACC-CAP-0068",
    "title": "Sexually Transmitted Diseases (Third Edition)",
    "author": "King K. Holmes",
    "authors": [
      "King K. Holmes",
      "P. Frederick Sparling",
      "Per-Anders Mårdh",
      "Stanley M. Lemon",
      "Walter E. Stamm",
      "Peter Piot",
      "Judith N. Wasserheit"
    ],
    "category": "Health & Medicine",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-04",
    "publisher": "McGraw-Hill",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "International clinical and epidemiological standard textbook on reproductive pathogens, STI diagnosis, treatment regimens, public health interventions, and HIV/AIDS management (GAD Corner).",
    "coverUrl": "/capitolbooks/a9c5f4ee-c36e-4495-a96f-581df2ecce10.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0069",
    "accessionNumber": "ACC-CAP-0069",
    "title": "Zoology (Ninth Edition, International Edition)",
    "author": "Stephen A. Miller",
    "authors": [
      "Stephen A. Miller",
      "John P. Harley"
    ],
    "category": "Science & Engineering",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-02",
    "publisher": "McGraw-Hill",
    "publicationYear": 2013,
    "status": "available",
    "available": true,
    "description": "Comprehensive invertebrate and vertebrate zoology textbook detailing phylogenetic relationships, animal morphology, physiology, and ecological adaptations.",
    "coverUrl": "/capitolbooks/ab39c1c7-b1e1-48df-ba17-a7c6c64357e2.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0070",
    "accessionNumber": "ACC-CAP-0070",
    "title": "Abnormal Psychology and Modern Life (5th Edition)",
    "author": "James C. Coleman",
    "authors": [
      "James C. Coleman"
    ],
    "category": "Social Sciences",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf B-01",
    "publisher": "Scott, Foresman and Company",
    "publicationYear": 1976,
    "status": "available",
    "available": true,
    "description": "Seminal psychology textbook examining psychological disorders, psychiatric classifications, behavioral etiologies, psychotherapies, and community mental health.",
    "coverUrl": "/capitolbooks/ac74adc9-2715-487f-8059-c5e9345cd4ba.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0071",
    "accessionNumber": "ACC-CAP-0071",
    "title": "Human Biology (Sixth Edition, Thomson Asian Edition)",
    "author": "Cecie Starr",
    "authors": [
      "Cecie Starr",
      "Beverly McMillan"
    ],
    "category": "Science & Engineering",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-02",
    "publisher": "Thomson Brooks/Cole",
    "publicationYear": 2005,
    "status": "available",
    "available": true,
    "description": "Visual textbook examining organ systems, human immunology, genetics, cellular respiration, homeostasis, and environmental impacts on human health.",
    "coverUrl": "/capitolbooks/af6ccbbb-a8ef-403b-a9d9-a5fa077f7076.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0072",
    "accessionNumber": "ACC-CAP-0072",
    "title": "Holt Science & Technology: Physical Science (California Edition)",
    "author": "Holt, Rinehart and Winston",
    "authors": [
      "Holt, Rinehart and Winston Science Team"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01",
    "publisher": "Holt, Rinehart and Winston",
    "publicationYear": 2001,
    "status": "available",
    "available": true,
    "description": "Interactive secondary physical science textbook covering mechanics, chemical interactions, waves, optics, and energy transfer with integrated laboratory exercises.",
    "coverUrl": "/capitolbooks/b4337674-a068-4346-b205-5031d86be80b.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0073",
    "accessionNumber": "ACC-CAP-0073",
    "title": "Physics for Scientists and Engineers with Modern Physics (6th Edition)",
    "author": "Raymond A. Serway",
    "authors": [
      "Raymond A. Serway",
      "John W. Jewett"
    ],
    "category": "Science & Engineering",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-02",
    "publisher": "Thomson Brooks/Cole",
    "publicationYear": 2004,
    "status": "available",
    "available": true,
    "description": "Authoritative calculus-based physics text detailing Newtonian mechanics, thermodynamics, electromagnetism, wave optics, relativity, and quantum physics.",
    "coverUrl": "/capitolbooks/b4acf8f5-8396-4c93-b592-734c8ed87167.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0074",
    "accessionNumber": "ACC-CAP-0074",
    "title": "1996 Griffith's 5 Minute Clinical Consult",
    "author": "Mark R. Dambro",
    "authors": [
      "Mark R. Dambro"
    ],
    "category": "Medical Reference",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-01",
    "publisher": "Williams & Wilkins",
    "publicationYear": 1996,
    "status": "available",
    "available": true,
    "description": "High-yield rapid medical reference providing quick access to diagnostic criteria, laboratory evaluations, differential diagnoses, and treatment options for hundreds of medical conditions.",
    "coverUrl": "/capitolbooks/b8959dd5-5eb7-4e98-90d4-145d192a1cf7.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0075",
    "accessionNumber": "ACC-CAP-0075",
    "title": "Maternal & Child Health Nursing: Care of the Childbearing & Childrearing Family (Fifth Edition, Volume 2)",
    "author": "Adele Pillitteri",
    "authors": [
      "Adele Pillitteri"
    ],
    "category": "Health & Medicine",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-04",
    "publisher": "Lippincott Williams & Wilkins",
    "publicationYear": 2007,
    "status": "available",
    "available": true,
    "description": "Comprehensive maternal and pediatric nursing textbook on perinatal nursing, labor management, high-risk neonatal care, and family-centered health promotion (GAD Corner).",
    "coverUrl": "/capitolbooks/b8a9f50a-3c9f-43a4-9e70-a163417b69b2.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0076",
    "accessionNumber": "ACC-CAP-0076",
    "title": "Robbins and Cotran Pathologic Basis of Disease (Eighth Edition)",
    "author": "Vinay Kumar",
    "authors": [
      "Vinay Kumar",
      "Abul K. Abbas",
      "Nelson Fausto",
      "Jon C. Aster"
    ],
    "category": "Medical Reference",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-02",
    "publisher": "Saunders / Elsevier",
    "publicationYear": 2010,
    "status": "available",
    "available": true,
    "description": "The gold-standard medical pathology textbook examining cellular injury, inflammation, neoplasia, genetic diseases, and systemic organ pathology.",
    "coverUrl": "/capitolbooks/bd9f4bd6-ad3b-47e0-b3b9-f7bce632657b.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0077",
    "accessionNumber": "ACC-CAP-0077",
    "title": "Harcourt Science (California Edition - Grade 3 Tiger Cub)",
    "author": "Robert M. Jones",
    "authors": [
      "Robert M. Jones",
      "Joyce K. Malcolm"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01",
    "publisher": "Harcourt School Publishers",
    "publicationYear": 2000,
    "status": "available",
    "available": true,
    "description": "Elementary school science book investigating plant structures, animal behaviors, geology rocks and minerals, and matter changes designed for grade 3 children.",
    "coverUrl": "/capitolbooks/c763d452-545e-40bf-bdba-99f75ead24f8.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0078",
    "accessionNumber": "ACC-CAP-0078",
    "title": "Campbell's Urology (Seventh Edition, Volume 1)",
    "author": "Patrick C. Walsh",
    "authors": [
      "Patrick C. Walsh",
      "Alan B. Retik",
      "E. Darracott Vaughan",
      "Alan J. Wein"
    ],
    "category": "Medical Reference",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-01",
    "publisher": "W.B. Saunders Company",
    "publicationYear": 1998,
    "status": "available",
    "available": true,
    "description": "Authoritative multi-volume urology surgical reference addressing renal physiology, urinary tract diagnostics, endoscopic procedures, urologic oncology, and reconstructive surgery.",
    "coverUrl": "/capitolbooks/c7ad4a8b-ff87-4ea2-a141-5f29769e06c0.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0079",
    "accessionNumber": "ACC-CAP-0079",
    "title": "Chemistry (10th Edition)",
    "author": "Raymond Chang",
    "authors": [
      "Raymond Chang"
    ],
    "category": "Science & Engineering",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-02",
    "publisher": "McGraw-Hill",
    "publicationYear": 2010,
    "status": "available",
    "available": true,
    "description": "Acclaimed college chemistry textbook featuring rigorous foundations in stoichiometry, thermochemistry, quantum theory, chemical equilibrium, acids and bases, and electrochemistry.",
    "coverUrl": "/capitolbooks/c8d515fb-93ca-467e-927e-5cceea98fb36.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0080",
    "accessionNumber": "ACC-CAP-0080",
    "title": "Psychiatric Mental Health Nursing",
    "author": "Faye Gary",
    "authors": [
      "Faye Gary",
      "Charlene Kate Kavanagh"
    ],
    "category": "Medical Reference",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-01",
    "publisher": "J.B. Lippincott Company",
    "publicationYear": 1991,
    "status": "available",
    "available": true,
    "description": "Clinical psychiatric nursing textbook discussing therapeutic communication, crisis intervention, mood disorders, schizophrenia, substance abuse rehabilitation, and psychopharmacology.",
    "coverUrl": "/capitolbooks/cac2baec-fd27-498d-9c29-cab9789052e0.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0081",
    "accessionNumber": "ACC-CAP-0081",
    "title": "University Physics",
    "author": "Wolfgang Bauer",
    "authors": [
      "Wolfgang Bauer",
      "Gary D. Westfall"
    ],
    "category": "Science & Engineering",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-02",
    "publisher": "McGraw-Hill",
    "publicationYear": 2011,
    "status": "available",
    "available": true,
    "description": "Modern university physics textbook emphasizing deep conceptual understanding, computational thinking, mechanics, electricity, magnetism, optics, and contemporary physics discoveries.",
    "coverUrl": "/capitolbooks/d57e5c1e-fef5-42f4-af61-0b3b6efb2eb6.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0082",
    "accessionNumber": "ACC-CAP-0082",
    "title": "Medical Assisting: Administrative and Clinical Procedures with Anatomy and Physiology (5e)",
    "author": "Kathryn A. Booth",
    "authors": [
      "Kathryn A. Booth",
      "Leesa G. Whicker",
      "Terri D. Wyman"
    ],
    "category": "Medical Reference",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-02",
    "publisher": "McGraw-Hill Education",
    "publicationYear": 2013,
    "status": "available",
    "available": true,
    "description": "Comprehensive medical assisting manual integrating healthcare administration, medical coding, clinical triage, phlebotomy, ECG operation, and human anatomy fundamentals.",
    "coverUrl": "/capitolbooks/d8b09aa5-51fc-4ae0-8320-f8d9a6bdafd1.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0083",
    "accessionNumber": "ACC-CAP-0083",
    "title": "Molecular Biology of the Cell (Third Edition)",
    "author": "Bruce Alberts",
    "authors": [
      "Bruce Alberts",
      "Dennis Bray",
      "Julian Lewis",
      "Martin Raff",
      "Keith Roberts",
      "James D. Watson"
    ],
    "category": "Medical Reference",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-02",
    "publisher": "Garland Publishing",
    "publicationYear": 1994,
    "status": "available",
    "available": true,
    "description": "Classic monumental cellular biology reference covering nucleic acid replication, protein sorting, cell cycle regulation, signal transduction pathways, and molecular genetics.",
    "coverUrl": "/capitolbooks/d906cdad-d940-41c2-b70f-708323901d34.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0084",
    "accessionNumber": "ACC-CAP-0084",
    "title": "Current Surgical Therapy (Ninth Edition)",
    "author": "John L. Cameron",
    "authors": [
      "John L. Cameron"
    ],
    "category": "Medical Reference",
    "section": "Reserved Section (M.R. Books)",
    "shelf": "Shelf M-02",
    "publisher": "Mosby / Elsevier",
    "publicationYear": 2008,
    "status": "available",
    "available": true,
    "description": "Authoritative reference for general surgeons detailing optimal surgical procedures, operative complications, critical care decisions, and innovative minimally invasive techniques.",
    "coverUrl": "/capitolbooks/d9bd98b4-a75b-47ea-8297-78cc36f07687.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0085",
    "accessionNumber": "ACC-CAP-0085",
    "title": "Philippine Cultural Disasters: Essays On an Age of Hyper Consumption",
    "author": "R. Kwan Laurel",
    "authors": [
      "R. Kwan Laurel"
    ],
    "category": "Filipiniana",
    "section": "Filipiniana Section",
    "shelf": "Shelf F-02",
    "publisher": "Milflores Publishing",
    "publicationYear": 2001,
    "status": "available",
    "available": true,
    "description": "Filipiniana cultural critiques and essays examining consumerist lifestyles, mass media representations, national literature, and contemporary socio-political consciousness in the Philippines.",
    "coverUrl": "/capitolbooks/dac6f628-0619-4813-8867-4fef92b10b99.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0086",
    "accessionNumber": "ACC-CAP-0086",
    "title": "Harcourt Science (California Edition - Grade 5 Butterfly)",
    "author": "Robert M. Jones",
    "authors": [
      "Robert M. Jones",
      "Joyce K. Malcolm"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01",
    "publisher": "Harcourt School Publishers",
    "publicationYear": 2000,
    "status": "available",
    "available": true,
    "description": "Elementary science textbook exploring living systems, cellular processes, weather cycles, astronomy, and chemical mixtures designed for upper elementary pupils.",
    "coverUrl": "/capitolbooks/ddfb16b8-38f1-4481-8046-e4c0daa2f75a.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0087",
    "accessionNumber": "ACC-CAP-0087",
    "title": "La Solidaridad: Quincenario democratico (Volume VII 1895)",
    "author": "Jose Rizal",
    "authors": [
      "Jose Rizal",
      "Marcelo H. Del Pilar",
      "Graciano Lopez Jaena"
    ],
    "category": "Historical Periodicals",
    "section": "Periodical Section (Includes Journal, Magazine, Leaflets, Brochures, Clippings)",
    "shelf": "Shelf P-01",
    "publisher": "Fundacion Santiago / National Historical Institute",
    "publicationYear": 1895,
    "status": "available",
    "available": true,
    "description": "Final historical volume of La Solidaridad published in Madrid in 1895 during the climax of the reformist campaign on the eve of the Philippine Revolution.",
    "coverUrl": "/capitolbooks/e27d8ecc-3121-4a8c-8019-8a73d823e936.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0088",
    "accessionNumber": "ACC-CAP-0088",
    "title": "Why Things Are & Why Things Aren't: The Answers to Life's Greatest Mysteries",
    "author": "Joel Achenbach",
    "authors": [
      "Joel Achenbach"
    ],
    "category": "General Non-Fiction",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf B-01",
    "publisher": "Ballantine Books",
    "publicationYear": 1996,
    "status": "available",
    "available": true,
    "description": "Engaging popular science book exploring intriguing everyday curiosities, human nature, cosmic questions, and common scientific misconceptions with humor and wit.",
    "coverUrl": "/capitolbooks/e55325c1-6973-40a7-80f5-e4f78288bcbe.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0089",
    "accessionNumber": "ACC-CAP-0089",
    "title": "Biology: An Appreciation of Life",
    "author": "M. M. Telser",
    "authors": [
      "M. M. Telser"
    ],
    "category": "Science & Engineering",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf C-02",
    "publisher": "Wadsworth Publishing",
    "publicationYear": 1995,
    "status": "available",
    "available": true,
    "description": "Introductory college life science textbook examining biosphere systems, biodiversity, genetic inheritance, human biology, and environmental stewardship.",
    "coverUrl": "/capitolbooks/e7b05b87-31d5-42c6-8567-ff291e1160cf.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0090",
    "accessionNumber": "ACC-CAP-0090",
    "title": "La Solidaridad: Quincenario democratico (Volume II 1890)",
    "author": "Jose Rizal",
    "authors": [
      "Jose Rizal",
      "Marcelo H. Del Pilar",
      "Graciano Lopez Jaena"
    ],
    "category": "Historical Periodicals",
    "section": "Periodical Section (Includes Journal, Magazine, Leaflets, Brochures, Clippings)",
    "shelf": "Shelf P-01",
    "publisher": "Fundacion Santiago / National Historical Institute",
    "publicationYear": 1890,
    "status": "available",
    "available": true,
    "description": "Volume II of La Solidaridad containing historic political essays, polemics, and manifestos published during 1890 at the peak of the Propaganda Movement.",
    "coverUrl": "/capitolbooks/f5334e6c-78c9-4d55-a2b3-b59c115c1f3d.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0091",
    "accessionNumber": "ACC-CAP-0091",
    "title": "Blaustein's Pathology of the Female Genital Tract (Fifth Edition)",
    "author": "Robert J. Kurman",
    "authors": [
      "Robert J. Kurman"
    ],
    "category": "Health & Medicine",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-04",
    "publisher": "Springer",
    "publicationYear": 2002,
    "status": "available",
    "available": true,
    "description": "Authoritative medical textbook on gynecologic histopathology, ovarian neoplasms, uterine sarcomas, cervical cytopathology, and women's oncology (GAD Corner).",
    "coverUrl": "/capitolbooks/f565f79e-9f36-4f13-9bbd-d331d8e8ef78.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0092",
    "accessionNumber": "ACC-CAP-0092",
    "title": "The Continuing Revolution: Meeting the Challenges of Development and Poverty Reduction",
    "author": "Fidel V. Ramos",
    "authors": [
      "Fidel V. Ramos"
    ],
    "category": "Political Science & Governance",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-01",
    "publisher": "Friends of Steady Eddie / Ramos Peace and Development Foundation",
    "publicationYear": 2001,
    "status": "available",
    "available": true,
    "description": "Comprehensive political and economic volume by former Philippine President Fidel V. Ramos on governance reforms, peace diplomacy in Mindanao, and national poverty alleviation strategies (Governor's Collection).",
    "coverUrl": "/capitolbooks/f8a0c484-c021-4c5d-a45a-dd7040048eed.webp",
    "source": "Misamis Oriental Capitol Public Library"
  },
  {
    "barcode": "LIB-CAP-0093",
    "accessionNumber": "ACC-CAP-0093",
    "title": "A Vision for a Drug-Free Philippines",
    "author": "Senator Vicente C. Sotto III",
    "authors": [
      "Senator Vicente C. Sotto III"
    ],
    "category": "Law & Public Policy",
    "section": "Special Collection Section (Includes Law Books, GAD Corner, Peace & Order Corner & Governor's Collection)",
    "shelf": "Shelf S-03",
    "publisher": "Senate of the Philippines",
    "publicationYear": 1994,
    "status": "available",
    "available": true,
    "description": "Policy treatise and legislative agenda on comprehensive anti-drug programs, community law enforcement, rehabilitation, and peace and order governance in the Philippines (Peace & Order Corner).",
    "coverUrl": "/capitolbooks/fc0bb3e7-5e77-4edf-8222-a8c54f3c14f3.webp",
    "source": "Misamis Oriental Capitol Public Library"
  }
];

async function seedCapitol() {
  try {
    console.log("Connecting to Supabase for Capitol Books Seeding...");

    let insertedCount = 0;
    let updatedCount = 0;

    for (const bookData of capitolBooks) {
      const payload = {
        barcode: bookData.barcode,
        accession_number: bookData.accessionNumber || null,
        title: bookData.title,
        author: bookData.author || "Unknown",
        authors: Array.isArray(bookData.authors) ? bookData.authors : [],
        category: bookData.category || "General",
        section: bookData.section || "Circulation Section (includes Fiction Books & Children's Corner)",
        shelf: bookData.shelf || "General Shelf",
        publisher: bookData.publisher || "N/A",
        publication_year: bookData.publicationYear ? Number(bookData.publicationYear) : null,
        status: bookData.status || "available",
        available: bookData.available !== false,
        description: bookData.description || "",
        cover_url: bookData.coverUrl || "",
        source: bookData.source || "Misamis Oriental Capitol Public Library",
        archived: false,
        updated_at: new Date().toISOString()
      };

      // Check existing by barcode
      const { data: existing } = await supabase
        .from("books")
        .select("id")
        .eq("barcode", bookData.barcode)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("books")
          .update(payload)
          .eq("id", existing.id);
        updatedCount++;
        console.log(`Updated: ${bookData.title} (${bookData.barcode})`);
      } else {
        const { error: insertError } = await supabase
          .from("books")
          .insert(payload);

        if (insertError) {
          console.error(`Failed to insert ${bookData.title}:`, insertError.message);
        } else {
          insertedCount++;
          console.log(`Inserted: ${bookData.title} (${bookData.barcode})`);
        }
      }
    }

    console.log(`\n🎉 Done! Processed all ${capitolBooks.length} Capitol books.`);
    console.log(`- Inserted new books: ${insertedCount}`);
    console.log(`- Updated existing books: ${updatedCount}`);

    const { count: totalBooks } = await supabase
      .from("books")
      .select("id", { count: "exact", head: true });
    console.log(`Total books currently in Supabase database: ${totalBooks}`);

    process.exit(0);
  } catch (err) {
    console.error("Error seeding Capitol books:", err);
    process.exit(1);
  }
}

seedCapitol();

