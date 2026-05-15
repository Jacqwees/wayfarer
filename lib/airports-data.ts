/**
 * Curated IATA airport list — ~380 airports covering major hubs and
 * popular holiday destinations worldwide. No API key needed; filtered client-side.
 *
 * Fields: iata (3-letter code), name (airport name), city, country
 */

export type Airport = {
  iata: string
  name: string
  city: string
  country: string
}

export const AIRPORTS: Airport[] = [
  // ── UK & Ireland ──────────────────────────────────────────────
  { iata: 'LHR', name: 'Heathrow', city: 'London', country: 'UK' },
  { iata: 'LGW', name: 'Gatwick', city: 'London', country: 'UK' },
  { iata: 'LCY', name: 'City Airport', city: 'London', country: 'UK' },
  { iata: 'STN', name: 'Stansted', city: 'London', country: 'UK' },
  { iata: 'LTN', name: 'Luton', city: 'London', country: 'UK' },
  { iata: 'MAN', name: 'Manchester Airport', city: 'Manchester', country: 'UK' },
  { iata: 'BHX', name: 'Birmingham Airport', city: 'Birmingham', country: 'UK' },
  { iata: 'EDI', name: 'Edinburgh Airport', city: 'Edinburgh', country: 'UK' },
  { iata: 'GLA', name: 'Glasgow Airport', city: 'Glasgow', country: 'UK' },
  { iata: 'BRS', name: 'Bristol Airport', city: 'Bristol', country: 'UK' },
  { iata: 'NCL', name: 'Newcastle Airport', city: 'Newcastle', country: 'UK' },
  { iata: 'LBA', name: 'Leeds Bradford Airport', city: 'Leeds', country: 'UK' },
  { iata: 'EMA', name: 'East Midlands Airport', city: 'Nottingham', country: 'UK' },
  { iata: 'BHD', name: 'George Best City Airport', city: 'Belfast', country: 'UK' },
  { iata: 'BFS', name: 'Belfast International', city: 'Belfast', country: 'UK' },
  { iata: 'ABZ', name: 'Aberdeen Airport', city: 'Aberdeen', country: 'UK' },
  { iata: 'CWL', name: 'Cardiff Airport', city: 'Cardiff', country: 'UK' },
  { iata: 'EXT', name: 'Exeter Airport', city: 'Exeter', country: 'UK' },
  { iata: 'LPL', name: 'Liverpool John Lennon', city: 'Liverpool', country: 'UK' },
  { iata: 'SOU', name: 'Southampton Airport', city: 'Southampton', country: 'UK' },
  { iata: 'INV', name: 'Inverness Airport', city: 'Inverness', country: 'UK' },
  { iata: 'NWI', name: 'Norwich Airport', city: 'Norwich', country: 'UK' },
  { iata: 'HUY', name: 'Humberside Airport', city: 'Humberside', country: 'UK' },
  { iata: 'DSA', name: 'Doncaster Sheffield Airport', city: 'Doncaster', country: 'UK' },
  { iata: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland' },
  { iata: 'ORK', name: 'Cork Airport', city: 'Cork', country: 'Ireland' },
  { iata: 'SNN', name: 'Shannon Airport', city: 'Shannon', country: 'Ireland' },
  { iata: 'KIR', name: 'Kerry Airport', city: 'Kerry', country: 'Ireland' },

  // ── France ────────────────────────────────────────────────────
  { iata: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
  { iata: 'ORY', name: 'Orly', city: 'Paris', country: 'France' },
  { iata: 'NCE', name: "Nice Côte d'Azur", city: 'Nice', country: 'France' },
  { iata: 'LYS', name: 'Lyon-Saint Exupéry', city: 'Lyon', country: 'France' },
  { iata: 'MRS', name: 'Marseille Provence', city: 'Marseille', country: 'France' },
  { iata: 'BOD', name: 'Bordeaux-Mérignac', city: 'Bordeaux', country: 'France' },
  { iata: 'TLS', name: 'Toulouse-Blagnac', city: 'Toulouse', country: 'France' },
  { iata: 'NTE', name: 'Nantes Atlantique', city: 'Nantes', country: 'France' },
  { iata: 'BIQ', name: 'Biarritz Airport', city: 'Biarritz', country: 'France' },
  { iata: 'MPL', name: 'Montpellier Airport', city: 'Montpellier', country: 'France' },
  { iata: 'SXB', name: 'Strasbourg Airport', city: 'Strasbourg', country: 'France' },
  { iata: 'RNS', name: 'Rennes Airport', city: 'Rennes', country: 'France' },

  // ── Benelux ───────────────────────────────────────────────────
  { iata: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  { iata: 'EIN', name: 'Eindhoven Airport', city: 'Eindhoven', country: 'Netherlands' },
  { iata: 'RTM', name: 'Rotterdam The Hague', city: 'Rotterdam', country: 'Netherlands' },
  { iata: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium' },
  { iata: 'CRL', name: 'Brussels South Charleroi', city: 'Charleroi', country: 'Belgium' },
  { iata: 'LUX', name: 'Luxembourg Airport', city: 'Luxembourg', country: 'Luxembourg' },

  // ── Germany ───────────────────────────────────────────────────
  { iata: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  { iata: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany' },
  { iata: 'BER', name: 'Berlin Brandenburg', city: 'Berlin', country: 'Germany' },
  { iata: 'DUS', name: 'Düsseldorf Airport', city: 'Düsseldorf', country: 'Germany' },
  { iata: 'HAM', name: 'Hamburg Airport', city: 'Hamburg', country: 'Germany' },
  { iata: 'STR', name: 'Stuttgart Airport', city: 'Stuttgart', country: 'Germany' },
  { iata: 'CGN', name: 'Cologne Bonn Airport', city: 'Cologne', country: 'Germany' },
  { iata: 'NUE', name: 'Nuremberg Airport', city: 'Nuremberg', country: 'Germany' },
  { iata: 'HAJ', name: 'Hannover Airport', city: 'Hannover', country: 'Germany' },
  { iata: 'LEJ', name: 'Leipzig/Halle Airport', city: 'Leipzig', country: 'Germany' },
  { iata: 'DRS', name: 'Dresden Airport', city: 'Dresden', country: 'Germany' },

  // ── Switzerland & Austria ─────────────────────────────────────
  { iata: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland' },
  { iata: 'GVA', name: 'Geneva Airport', city: 'Geneva', country: 'Switzerland' },
  { iata: 'BSL', name: 'EuroAirport Basel-Mulhouse', city: 'Basel', country: 'Switzerland' },
  { iata: 'VIE', name: 'Vienna Airport', city: 'Vienna', country: 'Austria' },
  { iata: 'SZG', name: 'Salzburg Airport', city: 'Salzburg', country: 'Austria' },
  { iata: 'INN', name: 'Innsbruck Airport', city: 'Innsbruck', country: 'Austria' },

  // ── Spain ─────────────────────────────────────────────────────
  { iata: 'MAD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'Spain' },
  { iata: 'BCN', name: 'Barcelona El Prat', city: 'Barcelona', country: 'Spain' },
  { iata: 'AGP', name: 'Málaga Costa del Sol', city: 'Málaga', country: 'Spain' },
  { iata: 'ALC', name: 'Alicante-Elche Airport', city: 'Alicante', country: 'Spain' },
  { iata: 'VLC', name: 'Valencia Airport', city: 'Valencia', country: 'Spain' },
  { iata: 'SVQ', name: 'Seville Airport', city: 'Seville', country: 'Spain' },
  { iata: 'BIO', name: 'Bilbao Airport', city: 'Bilbao', country: 'Spain' },
  { iata: 'SCQ', name: 'Santiago de Compostela', city: 'Santiago', country: 'Spain' },
  { iata: 'PMI', name: 'Palma de Mallorca', city: 'Palma', country: 'Spain' },
  { iata: 'IBZ', name: 'Ibiza Airport', city: 'Ibiza', country: 'Spain' },
  { iata: 'MAH', name: 'Menorca Airport', city: 'Mahón', country: 'Spain' },
  { iata: 'TFS', name: 'Tenerife Sur', city: 'Tenerife South', country: 'Spain' },
  { iata: 'TFN', name: 'Tenerife Norte', city: 'Tenerife North', country: 'Spain' },
  { iata: 'LPA', name: 'Gran Canaria Airport', city: 'Las Palmas', country: 'Spain' },
  { iata: 'ACE', name: 'Lanzarote Airport', city: 'Arrecife', country: 'Spain' },
  { iata: 'FUE', name: 'Fuerteventura Airport', city: 'Fuerteventura', country: 'Spain' },
  { iata: 'SPC', name: 'La Palma Airport', city: 'Santa Cruz de La Palma', country: 'Spain' },

  // ── Portugal ──────────────────────────────────────────────────
  { iata: 'LIS', name: 'Humberto Delgado Airport', city: 'Lisbon', country: 'Portugal' },
  { iata: 'OPO', name: 'Francisco Sá Carneiro', city: 'Porto', country: 'Portugal' },
  { iata: 'FAO', name: 'Faro Airport', city: 'Faro', country: 'Portugal' },
  { iata: 'FNC', name: 'Funchal Airport', city: 'Madeira', country: 'Portugal' },
  { iata: 'PDL', name: 'João Paulo II Airport', city: 'Ponta Delgada', country: 'Portugal' },

  // ── Italy ─────────────────────────────────────────────────────
  { iata: 'FCO', name: 'Fiumicino', city: 'Rome', country: 'Italy' },
  { iata: 'CIA', name: 'Ciampino', city: 'Rome', country: 'Italy' },
  { iata: 'MXP', name: 'Malpensa', city: 'Milan', country: 'Italy' },
  { iata: 'LIN', name: 'Linate', city: 'Milan', country: 'Italy' },
  { iata: 'BGY', name: 'Bergamo Orio al Serio', city: 'Bergamo', country: 'Italy' },
  { iata: 'VCE', name: 'Venice Marco Polo', city: 'Venice', country: 'Italy' },
  { iata: 'TSF', name: 'Treviso Airport', city: 'Treviso', country: 'Italy' },
  { iata: 'NAP', name: 'Naples Airport', city: 'Naples', country: 'Italy' },
  { iata: 'PMO', name: 'Palermo Airport', city: 'Palermo', country: 'Italy' },
  { iata: 'CTA', name: 'Catania Airport', city: 'Catania', country: 'Italy' },
  { iata: 'BLQ', name: 'Bologna Airport', city: 'Bologna', country: 'Italy' },
  { iata: 'FLR', name: 'Florence Airport', city: 'Florence', country: 'Italy' },
  { iata: 'PSA', name: 'Pisa Airport', city: 'Pisa', country: 'Italy' },
  { iata: 'TRN', name: 'Turin Airport', city: 'Turin', country: 'Italy' },
  { iata: 'BRI', name: 'Bari Airport', city: 'Bari', country: 'Italy' },
  { iata: 'OLB', name: 'Olbia Airport', city: 'Olbia', country: 'Italy' },
  { iata: 'CAG', name: 'Cagliari Airport', city: 'Cagliari', country: 'Italy' },
  { iata: 'AHO', name: 'Alghero Airport', city: 'Alghero', country: 'Italy' },
  { iata: 'VRN', name: 'Verona Airport', city: 'Verona', country: 'Italy' },
  { iata: 'SUF', name: 'Lamezia Terme Airport', city: 'Lamezia Terme', country: 'Italy' },
  { iata: 'REG', name: 'Reggio Calabria Airport', city: 'Reggio Calabria', country: 'Italy' },

  // ── Greece ────────────────────────────────────────────────────
  { iata: 'ATH', name: 'Eleftherios Venizelos', city: 'Athens', country: 'Greece' },
  { iata: 'SKG', name: 'Thessaloniki Macedonia', city: 'Thessaloniki', country: 'Greece' },
  { iata: 'HER', name: 'Heraklion Airport', city: 'Heraklion', country: 'Greece' },
  { iata: 'CHQ', name: 'Chania Airport', city: 'Chania', country: 'Greece' },
  { iata: 'JTR', name: 'Santorini Airport', city: 'Santorini', country: 'Greece' },
  { iata: 'JMK', name: 'Mykonos Airport', city: 'Mykonos', country: 'Greece' },
  { iata: 'RHO', name: 'Rhodes Airport', city: 'Rhodes', country: 'Greece' },
  { iata: 'KGS', name: 'Kos Airport', city: 'Kos', country: 'Greece' },
  { iata: 'CFU', name: 'Corfu Airport', city: 'Corfu', country: 'Greece' },
  { iata: 'ZTH', name: 'Zakynthos Airport', city: 'Zakynthos', country: 'Greece' },
  { iata: 'SMI', name: 'Samos Airport', city: 'Samos', country: 'Greece' },
  { iata: 'JSI', name: 'Skiathos Airport', city: 'Skiathos', country: 'Greece' },
  { iata: 'PVK', name: 'Preveza Airport', city: 'Preveza', country: 'Greece' },
  { iata: 'MJT', name: 'Mytilene Airport', city: 'Lesbos', country: 'Greece' },

  // ── Turkey & Cyprus ───────────────────────────────────────────
  { iata: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' },
  { iata: 'SAW', name: 'Sabiha Gökçen', city: 'Istanbul', country: 'Turkey' },
  { iata: 'AYT', name: 'Antalya Airport', city: 'Antalya', country: 'Turkey' },
  { iata: 'DLM', name: 'Dalaman Airport', city: 'Dalaman', country: 'Turkey' },
  { iata: 'BJV', name: 'Milas-Bodrum Airport', city: 'Bodrum', country: 'Turkey' },
  { iata: 'ADB', name: 'Adnan Menderes Airport', city: 'Izmir', country: 'Turkey' },
  { iata: 'ESB', name: 'Esenboğa Airport', city: 'Ankara', country: 'Turkey' },
  { iata: 'LCA', name: 'Larnaca Airport', city: 'Larnaca', country: 'Cyprus' },
  { iata: 'PFO', name: 'Paphos Airport', city: 'Paphos', country: 'Cyprus' },

  // ── Scandinavia & Nordics ──────────────────────────────────────
  { iata: 'CPH', name: 'Copenhagen Kastrup', city: 'Copenhagen', country: 'Denmark' },
  { iata: 'BLL', name: 'Billund Airport', city: 'Billund', country: 'Denmark' },
  { iata: 'AAL', name: 'Aalborg Airport', city: 'Aalborg', country: 'Denmark' },
  { iata: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'Sweden' },
  { iata: 'NYO', name: 'Stockholm Skavsta', city: 'Stockholm', country: 'Sweden' },
  { iata: 'GOT', name: 'Gothenburg Landvetter', city: 'Gothenburg', country: 'Sweden' },
  { iata: 'MMX', name: 'Malmö Airport', city: 'Malmö', country: 'Sweden' },
  { iata: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', country: 'Norway' },
  { iata: 'TRF', name: 'Sandefjord Torp', city: 'Sandefjord', country: 'Norway' },
  { iata: 'BGO', name: 'Bergen Airport', city: 'Bergen', country: 'Norway' },
  { iata: 'TRD', name: 'Trondheim Airport', city: 'Trondheim', country: 'Norway' },
  { iata: 'SVG', name: 'Stavanger Airport', city: 'Stavanger', country: 'Norway' },
  { iata: 'HEL', name: 'Helsinki-Vantaa', city: 'Helsinki', country: 'Finland' },
  { iata: 'TMP', name: 'Tampere-Pirkkala', city: 'Tampere', country: 'Finland' },
  { iata: 'RVN', name: 'Rovaniemi Airport', city: 'Rovaniemi', country: 'Finland' },
  { iata: 'RIX', name: 'Riga Airport', city: 'Riga', country: 'Latvia' },
  { iata: 'TLL', name: 'Lennart Meri Airport', city: 'Tallinn', country: 'Estonia' },
  { iata: 'VNO', name: 'Vilnius Airport', city: 'Vilnius', country: 'Lithuania' },
  { iata: 'RKV', name: 'Reykjavik Airport', city: 'Reykjavik', country: 'Iceland' },
  { iata: 'KEF', name: 'Keflavik Airport', city: 'Reykjavik', country: 'Iceland' },

  // ── Eastern Europe ────────────────────────────────────────────
  { iata: 'WAW', name: 'Warsaw Chopin', city: 'Warsaw', country: 'Poland' },
  { iata: 'KRK', name: 'Kraków John Paul II', city: 'Kraków', country: 'Poland' },
  { iata: 'GDN', name: 'Gdańsk Lech Wałęsa', city: 'Gdańsk', country: 'Poland' },
  { iata: 'KTW', name: 'Katowice Airport', city: 'Katowice', country: 'Poland' },
  { iata: 'WRO', name: 'Wrocław Airport', city: 'Wrocław', country: 'Poland' },
  { iata: 'PRG', name: 'Václav Havel Airport', city: 'Prague', country: 'Czechia' },
  { iata: 'BUD', name: 'Budapest Airport', city: 'Budapest', country: 'Hungary' },
  { iata: 'OTP', name: 'Henri Coandă Airport', city: 'Bucharest', country: 'Romania' },
  { iata: 'CLJ', name: 'Cluj-Napoca Airport', city: 'Cluj-Napoca', country: 'Romania' },
  { iata: 'SOF', name: 'Sofia Airport', city: 'Sofia', country: 'Bulgaria' },
  { iata: 'VAR', name: 'Varna Airport', city: 'Varna', country: 'Bulgaria' },
  { iata: 'BOJ', name: 'Burgas Airport', city: 'Burgas', country: 'Bulgaria' },
  { iata: 'BEG', name: 'Belgrade Nikola Tesla', city: 'Belgrade', country: 'Serbia' },
  { iata: 'ZAG', name: 'Zagreb Airport', city: 'Zagreb', country: 'Croatia' },
  { iata: 'SPU', name: 'Split Airport', city: 'Split', country: 'Croatia' },
  { iata: 'DBV', name: 'Dubrovnik Airport', city: 'Dubrovnik', country: 'Croatia' },
  { iata: 'ZAD', name: 'Zadar Airport', city: 'Zadar', country: 'Croatia' },
  { iata: 'PUY', name: 'Pula Airport', city: 'Pula', country: 'Croatia' },
  { iata: 'TGD', name: 'Podgorica Airport', city: 'Podgorica', country: 'Montenegro' },
  { iata: 'TIV', name: 'Tivat Airport', city: 'Tivat', country: 'Montenegro' },
  { iata: 'SKP', name: 'Skopje Airport', city: 'Skopje', country: 'N. Macedonia' },
  { iata: 'TIA', name: 'Rinas Mother Teresa', city: 'Tirana', country: 'Albania' },
  { iata: 'LJU', name: 'Ljubljana Airport', city: 'Ljubljana', country: 'Slovenia' },
  { iata: 'SJJ', name: 'Sarajevo Airport', city: 'Sarajevo', country: 'Bosnia' },
  { iata: 'KBP', name: 'Kyiv Boryspil', city: 'Kyiv', country: 'Ukraine' },

  // ── North Africa ──────────────────────────────────────────────
  { iata: 'CAI', name: 'Cairo Airport', city: 'Cairo', country: 'Egypt' },
  { iata: 'HRG', name: 'Hurghada Airport', city: 'Hurghada', country: 'Egypt' },
  { iata: 'SSH', name: 'Sharm el-Sheikh Airport', city: 'Sharm el-Sheikh', country: 'Egypt' },
  { iata: 'LXR', name: 'Luxor Airport', city: 'Luxor', country: 'Egypt' },
  { iata: 'CMN', name: 'Casablanca Mohammed V', city: 'Casablanca', country: 'Morocco' },
  { iata: 'RAK', name: 'Marrakech Menara', city: 'Marrakech', country: 'Morocco' },
  { iata: 'FEZ', name: 'Fez Saïss Airport', city: 'Fez', country: 'Morocco' },
  { iata: 'AGA', name: 'Agadir Al Massira', city: 'Agadir', country: 'Morocco' },
  { iata: 'TNG', name: 'Tangier Ibn Batouta', city: 'Tangier', country: 'Morocco' },
  { iata: 'TUN', name: 'Tunis Carthage', city: 'Tunis', country: 'Tunisia' },
  { iata: 'MIR', name: 'Monastir Airport', city: 'Monastir', country: 'Tunisia' },
  { iata: 'DJE', name: 'Djerba-Zarzis Airport', city: 'Djerba', country: 'Tunisia' },

  // ── Middle East ───────────────────────────────────────────────
  { iata: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE' },
  { iata: 'DWC', name: 'Al Maktoum Airport', city: 'Dubai', country: 'UAE' },
  { iata: 'AUH', name: 'Abu Dhabi Airport', city: 'Abu Dhabi', country: 'UAE' },
  { iata: 'DOH', name: 'Hamad Airport', city: 'Doha', country: 'Qatar' },
  { iata: 'KWI', name: 'Kuwait Airport', city: 'Kuwait City', country: 'Kuwait' },
  { iata: 'BAH', name: 'Bahrain Airport', city: 'Manama', country: 'Bahrain' },
  { iata: 'MCT', name: 'Muscat Airport', city: 'Muscat', country: 'Oman' },
  { iata: 'AMM', name: 'Queen Alia Airport', city: 'Amman', country: 'Jordan' },
  { iata: 'AQJ', name: 'King Hussein Airport', city: 'Aqaba', country: 'Jordan' },
  { iata: 'TLV', name: 'Ben Gurion Airport', city: 'Tel Aviv', country: 'Israel' },
  { iata: 'RUH', name: 'King Khalid Airport', city: 'Riyadh', country: 'Saudi Arabia' },
  { iata: 'JED', name: 'King Abdulaziz Airport', city: 'Jeddah', country: 'Saudi Arabia' },

  // ── Sub-Saharan Africa ────────────────────────────────────────
  { iata: 'JNB', name: 'O.R. Tambo Airport', city: 'Johannesburg', country: 'South Africa' },
  { iata: 'CPT', name: 'Cape Town Airport', city: 'Cape Town', country: 'South Africa' },
  { iata: 'DUR', name: 'King Shaka Airport', city: 'Durban', country: 'South Africa' },
  { iata: 'NBO', name: 'Jomo Kenyatta Airport', city: 'Nairobi', country: 'Kenya' },
  { iata: 'MBA', name: 'Mombasa Airport', city: 'Mombasa', country: 'Kenya' },
  { iata: 'ADD', name: 'Bole Airport', city: 'Addis Ababa', country: 'Ethiopia' },
  { iata: 'DAR', name: 'Julius Nyerere Airport', city: 'Dar es Salaam', country: 'Tanzania' },
  { iata: 'JRO', name: 'Kilimanjaro Airport', city: 'Kilimanjaro', country: 'Tanzania' },
  { iata: 'ZNZ', name: 'Zanzibar Airport', city: 'Zanzibar', country: 'Tanzania' },
  { iata: 'MRU', name: 'Sir Seewoosagur Ramgoolam', city: 'Mauritius', country: 'Mauritius' },
  { iata: 'SEZ', name: 'Seychelles Airport', city: 'Mahé', country: 'Seychelles' },
  { iata: 'ACC', name: 'Kotoka Airport', city: 'Accra', country: 'Ghana' },
  { iata: 'LOS', name: 'Murtala Muhammed Airport', city: 'Lagos', country: 'Nigeria' },
  { iata: 'ABV', name: 'Nnamdi Azikiwe Airport', city: 'Abuja', country: 'Nigeria' },

  // ── Indian Ocean ──────────────────────────────────────────────
  { iata: 'MLE', name: 'Malé Airport', city: 'Malé', country: 'Maldives' },
  { iata: 'RUN', name: 'Roland Garros Airport', city: 'Réunion', country: 'Réunion' },

  // ── South Asia ────────────────────────────────────────────────
  { iata: 'DEL', name: 'Indira Gandhi Airport', city: 'Delhi', country: 'India' },
  { iata: 'BOM', name: 'Chhatrapati Shivaji Airport', city: 'Mumbai', country: 'India' },
  { iata: 'BLR', name: 'Kempegowda Airport', city: 'Bangalore', country: 'India' },
  { iata: 'MAA', name: 'Chennai Airport', city: 'Chennai', country: 'India' },
  { iata: 'CCU', name: 'Netaji Subhas Chandra Bose', city: 'Kolkata', country: 'India' },
  { iata: 'HYD', name: 'Rajiv Gandhi Airport', city: 'Hyderabad', country: 'India' },
  { iata: 'GOI', name: 'Goa Airport', city: 'Goa', country: 'India' },
  { iata: 'COK', name: 'Cochin Airport', city: 'Kochi', country: 'India' },
  { iata: 'AMD', name: 'Sardar Vallabhbhai Patel', city: 'Ahmedabad', country: 'India' },
  { iata: 'CMB', name: 'Bandaranaike Airport', city: 'Colombo', country: 'Sri Lanka' },
  { iata: 'KTM', name: 'Tribhuvan Airport', city: 'Kathmandu', country: 'Nepal' },
  { iata: 'DAC', name: 'Hazrat Shahjalal Airport', city: 'Dhaka', country: 'Bangladesh' },
  { iata: 'KHI', name: 'Jinnah Airport', city: 'Karachi', country: 'Pakistan' },
  { iata: 'LHE', name: 'Allama Iqbal Airport', city: 'Lahore', country: 'Pakistan' },
  { iata: 'ISB', name: 'Islamabad Airport', city: 'Islamabad', country: 'Pakistan' },

  // ── Southeast Asia ────────────────────────────────────────────
  { iata: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand' },
  { iata: 'DMK', name: 'Don Mueang Airport', city: 'Bangkok', country: 'Thailand' },
  { iata: 'CNX', name: 'Chiang Mai Airport', city: 'Chiang Mai', country: 'Thailand' },
  { iata: 'HKT', name: 'Phuket Airport', city: 'Phuket', country: 'Thailand' },
  { iata: 'USM', name: 'Samui Airport', city: 'Koh Samui', country: 'Thailand' },
  { iata: 'KBV', name: 'Krabi Airport', city: 'Krabi', country: 'Thailand' },
  { iata: 'SIN', name: 'Changi Airport', city: 'Singapore', country: 'Singapore' },
  { iata: 'KUL', name: 'Kuala Lumpur Airport', city: 'Kuala Lumpur', country: 'Malaysia' },
  { iata: 'CGK', name: 'Soekarno-Hatta Airport', city: 'Jakarta', country: 'Indonesia' },
  { iata: 'DPS', name: 'Ngurah Rai Airport', city: 'Bali', country: 'Indonesia' },
  { iata: 'MNL', name: 'Ninoy Aquino Airport', city: 'Manila', country: 'Philippines' },
  { iata: 'CEB', name: 'Mactan-Cebu Airport', city: 'Cebu', country: 'Philippines' },
  { iata: 'SGN', name: 'Tan Son Nhat Airport', city: 'Ho Chi Minh City', country: 'Vietnam' },
  { iata: 'HAN', name: 'Noi Bai Airport', city: 'Hanoi', country: 'Vietnam' },
  { iata: 'DAD', name: 'Da Nang Airport', city: 'Da Nang', country: 'Vietnam' },
  { iata: 'PNH', name: 'Phnom Penh Airport', city: 'Phnom Penh', country: 'Cambodia' },
  { iata: 'REP', name: 'Siem Reap Airport', city: 'Siem Reap', country: 'Cambodia' },
  { iata: 'RGN', name: 'Yangon Airport', city: 'Yangon', country: 'Myanmar' },

  // ── East Asia ─────────────────────────────────────────────────
  { iata: 'HKG', name: 'Hong Kong Airport', city: 'Hong Kong', country: 'Hong Kong' },
  { iata: 'NRT', name: 'Tokyo Narita', city: 'Tokyo', country: 'Japan' },
  { iata: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan' },
  { iata: 'KIX', name: 'Osaka Kansai', city: 'Osaka', country: 'Japan' },
  { iata: 'CTS', name: 'New Chitose Airport', city: 'Sapporo', country: 'Japan' },
  { iata: 'FUK', name: 'Fukuoka Airport', city: 'Fukuoka', country: 'Japan' },
  { iata: 'OKA', name: 'Naha Airport', city: 'Okinawa', country: 'Japan' },
  { iata: 'NGO', name: 'Chubu Centrair Airport', city: 'Nagoya', country: 'Japan' },
  { iata: 'ICN', name: 'Incheon Airport', city: 'Seoul', country: 'South Korea' },
  { iata: 'GMP', name: 'Gimpo Airport', city: 'Seoul', country: 'South Korea' },
  { iata: 'PEK', name: 'Beijing Capital Airport', city: 'Beijing', country: 'China' },
  { iata: 'PKX', name: 'Beijing Daxing Airport', city: 'Beijing', country: 'China' },
  { iata: 'PVG', name: 'Shanghai Pudong', city: 'Shanghai', country: 'China' },
  { iata: 'SHA', name: 'Shanghai Hongqiao', city: 'Shanghai', country: 'China' },
  { iata: 'CAN', name: 'Guangzhou Baiyun', city: 'Guangzhou', country: 'China' },
  { iata: 'TPE', name: 'Taipei Taoyuan', city: 'Taipei', country: 'Taiwan' },

  // ── Oceania ───────────────────────────────────────────────────
  { iata: 'SYD', name: 'Kingsford Smith Airport', city: 'Sydney', country: 'Australia' },
  { iata: 'MEL', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia' },
  { iata: 'BNE', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia' },
  { iata: 'PER', name: 'Perth Airport', city: 'Perth', country: 'Australia' },
  { iata: 'ADL', name: 'Adelaide Airport', city: 'Adelaide', country: 'Australia' },
  { iata: 'OOL', name: 'Gold Coast Airport', city: 'Gold Coast', country: 'Australia' },
  { iata: 'CNS', name: 'Cairns Airport', city: 'Cairns', country: 'Australia' },
  { iata: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand' },
  { iata: 'CHC', name: 'Christchurch Airport', city: 'Christchurch', country: 'New Zealand' },
  { iata: 'WLG', name: 'Wellington Airport', city: 'Wellington', country: 'New Zealand' },
  { iata: 'NAN', name: 'Nadi Airport', city: 'Nadi', country: 'Fiji' },

  // ── North America ─────────────────────────────────────────────
  { iata: 'JFK', name: 'John F. Kennedy Airport', city: 'New York', country: 'USA' },
  { iata: 'LGA', name: 'LaGuardia Airport', city: 'New York', country: 'USA' },
  { iata: 'EWR', name: 'Newark Liberty Airport', city: 'New York', country: 'USA' },
  { iata: 'LAX', name: 'Los Angeles Airport', city: 'Los Angeles', country: 'USA' },
  { iata: 'ORD', name: "O'Hare Airport", city: 'Chicago', country: 'USA' },
  { iata: 'ATL', name: 'Hartsfield-Jackson Airport', city: 'Atlanta', country: 'USA' },
  { iata: 'DFW', name: 'Dallas/Fort Worth Airport', city: 'Dallas', country: 'USA' },
  { iata: 'DEN', name: 'Denver Airport', city: 'Denver', country: 'USA' },
  { iata: 'SFO', name: 'San Francisco Airport', city: 'San Francisco', country: 'USA' },
  { iata: 'SEA', name: 'Seattle-Tacoma Airport', city: 'Seattle', country: 'USA' },
  { iata: 'MIA', name: 'Miami Airport', city: 'Miami', country: 'USA' },
  { iata: 'BOS', name: 'Logan Airport', city: 'Boston', country: 'USA' },
  { iata: 'LAS', name: 'Harry Reid Airport', city: 'Las Vegas', country: 'USA' },
  { iata: 'MCO', name: 'Orlando Airport', city: 'Orlando', country: 'USA' },
  { iata: 'PHX', name: 'Sky Harbor Airport', city: 'Phoenix', country: 'USA' },
  { iata: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', country: 'USA' },
  { iata: 'IAD', name: 'Dulles Airport', city: 'Washington DC', country: 'USA' },
  { iata: 'DCA', name: 'Reagan National Airport', city: 'Washington DC', country: 'USA' },
  { iata: 'SAN', name: 'San Diego Airport', city: 'San Diego', country: 'USA' },
  { iata: 'TPA', name: 'Tampa Airport', city: 'Tampa', country: 'USA' },
  { iata: 'PDX', name: 'Portland Airport', city: 'Portland', country: 'USA' },
  { iata: 'MSP', name: 'Minneapolis-Saint Paul', city: 'Minneapolis', country: 'USA' },
  { iata: 'CLT', name: 'Charlotte Douglas Airport', city: 'Charlotte', country: 'USA' },
  { iata: 'HNL', name: 'Daniel K. Inouye Airport', city: 'Honolulu', country: 'USA' },
  { iata: 'AUS', name: 'Austin-Bergstrom Airport', city: 'Austin', country: 'USA' },
  { iata: 'BNA', name: 'Nashville Airport', city: 'Nashville', country: 'USA' },
  { iata: 'MSY', name: 'Louis Armstrong Airport', city: 'New Orleans', country: 'USA' },
  { iata: 'SLC', name: 'Salt Lake City Airport', city: 'Salt Lake City', country: 'USA' },
  { iata: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'Canada' },
  { iata: 'YVR', name: 'Vancouver Airport', city: 'Vancouver', country: 'Canada' },
  { iata: 'YUL', name: 'Montreal Pierre Elliott Trudeau', city: 'Montreal', country: 'Canada' },
  { iata: 'YYC', name: 'Calgary Airport', city: 'Calgary', country: 'Canada' },
  { iata: 'YEG', name: 'Edmonton Airport', city: 'Edmonton', country: 'Canada' },
  { iata: 'MEX', name: 'Benito Juárez Airport', city: 'Mexico City', country: 'Mexico' },
  { iata: 'CUN', name: 'Cancún Airport', city: 'Cancún', country: 'Mexico' },
  { iata: 'GDL', name: 'Guadalajara Airport', city: 'Guadalajara', country: 'Mexico' },
  { iata: 'PVR', name: 'Puerto Vallarta Airport', city: 'Puerto Vallarta', country: 'Mexico' },
  { iata: 'SJD', name: 'Los Cabos Airport', city: 'Los Cabos', country: 'Mexico' },

  // ── Caribbean ─────────────────────────────────────────────────
  { iata: 'NAS', name: 'Nassau Airport', city: 'Nassau', country: 'Bahamas' },
  { iata: 'MBJ', name: 'Sangster Airport', city: 'Montego Bay', country: 'Jamaica' },
  { iata: 'PUJ', name: 'Punta Cana Airport', city: 'Punta Cana', country: 'Dominican Republic' },
  { iata: 'HAV', name: 'José Martí Airport', city: 'Havana', country: 'Cuba' },
  { iata: 'BGI', name: 'Grantley Adams Airport', city: 'Bridgetown', country: 'Barbados' },
  { iata: 'ANU', name: "V.C. Bird Airport", city: 'Antigua', country: 'Antigua & Barbuda' },
  { iata: 'UVF', name: 'Hewanorra Airport', city: 'St Lucia', country: 'St Lucia' },
  { iata: 'SJU', name: 'Luis Muñoz Marín', city: 'San Juan', country: 'Puerto Rico' },

  // ── South America ─────────────────────────────────────────────
  { iata: 'GRU', name: 'São Paulo Guarulhos', city: 'São Paulo', country: 'Brazil' },
  { iata: 'GIG', name: 'Rio Galeão Airport', city: 'Rio de Janeiro', country: 'Brazil' },
  { iata: 'BSB', name: 'Brasília Airport', city: 'Brasília', country: 'Brazil' },
  { iata: 'EZE', name: 'Ezeiza Airport', city: 'Buenos Aires', country: 'Argentina' },
  { iata: 'SCL', name: 'Arturo Merino Benítez', city: 'Santiago', country: 'Chile' },
  { iata: 'BOG', name: 'El Dorado Airport', city: 'Bogotá', country: 'Colombia' },
  { iata: 'MDE', name: 'José María Córdova', city: 'Medellín', country: 'Colombia' },
  { iata: 'CTG', name: 'Rafael Núñez Airport', city: 'Cartagena', country: 'Colombia' },
  { iata: 'LIM', name: 'Jorge Chávez Airport', city: 'Lima', country: 'Peru' },
  { iata: 'CUZ', name: 'Alejandro Velasco Astete', city: 'Cusco', country: 'Peru' },
  { iata: 'UIO', name: 'Mariscal Sucre Airport', city: 'Quito', country: 'Ecuador' },
  { iata: 'MVD', name: 'Carrasco Airport', city: 'Montevideo', country: 'Uruguay' },
  { iata: 'PTY', name: 'Tocumen Airport', city: 'Panama City', country: 'Panama' },
  { iata: 'SJO', name: 'Juan Santamaría Airport', city: 'San José', country: 'Costa Rica' },
]

/**
 * Search airports by IATA code, city, name, or country.
 * Returns up to `limit` results (default 8).
 */
export function searchAirports(query: string, limit = 8): Airport[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const exact: Airport[] = []
  const starts: Airport[] = []
  const contains: Airport[] = []

  for (const a of AIRPORTS) {
    const iataL = a.iata.toLowerCase()
    const cityL = a.city.toLowerCase()
    const nameL = a.name.toLowerCase()
    const countryL = a.country.toLowerCase()

    if (iataL === q) {
      exact.push(a)
    } else if (iataL.startsWith(q) || cityL.startsWith(q)) {
      starts.push(a)
    } else if (cityL.includes(q) || nameL.includes(q) || countryL.includes(q) || iataL.includes(q)) {
      contains.push(a)
    }
  }

  return [...exact, ...starts, ...contains].slice(0, limit)
}
