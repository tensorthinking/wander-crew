/* Wander Crew destination cost model.
 * All money is INR, per person, assuming friends share rooms.
 *  fl/fh  : typical return economy fare from Bengaluru (low season low / busy-season high)
 *  d      : daily spend per person by travel style [backpacker, comfort, premium, luxury]
 *           = stay (shared) + food + local transport + paid activities, averaged per day
 *  visa   : approximate visa / entry fees for an Indian passport (0 = free)
 *  best   : good months, e.g. "10-3" = Oct to Mar, "4-6,9-10" = Apr-Jun and Sep-Oct
 *  hrs    : typical flying time one way from India, door to door-ish
 *  v      : vibes  B beaches  N nightlife  M mountains/nature  C culture/history
 *                  F food  S shopping/cities  A adventure  L luxury/chill  W wildlife
 *  wiki   : Wikipedia article titles used for real photos (first that has an image wins)
 * These are planning estimates for 2026-27, not quotes. Update freely.
 */
window.WC_REGIONS = [
  { id: "india",         name: "India",                 emoji: "🛺" },
  { id: "south-asia",    name: "South Asia",            emoji: "🏔️" },
  { id: "se-asia",       name: "Southeast Asia",        emoji: "🌴" },
  { id: "east-asia",     name: "East Asia",             emoji: "🏯" },
  { id: "central-asia",  name: "Central Asia & Caucasus", emoji: "🐎" },
  { id: "middle-east",   name: "Middle East",           emoji: "🐪" },
  { id: "indian-ocean",  name: "Indian Ocean Islands",  emoji: "🏝️" },
  { id: "africa",        name: "Africa",                emoji: "🦁" },
  { id: "europe",        name: "Europe",                emoji: "🏰" },
  { id: "north-america", name: "North America",         emoji: "🗽" },
  { id: "latin-america", name: "Latin America",         emoji: "🌮" },
  { id: "oceania",       name: "Australia & Pacific",   emoji: "🦘" },
];

window.WC_STYLES = [
  { id: 0, name: "Backpacker", blurb: "Hostels, street food, buses" },
  { id: 1, name: "Comfort",    blurb: "3★ hotels or villas, sit-down meals" },
  { id: 2, name: "Premium",    blurb: "4★, nice dinners, private tours" },
  { id: 3, name: "Luxury",     blurb: "5★, fine dining, zero compromises" },
];

window.WC_VIBES = {
  B: "Beaches", N: "Nightlife", M: "Mountains & nature", C: "Culture & history",
  F: "Food trail", S: "Shopping & cities", A: "Adventure", L: "Luxury & chill", W: "Wildlife",
};

// key, name, country, region, sub-region, airport, fl, fh, d[4], visa, visaNote, best, hrs, vibes, famous, wiki[]
const R = (key, name, country, region, sub, iata, fl, fh, d, visa, visaNote, best, hrs, v, famous, wiki) =>
  ({ key, name, country, region, sub, iata, fl, fh, d, visa, visaNote, best, hrs, v, famous, wiki });

window.WC_DEST = [
  // ---------- South Asia
  R("nepal","Kathmandu & Pokhara","Nepal","south-asia","Himalaya","KTM",14000,24000,[2000,3500,7000,16000],0,"No visa for Indians; carry passport or voter ID","10-11,3-5",2,"MCA","Himalayan views, paragliding, momos, temples",["Pokhara","Boudhanath","Annapurna Massif"]),
  R("bhutan","Paro & Thimphu","Bhutan","south-asia","Himalaya","PBH",18000,32000,[3500,5500,10000,25000],0,"No visa; entry permit + SDF ₹1,200 per night (built into daily cost)","3-5,9-11",3,"MCL","Tiger's Nest, dzongs, gross national happiness",["Paro Taktsang","Punakha Dzong","Tashichho Dzong"]),
  R("srilanka","Colombo, Kandy & the south coast","Sri Lanka","south-asia","Island","CMB",12000,22000,[2500,4500,9000,20000],1800,"ETA online before you fly","12-4",1.5,"BCWMF","Tea hills, the Kandy–Ella train, leopards, surf",["Sigiriya","Nine Arch Bridge","Galle Fort"]),

  // ---------- Indian Ocean
  R("maldives","Maldives","Maldives","indian-ocean","Islands","MLE",18000,35000,[4500,9000,22000,60000],0,"Free visa on arrival; IMUGA form 96h before","11-4",1.5,"BLA","Overwater villas, reef snorkelling, sandbanks",["Malé","Baa Atoll","Vaadhoo"]),
  R("mauritius","Mauritius","Mauritius","indian-ocean","Islands","MRU",40000,60000,[4000,7500,15000,35000],0,"Free visa on arrival","5-12",6,"BLA","Le Morne, Seven Coloured Earths, catamaran days",["Le Morne Brabant","Chamarel","Grand Baie"]),
  R("seychelles","Seychelles","Seychelles","indian-ocean","Islands","SEZ",45000,70000,[6000,11000,22000,50000],0,"Visa-free; travel authorisation fee online","4-5,10-11",6,"BLW","Granite beaches, giant tortoises, La Digue by bicycle",["Anse Source d'Argent","La Digue","Praslin"]),

  // ---------- Southeast Asia
  R("thailand-bkk","Bangkok & Pattaya","Thailand","se-asia","Thailand","BKK",16000,28000,[2500,5000,10000,22000],0,"Visa-free 30 days; TDAC form + ₹20k-ish cash on hand","11-3",4,"NFS","Rooftop bars, temples, night markets, shopping",["Wat Arun","Grand Palace","Chatuchak Weekend Market"]),
  R("thailand-south","Phuket, Krabi & Phi Phi","Thailand","se-asia","Thailand","HKT",20000,32000,[2800,5500,11000,25000],0,"Visa-free 30 days; TDAC form","11-4",5,"BNAL","Island hopping, Phi Phi, beach clubs, diving",["Phi Phi Islands","Railay Beach","Phang Nga Bay"]),
  R("thailand-north","Chiang Mai & Pai","Thailand","se-asia","Thailand","CNX",22000,34000,[2000,4000,8000,18000],0,"Visa-free 30 days; TDAC form","11-2",5,"MCFA","Elephant sanctuaries, night bazaars, mountain temples",["Wat Phra That Doi Suthep","Chiang Mai","Pai, Thailand"]),
  R("bali","Bali","Indonesia","se-asia","Indonesia","DPS",25000,40000,[2800,5500,11000,25000],3600,"Visa on arrival ₹2,800 + Bali tourist levy","4-10",7,"BNAL","Pool villas, rice terraces, waterfalls, beach clubs",["Tanah Lot","Uluwatu Temple","Tegallalang"]),
  R("komodo","Komodo & Labuan Bajo","Indonesia","se-asia","Indonesia","LBJ",32000,48000,[3500,7000,15000,35000],3600,"Visa on arrival","4-11",9,"AWB","Komodo dragons, pink beach, liveaboard boats",["Komodo National Park","Padar Island","Labuan Bajo"]),
  R("vietnam-north","Hanoi & Ha Long Bay","Vietnam","se-asia","Vietnam","HAN",22000,35000,[2000,4000,8000,18000],2300,"E-visa online before you fly","10-4",6,"MCF","Ha Long cruise, Old Quarter, egg coffee, Sapa",["Hạ Long Bay","Hoàn Kiếm Lake","Sa Pa"]),
  R("vietnam-central","Da Nang & Hoi An","Vietnam","se-asia","Vietnam","DAD",22000,35000,[2000,4000,8000,18000],2300,"E-visa online before you fly","2-8",7,"BFC","Golden Bridge, lantern town, beaches, tailors",["Golden Bridge (Vietnam)","Hội An","Marble Mountains"]),
  R("vietnam-south","Ho Chi Minh City & Phu Quoc","Vietnam","se-asia","Vietnam","SGN",20000,32000,[2000,4000,8000,18000],2300,"E-visa online before you fly","12-4",5,"FNB","Street food, Mekong Delta, island sunsets",["Ho Chi Minh City","Phú Quốc","Mekong Delta"]),
  R("singapore","Singapore","Singapore","se-asia","City","SIN",18000,30000,[5500,9000,16000,32000],2500,"Visa in advance via authorised agent","1-12",4.5,"SFN","Gardens by the Bay, Sentosa, hawker centres",["Gardens by the Bay","Marina Bay Sands","Sentosa"]),
  R("malaysia","Kuala Lumpur & Langkawi","Malaysia","se-asia","Malaysia","KUL",15000,26000,[2500,4500,9000,20000],0,"30-day exemption announced to Dec 2026; recheck for 2027","12-4",4.5,"SFB","Petronas Towers, Batu Caves, Langkawi beaches",["Petronas Towers","Batu Caves","Langkawi"]),
  R("penang","Penang","Malaysia","se-asia","Malaysia","PEN",17000,28000,[2200,4000,8000,17000],0,"30-day exemption announced to Dec 2026; recheck for 2027","12-3",4.5,"FCB","Street art, char kway teow, heritage shophouses",["George Town, Penang","Penang Hill","Kek Lok Si"]),
  R("philippines","Palawan: El Nido & Coron","Philippines","se-asia","Philippines","PPS",30000,45000,[2800,5000,10000,22000],0,"Visa-free 14 days for Indians","12-5",9,"BAL","Lagoons, limestone cliffs, island hopping",["El Nido, Palawan","Coron, Palawan","Big Lagoon"]),
  R("cambodia","Siem Reap & Phnom Penh","Cambodia","se-asia","Indochina","REP",25000,38000,[2000,3800,8000,18000],3000,"E-visa online","11-3",6,"CF","Angkor Wat sunrise, Pub Street, Khmer food",["Angkor Wat","Bayon","Ta Prohm"]),
  R("laos","Luang Prabang & Vang Vieng","Laos","se-asia","Indochina","LPQ",28000,40000,[1800,3500,7000,15000],3500,"Visa on arrival / e-visa","11-3",7,"MCA","Kuang Si Falls, monk alms, river tubing",["Luang Prabang","Kuang Si Falls","Vang Vieng"]),

  // ---------- East Asia
  R("japan","Tokyo, Kyoto & Osaka","Japan","east-asia","Japan","NRT",40000,65000,[6000,11000,20000,45000],600,"Visa in advance via VFS (apply 4–6 weeks ahead)","3-5,10-11",10,"CFS","Shibuya, Fushimi Inari, bullet trains, ramen",["Fushimi Inari-taisha","Shibuya Crossing","Mount Fuji"]),
  R("hokkaido","Hokkaido","Japan","east-asia","Japan","CTS",50000,75000,[6500,11500,21000,46000],600,"Visa in advance via VFS","12-2,7-8",12,"MAL","Powder snow, lavender fields, crab, onsens",["Niseko","Furano","Otaru"]),
  R("korea","Seoul & Busan","South Korea","east-asia","Korea","ICN",38000,60000,[5000,9000,17000,38000],3500,"Visa in advance","4-6,9-11",9,"SFCN","Palaces, K-pop, Korean BBQ, skincare hauls",["Gyeongbokgung","Bukchon Hanok Village","Gamcheon Culture Village"]),
  R("china-classic","Beijing & Shanghai","China","east-asia","China","PEK",40000,60000,[4000,7500,14000,32000],3000,"Visa in advance; set up Alipay/WeChat Pay","4-5,9-10",9,"CSF","Great Wall, Forbidden City, the Bund",["Great Wall of China","Forbidden City","The Bund"]),
  R("china-nature","Zhangjiajie & Guilin","China","east-asia","China","DYG",42000,62000,[3500,6500,12000,28000],3000,"Visa in advance","4-5,9-10",11,"MA","Avatar mountains, glass bridge, Li River karsts",["Zhangjiajie National Forest Park","Li River","Yangshuo County"]),
  R("hongkong","Hong Kong & Macau","Hong Kong","east-asia","City","HKG",22000,38000,[6000,10000,18000,40000],0,"Free pre-arrival registration (PAR) online","10-4",6,"SFN","Victoria Peak, dim sum, Disneyland, Macau casinos",["Victoria Harbour","Victoria Peak","Ruins of St. Paul's"]),
  R("taiwan","Taipei & Taroko","Taiwan","east-asia","Taiwan","TPE",35000,55000,[4000,7500,14000,30000],3000,"Visa or eVisa in advance","10-4",8,"FMS","Night markets, Jiufen, Taroko Gorge, bubble tea",["Taipei 101","Jiufen","Taroko National Park"]),
  R("mongolia","Ulaanbaatar & the steppe","Mongolia","east-asia","Mongolia","UBN",50000,75000,[3500,6500,12000,28000],2500,"E-visa online","6-9",12,"MA","Ger camps, Gobi dunes, horse treks, Naadam",["Gobi Desert","Ulaanbaatar","Terelj National Park"]),

  // ---------- Central Asia & Caucasus
  R("uzbekistan","Samarkand, Bukhara & Tashkent","Uzbekistan","central-asia","Silk Road","TAS",25000,40000,[2500,4500,9000,20000],1700,"E-visa online","4-6,9-10",3.5,"CF","Registan, blue domes, plov, Silk Road bazaars",["Registan","Bukhara","Itchan Kala"]),
  R("kazakhstan","Almaty","Kazakhstan","central-asia","Silk Road","ALA",25000,40000,[3000,5500,10000,22000],0,"Visa-free 14 days for Indians","5-9,12-2",4,"MA","Charyn Canyon, Big Almaty Lake, ski at Shymbulak",["Charyn Canyon","Big Almaty Lake","Kolsai Lakes"]),
  R("kyrgyzstan","Bishkek & Issyk-Kul","Kyrgyzstan","central-asia","Silk Road","FRU",30000,45000,[2200,4000,8000,16000],4000,"E-visa online","6-9",5,"MA","Yurt stays, alpine lakes, horse treks",["Issyk-Kul","Ala Archa National Park","Song-Köl"]),
  R("georgia","Tbilisi & Kazbegi","Georgia","central-asia","Caucasus","TBS",30000,48000,[2800,5000,10000,22000],5000,"E-visa, or visa-free with a valid US/UK/Schengen visa","5-10",6,"MFCN","Wine, khachapuri, Gergeti church, sulphur baths",["Tbilisi","Gergeti Trinity Church","Mestia"]),
  R("armenia","Yerevan & Lake Sevan","Armenia","central-asia","Caucasus","EVN",30000,48000,[2500,4500,9000,20000],800,"E-visa online","5-10",6,"CMF","Monasteries, Mount Ararat views, brandy",["Yerevan","Tatev Monastery","Lake Sevan"]),
  R("azerbaijan","Baku","Azerbaijan","central-asia","Caucasus","GYD",25000,40000,[3000,5500,11000,25000],2200,"E-visa online","4-6,9-10",4.5,"SC","Flame Towers, old city, fire mountains",["Flame Towers","Heydar Aliyev Center","Baku Old City"]),

  // ---------- Middle East
  R("dubai","Dubai & Abu Dhabi","UAE","middle-east","Gulf","DXB",15000,26000,[5000,9000,18000,45000],7500,"Visa in advance (on arrival if you hold a US/UK/EU visa)","11-3",4,"SNLA","Burj Khalifa, desert safari, malls, beach clubs",["Burj Khalifa","Sheikh Zayed Grand Mosque","Dubai Marina"]),
  R("oman","Muscat & the wadis","Oman","middle-east","Gulf","MCT",15000,28000,[4000,7500,14000,32000],1100,"E-visa online","10-3",3.5,"AMBC","Wadi Shab, desert camps, forts, fjords",["Sultan Qaboos Grand Mosque","Nizwa Fort","Wahiba Sands"]),
  R("qatar","Doha","Qatar","middle-east","Gulf","DOH",17000,28000,[5000,9000,17000,40000],0,"Visa-free 30 days (Hayya registration + hotel booking)","11-3",4,"SLC","Museum of Islamic Art, souqs, dune bashing",["Museum of Islamic Art, Doha","Souq Waqif","The Pearl-Qatar"]),
  R("saudi","Riyadh, AlUla & Jeddah","Saudi Arabia","middle-east","Gulf","RUH",20000,35000,[5500,10000,19000,45000],10000,"Visa in advance (e-visa if you hold a US/UK/Schengen visa)","11-3",4.5,"CA","Hegra tombs, Elephant Rock, Red Sea",["Kingdom Centre","Jeddah","Edge of the World (Saudi Arabia)"]),
  R("jordan","Petra, Wadi Rum & Dead Sea","Jordan","middle-east","Levant","AMM",30000,48000,[4500,8000,15000,32000],4700,"Visa on arrival, or free via Jordan Pass","3-5,9-11",7,"CA","Petra by night, Martian desert camps, floating",["Petra","Wadi Rum","Dead Sea"]),
  R("turkiye","Istanbul & Cappadocia","Türkiye","middle-east","Anatolia","IST",35000,55000,[4000,7500,14000,32000],7000,"Sticker visa (e-visa only with valid US/UK/Schengen visa)","4-6,9-10",8,"CFNS","Hot-air balloons, Hagia Sophia, bazaars, kebabs",["Hagia Sophia","Cappadocia","Pamukkale"]),
  R("egypt","Cairo, Luxor & the Red Sea","Egypt","middle-east","North Africa","CAI",30000,48000,[3000,5500,11000,25000],2200,"E-visa / visa on arrival","10-4",7,"CBA","Pyramids, Nile cruise, Abu Simbel, Red Sea diving",["Giza pyramid complex","Abu Simbel","Karnak"]),

  // ---------- Africa
  R("kenya","Masai Mara & Nairobi","Kenya","africa","East Africa","NBO",35000,55000,[7000,12000,25000,60000],3000,"eTA online","7-10,1-2",6,"WA","Big Five safari, the Great Migration",["Maasai Mara","Amboseli National Park","Nairobi National Park"]),
  R("tanzania","Serengeti & Zanzibar","Tanzania","africa","East Africa","ZNZ",40000,60000,[6500,11000,22000,55000],4500,"E-visa online","6-10,1-2",7,"WB","Serengeti, Ngorongoro, Stone Town, spice beaches",["Serengeti National Park","Ngorongoro Conservation Area","Stone Town"]),
  R("southafrica","Cape Town & Kruger","South Africa","africa","Southern Africa","CPT",50000,75000,[4500,8500,16000,38000],2000,"Visa in advance","10-4",12,"WMFA","Table Mountain, penguins, wine farms, safari",["Table Mountain","Cape of Good Hope","Kruger National Park"]),
  R("morocco","Marrakech & the Sahara","Morocco","africa","North Africa","RAK",45000,70000,[3000,5500,11000,26000],7000,"E-visa (or visa-free with valid US/UK/Schengen visa)","3-5,9-11",12,"CFA","Souks, riads, Sahara camel nights, Chefchaouen",["Jemaa el-Fnaa","Chefchaouen","Erg Chebbi"]),

  // ---------- Europe (west)
  R("paris","Paris & the French countryside","France","europe","Western Europe","CDG",50000,80000,[7000,12000,22000,50000],11000,"Schengen visa (book VFS slot 2+ months ahead)","4-6,9-10",10,"CFSL","Eiffel Tower, croissants, Louvre, Versailles",["Eiffel Tower","Louvre","Palace of Versailles"]),
  R("switzerland","Swiss Alps","Switzerland","europe","Western Europe","ZRH",55000,85000,[10000,17000,30000,70000],11000,"Schengen visa","6-9,12-2",10,"MAL","Jungfraujoch, Interlaken, Swiss rail, fondue",["Jungfraujoch","Lauterbrunnen","Matterhorn"]),
  R("benelux","Amsterdam & Bruges","Netherlands","europe","Western Europe","AMS",50000,80000,[7000,12000,22000,45000],11000,"Schengen visa","4-9",10,"CNS","Canals, tulips, cycling, Belgian waffles",["Amsterdam","Keukenhof","Bruges"]),
  R("germany","Berlin & Munich","Germany","europe","Western Europe","MUC",50000,78000,[6500,11000,20000,42000],11000,"Schengen visa","5-9,12",10,"CNF","Neuschwanstein, beer halls, Berlin clubs, Christmas markets",["Neuschwanstein Castle","Brandenburg Gate","Marienplatz"]),
  R("austria","Vienna, Salzburg & Hallstatt","Austria","europe","Western Europe","VIE",50000,80000,[7000,12000,22000,45000],11000,"Schengen visa","5-9,12",10,"CM","Hallstatt, palaces, Sound of Music, Alps",["Hallstatt","Schönbrunn Palace","Salzburg"]),
  R("uk","London & Scotland","United Kingdom","europe","British Isles","LHR",55000,85000,[8000,13000,24000,55000],14000,"UK visa (apply 6–8 weeks ahead)","5-9",10,"CSN","Big Ben, West End, Edinburgh, Highlands",["Tower Bridge","Edinburgh Castle","Isle of Skye"]),
  R("ireland","Dublin & the west coast","Ireland","europe","British Isles","DUB",55000,85000,[7500,12000,22000,45000],8000,"Irish visa in advance","5-9",11,"MCN","Cliffs of Moher, pubs, Ring of Kerry",["Cliffs of Moher","Temple Bar, Dublin","Ring of Kerry"]),
  // Europe (south)
  R("italy","Rome, Florence & Venice","Italy","europe","Southern Europe","FCO",50000,80000,[6500,11000,21000,48000],11000,"Schengen visa","4-6,9-10",9,"CFL","Colosseum, gelato, Tuscany, gondolas",["Colosseum","Florence Cathedral","Grand Canal (Venice)"]),
  R("amalfi","Amalfi Coast & Capri","Italy","europe","Southern Europe","NAP",55000,85000,[8000,14000,26000,60000],11000,"Schengen visa","5-9",10,"BLF","Positano, Capri boats, limoncello, Pompeii",["Positano","Capri","Pompeii"]),
  R("spain","Barcelona & Madrid","Spain","europe","Southern Europe","BCN",50000,80000,[6000,10000,19000,42000],11000,"Schengen visa","4-6,9-10",10,"NFCB","Sagrada Família, tapas, beaches, late nights",["Sagrada Família","Park Güell","Plaza Mayor, Madrid"]),
  R("portugal","Lisbon & Porto","Portugal","europe","Southern Europe","LIS",55000,85000,[5500,9500,18000,38000],11000,"Schengen visa","4-10",11,"BFC","Trams, pastéis de nata, Algarve cliffs, port wine",["Belém Tower","Ribeira (Porto)","Ponta da Piedade"]),
  R("greece","Athens & the islands","Greece","europe","Southern Europe","ATH",50000,80000,[6000,10500,20000,48000],11000,"Schengen visa","5-10",9,"BNCL","Santorini sunsets, Mykonos nights, the Acropolis",["Oia, Greece","Acropolis of Athens","Mykonos"]),
  R("croatia","Dubrovnik & Split","Croatia","europe","Southern Europe","DBV",55000,85000,[5500,9500,18000,40000],11000,"Schengen visa","5-9",11,"BNC","Game of Thrones walls, island hopping, Plitvice",["Dubrovnik","Plitvice Lakes National Park","Hvar"]),
  R("malta","Malta","Malta","europe","Southern Europe","MLA",55000,80000,[5500,9500,17000,35000],11000,"Schengen visa","5-10",10,"BNC","Blue Lagoon, Valletta, Gozo cliffs",["Valletta","Blue Lagoon (Comino)","Gozo"]),
  R("albania","Albanian Riviera","Albania","europe","Southern Europe","TIA",55000,80000,[3500,6500,12000,26000],0,"Visa-free with valid multi-entry Schengen/US/UK visa; otherwise visa needed","5-9",11,"BM","Ksamil beaches, cheap seafood, mountain villages",["Ksamil","Berat","Gjirokastër"]),
  // Europe (north)
  R("iceland","Iceland","Iceland","europe","Northern Europe","KEF",70000,110000,[11000,18000,32000,70000],11000,"Schengen visa","6-8,10-3",13,"MA","Northern lights, waterfalls, glaciers, Blue Lagoon",["Skógafoss","Jökulsárlón","Blue Lagoon (geothermal spa)"]),
  R("norway","Oslo & the fjords","Norway","europe","Northern Europe","OSL",60000,90000,[10000,16000,28000,60000],11000,"Schengen visa","6-8,12-3",11,"MA","Fjord cruises, Tromsø aurora, Lofoten",["Geirangerfjord","Lofoten","Tromsø"]),
  R("lapland","Finnish Lapland","Finland","europe","Northern Europe","RVN",60000,95000,[9000,15000,28000,60000],11000,"Schengen visa","12-3",12,"AML","Husky sledding, glass igloos, Santa's village",["Rovaniemi","Saariselkä","Levi, Finland"]),
  R("scandi","Copenhagen & Stockholm","Denmark","europe","Northern Europe","CPH",55000,85000,[9000,15000,26000,52000],11000,"Schengen visa","5-9",10,"CS","Nyhavn, design, Gamla Stan, cinnamon buns",["Nyhavn","Gamla stan","Tivoli Gardens"]),
  // Europe (central/east)
  R("prague-budapest","Prague, Vienna & Budapest","Czechia","europe","Central Europe","PRG",50000,78000,[4500,8000,15000,32000],11000,"Schengen visa","4-6,9-12",10,"CNF","Castles, ruin bars, thermal baths, cheap beer",["Prague Castle","Hungarian Parliament Building","Széchenyi thermal bath"]),
  R("poland","Kraków & Warsaw","Poland","europe","Central Europe","KRK",50000,75000,[4000,7000,13000,28000],11000,"Schengen visa","5-9,12",10,"CF","Old Town squares, salt mines, pierogi",["Kraków Old Town","Wieliczka Salt Mine","Warsaw Old Town"]),

  // ---------- North America
  R("newyork","New York City","USA","north-america","USA","JFK",75000,120000,[10000,17000,30000,65000],16000,"US B1/B2 visa (interview waits can run months, apply early)","4-6,9-12",17,"SCNF","Times Square, Central Park, Broadway, pizza",["Times Square","Central Park","Statue of Liberty"]),
  R("uswest","LA, Vegas & San Francisco","USA","north-america","USA","LAX",80000,125000,[9000,15000,28000,60000],16000,"US B1/B2 visa (apply early)","4-10",20,"NAS","Hollywood, the Strip, Golden Gate, Grand Canyon",["Golden Gate Bridge","Las Vegas Strip","Grand Canyon"]),
  R("hawaii","Hawaii","USA","north-america","USA","HNL",95000,145000,[11000,18000,32000,70000],16000,"US B1/B2 visa (apply early)","4-10",22,"BAL","Volcanoes, surf, snorkelling, luaus",["Waikiki","Nā Pali Coast","Haleakalā National Park"]),
  R("canada-rockies","Banff & Vancouver","Canada","north-america","Canada","YVR",85000,130000,[9000,15000,27000,55000],11000,"Canadian visa + biometrics (apply 2–3 months ahead)","6-9,12-3",20,"MA","Lake Louise, Moraine Lake, Rockies drives",["Moraine Lake","Lake Louise","Stanley Park"]),
  R("canada-east","Toronto & Montreal","Canada","north-america","Canada","YYZ",80000,120000,[8500,14000,25000,50000],11000,"Canadian visa + biometrics","5-10",18,"SC","Niagara Falls, CN Tower, old Montreal",["Niagara Falls","CN Tower","Old Montreal"]),
  R("mexico","Cancún & Mexico City","Mexico","north-america","Mexico","CUN",85000,130000,[5000,9000,17000,40000],3000,"Visa-free with a valid US/UK/Schengen visa; else Mexican visa","11-4",22,"BCFN","Cenotes, Mayan ruins, tacos, Tulum beaches",["Chichen Itza","Tulum","Cenote Ik Kil"]),

  // ---------- Latin America
  R("peru","Lima, Cusco & Machu Picchu","Peru","latin-america","Andes","CUZ",110000,160000,[4500,8000,15000,35000],0,"Visa-free with valid US/UK/Schengen visa; else visa in advance","5-9",28,"ACM","Machu Picchu, Rainbow Mountain, ceviche",["Machu Picchu","Rainbow Mountain (Peru)","Cusco"]),
  R("brazil","Rio de Janeiro","Brazil","latin-america","Brazil","GIG",100000,150000,[5500,9500,18000,40000],7000,"E-visa online","5-10",26,"BNF","Christ the Redeemer, Copacabana, samba nights",["Christ the Redeemer (statue)","Copacabana, Rio de Janeiro","Sugarloaf Mountain"]),
  R("patagonia","Patagonia","Argentina","latin-america","Andes","FTE",120000,180000,[6000,10000,20000,45000],5000,"Visa or e-visa (easier with valid US visa)","11-3",30,"MA","Perito Moreno glacier, Torres del Paine, trekking",["Perito Moreno Glacier","Torres del Paine National Park","Mount Fitz Roy"]),
  R("costarica","Costa Rica","Costa Rica","latin-america","Central America","SJO",110000,160000,[6500,11000,20000,45000],0,"Visa-free with valid US/Schengen visa; else visa needed","12-4",26,"WAB","Cloud forests, sloths, zip lines, volcanoes",["Arenal Volcano","Monteverde Cloud Forest Reserve","Manuel Antonio National Park"]),

  // ---------- Australia & Pacific
  R("sydney-melbourne","Sydney & Melbourne","Australia","oceania","Australia","SYD",55000,85000,[9000,14000,25000,55000],12000,"Australian visitor visa online","9-11,3-5",13,"SBFN","Opera House, Bondi, Great Ocean Road, coffee",["Sydney Opera House","Bondi Beach","Twelve Apostles (Victoria)"]),
  R("queensland","Gold Coast & Great Barrier Reef","Australia","oceania","Australia","CNS",60000,95000,[9000,14000,26000,58000],12000,"Australian visitor visa online","5-10",15,"BAW","Reef diving, theme parks, Whitsundays",["Great Barrier Reef","Whitehaven Beach","Surfers Paradise, Queensland"]),
  R("newzealand","New Zealand","New Zealand","oceania","New Zealand","ZQN",75000,120000,[9500,15000,27000,60000],11000,"NZ visitor visa + IVL levy","12-3,7-8",18,"MA","Queenstown bungy, Milford Sound, Hobbiton",["Milford Sound","Queenstown, New Zealand","Hobbiton Movie Set"]),
  R("fiji","Fiji","Fiji","oceania","Pacific","NAN",75000,110000,[6000,11000,22000,55000],0,"Free visa on arrival","5-10",17,"BLA","Island resorts, reef snorkelling, kava",["Mamanuca Islands","Yasawa Islands","Cloud 9 (Fiji)"]),
];

/* ---------- India (domestic). fl/fh = return economy from Bengaluru.
 * zone drives the fare for other home cities (WC_INDIA_ZONE_ADJ).
 * road = cheaper overland option from specific cities [low, high] return per person. */
const I = (key, name, state, zone, iata, fl, fh, d, permit, best, hrs, v, famous, wiki, road) =>
  ({ key, name, country: "India", state, region: "india", sub: zone, zone, iata, fl, fh, d, visa: permit ? 500 : 0,
     visaNote: permit || "No visa needed", best, hrs, v, famous, wiki, road: road || null, domestic: true });

window.WC_DEST.push(
  I("goa","Goa","Goa","West","GOI",5000,11000,[1800,3500,7500,18000],"","11-3",1,"BNFL","Beach shacks, Anjuna nights, Portuguese lanes, susegad life",["Palolem Beach","Basilica of Bom Jesus","Anjuna"],{BLR:[1800,3500],BOM:[1500,3000]}),
  I("gokarna","Gokarna & Murudeshwar","Karnataka","South","GOI",5000,10000,[1500,3000,6000,12000],"","10-3",1,"BAL","Om Beach cliff walks, quiet coves, temple town",["Om Beach","Murudeshwar Temple","Gokarna"],{BLR:[1500,3000]}),
  I("coorg","Coorg & Chikmagalur","Karnataka","South","IXE",4000,8000,[1800,3500,7000,16000],"","10-5",1,"MAL","Coffee estates, Abbey Falls, homestays, misty drives",["Abbey Falls","Mullayanagiri","Coorg district"],{BLR:[1200,2500]}),
  I("hampi","Hampi","Karnataka","South","VDY",5000,9000,[1500,2800,6000,14000],"","10-2",1,"CA","Boulder sunsets, Vijayanagara ruins, coracle rides",["Hampi","Vittala Temple","Virupaksha Temple, Hampi"],{BLR:[1200,2500]}),
  I("ooty","Ooty & Kodaikanal","Tamil Nadu","South","CJB",4500,9000,[1600,3200,6500,15000],"","10-6",1,"ML","Toy train, tea gardens, lakes, eucalyptus air",["Nilgiri Mountain Railway","Kodaikanal Lake","Ooty"],{BLR:[1200,2500],MAA:[1800,3500],COK:[1500,3000]}),
  I("pondicherry","Pondicherry & Auroville","Puducherry","South","PNY",4500,9000,[1600,3200,6500,14000],"","10-3",1,"BFC","French Quarter, cafés, Auroville, Paradise Beach",["Promenade Beach","Auroville","White Town, Pondicherry"],{BLR:[1200,2500],MAA:[600,1500]}),
  I("kerala","Kochi, Munnar & Alleppey","Kerala","South","COK",4500,9000,[1800,3500,7500,18000],"","9-3",1,"MLFC","Houseboats, tea hills, Fort Kochi, appam and stew",["Alappuzha","Munnar","Fort Kochi"],{BLR:[1500,3000],COK:[600,1500]}),
  I("andaman","Andaman Islands","Andaman & Nicobar","Islands","IXZ",12000,22000,[2500,5000,10000,24000],"","11-5",3,"BAL","Radhanagar Beach, scuba at Havelock, glass-bottom boats",["Radhanagar Beach","Havelock Island","Cellular Jail"]),
  I("lakshadweep","Lakshadweep","Lakshadweep","Islands","AGX",18000,32000,[4000,7500,14000,30000],"Entry permit required (arranged via tour operator/LPP portal)","10-4",3,"BLA","Lagoons, coral reefs, Agatti and Bangaram",["Agatti Island","Bangaram Atoll","Kavaratti"]),
  I("rajasthan","Jaipur, Udaipur & Jodhpur","Rajasthan","West","JAI",7000,13000,[1800,3800,8000,22000],"","10-3",2.5,"CFSL","Forts, palaces, lake sunsets, dal baati churma",["Hawa Mahal","City Palace, Udaipur","Mehrangarh"]),
  I("jaisalmer","Jaisalmer & the Thar","Rajasthan","West","JSA",9000,16000,[1800,3500,7500,20000],"","10-2",3,"ACL","Golden fort, desert camps, camel safaris under stars",["Jaisalmer Fort","Sam Sand Dunes","Patwon Ki Haveli"]),
  I("golden-triangle","Delhi, Agra & Jaipur","Delhi","North","DEL",7000,12000,[1800,3800,8000,20000],"","10-3",2.5,"CFS","Taj Mahal, Old Delhi food walk, Amber Fort",["Taj Mahal","Red Fort","Amber Fort"]),
  I("varanasi","Varanasi & Rishikesh","Uttar Pradesh","North","VNS",8000,14000,[1500,3000,6500,15000],"","10-3",2.5,"CAF","Ganga aarti, ghats at dawn, rafting, yoga",["Dashashwamedh Ghat","Varanasi","Rishikesh"]),
  I("himachal","Manali, Kasol & Spiti","Himachal Pradesh","North Hills","KUU",11000,20000,[1600,3200,6500,15000],"","3-6,9-11",3,"MAN","Solang snow, Kasol cafés, Spiti moonscapes, Parvati valley",["Manali, Himachal Pradesh","Key Monastery","Kasol"]),
  I("kashmir","Srinagar, Gulmarg & Pahalgam","Jammu & Kashmir","North Hills","SXR",10000,18000,[2200,4200,8500,20000],"","4-10,12-2",3,"MLA","Dal Lake shikaras, Gulmarg gondola, meadows, kahwa",["Dal Lake","Gulmarg","Pahalgam"]),
  I("ladakh","Leh & Ladakh","Ladakh","North Hills","IXL",12000,24000,[2200,4200,8500,20000],"Inner Line Permit for Nubra, Pangong etc. (online, cheap)","5-9",3.5,"MA","Pangong Lake, Khardung La, monasteries, bike trips",["Pangong Tso","Nubra Valley","Thiksey Monastery"]),
  I("uttarakhand","Rishikesh, Mussoorie & Auli","Uttarakhand","North Hills","DED",9000,16000,[1600,3200,6500,15000],"","3-6,9-12",3,"MAC","River rafting, Kedarkantha trek, Auli skiing",["Rishikesh","Auli","Mussoorie"]),
  I("sikkim","Gangtok & Darjeeling","Sikkim","Northeast","PYG",10000,18000,[1800,3500,7000,16000],"Permit needed for Nathula / North Sikkim (via operator)","3-5,10-12",3,"MCA","Kanchenjunga sunrise, toy train, Tsomgo Lake, momos",["Tsomgo Lake","Darjeeling Himalayan Railway","Gangtok"]),
  I("meghalaya","Shillong & Cherrapunji","Meghalaya","Northeast","SHL",10000,18000,[1700,3300,6800,15000],"","10-5",3.5,"MA","Living root bridges, Dawki's clear river, waterfalls",["Living root bridge","Umngot River","Nohkalikai Falls"]),
  I("tawang","Tawang & Ziro","Arunachal Pradesh","Northeast","GAU",11000,19000,[1800,3500,7000,15000],"Inner Line Permit required (online)","3-6,9-11",4,"MAC","Sela Pass, Tawang monastery, Ziro music fest",["Tawang Monastery","Sela Pass","Ziro"]),
  I("mumbai","Mumbai & Lonavala","Maharashtra","West","BOM",4500,9000,[2200,4500,9000,22000],"","10-3",1.5,"SNFB","Marine Drive, street food, nightlife, monsoon ghats",["Gateway of India","Marine Drive, Mumbai","Lonavala"],{BOM:[200,600]}),
  I("rann","Rann of Kutch & Gir","Gujarat","West","BHJ",8000,14000,[1800,3500,7000,16000],"","11-2",2,"CWM","White desert under full moon, Rann Utsav, Asiatic lions",["Great Rann of Kutch","Gir National Park","Dholavira"]),
  I("ranthambore","Ranthambore & Jim Corbett","Rajasthan","North","JAI",7000,13000,[2500,5000,10000,25000],"","10-6",2.5,"WA","Tiger safaris, jungle lodges, bonfires",["Ranthambore National Park","Jim Corbett National Park","Ranthambore Fort"]),
);

/* domestic fare multiplier by home city and zone (relative to BLR) */
window.WC_INDIA_ZONE_ADJ = {
  BLR: {},
  DEL: { South: 1.15, West: 0.95, North: 0.45, "North Hills": 0.7, Northeast: 0.95, Islands: 1.1 },
  BOM: { South: 0.9, West: 0.6, North: 0.9, "North Hills": 0.95, Northeast: 1.05, Islands: 1.05 },
  MAA: { South: 0.75, West: 1.0, North: 1.05, "North Hills": 1.05, Northeast: 1.0, Islands: 0.85 },
  HYD: { South: 0.85, West: 0.9, North: 0.95, "North Hills": 1.0, Northeast: 1.0, Islands: 0.95 },
  CCU: { South: 1.1, West: 1.1, North: 0.95, "North Hills": 1.0, Northeast: 0.55, Islands: 0.8 },
  COK: { South: 0.8, West: 1.0, North: 1.1, "North Hills": 1.1, Northeast: 1.1, Islands: 1.0 },
};

/* origin adjustments by region (multiplies the BLR fare) */
window.WC_ORIGINS = {
  BLR: { name: "Bengaluru", adj: {} },
  BOM: { name: "Mumbai",    adj: { "middle-east": 0.9, europe: 0.95, africa: 0.92, "north-america": 0.97 } },
  DEL: { name: "Delhi",     adj: { "middle-east": 0.92, europe: 0.92, "central-asia": 0.85, "north-america": 0.95, "south-asia": 0.9, "se-asia": 1.05 } },
  MAA: { name: "Chennai",   adj: { "se-asia": 0.95, "south-asia": 0.9, "middle-east": 0.95 } },
  HYD: { name: "Hyderabad", adj: { "middle-east": 0.95 } },
  CCU: { name: "Kolkata",   adj: { "se-asia": 0.9, "east-asia": 0.92, "south-asia": 0.85, europe: 1.08, "middle-east": 1.05 } },
  COK: { name: "Kochi",     adj: { "middle-east": 0.88, "south-asia": 0.9, "se-asia": 1.0, europe: 1.05 } },
};
