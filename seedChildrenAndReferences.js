require("dotenv").config();
const { supabase } = require("./db/supabase");

const childrenAndReferences = [
  {
    "barcode": "LIB-CAP-0192",
    "accessionNumber": "ACC-CAP-0192",
    "title": "Diary of a Wimpy Kid: Old School",
    "author": "Jeff Kinney",
    "authors": [
      "Jeff Kinney"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Fiction)",
    "publisher": "Amulet Books",
    "publicationYear": 2015,
    "status": "available",
    "available": true,
    "description": "Book 10 in the Diary of a Wimpy Kid series. Life was better in the old days. Or was it? Greg Heffley finds out as the town unplugs and goes electronics-free.",
    "coverUrl": "/Children's Corner/11305874-eba2-4b62-8083-c54294894923.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0193",
    "accessionNumber": "ACC-CAP-0193",
    "title": "Alamat ng Ampalaya",
    "author": "Augie Rivera",
    "authors": [
      "Augie Rivera"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-02 (Filipiniana Children's Corner)",
    "publisher": "Adarna House",
    "publicationYear": 1995,
    "status": "available",
    "available": true,
    "description": "Ang Alamat ng Ampalaya (The Legend of the Bitter Gourd). A classic Filipino children's tale about envy, sharing, and humility. Illustrated by Kiko Moran.",
    "coverUrl": "/Children's Corner/11b5fbb2-9090-47f3-92d3-67a566e9e82b.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0194",
    "accessionNumber": "ACC-CAP-0194",
    "title": "Walt Disney Beginning Reader: Welcome Back, Snow White (Volume 11)",
    "author": "Walt Disney",
    "authors": [
      "Walt Disney"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Fiction)",
    "publisher": "Bantam Books",
    "publicationYear": 1988,
    "status": "available",
    "available": true,
    "description": "A heartwarming early reader featuring Snow White and the Seven Dwarfs returning to celebrate friendship in the cottage in the forest.",
    "coverUrl": "/Children's Corner/14bbd354-d22d-492f-96f2-ca26a449f5be.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0195",
    "accessionNumber": "ACC-CAP-0195",
    "title": "Seryeng Kalasag: Nang Dumating ang Malakas na Lindol",
    "author": "Genaro R. Gojo Cruz",
    "authors": [
      "Genaro R. Gojo Cruz"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-02 (Filipiniana Children's Corner)",
    "publisher": "St. Matthew's Publishing",
    "publicationYear": 2021,
    "status": "available",
    "available": true,
    "description": "Social and Emotional Learning series for kids navigating disasters, focusing on emotional safety and preparedness during strong earthquakes. Illustrated by Jhucel A. del Rosario.",
    "coverUrl": "/Children's Corner/171397c2-bb17-4040-b867-849e5d454aa3.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0196",
    "accessionNumber": "ACC-CAP-0196",
    "title": "Walt Disney Beginning Reader: Scrooge and the Magic Fish",
    "author": "Walt Disney",
    "authors": [
      "Walt Disney"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Fiction)",
    "publisher": "Bantam Books",
    "publicationYear": 1988,
    "status": "available",
    "available": true,
    "description": "An entertaining children's beginning reader featuring Scrooge McDuck and a magical fish teaching lessons on generosity and gratitude.",
    "coverUrl": "/Children's Corner/1c8c26c3-80c9-49a8-8f99-2aa053b2e07f.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0197",
    "accessionNumber": "ACC-CAP-0197",
    "title": "Walt Disney Beginning Reader: Ferdinand and the Bullies",
    "author": "Walt Disney",
    "authors": [
      "Walt Disney"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Fiction)",
    "publisher": "Bantam Books",
    "publicationYear": 1988,
    "status": "available",
    "available": true,
    "description": "Ferdinand the gentle bull teaches young readers peaceful problem-solving and handling bullying behavior with calm kindness.",
    "coverUrl": "/Children's Corner/1e5e72b0-724f-4047-bc43-61fe88b46df8.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0198",
    "accessionNumber": "ACC-CAP-0198",
    "title": "My Bible Friends (Book 4): Joash, the Little King / David, the Youngest Boy",
    "author": "Etta B. Degering",
    "authors": [
      "Etta B. Degering"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Corner)",
    "publisher": "Review and Herald Publishing Association",
    "publicationYear": 1964,
    "status": "available",
    "available": true,
    "description": "Illustrated Bible stories for young children recounting the boyhood of King Joash and the faithful courage of young shepherd David.",
    "coverUrl": "/Children's Corner/1fe14bd9-4da0-49fa-adc5-c0017b40704d.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0199",
    "accessionNumber": "ACC-CAP-0199",
    "title": "Diary of a Wimpy Kid: Greg Heffley's Journal",
    "author": "Jeff Kinney",
    "authors": [
      "Jeff Kinney"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Fiction)",
    "publisher": "Amulet Books",
    "publicationYear": 2007,
    "status": "available",
    "available": true,
    "description": "The landmark novel in cartoons introducing middle school student Greg Heffley as he survives the perils of sixth grade.",
    "coverUrl": "/Children's Corner/22424e2a-8597-4bf5-ae11-f6d330f7b6c0.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0200",
    "accessionNumber": "ACC-CAP-0200",
    "title": "Ang Mga Kuwento ni Lola Basyang: Ang Prinsipeng Mahaba ang Ilong",
    "author": "Severino Reyes & Christine S. Bellen",
    "authors": [
      "Severino Reyes",
      "Christine S. Bellen"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-02 (Filipiniana Children's Corner)",
    "publisher": "Anvil Publishing",
    "publicationYear": 2007,
    "status": "available",
    "available": true,
    "description": "The Prince with the Long Nose - a beloved Filipino classic fairy tale by Severino Reyes, retold by Christine S. Bellen, illustrated by Liza A. Flores.",
    "coverUrl": "/Children's Corner/3529f9cd-4d7f-428e-9604-d5bf64317657.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0201",
    "accessionNumber": "ACC-CAP-0201",
    "title": "ValueTales: The Value of Caring - The Story of Eleanor Roosevelt",
    "author": "Ann Donegan Johnson",
    "authors": [
      "Ann Donegan Johnson",
      "Spencer Johnson"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Corner)",
    "publisher": "Value Communications",
    "publicationYear": 1977,
    "status": "available",
    "available": true,
    "description": "An inspiring biography in the ValueTales series teaching children the character quality of caring through the humanitarian work of Eleanor Roosevelt.",
    "coverUrl": "/Children's Corner/587616ef-3bce-48d6-b581-49f0a6348524.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0202",
    "accessionNumber": "ACC-CAP-0202",
    "title": "Walt Disney Beginning Reader: Donald Cries 'Wolf!' (Volume 14)",
    "author": "Walt Disney",
    "authors": [
      "Walt Disney"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Fiction)",
    "publisher": "Bantam Books",
    "publicationYear": 1988,
    "status": "available",
    "available": true,
    "description": "Donald Duck stars in an adaptation of Aesop's fable The Boy Who Cried Wolf, teaching young children the enduring value of honesty.",
    "coverUrl": "/Children's Corner/65a37177-ea51-4d42-829a-d3a08ccc9e3d.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0203",
    "accessionNumber": "ACC-CAP-0203",
    "title": "Seryeng Kalasag: Nang Pumutok ang Bulkan",
    "author": "Genaro R. Gojo Cruz",
    "authors": [
      "Genaro R. Gojo Cruz"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-02 (Filipiniana Children's Corner)",
    "publisher": "St. Matthew's Publishing",
    "publicationYear": 2021,
    "status": "available",
    "available": true,
    "description": "Social and emotional guidance for children experiencing volcanic eruptions and ash fall, emphasizing community resilience. Illustrated by Jhucel A. del Rosario.",
    "coverUrl": "/Children's Corner/6be36cd1-0e20-41c2-8422-73a416bfa29c.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0204",
    "accessionNumber": "ACC-CAP-0204",
    "title": "Seryeng Kalasag: Sa Panahong May Pandemya",
    "author": "Genaro R. Gojo Cruz",
    "authors": [
      "Genaro R. Gojo Cruz"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-02 (Filipiniana Children's Corner)",
    "publisher": "St. Matthew's Publishing",
    "publicationYear": 2021,
    "status": "available",
    "available": true,
    "description": "Helping young children understand quarantine, staying safe at home, hygiene, and coping with emotions during an epidemic or pandemic. Illustrated by Jhucel A. del Rosario.",
    "coverUrl": "/Children's Corner/7b3dffb3-526e-4a6c-963c-09fab9ab2ea2.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0205",
    "accessionNumber": "ACC-CAP-0205",
    "title": "Craft Projects: Paper Crafts for Kids",
    "author": "Robyn Supraner",
    "authors": [
      "Robyn Supraner"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Corner)",
    "publisher": "Troll Associates",
    "publicationYear": 1981,
    "status": "available",
    "available": true,
    "description": "Creative hands-on craft guide full of easy-to-make paper art projects, origami, masks, and decorations designed for elementary school children.",
    "coverUrl": "/Children's Corner/7d4c9641-eb5b-4371-8c78-b6346dc656d8.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0206",
    "accessionNumber": "ACC-CAP-0206",
    "title": "Walt Disney Beginning Reader: Pooh's New Clothes",
    "author": "Walt Disney",
    "authors": [
      "Walt Disney"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Fiction)",
    "publisher": "Bantam Books",
    "publicationYear": 1988,
    "status": "available",
    "available": true,
    "description": "A delightful Hundred Acre Wood adventure with Winnie the Pooh and Piglet as Pooh attempts to find comfortable new clothes.",
    "coverUrl": "/Children's Corner/8526a0fa-83cc-4dc6-aa4d-9d960dc44077.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0207",
    "accessionNumber": "ACC-CAP-0207",
    "title": "ValueTales: The Value of Helping - The Story of Harriet Tubman",
    "author": "Ann Donegan Johnson",
    "authors": [
      "Ann Donegan Johnson",
      "Spencer Johnson"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Corner)",
    "publisher": "Value Communications",
    "publicationYear": 1979,
    "status": "available",
    "available": true,
    "description": "An inspiring biographical children's book illustrating the heroic character trait of helping through the courageous life of Underground Railroad conductor Harriet Tubman.",
    "coverUrl": "/Children's Corner/8bebcb19-3baa-4b76-9689-276c00bfcd07.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0208",
    "accessionNumber": "ACC-CAP-0208",
    "title": "Seryeng Kalasag: Nang Dumating ang Mabagsik na Bagyo",
    "author": "Genaro R. Gojo Cruz",
    "authors": [
      "Genaro R. Gojo Cruz"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-02 (Filipiniana Children's Corner)",
    "publisher": "St. Matthew's Publishing",
    "publicationYear": 2021,
    "status": "available",
    "available": true,
    "description": "A sensitive children's book illustrating typhoon preparedness, coping with fear during fierce storms, and family solidarity. Illustrated by Jhucel A. del Rosario.",
    "coverUrl": "/Children's Corner/8e854718-52cb-4db2-bf69-ffb5b921fe87.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0209",
    "accessionNumber": "ACC-CAP-0209",
    "title": "Noses",
    "author": "Dorothy Evans",
    "authors": [
      "Dorothy Evans"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Corner)",
    "publisher": "Ginn and Company",
    "publicationYear": 1990,
    "status": "available",
    "available": true,
    "description": "An engaging beginner's science picture book exploring animal senses and the strange varieties of noses in the animal kingdom.",
    "coverUrl": "/Children's Corner/935f5c24-69b9-4437-bb30-94ee1ce8b053.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0210",
    "accessionNumber": "ACC-CAP-0210",
    "title": "Walt Disney Beginning Reader: Dumbo at Bat",
    "author": "Walt Disney",
    "authors": [
      "Walt Disney"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Fiction)",
    "publisher": "Bantam Books",
    "publicationYear": 1988,
    "status": "available",
    "available": true,
    "description": "Dumbo the flying elephant steps up to play baseball with his circus animal friends in this sweet early learning tale.",
    "coverUrl": "/Children's Corner/a0201645-d6ea-4c67-b5eb-934ee80ed0cc.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0211",
    "accessionNumber": "ACC-CAP-0211",
    "title": "My Bible Friends (Book 3): Jesus and the Storm / Jesus and the Children",
    "author": "Etta B. Degering",
    "authors": [
      "Etta B. Degering"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Corner)",
    "publisher": "Review and Herald Publishing Association",
    "publicationYear": 1963,
    "status": "available",
    "available": true,
    "description": "Classic Bible stories for early readers showing how Jesus calmed the stormy Sea of Galilee and welcomed little children with love and warmth.",
    "coverUrl": "/Children's Corner/c04f5575-8741-4ca1-bb4e-75141cf5fd5b.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0212",
    "accessionNumber": "ACC-CAP-0212",
    "title": "Diary of a Wimpy Kid: The Last Straw",
    "author": "Jeff Kinney",
    "authors": [
      "Jeff Kinney"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Fiction)",
    "publisher": "Amulet Books",
    "publicationYear": 2009,
    "status": "available",
    "available": true,
    "description": "Book 3 in the Diary of a Wimpy Kid series. Frank Heffley actually thinks he can get his son to toughen up, threatening him with military academy.",
    "coverUrl": "/Children's Corner/cb5f0db0-26a8-4b7c-9db7-57527e0b1a93.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0213",
    "accessionNumber": "ACC-CAP-0213",
    "title": "Ladybug Girl Gift Set",
    "author": "David Soman & Jacky Davis",
    "authors": [
      "David Soman",
      "Jacky Davis"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Corner)",
    "publisher": "Dial Books for Young Readers",
    "publicationYear": 2010,
    "status": "available",
    "available": true,
    "description": "New York Times bestselling story following Lulu and her trusty hound Bingo as she transforms into Ladybug Girl with big adventures.",
    "coverUrl": "/Children's Corner/d3135d01-6ff7-414d-b2c8-a767511b81f2.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0214",
    "accessionNumber": "ACC-CAP-0214",
    "title": "Diary of a Wimpy Kid: Rodrick Rules",
    "author": "Jeff Kinney",
    "authors": [
      "Jeff Kinney"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Fiction)",
    "publisher": "Amulet Books",
    "publicationYear": 2008,
    "status": "available",
    "available": true,
    "description": "Book 2 of Jeff Kinney's hilarious cartoon chronicles. Greg Heffley tries to keep his humiliating summer secret from leaking out, but his older brother Rodrick knows everything.",
    "coverUrl": "/Children's Corner/d404d615-2408-4e89-853e-9ffebd575468.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0215",
    "accessionNumber": "ACC-CAP-0215",
    "title": "Step into Reading: The Best Mistake Ever! and Other Stories",
    "author": "Richard Scarry",
    "authors": [
      "Richard Scarry"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Fiction)",
    "publisher": "Random House Children's Books",
    "publicationYear": 1984,
    "status": "available",
    "available": true,
    "description": "Three funny stories starring Huckle Cat and Lowly Worm that help beginning readers practice words while learning that even mistakes can turn out happily.",
    "coverUrl": "/Children's Corner/d77a9af4-2d7e-4984-991f-075ec1308606.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0216",
    "accessionNumber": "ACC-CAP-0216",
    "title": "My Bible Friends (Book 5): Go Wash in the River / Barley Loaves and Fishes",
    "author": "Etta B. Degering",
    "authors": [
      "Etta B. Degering"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Corner)",
    "publisher": "Review and Herald Publishing Association",
    "publicationYear": 1964,
    "status": "available",
    "available": true,
    "description": "Vividly illustrated biblical tales depicting Naaman obeying the prophet Elisha, and a little boy sharing his five barley loaves and two fish with Jesus.",
    "coverUrl": "/Children's Corner/df29f775-19e6-42cf-872a-f1cbb5bfdf31.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0217",
    "accessionNumber": "ACC-CAP-0217",
    "title": "Diary of a Wimpy Kid: The Ugly Truth",
    "author": "Jeff Kinney",
    "authors": [
      "Jeff Kinney"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Fiction)",
    "publisher": "Amulet Books",
    "publicationYear": 2010,
    "status": "available",
    "available": true,
    "description": "Book 5 in the Wimpy Kid series. Greg Heffley has always been in a rush to grow up, but is getting older really all it's cracked up to be?",
    "coverUrl": "/Children's Corner/dff0c923-f1d1-4867-9275-27ee85ee0539.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0218",
    "accessionNumber": "ACC-CAP-0218",
    "title": "ValueTales: The Value of Consideration - The Story of Confucius",
    "author": "Ann Donegan Johnson",
    "authors": [
      "Ann Donegan Johnson",
      "Spencer Johnson"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Corner)",
    "publisher": "Value Communications",
    "publicationYear": 1982,
    "status": "available",
    "available": true,
    "description": "A delightful illustrated children's story demonstrating the value of consideration for others through the life and teachings of Confucius.",
    "coverUrl": "/Children's Corner/eb248a1f-cba2-43be-9f94-8a311ea073ab.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0219",
    "accessionNumber": "ACC-CAP-0219",
    "title": "Walt Disney Beginning Reader: Wendy's Adventure in Never Land",
    "author": "Walt Disney",
    "authors": [
      "Walt Disney"
    ],
    "category": "Children's Corner",
    "section": "Circulation Section (includes Fiction Books & Children's Corner)",
    "shelf": "Shelf K-01 (Children's Fiction)",
    "publisher": "Bantam Books",
    "publicationYear": 1988,
    "status": "available",
    "available": true,
    "description": "Peter Pan and Wendy take to the skies of Never Land in this easy reader book full of magic, pixie dust, and adventure.",
    "coverUrl": "/Children's Corner/f6b25fd5-bd19-497e-ab29-5b50f5ddf3ed.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0220",
    "accessionNumber": "ACC-CAP-0220",
    "title": "The New Lexicon Webster's Dictionary of the English Language (Deluxe Encyclopedic Edition)",
    "author": "Lexicon Publications Staff",
    "authors": [
      "Lexicon Publications Staff"
    ],
    "category": "Dictionaries",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-01 (General Dictionaries)",
    "publisher": "Lexicon Publications",
    "publicationYear": 1993,
    "status": "available",
    "available": true,
    "description": "A massive, authoritative encyclopedic dictionary offering comprehensive definitions, etymologies, historical supplements, and reference atlases.",
    "coverUrl": "/References/Dictionaries/07a73523-77a7-40b6-beb4-2d00f7a3f8b5.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0221",
    "accessionNumber": "ACC-CAP-0221",
    "title": "Webster's New Universal Unabridged Dictionary of the English Language (Deluxe Color Edition)",
    "author": "Webster's Editorial Staff",
    "authors": [
      "Webster's Editorial Staff"
    ],
    "category": "Dictionaries",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-01 (General Dictionaries)",
    "publisher": "Barnes & Noble Books / Dorset & Baber",
    "publicationYear": 1989,
    "status": "available",
    "available": true,
    "description": "Unabridged English dictionary featuring over 300,000 definitions, full-color thematic plates, linguistic appendices, and world maps.",
    "coverUrl": "/References/Dictionaries/534524b2-c5c1-4ebb-a96b-e36680475b7f.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0222",
    "accessionNumber": "ACC-CAP-0222",
    "title": "The American Heritage Children's Dictionary",
    "author": "American Heritage Dictionaries Editors",
    "authors": [
      "American Heritage Dictionaries Editors"
    ],
    "category": "Dictionaries",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-01 (Language Dictionaries)",
    "publisher": "Houghton Mifflin",
    "publicationYear": 1998,
    "status": "available",
    "available": true,
    "description": "Specially designed for students in elementary and middle grades, featuring over 37,000 words, vivid color illustrations, sample sentences, and phonics support.",
    "coverUrl": "/References/Dictionaries/8e52aa0e-fb33-41d6-a55f-c4b2fd4006f5.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0223",
    "accessionNumber": "ACC-CAP-0223",
    "title": "Hippocrene English-Hindi Dictionary",
    "author": "Hippocrene Language Books Staff",
    "authors": [
      "Hippocrene Language Books Staff"
    ],
    "category": "Dictionaries",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-01 (Foreign Language Dictionaries)",
    "publisher": "Hippocrene Books",
    "publicationYear": 2001,
    "status": "available",
    "available": true,
    "description": "Bidirectional Hindi-English / English-Hindi dictionary providing Devanagari script alongside romanized transliteration and usage guidelines.",
    "coverUrl": "/References/Dictionaries/b399d716-be0b-4a50-b076-c1228089b2b9.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0224",
    "accessionNumber": "ACC-CAP-0224",
    "title": "The Modern Dictionary of Electronics (8th Edition)",
    "author": "Rudolf F. Graf",
    "authors": [
      "Rudolf F. Graf"
    ],
    "category": "Dictionaries",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-01 (Technical Dictionaries)",
    "publisher": "Newnes / Butterworth-Heinemann",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "The quintessential electronics reference with more than 25,000 terms spanning circuits, microprocessors, fiber optics, wireless comms, and audio-video technology.",
    "coverUrl": "/References/Dictionaries/d10a827b-5e08-469c-b039-38c102046c2d.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0225",
    "accessionNumber": "ACC-CAP-0225",
    "title": "The Dictionary of Opera",
    "author": "Charles Osborne",
    "authors": [
      "Charles Osborne"
    ],
    "category": "Dictionaries",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-01 (Music & Fine Arts Dictionaries)",
    "publisher": "Macmillan Publishing",
    "publicationYear": 1983,
    "status": "available",
    "available": true,
    "description": "A comprehensive guide to composers, librettists, singers, operas, and world premiere performances throughout opera history.",
    "coverUrl": "/References/Dictionaries/d8f65c75-2ae3-4cee-b004-87de29722ed6.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0226",
    "accessionNumber": "ACC-CAP-0226",
    "title": "The New International Comprehensive Dictionary of the English Language (Deluxe Encyclopedic Edition)",
    "author": "Funk & Wagnalls Editorial Staff",
    "authors": [
      "Funk & Wagnalls Editorial Staff"
    ],
    "category": "Dictionaries",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-01 (General Dictionaries)",
    "publisher": "Trident Press International",
    "publicationYear": 1996,
    "status": "available",
    "available": true,
    "description": "Encyclopedic English dictionary combining unabridged word entries with specialized encyclopedic reference supplements and technical vocabularies.",
    "coverUrl": "/References/Dictionaries/ef0d6c9a-3c76-4bfd-aa2d-02f23e975193.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0227",
    "accessionNumber": "ACC-CAP-0227",
    "title": "Junior Dictionary",
    "author": "E. L. Thorndike & Clarence L. Barnhart",
    "authors": [
      "E. L. Thorndike",
      "Clarence L. Barnhart"
    ],
    "category": "Dictionaries",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-01 (Language Dictionaries)",
    "publisher": "Scott, Foresman and Company",
    "publicationYear": 1988,
    "status": "available",
    "available": true,
    "description": "Classic junior school reference dictionary designed to help children build vocabulary with clear definitions and illustrative example sentences.",
    "coverUrl": "/References/Dictionaries/f2a74c44-a296-4257-aaf1-4448c79f80e4.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0228",
    "accessionNumber": "ACC-CAP-0228",
    "title": "Microcomputer Dictionary",
    "author": "Charles J. Sippl",
    "authors": [
      "Charles J. Sippl"
    ],
    "category": "Dictionaries",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-01 (Computer & Tech Dictionaries)",
    "publisher": "Howard W. Sams & Co.",
    "publicationYear": 1981,
    "status": "available",
    "available": true,
    "description": "Authoritative technical dictionary detailing microprocessor architectures, computing nomenclature, peripheral hardware, and telecommunications for engineers and scientists.",
    "coverUrl": "/References/Dictionaries/fe7b280b-0efc-4b8a-83f5-0032624bee7a.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0229",
    "accessionNumber": "ACC-CAP-0229",
    "title": "New Standard Encyclopedia (Volume 5: CD)",
    "author": "Standard Educational Corporation Editors",
    "authors": [
      "Standard Educational Corporation Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (General Encyclopedias)",
    "publisher": "Standard Educational Corporation",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "Comprehensive reference work covering letters CD, featuring in-depth articles, historical surveys, scientific discoveries, and geographic entries.",
    "coverUrl": "/References/Encyclopedia/01ab7d14-31b7-4cdf-8e34-e08ecc90eddc.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0230",
    "accessionNumber": "ACC-CAP-0230",
    "title": "The Macmillan Illustrated Encyclopedia (Volume 2: C-D)",
    "author": "Macmillan Editors",
    "authors": [
      "Macmillan Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (Illustrated Encyclopedias)",
    "publisher": "Macmillan Publishing",
    "publicationYear": 1989,
    "status": "available",
    "available": true,
    "description": "Visual reference encyclopedia volume C-D covering civilization, science, culture, technology, and natural history with vivid full-color illustrations.",
    "coverUrl": "/References/Encyclopedia/0cbb8e84-9bc5-4a96-b773-34ab97f55ac7.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0231",
    "accessionNumber": "ACC-CAP-0231",
    "title": "Encyclopaedia of Occupational Health and Safety (4th Edition, Volume II)",
    "author": "Jeanne Mager Stellman & International Labour Office",
    "authors": [
      "Jeanne Mager Stellman",
      "International Labour Office"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (Specialized Encyclopedias)",
    "publisher": "International Labour Office (ILO)",
    "publicationYear": 1998,
    "status": "available",
    "available": true,
    "description": "Authoritative ILO standard reference covering hazards, healthcare systems, toxicology, ergonomic policies, and occupational safety measures worldwide.",
    "coverUrl": "/References/Encyclopedia/13553b4c-35f9-44cf-9aa1-39ed2b0b3e7d.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0232",
    "accessionNumber": "ACC-CAP-0232",
    "title": "New Standard Encyclopedia (Volume 1: A)",
    "author": "Standard Educational Corporation Editors",
    "authors": [
      "Standard Educational Corporation Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (General Encyclopedias)",
    "publisher": "Standard Educational Corporation",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "Premier volume of the New Standard Encyclopedia containing comprehensive encyclopedic knowledge from letter A, fully illustrated.",
    "coverUrl": "/References/Encyclopedia/22d3419a-d07d-47f7-a163-2c0879b5c86c.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0233",
    "accessionNumber": "ACC-CAP-0233",
    "title": "Encyclopaedia of Occupational Health and Safety (4th Edition, Volume III)",
    "author": "Jeanne Mager Stellman & International Labour Office",
    "authors": [
      "Jeanne Mager Stellman",
      "International Labour Office"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (Specialized Encyclopedias)",
    "publisher": "International Labour Office (ILO)",
    "publicationYear": 1998,
    "status": "available",
    "available": true,
    "description": "Authoritative ILO standard reference volume III addressing industrial hazards, chemical exposures, safety engineering, and workplace regulations.",
    "coverUrl": "/References/Encyclopedia/307d22dc-ada4-4f2b-a266-a3e4cc9a1f47.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0234",
    "accessionNumber": "ACC-CAP-0234",
    "title": "New Standard Encyclopedia (Volume 14: S-Sn)",
    "author": "Standard Educational Corporation Editors",
    "authors": [
      "Standard Educational Corporation Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (General Encyclopedias)",
    "publisher": "Standard Educational Corporation",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "General reference encyclopedia volume spanning entries from S through Sn, with authoritative academic and practical entries.",
    "coverUrl": "/References/Encyclopedia/3ead027d-b98c-4027-b190-d6bcec20dde4.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0235",
    "accessionNumber": "ACC-CAP-0235",
    "title": "The Macmillan Illustrated Encyclopedia (Volume 4: G-I)",
    "author": "Macmillan Editors",
    "authors": [
      "Macmillan Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (Illustrated Encyclopedias)",
    "publisher": "Macmillan Publishing",
    "publicationYear": 1989,
    "status": "available",
    "available": true,
    "description": "Richly illustrated encyclopedia volume covering topics from G through I, with detailed infographics, diagrams, and historical timelines.",
    "coverUrl": "/References/Encyclopedia/47fc76c0-52c8-4945-bf55-63503d7681fb.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0236",
    "accessionNumber": "ACC-CAP-0236",
    "title": "New Standard Encyclopedia (Volume 7: FG)",
    "author": "Standard Educational Corporation Editors",
    "authors": [
      "Standard Educational Corporation Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (General Encyclopedias)",
    "publisher": "Standard Educational Corporation",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "General knowledge reference volume covering subjects from letters FG, including physics, geography, global biography, and government.",
    "coverUrl": "/References/Encyclopedia/4b440fc0-b1eb-455f-8017-8198b379145d.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0237",
    "accessionNumber": "ACC-CAP-0237",
    "title": "New Standard Encyclopedia (Volume 2: B)",
    "author": "Standard Educational Corporation Editors",
    "authors": [
      "Standard Educational Corporation Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (General Encyclopedias)",
    "publisher": "Standard Educational Corporation",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "General knowledge reference encyclopedia volume dedicated to topics under the letter B, from biology to world history.",
    "coverUrl": "/References/Encyclopedia/51ebfa9b-be4e-4d60-be29-9c03cb17fb32.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0238",
    "accessionNumber": "ACC-CAP-0238",
    "title": "The Macmillan Illustrated Encyclopedia (Volume 3: E-F)",
    "author": "Macmillan Editors",
    "authors": [
      "Macmillan Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (Illustrated Encyclopedias)",
    "publisher": "Macmillan Publishing",
    "publicationYear": 1989,
    "status": "available",
    "available": true,
    "description": "Visual reference encyclopedia volume E-F covering Earth, ecology, finance, flora, and world cultures with full-color illustrations.",
    "coverUrl": "/References/Encyclopedia/54bd57ba-224e-489d-a939-83e0c858987d.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0239",
    "accessionNumber": "ACC-CAP-0239",
    "title": "The Macmillan Illustrated Encyclopedia (Volume 7: R-S)",
    "author": "Macmillan Editors",
    "authors": [
      "Macmillan Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (Illustrated Encyclopedias)",
    "publisher": "Macmillan Publishing",
    "publicationYear": 1989,
    "status": "available",
    "available": true,
    "description": "Visual reference encyclopedia volume R-S exploring religion, science, space exploration, and sociology.",
    "coverUrl": "/References/Encyclopedia/67aa27f6-b988-4b49-af97-0335e9f0f6c6.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0240",
    "accessionNumber": "ACC-CAP-0240",
    "title": "New Standard Encyclopedia (Volume 4: CIV-CZ)",
    "author": "Standard Educational Corporation Editors",
    "authors": [
      "Standard Educational Corporation Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (General Encyclopedias)",
    "publisher": "Standard Educational Corporation",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "General reference volume covering entries from CIV through CZ, including civil rights, climatology, and communication.",
    "coverUrl": "/References/Encyclopedia/84e625b5-64d1-465a-90c0-8838c05868b6.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0241",
    "accessionNumber": "ACC-CAP-0241",
    "title": "The Macmillan Illustrated Encyclopedia (Volume 1: A-B)",
    "author": "Macmillan Editors",
    "authors": [
      "Macmillan Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (Illustrated Encyclopedias)",
    "publisher": "Macmillan Publishing",
    "publicationYear": 1989,
    "status": "available",
    "available": true,
    "description": "The introductory volume of the Macmillan Illustrated Encyclopedia, featuring richly illustrated topics from Astronomy to Botany.",
    "coverUrl": "/References/Encyclopedia/96b8ea08-7283-43fe-af2a-079f5b9eed8b.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0242",
    "accessionNumber": "ACC-CAP-0242",
    "title": "The Macmillan Illustrated Encyclopedia (Volume 9: Index)",
    "author": "Macmillan Editors",
    "authors": [
      "Macmillan Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (Illustrated Encyclopedias)",
    "publisher": "Macmillan Publishing",
    "publicationYear": 1989,
    "status": "available",
    "available": true,
    "description": "The complete cumulative master index and cross-reference research guide for the 9-volume Macmillan Illustrated Encyclopedia.",
    "coverUrl": "/References/Encyclopedia/a0c2eeaa-8655-44dd-bca4-4d5e60fab242.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0243",
    "accessionNumber": "ACC-CAP-0243",
    "title": "Encyclopedia of Animals: Mammals, Birds, Reptiles, Amphibians",
    "author": "Harold G. Cogger, Joseph Forshaw & Edwin Gould",
    "authors": [
      "Harold G. Cogger",
      "Joseph Forshaw",
      "Edwin Gould"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (Science & Nature Encyclopedias)",
    "publisher": "Weldon Owen / Fog City Press",
    "publicationYear": 2002,
    "status": "available",
    "available": true,
    "description": "A comprehensive, beautifully photographed guide to wildlife biology, species classification, habits, and habitats across the globe.",
    "coverUrl": "/References/Encyclopedia/b604d9ad-99ec-4fdf-8307-f37a3fa17b46.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0244",
    "accessionNumber": "ACC-CAP-0244",
    "title": "Encyclopaedia of Occupational Health and Safety (4th Edition, Volume IV: Indexes)",
    "author": "Jeanne Mager Stellman & International Labour Office",
    "authors": [
      "Jeanne Mager Stellman",
      "International Labour Office"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (Specialized Encyclopedias)",
    "publisher": "International Labour Office (ILO)",
    "publicationYear": 1998,
    "status": "available",
    "available": true,
    "description": "Comprehensive analytical index, chemical directory, cross-references, and global guidelines for occupational safety and health.",
    "coverUrl": "/References/Encyclopedia/c5052cf9-9b62-40b5-a3bf-c5401f9c689f.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0245",
    "accessionNumber": "ACC-CAP-0245",
    "title": "The Macmillan Illustrated Encyclopedia (Volume 5: J-M)",
    "author": "Macmillan Editors",
    "authors": [
      "Macmillan Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (Illustrated Encyclopedias)",
    "publisher": "Macmillan Publishing",
    "publicationYear": 1989,
    "status": "available",
    "available": true,
    "description": "Illustrated encyclopedia volume J-M featuring entries on jurisprudence, marine biology, metallurgy, and modern world history.",
    "coverUrl": "/References/Encyclopedia/c66aaa1a-a861-4cea-b219-a23a5bd307ed.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0246",
    "accessionNumber": "ACC-CAP-0246",
    "title": "The Macmillan Illustrated Encyclopedia (Volume 8: T-Z)",
    "author": "Macmillan Editors",
    "authors": [
      "Macmillan Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (Illustrated Encyclopedias)",
    "publisher": "Macmillan Publishing",
    "publicationYear": 1989,
    "status": "available",
    "available": true,
    "description": "Visual reference encyclopedia volume T-Z covering zoology, transportation, typography, and world civilizations.",
    "coverUrl": "/References/Encyclopedia/c7f5bcb0-a5fe-4ec8-bdc3-796571e24853.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0247",
    "accessionNumber": "ACC-CAP-0247",
    "title": "New Standard Encyclopedia (Volume 6: DE)",
    "author": "Standard Educational Corporation Editors",
    "authors": [
      "Standard Educational Corporation Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (General Encyclopedias)",
    "publisher": "Standard Educational Corporation",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "General knowledge reference volume covering subjects from letters DE, including democracy, economics, engineering, and ecosystems.",
    "coverUrl": "/References/Encyclopedia/caf909bc-a5fc-4189-9894-6256e01d5b12.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0248",
    "accessionNumber": "ACC-CAP-0248",
    "title": "New Standard Encyclopedia (Volume 19: T)",
    "author": "Standard Educational Corporation Editors",
    "authors": [
      "Standard Educational Corporation Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (General Encyclopedias)",
    "publisher": "Standard Educational Corporation",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "General knowledge reference volume dedicated to subjects under letter T, from technology to thermodynamics.",
    "coverUrl": "/References/Encyclopedia/d45b18fe-3335-4452-93f5-1fa932e62de4.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0249",
    "accessionNumber": "ACC-CAP-0249",
    "title": "The Macmillan Illustrated Encyclopedia (Volume 6: N-Q)",
    "author": "Macmillan Editors",
    "authors": [
      "Macmillan Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (Illustrated Encyclopedias)",
    "publisher": "Macmillan Publishing",
    "publicationYear": 1989,
    "status": "available",
    "available": true,
    "description": "Visual reference encyclopedia volume N-Q highlighting natural history, physics, optics, and philosophy.",
    "coverUrl": "/References/Encyclopedia/d4d02708-77ca-4eb9-b29f-e8f11f219acf.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0250",
    "accessionNumber": "ACC-CAP-0250",
    "title": "New Standard Encyclopedia (Volume 3: C-CIU)",
    "author": "Standard Educational Corporation Editors",
    "authors": [
      "Standard Educational Corporation Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (General Encyclopedias)",
    "publisher": "Standard Educational Corporation",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "General knowledge reference encyclopedia volume spanning entries C through CIU, including chemistry, civilizations, and cinema.",
    "coverUrl": "/References/Encyclopedia/d763e6de-cf8e-4240-a4b0-be5ffb4ab833.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0251",
    "accessionNumber": "ACC-CAP-0251",
    "title": "Encyclopaedia of Occupational Health and Safety (4th Edition, Volume I)",
    "author": "Jeanne Mager Stellman & International Labour Office",
    "authors": [
      "Jeanne Mager Stellman",
      "International Labour Office"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (Specialized Encyclopedias)",
    "publisher": "International Labour Office (ILO)",
    "publicationYear": 1998,
    "status": "available",
    "available": true,
    "description": "First volume of the landmark ILO workplace safety reference, focusing on occupational physiology, toxicology, ergonomics, and work environment health.",
    "coverUrl": "/References/Encyclopedia/e7b6187b-8a13-4541-8eef-7922dec19282.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0252",
    "accessionNumber": "ACC-CAP-0252",
    "title": "New Standard Encyclopedia (Volume 18: So-Sz)",
    "author": "Standard Educational Corporation Editors",
    "authors": [
      "Standard Educational Corporation Editors"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (General Encyclopedias)",
    "publisher": "Standard Educational Corporation",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "General knowledge reference volume covering subjects So through Sz, including sociology, space exploration, and surgery.",
    "coverUrl": "/References/Encyclopedia/e7f76131-9707-4f6c-bf05-ffb6d3db2422.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0253",
    "accessionNumber": "ACC-CAP-0253",
    "title": "The British Printer Encyclopaedia of Typefaces (Anniversary Edition)",
    "author": "W. Pincus Jaspert, W. Turner Berry & A. F. Johnson",
    "authors": [
      "W. Pincus Jaspert",
      "W. Turner Berry",
      "A. F. Johnson"
    ],
    "category": "Encyclopedias",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-02 (Art & Design Encyclopedias)",
    "publisher": "Blandford Press",
    "publicationYear": 1983,
    "status": "available",
    "available": true,
    "description": "The standard international reference work on typography, cataloging specimen alphabets, designer histories, and classification of global typefaces.",
    "coverUrl": "/References/Encyclopedia/f6cc9fb4-6f63-4ab6-a452-f2bf82c2191e.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0254",
    "accessionNumber": "ACC-CAP-0254",
    "title": "Subject Guide to Books in Print (1972)",
    "author": "R. R. Bowker Company",
    "authors": [
      "R. R. Bowker Company"
    ],
    "category": "Handbooks",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-03 (Bibliographic Handbooks)",
    "publisher": "Xerox / R. R. Bowker",
    "publicationYear": 1972,
    "status": "available",
    "available": true,
    "description": "Comprehensive bibliographic handbook cataloging available books across 63,500 Library of Congress subject categories.",
    "coverUrl": "/References/Handbooks/09527100-498d-442b-aa13-391fe01b19ce.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0255",
    "accessionNumber": "ACC-CAP-0255",
    "title": "The Illustrated Handbook of Woodworking Joints",
    "author": "Percy W. Blandford",
    "authors": [
      "Percy W. Blandford"
    ],
    "category": "Handbooks",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-03 (Crafts & Engineering Handbooks)",
    "publisher": "TAB Books",
    "publicationYear": 1984,
    "status": "available",
    "available": true,
    "description": "Step-by-step practical manual illustrating traditional and modern joinery techniques, dovetails, mortise and tenon, and wood construction.",
    "coverUrl": "/References/Handbooks/1adfdaed-222e-4abd-8ee0-0c0b29178a08.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0256",
    "accessionNumber": "ACC-CAP-0256",
    "title": "Study Guide for Jurmain, Kilgore, and Trevathan's Introduction to Physical Anthropology",
    "author": "Lynn Kilgore, Robert Jurmain & Wenda Trevathan",
    "authors": [
      "Lynn Kilgore",
      "Robert Jurmain",
      "Wenda Trevathan"
    ],
    "category": "Handbooks",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-03 (Academic Handbooks & Guides)",
    "publisher": "Wadsworth Publishing",
    "publicationYear": 2000,
    "status": "available",
    "available": true,
    "description": "A comprehensive study companion to physical anthropology covering primate behavior, human genetics, hominid fossil records, and evolutionary science.",
    "coverUrl": "/References/Handbooks/2a6b5d14-ddef-48f8-b794-8032c505eeab.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0257",
    "accessionNumber": "ACC-CAP-0257",
    "title": "MLA Handbook for Writers of Research Papers (Fifth Edition)",
    "author": "Joseph Gibaldi",
    "authors": [
      "Joseph Gibaldi"
    ],
    "category": "Handbooks",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-03 (Research & Academic Writing Handbooks)",
    "publisher": "The Modern Language Association of America",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "The authoritative writing and style handbook for students and scholars, detailing documentation guidelines, citations, plagiarism rules, and manuscript mechanics.",
    "coverUrl": "/References/Handbooks/353e07d3-a4b1-42c4-ab23-f21ce81a7a6e.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0258",
    "accessionNumber": "ACC-CAP-0258",
    "title": "Study Guide: Financial Reporting and Analysis (Third Edition)",
    "author": "Charles Fazzi",
    "authors": [
      "Charles Fazzi",
      "Lawrence Revsine",
      "Daniel W. Collins",
      "W. Bruce Johnson"
    ],
    "category": "Handbooks",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-03 (Business & Finance Handbooks)",
    "publisher": "Prentice Hall",
    "publicationYear": 2005,
    "status": "available",
    "available": true,
    "description": "Essential student study guide and problem solver accompanying Revsine, Collins, and Johnson's Financial Reporting and Analysis.",
    "coverUrl": "/References/Handbooks/44bf0f3c-5dbd-4389-8467-df6ab9dbf854.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0259",
    "accessionNumber": "ACC-CAP-0259",
    "title": "Webster's Secretarial Handbook (Second Edition)",
    "author": "Merriam-Webster Editorial Staff",
    "authors": [
      "Merriam-Webster Editorial Staff"
    ],
    "category": "Handbooks",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-03 (Office & Secretarial Handbooks)",
    "publisher": "Merriam-Webster",
    "publicationYear": 1983,
    "status": "available",
    "available": true,
    "description": "Authoritative office reference covering business correspondence, office automation, filing systems, record keeping, and professional communications.",
    "coverUrl": "/References/Handbooks/44c56665-f42e-4001-ac19-fe91095b7a96.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0260",
    "accessionNumber": "ACC-CAP-0260",
    "title": "Nurse's Handbook of Alternative & Complementary Therapies (Second Edition)",
    "author": "Lippincott Williams & Wilkins Staff",
    "authors": [
      "Lippincott Williams & Wilkins Staff"
    ],
    "category": "Handbooks",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-03 (Medical & Nursing Handbooks)",
    "publisher": "Lippincott Williams & Wilkins",
    "publicationYear": 2003,
    "status": "available",
    "available": true,
    "description": "Clinical nursing handbook covering over 300 herbal supplements, holistic therapies, mind-body interventions, drug interactions, and nursing considerations.",
    "coverUrl": "/References/Handbooks/5a49241f-a716-4e7b-8e88-914abf987215.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0261",
    "accessionNumber": "ACC-CAP-0261",
    "title": "Illustrated Manual of Nursing Practice (Third Edition)",
    "author": "Springhouse Corporation Editors",
    "authors": [
      "Springhouse Corporation Editors"
    ],
    "category": "Handbooks",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-03 (Medical & Nursing Handbooks)",
    "publisher": "Springhouse",
    "publicationYear": 2002,
    "status": "available",
    "available": true,
    "description": "Clinical reference providing comprehensive nursing diagnoses, assessment standards, step-by-step procedures, patient outcomes, and clinical interventions.",
    "coverUrl": "/References/Handbooks/7d57f81b-5920-42d6-9075-3219994dce04.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0262",
    "accessionNumber": "ACC-CAP-0262",
    "title": "Nursing Know-How: Interpreting ECGs",
    "author": "Lippincott Williams & Wilkins Staff",
    "authors": [
      "Lippincott Williams & Wilkins Staff"
    ],
    "category": "Handbooks",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-03 (Medical & Nursing Handbooks)",
    "publisher": "Wolters Kluwer / Lippincott Williams & Wilkins",
    "publicationYear": 2010,
    "status": "available",
    "available": true,
    "description": "Practical clinical nursing guide for accurate recognition and interpretation of cardiac dysrhythmias, 12-lead ECG strips, and emergency cardiac interventions.",
    "coverUrl": "/References/Handbooks/7fca6a31-2116-47c9-898a-bfbbc3fa9cf8.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0263",
    "accessionNumber": "ACC-CAP-0263",
    "title": "The G Protein-Coupled Receptors Handbook",
    "author": "Lakshmi A. Devi, PhD",
    "authors": [
      "Lakshmi A. Devi"
    ],
    "category": "Handbooks",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-03 (Biomedical & Science Handbooks)",
    "publisher": "Humana Press",
    "publicationYear": 2005,
    "status": "available",
    "available": true,
    "description": "Advanced biomedical reference exploring GPCR biochemistry, molecular signaling cascades, pharmacological targets, and drug discovery.",
    "coverUrl": "/References/Handbooks/9db60435-c8f7-49bc-98ab-7895d491c5e0.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0264",
    "accessionNumber": "ACC-CAP-0264",
    "title": "Giant Book of Tofu Cooking",
    "author": "K. Lee Evans & Chris Rankin",
    "authors": [
      "K. Lee Evans",
      "Chris Rankin"
    ],
    "category": "Manuals",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-04 (Culinary & Practical Manuals)",
    "publisher": "Sterling Publishing / Lark Books",
    "publicationYear": 2000,
    "status": "available",
    "available": true,
    "description": "An extensive culinary recipe manual offering healthy, creative cooking techniques and delicious dishes incorporating tofu, tempeh, and soy foods.",
    "coverUrl": "/References/Manuals/0139bc88-05b1-467a-bfe4-2e084b5e300a.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0265",
    "accessionNumber": "ACC-CAP-0265",
    "title": "First Steps Toward Reading: A Parent's Guide",
    "author": "Time-Life Books Editors",
    "authors": [
      "Time-Life Books Editors"
    ],
    "category": "Manuals",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-04 (Education & Parenting Manuals)",
    "publisher": "Time-Life Books",
    "publicationYear": 1987,
    "status": "available",
    "available": true,
    "description": "A practical parental and educator's guide to teaching children reading skills, phonetic awareness, storytelling, and early childhood literacy.",
    "coverUrl": "/References/Manuals/06d23f95-47a2-4075-9637-5fc97d22cfac.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0266",
    "accessionNumber": "ACC-CAP-0266",
    "title": "Step-Up to Medicine (Second Edition)",
    "author": "Samir Mehta et al.",
    "authors": [
      "Samir Mehta",
      "Edmund A. Milder",
      "Adam J. Mirarchi",
      "Eugene Milder",
      "Veronica Sikka"
    ],
    "category": "Manuals",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-04 (Medical Manuals)",
    "publisher": "Lippincott Williams & Wilkins",
    "publicationYear": 2008,
    "status": "available",
    "available": true,
    "description": "A high-yield case-based clinical review manual designed for medical clerkships, USMLE Step 1 and Step 2 exams, emphasizing internal medicine pathologies.",
    "coverUrl": "/References/Manuals/279a0b23-d067-43e4-81d6-08ca054ead46.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0267",
    "accessionNumber": "ACC-CAP-0267",
    "title": "Making Cards in a Weekend: Inspirational Ideas and Practical Projects",
    "author": "Jain Suckling",
    "authors": [
      "Jain Suckling"
    ],
    "category": "Manuals",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-04 (Crafts & Hobby Manuals)",
    "publisher": "Guild of Master Craftsman Publications",
    "publicationYear": 2003,
    "status": "available",
    "available": true,
    "description": "Inspirational project manual providing step-by-step instructions for handcrafted greeting cards using embossing, stamping, stenciling, and decoupage.",
    "coverUrl": "/References/Manuals/2de5dc4a-6693-4855-8e73-00d71f98817a.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0268",
    "accessionNumber": "ACC-CAP-0268",
    "title": "Soup: Wholesome, Seasonal, Fresh",
    "author": "Eric Schlosser & Culinary Editors",
    "authors": [
      "Eric Schlosser",
      "Culinary Editors"
    ],
    "category": "Manuals",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-04 (Culinary & Practical Manuals)",
    "publisher": "DK Publishing / Taunton Press",
    "publicationYear": 2009,
    "status": "available",
    "available": true,
    "description": "A comprehensive cooking manual containing hundreds of comforting soup recipes using seasonal produce, slow broths, and rustic culinary traditions.",
    "coverUrl": "/References/Manuals/5f322b55-1253-425d-af8b-39c387ef756e.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0269",
    "accessionNumber": "ACC-CAP-0269",
    "title": "Reader's Digest: How to Fix Just About Anything",
    "author": "Reader's Digest Editors",
    "authors": [
      "Reader's Digest Editors"
    ],
    "category": "Manuals",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-04 (Home Repair & Maintenance Manuals)",
    "publisher": "The Reader's Digest Association",
    "publicationYear": 1998,
    "status": "available",
    "available": true,
    "description": "The quintessential quick and easy DIY household repair manual to troubleshoot, fix, and maintain appliances, plumbing, cars, and home structures.",
    "coverUrl": "/References/Manuals/73a13baa-bcb7-4fea-822f-bb9947b1afff.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0270",
    "accessionNumber": "ACC-CAP-0270",
    "title": "Franklin Quest Style Guide for Business and Technical Communication",
    "author": "Shipley Associates & Franklin Quest Co.",
    "authors": [
      "Shipley Associates",
      "Franklin Quest Co."
    ],
    "category": "Manuals",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-04 (Business & Communication Manuals)",
    "publisher": "Franklin Quest Co.",
    "publicationYear": 1995,
    "status": "available",
    "available": true,
    "description": "Comprehensive style guide offering standards for corporate proposals, technical reports, email etiquette, executive presentations, and grammar.",
    "coverUrl": "/References/Manuals/7df3576e-62c5-44d3-82a1-beecd339e4c2.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0271",
    "accessionNumber": "ACC-CAP-0271",
    "title": "The Common-Sense Investment Guide",
    "author": "J. K. Lasser Institute",
    "authors": [
      "J. K. Lasser Institute"
    ],
    "category": "Manuals",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-04 (Finance & Investment Manuals)",
    "publisher": "John Wiley & Sons",
    "publicationYear": 1999,
    "status": "available",
    "available": true,
    "description": "A practical financial manual providing time-tested strategies for asset allocation, mutual funds, stocks, bonds, and retirement planning.",
    "coverUrl": "/References/Manuals/c8b7ecfa-d360-4c1d-ac3a-16ba56bf289e.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0272",
    "accessionNumber": "ACC-CAP-0272",
    "title": "Great American Favorite Brand Name Cookbook",
    "author": "Publications International Staff",
    "authors": [
      "Publications International Staff"
    ],
    "category": "Manuals",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-04 (Culinary & Practical Manuals)",
    "publisher": "Publications International",
    "publicationYear": 1993,
    "status": "available",
    "available": true,
    "description": "Classic kitchen recipe manual compiling hundreds of beloved family recipes utilizing favorite pantry staple ingredients and brand products.",
    "coverUrl": "/References/Manuals/d27e4ad0-25e5-4765-ae69-1af722867616.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  },
  {
    "barcode": "LIB-CAP-0273",
    "accessionNumber": "ACC-CAP-0273",
    "title": "The Good Cook: Poultry",
    "author": "Richard Olney & The Editors of Time-Life Books",
    "authors": [
      "Richard Olney",
      "The Editors of Time-Life Books"
    ],
    "category": "Manuals",
    "section": "Reference Section (Includes Theses & Dissertations)",
    "shelf": "Shelf R-04 (Culinary & Practical Manuals)",
    "publisher": "Time-Life Books",
    "publicationYear": 1979,
    "status": "available",
    "available": true,
    "description": "Master culinary instructional manual featuring technique photographic sequences and authentic recipes for preparing chicken, duck, turkey, and game birds.",
    "coverUrl": "/References/Manuals/ed3b3ced-8da9-421a-8d91-18e9b78bc8f6.jfif",
    "source": "Misamis Oriental Capitol Public Library",
    "condition": "Good",
    "copies": 1,
    "borrowable": true,
    "archived": false
  }
];

async function seedChildrenAndReferences() {
  console.log(`Starting to seed ${childrenAndReferences.length} items from Children's Corner & References...`);
  
  try {
    let insertedCount = 0;
    let updatedCount = 0;

    for (const bookData of childrenAndReferences) {
      const payload = {
        barcode: bookData.barcode,
        accession_number: bookData.accessionNumber || null,
        title: bookData.title,
        author: bookData.author || "Unknown",
        authors: Array.isArray(bookData.authors) ? bookData.authors : [],
        category: bookData.category || "General",
        section: bookData.section,
        shelf: bookData.shelf,
        publisher: bookData.publisher || "N/A",
        publication_year: bookData.publicationYear ? Number(bookData.publicationYear) : null,
        status: bookData.status || "available",
        available: bookData.available !== false,
        description: bookData.description || "",
        cover_url: bookData.coverUrl || "",
        source: bookData.source || "Misamis Oriental Capitol Public Library",
        condition: bookData.condition || "Good",
        copies: bookData.copies || 1,
        borrowable: bookData.borrowable !== false,
        archived: bookData.archived === true
      };

      // Check if book with this barcode or cover_url already exists
      const { data: existing } = await supabase
        .from("books")
        .select("id, barcode, cover_url")
        .or(`barcode.eq.${bookData.barcode},cover_url.eq."${bookData.coverUrl}"`)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabase
          .from("books")
          .update(payload)
          .eq("id", existing.id);

        if (updateError) {
          console.error(`Failed to update ${bookData.title}:`, updateError.message);
        } else {
          updatedCount++;
          console.log(`Updated: ${bookData.title} (${bookData.barcode})`);
        }
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

    console.log(`\n🎉 Done! Processed all ${childrenAndReferences.length} Children's Corner & Reference items.`);
    console.log(`- Inserted new books: ${insertedCount}`);
    console.log(`- Updated existing books: ${updatedCount}`);

    const { count: totalBooks } = await supabase
      .from("books")
      .select("id", { count: "exact", head: true });
    console.log(`Total books currently in Supabase database: ${totalBooks}`);

    process.exit(0);
  } catch (err) {
    console.error("Error seeding Children's Corner & References:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  seedChildrenAndReferences();
}

module.exports = { childrenAndReferences, seedChildrenAndReferences };
