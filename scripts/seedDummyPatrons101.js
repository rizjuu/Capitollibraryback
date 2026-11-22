const bcrypt = require("bcryptjs");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { supabase } = require("../db/supabase");

const DUMMY_STUDENTS = [
  {
    name: "Mark Kenneth Dabalos",
    firstName: "Mark Kenneth",
    lastName: "Dabalos",
    email: "dabalos.markkenneth@gmail.com",
    phone: "09173428190",
    school: "Xavier University – Ateneo de Cagayan",
    yearLevel: "3rd Year College",
    age: 20,
    address: "Barangay Carmen, Cagayan de Oro City",
    date: "2026-10-02T01:15:20.000Z"
  },
  {
    name: "Alyssa Mae Gonzaga",
    firstName: "Alyssa Mae",
    lastName: "Gonzaga",
    email: "alyssa.gonzaga24@gmail.com",
    phone: "09278193401",
    school: "University of Science and Technology of Southern Philippines",
    yearLevel: "2nd Year College",
    age: 19,
    address: "Barangay Lapasan, Cagayan de Oro City",
    date: "2026-10-02T05:30:10.000Z"
  },
  {
    name: "John Paul Caballes",
    firstName: "John Paul",
    lastName: "Caballes",
    email: "caballes.jp2026@gmail.com",
    phone: "09351092847",
    school: "Liceo de Cagayan University",
    yearLevel: "4th Year College",
    age: 21,
    address: "Barangay Nazareth, Cagayan de Oro City",
    date: "2026-10-03T02:45:33.000Z"
  },
  {
    name: "Mary Grace Villanueva",
    firstName: "Mary Grace",
    lastName: "Villanueva",
    email: "mg.villanueva01@gmail.com",
    phone: "09458291034",
    school: "Capitol University",
    yearLevel: "1st Year College",
    age: 18,
    address: "Barangay Kauswagan, Cagayan de Oro City",
    date: "2026-10-03T08:12:45.000Z"
  },
  {
    name: "Joshua Brian Ybañez",
    firstName: "Joshua Brian",
    lastName: "Ybañez",
    email: "ybanez.joshuabrian@gmail.com",
    phone: "09564810293",
    school: "PHINMA – Cagayan de Oro College",
    yearLevel: "3rd Year College",
    age: 20,
    address: "Barangay Macasandig, Cagayan de Oro City",
    date: "2026-10-05T01:50:18.000Z"
  },
  {
    name: "Christine Joy Emano",
    firstName: "Christine Joy",
    lastName: "Emano",
    email: "emano.christinejoy@gmail.com",
    phone: "09663910482",
    school: "Southern Philippines College",
    yearLevel: "2nd Year College",
    age: 19,
    address: "Barangay Bulua, Cagayan de Oro City",
    date: "2026-10-05T06:22:04.000Z"
  },
  {
    name: "Angelo Miguel Roa",
    firstName: "Angelo Miguel",
    lastName: "Roa",
    email: "angelo.roa2005@gmail.com",
    phone: "09774910283",
    school: "Pilgrim Christian College",
    yearLevel: "1st Year College",
    age: 18,
    address: "Barangay Patag, Cagayan de Oro City",
    date: "2026-10-06T03:33:41.000Z"
  },
  {
    name: "Bea Nicole Neri",
    firstName: "Bea Nicole",
    lastName: "Neri",
    email: "neri.beanicole@gmail.com",
    phone: "09958201948",
    school: "Lourdes College",
    yearLevel: "3rd Year College",
    age: 20,
    address: "Barangay Gusa, Cagayan de Oro City",
    date: "2026-10-06T07:14:55.000Z"
  },
  {
    name: "Kyle Francis Vamenta",
    firstName: "Kyle Francis",
    lastName: "Vamenta",
    email: "vamenta.kylef@gmail.com",
    phone: "09051938472",
    school: "Cagayan de Oro National High School",
    yearLevel: "Grade 12 - STEM",
    age: 17,
    address: "Barangay Cugman, Cagayan de Oro City",
    date: "2026-10-07T02:08:19.000Z"
  },
  {
    name: "Princess Dianne Abellanosa",
    firstName: "Princess Dianne",
    lastName: "Abellanosa",
    email: "dianne.abellanosa@gmail.com",
    phone: "09162948103",
    school: "Misamis Oriental General Comprehensive High School",
    yearLevel: "Grade 11 - HUMSS",
    age: 16,
    address: "Barangay Puerto, Cagayan de Oro City",
    date: "2026-10-07T05:42:07.000Z"
  },
  {
    name: "Jericho Valdehuesa",
    firstName: "Jericho",
    lastName: "Valdehuesa",
    email: "jericho.valdehuesa03@gmail.com",
    phone: "09263019485",
    school: "Corpus Christi School",
    yearLevel: "Grade 12 - ABM",
    age: 17,
    address: "Barangay Macasandig, Cagayan de Oro City",
    date: "2026-10-08T01:25:50.000Z"
  },
  {
    name: "Danica Rose Chavez",
    firstName: "Danica Rose",
    lastName: "Chavez",
    email: "danica.chavez04@gmail.com",
    phone: "09364819204",
    school: "Gusa Regional Science High School - X",
    yearLevel: "Grade 11 - STEM",
    age: 16,
    address: "Barangay Gusa, Cagayan de Oro City",
    date: "2026-10-08T06:19:12.000Z"
  },
  {
    name: "Earl Justin Pelaez",
    firstName: "Earl Justin",
    lastName: "Pelaez",
    email: "pelaez.earljustin@gmail.com",
    phone: "09085910294",
    school: "Opol Community College",
    yearLevel: "2nd Year College",
    age: 19,
    address: "Barra, Opol, Misamis Oriental",
    date: "2026-10-09T03:11:05.000Z"
  },
  {
    name: "Kimberly Jane Gaane",
    firstName: "Kimberly Jane",
    lastName: "Gaane",
    email: "gaane.kimberlyjane@gmail.com",
    phone: "09184029184",
    school: "Tagoloan Community College",
    yearLevel: "3rd Year College",
    age: 20,
    address: "Poblacion, Tagoloan, Misamis Oriental",
    date: "2026-10-09T08:04:39.000Z"
  },
  {
    name: "Renz Christian Suan",
    firstName: "Renz Christian",
    lastName: "Suan",
    email: "renzsuan2004@gmail.com",
    phone: "09193029184",
    school: "University of Science and Technology of Southern Philippines",
    yearLevel: "2nd Year College",
    age: 19,
    address: "Barangay Carmen, Cagayan de Oro City",
    date: "2026-10-10T02:50:21.000Z"
  },
  {
    name: "Althea Marie Moreno",
    firstName: "Althea Marie",
    lastName: "Moreno",
    email: "moreno.altheamarie@gmail.com",
    phone: "09204918204",
    school: "Xavier University – Ateneo de Cagayan",
    yearLevel: "1st Year College",
    age: 18,
    address: "Barangay Nazareth, Cagayan de Oro City",
    date: "2026-10-10T07:35:10.000Z"
  },
  {
    name: "Marvin Acenas",
    firstName: "Marvin",
    lastName: "Acenas",
    email: "acenas.marvin02@gmail.com",
    phone: "09283910294",
    school: "Liceo de Cagayan University",
    yearLevel: "4th Year College",
    age: 22,
    address: "Barangay Lapasan, Cagayan de Oro City",
    date: "2026-10-12T01:40:48.000Z"
  },
  {
    name: "Samantha Kate Salcedo",
    firstName: "Samantha Kate",
    lastName: "Salcedo",
    email: "salcedo.samkate@gmail.com",
    phone: "09294019284",
    school: "Capitol University",
    yearLevel: "3rd Year College",
    age: 20,
    address: "Barangay Kauswagan, Cagayan de Oro City",
    date: "2026-10-12T05:15:32.000Z"
  },
  {
    name: "Dexter Casiño",
    firstName: "Dexter",
    lastName: "Casiño",
    email: "dex.casino2003@gmail.com",
    phone: "09395019284",
    school: "PHINMA – Cagayan de Oro College",
    yearLevel: "2nd Year College",
    age: 21,
    address: "Barangay Bulua, Cagayan de Oro City",
    date: "2026-10-13T03:22:15.000Z"
  },
  {
    name: "Trisha Mae Baculio",
    firstName: "Trisha Mae",
    lastName: "Baculio",
    email: "baculio.trishamae@gmail.com",
    phone: "09476019284",
    school: "Southern Philippines College",
    yearLevel: "1st Year College",
    age: 18,
    address: "Barangay Patag, Cagayan de Oro City",
    date: "2026-10-13T07:58:40.000Z"
  },
  {
    name: "Kevin Lance Jamaca",
    firstName: "Kevin Lance",
    lastName: "Jamaca",
    email: "jamaca.kevinlance@gmail.com",
    phone: "09497019284",
    school: "Pilgrim Christian College",
    yearLevel: "3rd Year College",
    age: 20,
    address: "Barangay Macasandig, Cagayan de Oro City",
    date: "2026-10-14T02:18:25.000Z"
  },
  {
    name: "Hazel Joy Obsioma",
    firstName: "Hazel Joy",
    lastName: "Obsioma",
    email: "obsioma.hazeljoy@gmail.com",
    phone: "09988019284",
    school: "Lourdes College",
    yearLevel: "2nd Year College",
    age: 19,
    address: "Barangay Camaman-an, Cagayan de Oro City",
    date: "2026-10-14T06:45:09.000Z"
  },
  {
    name: "Neil Patrick Quilinging",
    firstName: "Neil Patrick",
    lastName: "Quilinging",
    email: "quilinging.neilp@gmail.com",
    phone: "09999019284",
    school: "Golden Heritage Polytechnic College",
    yearLevel: "2nd Year College",
    age: 20,
    address: "Barangay Puntod, Cagayan de Oro City",
    date: "2026-10-15T01:30:17.000Z"
  },
  {
    name: "Clarisse Anne Quicoy",
    firstName: "Clarisse Anne",
    lastName: "Quicoy",
    email: "quicoy.clarisse@gmail.com",
    phone: "09121029384",
    school: "St. Mary's Academy of Carmen",
    yearLevel: "Grade 12 - STEM",
    age: 17,
    address: "Barangay Carmen, Cagayan de Oro City",
    date: "2026-10-15T05:05:54.000Z"
  },
  {
    name: "Dominic Pabayo",
    firstName: "Dominic",
    lastName: "Pabayo",
    email: "dom.pabayo2004@gmail.com",
    phone: "09302039485",
    school: "Kong Hua School",
    yearLevel: "Grade 11 - ABM",
    age: 16,
    address: "Barangay Kauswagan, Cagayan de Oro City",
    date: "2026-10-16T02:40:38.000Z"
  },
  {
    name: "Jessa Marie Sabanal",
    firstName: "Jessa Marie",
    lastName: "Sabanal",
    email: "sabanal.jessamarie@gmail.com",
    phone: "09383049586",
    school: "Asian College of Science and Technology",
    yearLevel: "2nd Year College",
    age: 19,
    address: "Barangay Lapasan, Cagayan de Oro City",
    date: "2026-10-16T07:12:19.000Z"
  },
  {
    name: "Reymart Magdale",
    firstName: "Reymart",
    lastName: "Magdale",
    email: "reymart.magdale01@gmail.com",
    phone: "09464059687",
    school: "STI College Cagayan de Oro",
    yearLevel: "3rd Year College",
    age: 21,
    address: "Barangay Nazareth, Cagayan de Oro City",
    date: "2026-10-17T03:05:44.000Z"
  },
  {
    name: "Shiela May Echem",
    firstName: "Shiela May",
    lastName: "Echem",
    email: "echem.shielamay@gmail.com",
    phone: "09485069788",
    school: "Vineyard International Polytechnic College",
    yearLevel: "1st Year College",
    age: 18,
    address: "Barangay Consolacion, Cagayan de Oro City",
    date: "2026-10-17T08:29:10.000Z"
  },
  {
    name: "Bryan Daing",
    firstName: "Bryan",
    lastName: "Daing",
    email: "daing.bryan2005@gmail.com",
    phone: "09506079899",
    school: "University of Science and Technology of Southern Philippines",
    yearLevel: "2nd Year College",
    age: 19,
    address: "Barangay Balulang, Cagayan de Oro City",
    date: "2026-10-19T01:55:02.000Z"
  },
  {
    name: "Andrea Nicole Salvaleon",
    firstName: "Andrea Nicole",
    lastName: "Salvaleon",
    email: "salvaleon.andrea@gmail.com",
    phone: "09077089900",
    school: "Xavier University – Ateneo de Cagayan",
    yearLevel: "3rd Year College",
    age: 20,
    address: "Barangay Macasandig, Cagayan de Oro City",
    date: "2026-10-19T06:18:37.000Z"
  },
  {
    name: "Kenneth Paul Alambatin",
    firstName: "Kenneth Paul",
    lastName: "Alambatin",
    email: "alambatin.kenneth@gmail.com",
    phone: "09098099011",
    school: "Liceo de Cagayan University",
    yearLevel: "4th Year College",
    age: 22,
    address: "Barangay Iponan, Cagayan de Oro City",
    date: "2026-10-20T02:35:12.000Z"
  },
  {
    name: "Nicole Grace Tan",
    firstName: "Nicole Grace",
    lastName: "Tan",
    email: "tan.nicolegrace03@gmail.com",
    phone: "09109019122",
    school: "Capitol University",
    yearLevel: "2nd Year College",
    age: 19,
    address: "Barangay Carmen, Cagayan de Oro City",
    date: "2026-10-20T07:44:59.000Z"
  },
  {
    name: "Adrian James Uy",
    firstName: "Adrian James",
    lastName: "Uy",
    email: "uy.adrianjames@gmail.com",
    phone: "09610129233",
    school: "PHINMA – Cagayan de Oro College",
    yearLevel: "1st Year College",
    age: 18,
    address: "Barangay Canitoan, Cagayan de Oro City",
    date: "2026-10-21T01:10:45.000Z"
  },
  {
    name: "Michelle Rose Go",
    firstName: "Michelle Rose",
    lastName: "Go",
    email: "michelle.go2004@gmail.com",
    phone: "09631239344",
    school: "Southern Philippines College",
    yearLevel: "3rd Year College",
    age: 20,
    address: "Barangay Bugo, Cagayan de Oro City",
    date: "2026-10-21T05:52:19.000Z"
  },
  {
    name: "Vincent Lim",
    firstName: "Vincent",
    lastName: "Lim",
    email: "vincent.lim2003@gmail.com",
    phone: "09702349455",
    school: "Pilgrim Christian College",
    yearLevel: "2nd Year College",
    age: 21,
    address: "Barangay Tablon, Cagayan de Oro City",
    date: "2026-10-22T03:14:08.000Z"
  },
  {
    name: "Janelle Fernandez",
    firstName: "Janelle",
    lastName: "Fernandez",
    email: "janelle.fernandez04@gmail.com",
    phone: "09813459566",
    school: "Lourdes College",
    yearLevel: "1st Year College",
    age: 18,
    address: "Barangay Agusan, Cagayan de Oro City",
    date: "2026-10-22T08:01:23.000Z"
  },
  {
    name: "Patrick John Mendoza",
    firstName: "Patrick John",
    lastName: "Mendoza",
    email: "mendoza.patrickjohn@gmail.com",
    phone: "09854569677",
    school: "Cagayan de Oro National High School",
    yearLevel: "Grade 12 - STEM",
    age: 17,
    address: "Barangay Macabalan, Cagayan de Oro City",
    date: "2026-10-23T02:20:30.000Z"
  },
  {
    name: "Hannah Ramos",
    firstName: "Hannah",
    lastName: "Ramos",
    email: "ramos.hannah05@gmail.com",
    phone: "09915679788",
    school: "Misamis Oriental General Comprehensive High School",
    yearLevel: "Grade 11 - HUMSS",
    age: 16,
    address: "Barangay Bonbon, Cagayan de Oro City",
    date: "2026-10-23T06:40:11.000Z"
  },
  {
    name: "Rafael Reyes",
    firstName: "Rafael",
    lastName: "Reyes",
    email: "rafael.reyes2004@gmail.com",
    phone: "09926789899",
    school: "Corpus Christi School",
    yearLevel: "Grade 12 - ABM",
    age: 17,
    address: "Barangay Bayabas, Cagayan de Oro City",
    date: "2026-10-24T01:45:50.000Z"
  },
  {
    name: "Charisse Santos",
    firstName: "Charisse",
    lastName: "Santos",
    email: "charisse.santos02@gmail.com",
    phone: "09937899900",
    school: "Gusa Regional Science High School - X",
    yearLevel: "Grade 11 - STEM",
    age: 16,
    address: "Barangay Gusa, Cagayan de Oro City",
    date: "2026-10-24T07:22:40.000Z"
  },
  {
    name: "Carlo Cruz",
    firstName: "Carlo",
    lastName: "Cruz",
    email: "cruz.carlo2005@gmail.com",
    phone: "09948909011",
    school: "Opol Community College",
    yearLevel: "1st Year College",
    age: 18,
    address: "Barra, Opol, Misamis Oriental",
    date: "2026-10-25T02:05:15.000Z"
  },
  {
    name: "Stephanie Bautista",
    firstName: "Stephanie",
    lastName: "Bautista",
    email: "stephanie.bautista03@gmail.com",
    phone: "09179019122",
    school: "Tagoloan Community College",
    yearLevel: "2nd Year College",
    age: 19,
    address: "Poblacion, Tagoloan, Misamis Oriental",
    date: "2026-10-25T05:39:52.000Z"
  },
  {
    name: "Sean Michael Ocampos",
    firstName: "Sean Michael",
    lastName: "Ocampos",
    email: "ocampos.seanm@gmail.com",
    phone: "09270129233",
    school: "University of Science and Technology of Southern Philippines",
    yearLevel: "3rd Year College",
    age: 20,
    address: "Barangay Lapasan, Cagayan de Oro City",
    date: "2026-10-26T01:30:20.000Z"
  },
  {
    name: "Maricar Babor",
    firstName: "Maricar",
    lastName: "Babor",
    email: "maricar.babor04@gmail.com",
    phone: "09351239344",
    school: "Xavier University – Ateneo de Cagayan",
    yearLevel: "2nd Year College",
    age: 19,
    address: "Barangay Nazareth, Cagayan de Oro City",
    date: "2026-10-26T06:12:47.000Z"
  },
  {
    name: "Rochelle Pagara",
    firstName: "Rochelle",
    lastName: "Pagara",
    email: "rochelle.pagara01@gmail.com",
    phone: "09452349455",
    school: "Liceo de Cagayan University",
    yearLevel: "1st Year College",
    age: 18,
    address: "Barangay Carmen, Cagayan de Oro City",
    date: "2026-10-27T02:50:33.000Z"
  },
  {
    name: "Louie Jay Macasero",
    firstName: "Louie Jay",
    lastName: "Macasero",
    email: "macasero.louiejay@gmail.com",
    phone: "09563459566",
    school: "Capitol University",
    yearLevel: "4th Year College",
    age: 22,
    address: "Barangay Kauswagan, Cagayan de Oro City",
    date: "2026-10-27T07:15:18.000Z"
  },
  {
    name: "Kristel Edrote",
    firstName: "Kristel",
    lastName: "Edrote",
    email: "kristel.edrote05@gmail.com",
    phone: "09664569677",
    school: "PHINMA – Cagayan de Oro College",
    yearLevel: "3rd Year College",
    age: 20,
    address: "Barangay Bulua, Cagayan de Oro City",
    date: "2026-10-28T01:22:05.000Z"
  },
  {
    name: "Francis Galarrita",
    firstName: "Francis",
    lastName: "Galarrita",
    email: "francis.galarrita@gmail.com",
    phone: "09775679788",
    school: "Southern Philippines College",
    yearLevel: "2nd Year College",
    age: 19,
    address: "Barangay Patag, Cagayan de Oro City",
    date: "2026-10-28T05:40:40.000Z"
  },
  {
    name: "Regine Labis",
    firstName: "Regine",
    lastName: "Labis",
    email: "regine.labis2004@gmail.com",
    phone: "09956789899",
    school: "Pilgrim Christian College",
    yearLevel: "1st Year College",
    age: 18,
    address: "Barangay Macasandig, Cagayan de Oro City",
    date: "2026-10-28T08:50:12.000Z"
  },
  {
    name: "Karl Macarandan",
    firstName: "Karl",
    lastName: "Macarandan",
    email: "macarandan.karl@gmail.com",
    phone: "09057899900",
    school: "Lourdes College",
    yearLevel: "3rd Year College",
    age: 20,
    address: "Barangay Camaman-an, Cagayan de Oro City",
    date: "2026-10-29T01:10:30.000Z"
  },
  {
    name: "Joanne Seno",
    firstName: "Joanne",
    lastName: "Seno",
    email: "joanne.seno03@gmail.com",
    phone: "09168909011",
    school: "Golden Heritage Polytechnic College",
    yearLevel: "2nd Year College",
    age: 19,
    address: "Barangay Puntod, Cagayan de Oro City",
    date: "2026-10-29T04:25:15.000Z"
  },
  {
    name: "Arvin Yap",
    firstName: "Arvin",
    lastName: "Yap",
    email: "arvin.yap2005@gmail.com",
    phone: "09269019122",
    school: "St. Mary's Academy of Carmen",
    yearLevel: "Grade 12 - STEM",
    age: 17,
    address: "Barangay Carmen, Cagayan de Oro City",
    date: "2026-10-29T07:38:50.000Z"
  },
  {
    name: "Jasmine Del Castillo",
    firstName: "Jasmine",
    lastName: "Del Castillo",
    email: "jasmine.delcastillo@gmail.com",
    phone: "09360129233",
    school: "Kong Hua School",
    yearLevel: "Grade 11 - ABM",
    age: 16,
    address: "Barangay Kauswagan, Cagayan de Oro City",
    date: "2026-10-30T01:05:42.000Z"
  },
  {
    name: "Lance Pagaspas",
    firstName: "Lance",
    lastName: "Pagaspas",
    email: "lance.pagaspas02@gmail.com",
    phone: "09081239344",
    school: "Asian College of Science and Technology",
    yearLevel: "3rd Year College",
    age: 21,
    address: "Barangay Lapasan, Cagayan de Oro City",
    date: "2026-10-30T03:15:20.000Z"
  },
  {
    name: "Angelica Macale",
    firstName: "Angelica",
    lastName: "Macale",
    email: "angelica.macale@gmail.com",
    phone: "09182349455",
    school: "STI College Cagayan de Oro",
    yearLevel: "1st Year College",
    age: 18,
    address: "Barangay Nazareth, Cagayan de Oro City",
    date: "2026-10-30T05:22:10.000Z"
  },
  {
    name: "Neil Quimpo",
    firstName: "Neil",
    lastName: "Quimpo",
    email: "neil.quimpo2004@gmail.com",
    phone: "09193459566",
    school: "Vineyard International Polytechnic College",
    yearLevel: "2nd Year College",
    age: 19,
    address: "Barangay Consolacion, Cagayan de Oro City",
    date: "2026-10-30T06:45:00.000Z"
  },
  {
    name: "Kathleen Jalagat",
    firstName: "Kathleen",
    lastName: "Jalagat",
    email: "kathleen.jalagat@gmail.com",
    phone: "09204569677",
    school: "University of Science and Technology of Southern Philippines",
    yearLevel: "4th Year College",
    age: 21,
    address: "Barangay Balulang, Cagayan de Oro City",
    date: "2026-10-30T07:18:30.000Z"
  },
  {
    name: "Jayvee Clavano",
    firstName: "Jayvee",
    lastName: "Clavano",
    email: "jayvee.clavano03@gmail.com",
    phone: "09285679788",
    school: "Xavier University – Ateneo de Cagayan",
    yearLevel: "2nd Year College",
    age: 19,
    address: "Barangay Macasandig, Cagayan de Oro City",
    date: "2026-10-30T07:55:12.000Z"
  },
  {
    name: "Danica Cañete",
    firstName: "Danica",
    lastName: "Cañete",
    email: "canete.danica05@gmail.com",
    phone: "09296789899",
    school: "Liceo de Cagayan University",
    yearLevel: "3rd Year College",
    age: 20,
    address: "Barangay Iponan, Cagayan de Oro City",
    date: "2026-10-30T08:12:40.000Z"
  },
  {
    name: "Reymart Balaba",
    firstName: "Reymart",
    lastName: "Balaba",
    email: "reymart.balaba@gmail.com",
    phone: "09397899900",
    school: "Capitol University",
    yearLevel: "1st Year College",
    age: 18,
    address: "Barangay Carmen, Cagayan de Oro City",
    date: "2026-10-30T08:35:10.000Z"
  },
  {
    name: "Shiela Saliring",
    firstName: "Shiela",
    lastName: "Saliring",
    email: "saliring.shiela@gmail.com",
    phone: "09478909011",
    school: "PHINMA – Cagayan de Oro College",
    yearLevel: "2nd Year College",
    age: 19,
    address: "Barangay Canitoan, Cagayan de Oro City",
    date: "2026-10-30T08:50:00.000Z"
  },
  {
    name: "Althea Pacana",
    firstName: "Althea",
    lastName: "Pacana",
    email: "pacana.althea04@gmail.com",
    phone: "09499019122",
    school: "Southern Philippines College",
    yearLevel: "3rd Year College",
    age: 20,
    address: "Barangay Bugo, Cagayan de Oro City",
    date: "2026-10-30T09:05:25.000Z"
  },
  {
    name: "Justine Zayas",
    firstName: "Justine",
    lastName: "Zayas",
    email: "zayas.justine02@gmail.com",
    phone: "09980129233",
    school: "Pilgrim Christian College",
    yearLevel: "4th Year College",
    age: 22,
    address: "Barangay Tablon, Cagayan de Oro City",
    date: "2026-10-30T09:20:45.000Z"
  },
  {
    name: "Hazel Ebajay",
    firstName: "Hazel",
    lastName: "Ebajay",
    email: "hazel.ebajay2005@gmail.com",
    phone: "09991239344",
    school: "Lourdes College",
    yearLevel: "1st Year College",
    age: 18,
    address: "Barangay Agusan, Cagayan de Oro City",
    date: "2026-10-30T09:40:00.000Z"
  }
];

async function seedDummyPatrons() {
  try {
    console.log("Checking current patron count in Supabase...");
    const { count: currentPatronCount, error: countErr } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "patron");

    if (countErr) throw countErr;
    console.log(`Current patrons in DB: ${currentPatronCount}`);

    const targetPatrons = 101;
    const needed = targetPatrons - currentPatronCount;
    console.log(`Target: ${targetPatrons} patrons. Needed dummy patrons: ${needed}`);

    if (needed <= 0) {
      console.log("Already at or above target patron count!");
      return;
    }

    const studentsToInsert = DUMMY_STUDENTS.slice(0, needed);
    console.log(`Preparing to insert ${studentsToInsert.length} dummy patron accounts...`);

    // Standard shared password for all dummy accounts: patron123
    const COMMON_PASSWORD = "patron123";
    const hashedPassword = await bcrypt.hash(COMMON_PASSWORD, 10);
    console.log(`Hashed standard dummy password: "${COMMON_PASSWORD}"`);

    // Determine starting sequence number (e.g. 38 for 37 existing)
    const startSeq = currentPatronCount + 1;
    const records = studentsToInsert.map((stu, idx) => {
      const seq = startSeq + idx;
      const patronId = `MISORLIB-2026-${String(seq).padStart(3, "0")}`;

      return {
        username: patronId,
        email: stu.email.toLowerCase().trim(),
        password: hashedPassword,
        google_id: null,
        avatar: null,
        role: "patron",
        name: stu.name.trim(),
        first_name: stu.firstName.trim(),
        last_name: stu.lastName.trim(),
        phone: stu.phone.trim(),
        address: stu.address.trim(),
        patron_type: "student",
        school: stu.school.trim(),
        year_level: stu.yearLevel.trim(),
        age: stu.age,
        is_profile_completed: true,
        status: "active",
        created_at: stu.date,
        updated_at: stu.date
      };
    });

    // Insert in batches of 20 to avoid large payload limits
    const BATCH_SIZE = 20;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const { data, error: insertError } = await supabase
        .from("users")
        .insert(batch)
        .select("id, username, name, email");

      if (insertError) {
        throw insertError;
      }
      console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} patrons)`);
    }

    // Verify final patron count
    const { count: finalCount, error: finalCountErr } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "patron");

    if (finalCountErr) throw finalCountErr;

    console.log("==================================================");
    console.log(`✅ SUCCESS! Total patrons is now: ${finalCount}`);
    console.log(`All dummy patrons have password: ${COMMON_PASSWORD}`);
    console.log("All dummy accounts have created_at dates in October 2026.");
    console.log("Genuine accounts from November remain at the top of User Management!");
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Error seeding dummy patrons:", error);
    process.exit(1);
  }
}

seedDummyPatrons();
