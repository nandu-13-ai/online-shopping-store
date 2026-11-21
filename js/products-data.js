/**
 * NammaStore Product Catalog & Categories Database
 * Realistic high-end catalog with verified Unsplash photography, specs, reviews, and variants
 */

const CATEGORIES = [
  { id: 'all', name: 'All Products', icon: 'fa-cubes' },
  { id: 'electronics', name: 'Electronics & Audio', icon: 'fa-laptop' },
  { id: 'fashion', name: 'Ethnic & Modern Fashion', icon: 'fa-shirt' },
  { id: 'home', name: 'Home & Living', icon: 'fa-couch' },
  { id: 'gourmet', name: 'Gourmet & Spices', icon: 'fa-seedling' },
  { id: 'beauty', name: 'Luxury Beauty & Wellness', icon: 'fa-spa' },
  { id: 'artisan', name: 'Artisanal Crafts', icon: 'fa-palette' }
];

const CURRENCIES = {
  INR: { symbol: '₹', rate: 1, name: 'Indian Rupee' },
  USD: { symbol: '$', rate: 0.012, name: 'US Dollar' },
  EUR: { symbol: '€', rate: 0.011, name: 'Euro' },
  GBP: { symbol: '£', rate: 0.0095, name: 'British Pound' },
  AED: { symbol: 'AED ', rate: 0.044, name: 'UAE Dirham' }
};

const PRODUCTS = [
  {
    id: 'ns-001',
    name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    category: 'electronics',
    brand: 'Sony',
    price: 29990,
    originalPrice: 34990,
    rating: 4.8,
    reviewCount: 342,
    inStock: true,
    stockQuantity: 12,
    badge: 'BESTSELLER',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Industry-leading noise cancellation optimized to you with dual processors and 8 microphones. Enjoy crystal clear hands-free calling, up to 30 hours battery life with quick charging, and ultra-comfortable lightweight design with soft fit leather.',
    features: [
      'Two processors control 8 microphones for unprecedented noise cancellation',
      'Magnificent sound engineered to perfection with 30mm precision driver',
      'Crystal clear hands-free calling with 4 beamforming microphones',
      'Up to 30-hour battery life with quick charging (3 min for 3 hours of playback)',
      'Multipoint connection allows switching between two Bluetooth devices seamlessly'
    ],
    specs: {
      'Battery Life': 'Up to 30 Hours (ANC ON)',
      'Connectivity': 'Bluetooth 5.2 / 3.5mm Aux',
      'Driver Size': '30 mm Carbon Fiber Composite',
      'Weight': '250 grams',
      'Warranty': '1 Year Brand Warranty',
      'In The Box': 'Headphones, Carrying Case, Audio Cable, USB-C Cable'
    },
    variants: {
      colors: [
        { name: 'Midnight Black', hex: '#1a1a1a' },
        { name: 'Silver Platinum', hex: '#d9d9d9' },
        { name: 'Midnight Blue', hex: '#1c2841' }
      ]
    },
    reviews: [
      {
        user: 'Vikram Sundaram',
        rating: 5,
        date: '2026-11-02',
        title: 'Best ANC Headphones hands down',
        comment: 'The noise cancellation is pure magic. I use it daily during my metro commutes in Bengaluru and it shuts out everything.'
      },
      {
        user: 'Ananya Deshmukh',
        rating: 5,
        date: '2026-10-24',
        title: 'Super comfortable for long work hours',
        comment: 'The soft fit leather does not clamp hard. Sound stage is balanced and vocals are super crisp.'
      }
    ],
    frequentlyBoughtWith: 'ns-003'
  },
  {
    id: 'ns-002',
    name: 'Kanjeevaram Pure Mulberry Silk Saree with Zari Pallu',
    category: 'fashion',
    brand: 'Namma Weaves',
    price: 18450,
    originalPrice: 24900,
    rating: 4.9,
    reviewCount: 189,
    inStock: true,
    stockQuantity: 5,
    badge: 'ROYAL HERITAGE',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Directly hand-woven by master weavers in Kanchipuram using certified 100% pure Mulberry Silk and authentic tested zari. Features intricate floral temple motifs, contrast rich golden border, and matching unstitched blouse piece.',
    features: [
      'Certified Silk Mark Guarantee with 100% authentic mulberry silk',
      'Heirloom quality handloom weave taking over 24 days per saree',
      'Tested silver-gold dipped zari pallu with traditional Mayil (Peacock) motifs',
      'Comes with authentic velvet lined presentation storage box'
    ],
    specs: {
      'Fabric': '100% Pure Mulberry Silk',
      'Weave Type': 'Handloom Korvai Weave',
      'Length': '6.3 Meters (including 0.8m blouse piece)',
      'Certification': 'Silk Mark India Certified',
      'Care': 'Strictly Dry Clean Only',
      'Origin': 'Kanchipuram, Tamil Nadu'
    },
    variants: {
      colors: [
        { name: 'Royal Crimson & Gold', hex: '#990024' },
        { name: 'Peacock Emerald Green', hex: '#097969' },
        { name: 'Deep Mustard Yellow', hex: '#e1ad01' }
      ]
    },
    reviews: [
      {
        user: 'Revathi Raghavan',
        rating: 5,
        date: '2026-11-10',
        title: 'Breathtaking craftsmanship!',
        comment: 'Wore this for my daughter’s engagement and received countless compliments. The silk sheen and weight feel truly regal.'
      }
    ],
    frequentlyBoughtWith: 'ns-007'
  },
  {
    id: 'ns-003',
    name: 'Apple Watch Ultra 2 GPS + Cellular Titanium',
    category: 'electronics',
    brand: 'Apple',
    price: 89900,
    originalPrice: 94900,
    rating: 4.9,
    reviewCount: 215,
    inStock: true,
    stockQuantity: 9,
    badge: 'FLAGSHIP',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'The ultimate sports and adventure watch. Powered by S9 SiP with double tap gesture, brightest display ever up to 3000 nits, precision dual-frequency GPS, and up to 36 hours of normal battery life in rugged aerospace titanium case.',
    features: [
      '49mm aerospace-grade titanium case for ideal balance of weight and corrosion resistance',
      'Brilliant Always-On Retina display with 3000 nits peak brightness',
      'Precision dual-frequency GPS provides remarkable accuracy for distance and route',
      'Water resistant 100m, high-speed dive computer app EN13319 certified'
    ],
    specs: {
      'Case Material': 'Aerospace Grade Natural Titanium',
      'Display': 'Always-On Retina OLED, 3000 nits',
      'Battery Life': 'Up to 36 hrs normal / 72 hrs Low Power Mode',
      'Sensors': 'Blood Oxygen, ECG, Temperature sensing, Depth gauge',
      'Warranty': '1 Year Apple International Warranty'
    },
    variants: {
      colors: [
        { name: 'Natural Titanium w/ Orange Loop', hex: '#c5a059' },
        { name: 'Natural Titanium w/ Trail Loop', hex: '#686a6c' }
      ],
      sizes: ['49mm Case']
    },
    reviews: [
      {
        user: 'Karthik Rao',
        rating: 5,
        date: '2026-11-05',
        title: 'Tough as nails, incredible battery',
        comment: 'Went on a 3-day trek in the Western Ghats without charging once. GPS navigation was spot-on.'
      }
    ],
    frequentlyBoughtWith: 'ns-001'
  },
  {
    id: 'ns-004',
    name: 'Handcrafted Heritage Brass Urli with Floating Diya Set',
    category: 'home',
    brand: 'Namma Craftisan',
    price: 3890,
    originalPrice: 5500,
    rating: 4.7,
    reviewCount: 94,
    inStock: true,
    stockQuantity: 18,
    badge: 'HANDMADE',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Cast in heavy solid virgin brass by skilled artisans of Thanjavur. Fill with water and fresh rose petals or floating diyas to create a serene, welcoming Vastu-compliant sanctuary at your entrance foyer or living room.',
    features: [
      'Traditional sand-casting technique using pure brass with antique patina finish',
      'Includes 6 matching brass lotus diya burners and decorative brass stand',
      'Coated with protective lacquer to prevent tarnishing and oxidation',
      'Weight: 3.2 kg of solid virgin brass'
    ],
    specs: {
      'Material': 'Pure High-Grade Virgin Brass',
      'Diameter': '14 Inches / 35.5 cm',
      'Weight': '3.2 Kilograms',
      'Finish': 'Hand-buffed Antique Golden Polish',
      'Care': 'Clean with mild pitambari or lemon juice, wipe dry'
    },
    variants: {
      sizes: ['12 Inch', '14 Inch', '18 Inch Masterpiece']
    },
    reviews: [
      {
        user: 'Meera Iyer',
        rating: 5,
        date: '2026-10-30',
        title: 'Divine centerpiece for festive decor',
        comment: 'The weight and detailing on the rim are exceptional. Filled it with water and marigold petals for Diwali and everyone was awestruck.'
      }
    ],
    frequentlyBoughtWith: 'ns-008'
  },
  {
    id: 'ns-005',
    name: 'Coorg Single-Estate Arabica Roast & Ground Artisanal Coffee (500g)',
    category: 'gourmet',
    brand: 'Namma Brews',
    price: 680,
    originalPrice: 850,
    rating: 4.8,
    reviewCount: 420,
    inStock: true,
    stockQuantity: 35,
    badge: 'ORGANIC',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Shade-grown at 3800 ft under silver oak and wild fig trees in Madikeri, Coorg. Micro-lot medium-dark roast with enticing tasting notes of dark chocolate, toasted almond, and sweet spice. Ideal for traditional South Indian filter decoction, French Press, or Moka Pot.',
    features: [
      '100% Single-origin AAA graded Arabica beans, hand-picked and sun-dried',
      'Small batch roasted every Wednesday to ensure peak freshness',
      'Nitrogen flushed vacuum sealed pouch with one-way degassing valve',
      'Notes of Belgian dark chocolate, nutmeg, and caramelized jaggery'
    ],
    specs: {
      'Weight': '500 grams',
      'Roast Level': 'Medium-Dark Artisanal Roast',
      'Grind Type': 'Traditional Filter Coffee Grind / French Press',
      'Origin': 'Madikeri, Coorg, Karnataka',
      'Shelf Life': '9 Months from Roast Date'
    },
    variants: {
      sizes: ['250g Pouch', '500g Value Pack', '1kg Tin Box']
    },
    reviews: [
      {
        user: 'Sridhar Narayan',
        rating: 5,
        date: '2026-11-12',
        title: 'Authentic Filter Kaapi heaven!',
        comment: 'The aroma when opening the bag filled the entire house. Thick decoction with natural caramel sweetness, no bitter aftertaste.'
      }
    ],
    frequentlyBoughtWith: 'ns-006'
  },
  {
    id: 'ns-006',
    name: 'Pure Brass Traditional South Indian Filter Coffee Maker (4-Cup)',
    category: 'home',
    brand: 'Namma Craftisan',
    price: 1450,
    originalPrice: 1950,
    rating: 4.9,
    reviewCount: 156,
    inStock: true,
    stockQuantity: 24,
    badge: 'BESTSELLER',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518832553480-cd0e625ed3e6?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Crafted from heavy gauge virgin brass with food-grade tin lining inside (Kalai). Brews rich, thick decoction within 15 minutes, preserving the authentic temperature and velvet texture that stainless steel cannot replicate.',
    features: [
      'Heavy-gauge food safe virgin brass for uniform heat retention',
      'Precision micro-perforated filter disc prevents coffee sediment leakage',
      'Includes brass plunger tamper, upper brew chamber, decoction cup & lid',
      'Traditional South Indian heirloom style'
    ],
    specs: {
      'Capacity': '4 Cups (approx 220 ml decoction)',
      'Material': 'Virgin Brass with Traditional Tin-Lining',
      'Height': '16 cm',
      'Weight': '420 grams',
      'Warranty': 'Lifetime Craftsmanship Guarantee'
    },
    variants: {
      sizes: ['2-Cup Compact', '4-Cup Family', '6-Cup Large']
    },
    reviews: [
      {
        user: 'Bhavani Shankar',
        rating: 5,
        date: '2026-10-18',
        title: 'Brews the smoothest decoction',
        comment: 'Such a timeless piece on my kitchen counter. Brews thick kaapi decoction like the iconic Brahmin cafes of Bengaluru.'
      }
    ],
    frequentlyBoughtWith: 'ns-005'
  },
  {
    id: 'ns-007',
    name: 'Kumkumadi Miraculous Ayurvedic Night Beauty Face Elixir (30ml)',
    category: 'beauty',
    brand: 'Namma Ayurveda',
    price: 2450,
    originalPrice: 3200,
    rating: 4.8,
    reviewCount: 310,
    inStock: true,
    stockQuantity: 20,
    badge: '100% ORGANIC',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1608248597359-bb436a53f2cf?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Classical Ayurvedic formulation prepared with authentic Kashmiri Saffron (Kumkuma), Sandalwood, Lotus pollen, and 26 rare botanicals simmered in pure goat milk and sesame oil. Visibly brightens complexion, diminishes dark spots, and restores youthful radiance.',
    features: [
      'Formulated according to authentic texts of Ashtanga Hridaya',
      'Features Grade-1 GI tagged Kashmiri Mongra Saffron',
      'Chemical-free, Paraben-free, 100% cruelty-free natural cold extraction',
      'Lightweight, fast-absorbing golden elixir that penetrates deep cellular layers'
    ],
    specs: {
      'Volume': '30 ml Glass Dropper Bottle',
      'Skin Type': 'All Skin Types (Ideal for Dull & Pigmented skin)',
      'Key Ingredients': 'Kashmiri Saffron, Red Sandalwood, Manjistha, Vetiver',
      'Usage': 'Apply 3-4 drops nightly on cleansed face',
      'Shelf Life': '24 Months'
    },
    variants: {
      sizes: ['15ml Travel', '30ml Standard', '50ml Luxury Edition']
    },
    reviews: [
      {
        user: 'Deepika Nair',
        rating: 5,
        date: '2026-11-08',
        title: 'Golden glow in just 10 days',
        comment: 'I was skeptical, but my pigmentation around the cheeks noticeably faded after 10 days of night application. Smells divine and natural.'
      }
    ],
    frequentlyBoughtWith: 'ns-002'
  },
  {
    id: 'ns-008',
    name: 'Channapatna Wooden Handcrafted Royal Chess Set',
    category: 'artisan',
    brand: 'Namma Craftisan',
    price: 2950,
    originalPrice: 4200,
    rating: 4.9,
    reviewCount: 78,
    inStock: true,
    stockQuantity: 8,
    badge: 'GI TAGGED',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Hand-turned on traditional wooden lathes by master artisans of Channapatna (Karnataka’s renowned Gombegala Ooru). Crafted from sustainably harvested Wrightia tinctoria (Ivory Wood) and polished with natural vegetable and turmeric lac dyes for a brilliant, silky, non-toxic finish.',
    features: [
      'Official GI (Geographical Indication) tagged authentic craft',
      'Natural vegetable dyes (turmeric, indigo, acacia) with natural shellac polish',
      'Weighted pieces with velvet green felt bottoms for smooth glide on board',
      'Foldable solid Sheesham wood board with brass latches and interior velvet storage'
    ],
    specs: {
      'Board Dimensions': '14 x 14 Inches (35 x 35 cm)',
      'King Height': '3.25 Inches',
      'Wood Type': 'Ivory Wood (Pieces) & Sheesham Wood (Board)',
      'Finish': 'Natural Lacquer Gloss Polish',
      'Total Pieces': '32 Chessmen + 2 Extra Queens + Foldable Board'
    },
    variants: {
      sizes: ['12 Inch Travel', '14 Inch Tournament', '16 Inch Collector Edition']
    },
    reviews: [
      {
        user: 'Harish Varma',
        rating: 5,
        date: '2026-10-15',
        title: 'Masterpiece of Karnataka heritage',
        comment: 'The smooth lacquer finish on the pieces is so satisfying to touch during blitz chess matches. Proud to own this GI piece.'
      }
    ],
    frequentlyBoughtWith: 'ns-004'
  },
  {
    id: 'ns-009',
    name: 'Apple MacBook Pro 16" M3 Max (36GB RAM, 1TB SSD)',
    category: 'electronics',
    brand: 'Apple',
    price: 349900,
    originalPrice: 379900,
    rating: 5.0,
    reviewCount: 88,
    inStock: true,
    stockQuantity: 4,
    badge: 'LUXURY TECH',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Blisteringly fast M3 Max chip with 14-core CPU and 30-core GPU. Liquid Retina XDR display with 1600 nits peak brightness, 22-hour battery life, six-speaker sound system with Spatial Audio, and pro ports including HDMI, MagSafe, and SDXC card slot.',
    features: [
      'Apple M3 Max chip with 14-core CPU, 30-core GPU, and 16-core Neural Engine',
      '16.2-inch Liquid Retina XDR display with ProMotion 120Hz refresh rate',
      '36GB unified memory for lightning fast compiling and 8K video rendering',
      '1TB ultra-fast PCIe NVMe SSD storage with 7.4GB/s read speeds',
      'MagSafe 3 fast charging with 140W USB-C Power Adapter'
    ],
    specs: {
      'Processor': 'Apple M3 Max (14-Core CPU)',
      'RAM': '36GB Unified Memory',
      'Storage': '1TB Ultra-Fast SSD',
      'Display': '16.2-inch Liquid Retina XDR (3456 x 2234)',
      'Battery': 'Up to 22 Hours',
      'Weight': '2.16 kg'
    },
    variants: {
      colors: [
        { name: 'Space Black', hex: '#232528' },
        { name: 'Silver', hex: '#e3e4e5' }
      ],
      sizes: ['512GB SSD', '1TB SSD', '2TB SSD']
    },
    reviews: [
      {
        user: 'Rohit Shenoy',
        rating: 5,
        date: '2026-11-14',
        title: 'Unbelievable performance & battery',
        comment: 'Runs Docker containers, 4K video renders, and LLMs locally without breaking a sweat or even spinning the fans audible. Best machine ever made.'
      }
    ],
    frequentlyBoughtWith: 'ns-001'
  },
  {
    id: 'ns-010',
    name: 'Men Handloom Raw Silk Kurta with Embroidered Nehru Jacket',
    category: 'fashion',
    brand: 'Namma Weaves',
    price: 7499,
    originalPrice: 11999,
    rating: 4.7,
    reviewCount: 112,
    inStock: true,
    stockQuantity: 14,
    badge: 'FESTIVE SPECIAL',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Tailored from breathable Matka raw silk with subtle slub texture. Paired with a tailored mandarin collar Nehru jacket featuring delicate thread embroidery and antique brass metal buttons.',
    features: [
      'Pure organic Matka silk blend for all-season breathability',
      'Mandarin collar with tailored side slits and in-seam pockets',
      'Includes matching tapered silk churidar pyjama bottoms',
      'Wrinkle-resistant fabric with soft cotton lining'
    ],
    specs: {
      'Fabric': 'Raw Matka Silk Kurta & Chanderi Silk Jacket',
      'Fitting': 'Tailored Regular Modern Fit',
      'Wash Care': 'Dry Clean Recommended',
      'Occasion': 'Festive, Weddings, Cocktail Evenings'
    },
    variants: {
      colors: [
        { name: 'Ivory & Royal Navy', hex: '#1B263B' },
        { name: 'Burgundy Wine & Gold', hex: '#58111A' },
        { name: 'Emerald Olive & Bronze', hex: '#283618' }
      ],
      sizes: ['S (38)', 'M (40)', 'L (42)', 'XL (44)', 'XXL (46)']
    },
    fitType: 'tops',
    sizeMeasurements: {
      'S (38)': { chest: 98, length: 72, shoulder: 42, sleeve: 61 },
      'M (40)': { chest: 102, length: 74, shoulder: 44, sleeve: 62.5 },
      'L (42)': { chest: 106, length: 76, shoulder: 46, sleeve: 64 },
      'XL (44)': { chest: 112, length: 78, shoulder: 48, sleeve: 65.5 },
      'XXL (46)': { chest: 118, length: 80, shoulder: 50, sleeve: 67 }
    },
    reviews: [
      {
        user: 'Gautam Menon',
        rating: 5,
        date: '2026-10-29',
        title: 'Perfect fit and exquisite texture',
        comment: 'Received compliments throughout the wedding reception. The fabric breathes so well in warm weather and looks high-end.'
      }
    ],
    frequentlyBoughtWith: 'ns-002'
  },
  {
    id: 'ns-011',
    name: 'Wayanad Organic Wild Forest Honey & Tellicherry Peppercorns Set',
    category: 'gourmet',
    brand: 'Namma Organics',
    price: 1190,
    originalPrice: 1650,
    rating: 4.9,
    reviewCount: 260,
    inStock: true,
    stockQuantity: 40,
    badge: '100% RAW',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Sustainably collected by indigenous tribal communities from the dense rainforest canopies of Wayanad, Kerala. Unheated, raw, multi-floral forest honey paired with jumbo Grade-TGSEB sun-dried black peppercorns bursting with rich piperine essential oils.',
    features: [
      '100% Unprocessed, unpasteurized honey with natural pollen & propolis enzymes',
      'Tellicherry Extra Bold (TGSEB) hand-graded black peppercorns',
      'Glass apothecary jars that preserve delicate aromas and antioxidants',
      'Sustainably certified by Rainforest Alliance'
    ],
    specs: {
      'Weight': 'Honey: 500g Glass Jar | Peppercorns: 200g Jar',
      'Origin': 'Wayanad Biosphere Reserve, Kerala',
      'Processing': 'Cold Extracted & Sun Dried',
      'Purity Guarantee': 'Nuclear Magnetic Resonance (NMR) Tested'
    },
    variants: {
      sizes: ['Twin Gift Set (700g total)', 'Single Honey Jar (500g)']
    },
    reviews: [
      {
        user: 'Pooja Hegde',
        rating: 5,
        date: '2026-11-06',
        title: 'Real wild honey has this flavor!',
        comment: 'You can taste the wild forest blossoms. Thick, unadulterated, and the Tellicherry pepper has an intense citrus-floral punch.'
      }
    ],
    frequentlyBoughtWith: 'ns-005'
  },
  {
    id: 'ns-012',
    name: 'Mysore Sandalwood & Kashmiri Saffron Luxury Incense & Dhoop Box',
    category: 'home',
    brand: 'Namma Aromatics',
    price: 890,
    originalPrice: 1250,
    rating: 4.8,
    reviewCount: 175,
    inStock: true,
    stockQuantity: 50,
    badge: 'CHARCOAL FREE',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Slow-burning, artisanal agarbatti hand-rolled using pure Mysore Santalum album powder, natural temple floral gums, and Kashmiri saffron strands. 100% charcoal-free and dipped in botanical essential oils for a deeply calming meditation atmosphere.',
    features: [
      'Zero charcoal, zero toxic fumes — 100% natural organic incense',
      'Burn time of 60+ minutes per stick with lingering soothing aroma',
      'Includes handcrafted ceramic lotus incense holder',
      'Packed in recycled handmade cotton paper cylinder box'
    ],
    specs: {
      'Contents': '50 Artisanal Incense Sticks + 20 Dhoop Cones + Holder',
      'Fragrance': 'Pure Mysore Sandalwood & Royal Saffron',
      'Burn Time': '60 - 75 minutes per stick',
      'Origin': 'Mysuru, Karnataka'
    },
    variants: {
      sizes: ['50 Sticks Box', '100 Sticks Value Gift Pack']
    },
    reviews: [
      {
        user: 'Naveen Swaminathan',
        rating: 5,
        date: '2026-11-01',
        title: 'Brings temple peace right into the home',
        comment: 'Most commercial sticks give me headaches because of charcoal. These are pure, sweet, and burn for over an hour.'
      }
    ],
    frequentlyBoughtWith: 'ns-004'
  },
  {
    id: 'ns-013',
    name: 'Namma Crafted South Indian Pure French Linen Tailored Shirt',
    category: 'fashion',
    brand: 'Namma Weaves',
    price: 3499,
    originalPrice: 4999,
    rating: 4.9,
    reviewCount: 94,
    inStock: true,
    stockQuantity: 22,
    badge: 'NEW ARRIVAL',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1589310243389-9685981b3456?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Woven from 100% Normandy flax linen with a featherlight, ultra-breathable texture. Tailored with mother-of-pearl buttons and a relaxed modern Italian collar, making it the perfect shirt for Bengaluru weather and coastal getaways.',
    features: [
      '100% Certified pure European flax linen yarn',
      'Pre-washed garment enzyme finish for signature soft touch',
      'Natural Mother-of-Pearl shell buttons',
      'Reinforced gusset stitching at side seams'
    ],
    specs: {
      'Fabric': '100% Pure Flax Linen',
      'Fit': 'Tailored Modern Fit',
      'Collar': 'Relaxed Semi-Spread Collar',
      'Wash Care': 'Gentle Machine Wash, Hang Dry',
      'Origin': 'Hand-finished in Coimbatore'
    },
    variants: {
      colors: [
        { name: 'Riviera White', hex: '#F8F9FA' },
        { name: 'Navy Indigo', hex: '#1D2A44' },
        { name: 'Olive Sage', hex: '#708238' }
      ],
      sizes: ['S (38)', 'M (40)', 'L (42)', 'XL (44)']
    },
    fitType: 'tops',
    sizeMeasurements: {
      'S (38)': { chest: 98, length: 72, shoulder: 43, sleeve: 62 },
      'M (40)': { chest: 104, length: 74, shoulder: 45, sleeve: 63.5 },
      'L (42)': { chest: 110, length: 76, shoulder: 47, sleeve: 65 },
      'XL (44)': { chest: 116, length: 78, shoulder: 49, sleeve: 66.5 }
    },
    reviews: [
      {
        user: 'Tarun Saxena',
        rating: 5,
        date: '2026-11-16',
        title: 'Insane fit and fabric breathability',
        comment: 'I usually struggle with linen being either too stiff or boxy. This fits like a dream across the chest and shoulders.'
      }
    ],
    frequentlyBoughtWith: 'ns-010'
  },
  {
    id: 'ns-014',
    name: 'Artisanal Full-Grain Buffalo Leather & Canvas Commuter Backpack',
    category: 'fashion',
    brand: 'Namma Craftisan',
    price: 5890,
    originalPrice: 8500,
    rating: 4.8,
    reviewCount: 63,
    inStock: true,
    stockQuantity: 11,
    badge: 'HANDCRAFTED',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1577733966973-d680bffd2e80?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Handcrafted with water-resistant 18oz heavy waxed army duck canvas and vegetable-tanned full grain buffalo leather. Fits up to a 16-inch MacBook Pro in a padded suspension compartment with antique brass hardware.',
    features: [
      'Heavy 18oz waxed canvas with pull-up vegetable tanned leather trim',
      'Suspended padded laptop sleeve fits up to 16-inch laptop',
      'Waterproof YKK zippers and solid cast brass buckles',
      'Breathable padded mesh back panel and contoured leather straps'
    ],
    specs: {
      'Capacity': '24 Liters',
      'Dimensions': 'Height: 46 cm | Width: 32 cm | Depth: 16 cm',
      'Weight': '1.35 kg',
      'Laptop Compartment': 'Fits up to 16" MacBook Pro'
    },
    variants: {
      colors: [
        { name: 'Vintage Olive & Tan', hex: '#556B2F' },
        { name: 'Charcoal Black & Cognac', hex: '#2F4F4F' }
      ],
      sizes: ['24L Everyday Backpack']
    },
    fitType: 'bags',
    bagMeasurements: {
      height: 46,
      width: 32,
      depth: 16,
      laptopFit: 16
    },
    reviews: [
      {
        user: 'Aditya Roy',
        rating: 5,
        date: '2026-11-13',
        title: 'Rugged luxury at its finest',
        comment: 'Leather smells authentic and the waxed canvas is rock solid. Fits my 16-inch laptop, water bottle, and gym clothes with ease.'
      }
    ],
    frequentlyBoughtWith: 'ns-009'
  },
  {
    id: 'ns-015',
    name: 'Bengaluru Indigo Handblock Pure Cotton Casual Shirt',
    category: 'fashion',
    brand: 'Namma Weaves',
    price: 2499,
    originalPrice: 3999,
    rating: 4.8,
    reviewCount: 78,
    inStock: true,
    stockQuantity: 19,
    badge: 'POPULAR',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1589310243389-9685981b3456?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Artisanal natural indigo block print shirt made from 100% fine staple South Indian cotton. Pre-shrunk and hand-dyed using traditional Bagru techniques for an effortless, breathable smart-casual look.',
    features: [
      '100% Breathable combed long-staple Indian cotton',
      'Natural organic indigo botanical dye',
      'Tailored regular fit with modern spread collar',
      'Durable double-stitched armholes and coconut shell buttons'
    ],
    specs: {
      'Fabric': '100% Combed Cotton',
      'Fit': 'Tailored Regular Casual Fit',
      'Collar': 'Modern Button-Down Collar',
      'Wash Care': 'Cold Machine Wash with like colors',
      'Origin': 'Hand-dyed & stitched in Bengaluru'
    },
    variants: {
      colors: [
        { name: 'Indigo Geo Block', hex: '#1D2A44' },
        { name: 'Vintage Rust Leaf', hex: '#8B4513' },
        { name: 'Charcoal Grid', hex: '#333333' }
      ],
      sizes: ['S (38)', 'M (40)', 'L (42)', 'XL (44)']
    },
    fitType: 'tops',
    sizeMeasurements: {
      'S (38)': { chest: 98, length: 72, shoulder: 43, sleeve: 62 },
      'M (40)': { chest: 104, length: 74, shoulder: 45, sleeve: 63 },
      'L (42)': { chest: 110, length: 76, shoulder: 47, sleeve: 64.5 },
      'XL (44)': { chest: 116, length: 78, shoulder: 49, sleeve: 66 }
    },
    reviews: [
      {
        user: 'Rohit Kulkarni',
        rating: 5,
        date: '2026-11-17',
        title: 'Authentic indigo and stellar fit',
        comment: 'The cotton is incredibly soft and the natural dye gives it a bespoke character.'
      }
    ],
    frequentlyBoughtWith: 'ns-014'
  },
  {
    id: 'ns-016',
    name: 'Chettinad Crisp White Khadi Mandarin Collar Shirt',
    category: 'fashion',
    brand: 'Namma Weaves',
    price: 2899,
    originalPrice: 4299,
    rating: 4.9,
    reviewCount: 64,
    inStock: true,
    stockQuantity: 16,
    badge: 'BESTSELLER',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1620012253295-c15c429fbb41?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Spun from pure indigenous cotton on traditional amber charkhas. Features an elegant mandarin band collar, coconut shell buttons, and a tailored comfort cut designed to keep you cool in South Indian summers.',
    features: [
      '100% Certified organic hand-spun khadi cotton',
      'Minimalist mandarin band collar with concealed placket',
      'Naturally breathable and temperature-regulating weave',
      'Pre-shrunk fabric ensuring zero shrinkage after washes'
    ],
    specs: {
      'Fabric': '100% Hand-Spun Khadi Cotton',
      'Fit': 'Tailored Modern Fit',
      'Collar': 'Mandarin Band Collar',
      'Wash Care': 'Gentle Hand Wash or Mild Machine Wash',
      'Origin': 'Woven in Chettinad, Tamil Nadu'
    },
    variants: {
      colors: [
        { name: 'Pure Chalk White', hex: '#FFFFFF' },
        { name: 'Natural Ecru', hex: '#F5F5DC' }
      ],
      sizes: ['S (38)', 'M (40)', 'L (42)', 'XL (44)']
    },
    fitType: 'tops',
    sizeMeasurements: {
      'S (38)': { chest: 98, length: 72, shoulder: 43, sleeve: 61.5 },
      'M (40)': { chest: 104, length: 74, shoulder: 45, sleeve: 63 },
      'L (42)': { chest: 110, length: 76, shoulder: 47, sleeve: 64.5 },
      'XL (44)': { chest: 116, length: 78, shoulder: 49, sleeve: 66 }
    },
    reviews: [
      {
        user: 'Vivek Chandran',
        rating: 5,
        date: '2026-11-18',
        title: 'Outstanding fabric quality and silhouette',
        comment: 'Crisp, structured yet feels weightless. Pairs perfectly with both tailored trousers and jeans.'
      }
    ],
    frequentlyBoughtWith: 'ns-013'
  },
  {
    id: 'ns-017',
    name: 'Malabar Breathable Organic Pique Cotton Resort Polo',
    category: 'fashion',
    brand: 'Namma Weaves',
    price: 1899,
    originalPrice: 2799,
    rating: 4.8,
    reviewCount: 52,
    inStock: true,
    stockQuantity: 28,
    badge: 'ESSENTIAL',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Knitted from long-staple organic cotton with a honeycomb pique texture. Features ribbed collar and cuffs, side vent slits, and an active stretch profile that moves with you.',
    features: [
      'Organic combed cotton honeycomb pique weave',
      'Two-button placket with real horn buttons',
      'Tennis tail hem with reinforced side vents',
      'Shape-retention ribbed collar that never curls'
    ],
    specs: {
      'Fabric': '100% Organic Pique Cotton (220 GSM)',
      'Fit': 'Athletic Slim Fit',
      'Collar': 'Ribbed Polo Collar',
      'Wash Care': 'Machine Wash Warm, Tumble Dry Low',
      'Origin': 'Knit in Tiruppur, Tamil Nadu'
    },
    variants: {
      colors: [
        { name: 'Forest Evergreen', hex: '#1E3F20' },
        { name: 'Deep Royal Navy', hex: '#1B263B' },
        { name: 'Sunlit Terracotta', hex: '#CC4E46' }
      ],
      sizes: ['S (38)', 'M (40)', 'L (42)', 'XL (44)']
    },
    fitType: 'tops',
    sizeMeasurements: {
      'S (38)': { chest: 96, length: 70, shoulder: 42, sleeve: 21 },
      'M (40)': { chest: 102, length: 72, shoulder: 44, sleeve: 22 },
      'L (42)': { chest: 108, length: 74, shoulder: 46, sleeve: 23 },
      'XL (44)': { chest: 114, length: 76, shoulder: 48, sleeve: 24 }
    },
    reviews: [
      {
        user: 'Abhishek Nair',
        rating: 5,
        date: '2026-11-15',
        title: 'Best polo in this price category',
        comment: 'Fabric feels heavy and premium without trapping heat. Collar stays sharp even after multiple washes.'
      }
    ],
    frequentlyBoughtWith: 'ns-014'
  },
  {
    id: 'ns-018',
    name: 'Nilgiri Washed Vintage Denim Western Overshirt',
    category: 'fashion',
    brand: 'Namma Weaves',
    price: 3199,
    originalPrice: 4699,
    rating: 4.8,
    reviewCount: 41,
    inStock: true,
    stockQuantity: 18,
    badge: 'TRENDING',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1589310243389-9685981b3456?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Crafted from 8.5 oz ring-spun denim and enzyme stone-washed for lived-in comfort. Features western front & back yokes, twin flap chest pockets, and antiqued brass snap buttons.',
    features: [
      '100% Cotton 8.5 oz ring-spun selvedge denim',
      'Authentic Western pointed yokes and pearl snap fasteners',
      'Double-needle chainstitch construction on stress points',
      'Versatile as standalone shirt or unbuttoned overshirt'
    ],
    specs: {
      'Fabric': '100% Heavyweight Cotton Denim',
      'Fit': 'Relaxed Modern Overshirt Fit',
      'Collar': 'Point Collar with Western Yoke',
      'Wash Care': 'Machine Wash Cold Inside Out',
      'Origin': 'Crafted in Bengaluru'
    },
    variants: {
      colors: [
        { name: 'Medium Indigo Wash', hex: '#3B5998' },
        { name: 'Vintage Fade Grey', hex: '#5A6268' }
      ],
      sizes: ['S (38)', 'M (40)', 'L (42)', 'XL (44)']
    },
    fitType: 'tops',
    sizeMeasurements: {
      'S (38)': { chest: 100, length: 73, shoulder: 44, sleeve: 62 },
      'M (40)': { chest: 106, length: 75, shoulder: 46, sleeve: 63.5 },
      'L (42)': { chest: 112, length: 77, shoulder: 48, sleeve: 65 },
      'XL (44)': { chest: 118, length: 79, shoulder: 50, sleeve: 66.5 }
    },
    reviews: [
      {
        user: 'Siddharth Rao',
        rating: 5,
        date: '2026-11-14',
        title: 'Perfect rugged layering piece',
        comment: 'Great weight for Bengaluru evenings. The denim softens noticeably with each wash.'
      }
    ],
    frequentlyBoughtWith: 'ns-009'
  },
  {
    id: 'ns-019',
    name: 'Royal Mysore Tussar Silk Bandhgala Nehru Jacket Set',
    category: 'fashion',
    brand: 'Namma Weaves',
    price: 8499,
    originalPrice: 12999,
    rating: 4.9,
    reviewCount: 37,
    inStock: true,
    stockQuantity: 11,
    badge: 'LUXURY',
    isExpress: true,
    images: [
      'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'Woven from wild Tussar silk with a rich gold luster and natural textured slubs. Features structured shoulder padding, bespoke carved brass buttons, and welt pockets, paired with an ivory silk kurta.',
    features: [
      'Certified authentic wild Tussar raw silk',
      'Hand-cast Mysore royal crest brass buttons',
      'Structured chest canvas for sharp royal posture',
      'Breathable satin-twill interior lining'
    ],
    specs: {
      'Fabric': '100% Pure Tussar Silk & Satin Lining',
      'Fit': 'Structured Tailored Bandhgala Fit',
      'Collar': 'Standing Mandarin Collar',
      'Wash Care': 'Strictly Dry Clean Only',
      'Origin': 'Master Weavers of Mysore'
    },
    variants: {
      colors: [
        { name: 'Antique Gold Ochre', hex: '#B8860B' },
        { name: 'Imperial Midnight Blue', hex: '#191970' }
      ],
      sizes: ['S (38)', 'M (40)', 'L (42)', 'XL (44)']
    },
    fitType: 'tops',
    sizeMeasurements: {
      'S (38)': { chest: 100, length: 71, shoulder: 43, sleeve: 61 },
      'M (40)': { chest: 104, length: 73, shoulder: 45, sleeve: 62.5 },
      'L (42)': { chest: 108, length: 75, shoulder: 47, sleeve: 64 },
      'XL (44)': { chest: 114, length: 77, shoulder: 49, sleeve: 65.5 }
    },
    reviews: [
      {
        user: 'Devendra Hegde',
        rating: 5,
        date: '2026-11-19',
        title: 'Regal look and impeccable tailoring',
        comment: 'Wore it for my sister wedding and got countless compliments. The raw silk has a stunning organic sheen.'
      }
    ],
    frequentlyBoughtWith: 'ns-002'
  }
];

// Available coupon codes
const COUPONS = {
  'NAMMA20': { discount: 0.20, type: 'percent', label: '20% Off Your Entire Order', minSpend: 1000 },
  'FIRSTBUY': { discount: 500, type: 'fixed', label: '₹500 Flat Off on First Order', minSpend: 2500 },
  'FESTIVE': { discount: 0.15, type: 'percent', label: '15% Off Festive Season Discount', minSpend: 1500 },
  'FREESHIP': { discount: 0, type: 'free_shipping', label: 'Free Express Shipping', minSpend: 500 }
};

// Export to window
if (typeof window !== 'undefined') {
  window.CATEGORIES = CATEGORIES;
  window.CURRENCIES = CURRENCIES;
  window.PRODUCTS = PRODUCTS;
  window.COUPONS = COUPONS;
}
