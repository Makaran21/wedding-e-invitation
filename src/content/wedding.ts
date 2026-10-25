// All wedding text, dates, places, photos and look-and-feel settings live here.
// Edit this file to change what guests see. Anything written as "....." is
// still a placeholder carried over from the design.

export type ProgramIcon =
  | 'icoTray' | 'icoBlessing' | 'icoMonk' | 'icoScissors'
  | 'icoRings' | 'icoDine' | 'icoGuests' | 'icoMusic' | 'icoCheers' | 'icoPray';

export interface Bilingual { kh: string; en: string }
export interface ProgramItem { time: string; kh: string; en: string; icon: ProgramIcon }
export interface VenueDetail { en: string; kh: string; body: string }
export interface GalleryPhoto { src: string; label: string; shape?: 'wide' | 'landscape' | 'tall' }
export interface Wish { name: string; message: string }

export type KhmerFont = 'Moulpali' | 'Moul' | 'Preahvihear' | 'Battambang' | 'Suwannaphum' | 'Kantumruy Pro' | 'Koulen';
export type LatinFont = 'Cinzel' | 'Cormorant Garamond' | 'EB Garamond' | 'Marcellus' | 'Playfair Display' | 'Jost';
export type Falling = 'Rose petals' | 'Gold dust' | 'None';
export type MapStyle =
  | 'Dark matter' | 'Dark matter (no labels)'
  | 'Positron' | 'Positron (no labels)'
  | 'Voyager' | 'Voyager (no labels)';

export interface Settings {
  /** Width of the kbach side rails, 6–48 px. */
  railWidth: number;
  falling: Falling;
  petalCount: number;
  sparkCount: number;
  dustCount: number;
  khmerFont: KhmerFont;
  latinFont: LatinFont;
  monogram: 'Khmer card mark' | 'Khmer ម ន mark' | 'Khmer kbach mark' | 'Latin MN mark' | 'Khmer ម ន letters';
  dateMonogram: 'Khmer card mark' | 'Khmer ម ន mark' | 'Khmer kbach mark' | 'Latin MN mark' | 'M & N lettering';
  mapStyle: MapStyle;
  /** Keep the page covered (and unscrollable) until the guest taps "Open invitation". */
  lockUntilOpened: boolean;
  /** Which opening cover to show. A link can override it to compare: ?intro=vertical, ?intro=envelope or ?intro=lotus. */
  intro: 'Vertical' | 'Envelope' | 'Lotus';
}

export interface WeddingContent {
  couple: { groom: Bilingual; bride: Bilingual; short: string; monogramKh: string };
  date: {
    iso: string; dots: string; lunarKh: string; day: string;
    monthKh: string; monthEn: string; yearKh: string; weekdayEn: string;
    fullKh: string; fullEn: string;
  };
  guestDefault: string;
  parents: [string, string, string, string];
  parentsEn: [string, string, string, string];
  letter: { inviteKh: string; inviteEn: string; detailsKh: string; detailsEn: string };
  program: ProgramItem[];
  venue: { lat: number; lng: number; zoom: number; details: VenueDetail[] };
  gratitude: Bilingual;
  photos: { strip: [string, string, string]; couple: string; gallery: GalleryPhoto[] };
  settings: Settings;
}

export const wedding: WeddingContent = {
  couple: {
    groom: { kh: 'វិជ្ជានន្ទ មករន្ទ', en: 'Vicheanon Makaran' },
    bride: { kh: 'អ៊ុង វួចនា', en: 'Ung Vouchnea' },
    short: 'Makaran & Vouchnea',
    monogramKh: 'ម ន',
  },

  date: {
    iso: '2026-12-06T07:00:00+07:00',
    dots: '06 . 12 . 2026',
    lunarKh: 'ថ្ងៃអាទិត្យ ១២រោច ខែកត្តិក',
    day: '06',
    monthKh: 'ធ្នូ',
    monthEn: 'December',
    yearKh: '២០២៦',
    weekdayEn: 'Sunday',
    fullKh: 'ថ្ងៃអាទិត្យ ទី៦ ខែធ្នូ ឆ្នាំ២០២៦',
    fullEn: 'Sunday 6 December 2026',
  },

  // Shown when the link has no ?to=… — personalise a link with e.g. /?to=លោក%20សុខ
  guestDefault: 'ជូន លោក / លោកស្រី ..... ',

  // The four parent names in the letter (left→right, top→bottom), in Khmer and English.
  parents: ['លោក ខៀវ វិជ្ជានន្ទ', 'លោក អ៊ុង ស៊ីណាត', 'លោកស្រី សេង ពិសិដ្ឋនារី', 'លោកស្រី សៅ សុជាតិ'],
  parentsEn: ['Mr. Khieu Vicheanon', 'Mr. Ung Sinath', 'Mrs. Seng Pisethneary', 'Mrs. Sao Socheat'],

  letter: {
    inviteKh: 'ឯកឧត្តម លោកជំទាវ លោកអ្នកឧកញ៉ា អ្នកឧកញ៉ា ឧកញ៉ា លោក លោកស្រី អ្នកនាង កញ្ញា អញ្ជើញចូលរួមជាអធិបតី និងជាភ្ញៀវកិត្តិយស ដើម្បីប្រសិទ្ធិពរជ័យ សិរីសួស្តី ជ័យមង្គល ក្នុងពិធីសិរីមង្គលអាពាហ៍ពិពាហ៍ កូនប្រុស កូនស្រី របស់យើងខ្ញុំ។',
    inviteEn: 'Have the honor of requesting your esteemed presence at the auspicious occasion of our wedding ceremony.',
    detailsKh: 'ដែលនឹងប្រព្រឹត្តទៅនាថ្ងៃ អាទិត្យ ១២រោច ខែកត្តិក ឆ្នាំមមី អដ្ឋស័ក ពុទ្ធសករាជ ២៥៧០ ត្រូវនឹងថ្ងៃទី ០៦ ខែ ធ្នូ ឆ្នាំ ២០២៦ វេលាម៉ោង ៥:០០ល្ងាច ស្ថិតនៅ វិមានពិភពថ្មីសែនសុខ (អគារ B) ។',
    // Shown under "Which will be held"; each line break starts a new line.
    detailsEn: 'On Sunday, 06 December 2026, at 5:00 PM\nAt Vimean Piphub Thmey Sen Sok (Building B)',
  },

  program: [
    { time: '០៦:៣០ ព្រឹក', kh: 'ជួបជុំភ្ញៀវកិត្តិយស ដើម្បីរៀបចំពិធីហែជំនូន', en: 'Guests gather for the procession', icon: 'icoGuests' },
    { time: '០៧:០០ ព្រឹក', kh: 'ពិធីហែជំនូនកំណត់ ចូលរោងជ័យ', en: "Groom's procession", icon: 'icoTray' },
    { time: '០៧:៣០ ព្រឹក', kh: 'អញ្ជើញភ្ញៀវកិត្តិយស ពិសារអាហារពេលព្រឹក', en: 'Breakfast', icon: 'icoDine' },
    { time: '០៨:០០ ព្រឹក', kh: 'ពិធីចៅមហានិយាយជើងការ រៀបរាប់ផ្លែឈើ និងបំពាក់ចិញ្ចៀន', en: 'Matchmaker rite & exchange of rings', icon: 'icoRings' },
    { time: '០៨:៣០ ព្រឹក', kh: 'ពិធីសូត្រមន្ត ចម្រើនព្រះបរិត្ត', en: "Monks' blessing", icon: 'icoMonk' },
    { time: '០៩:៣០ ព្រឹក', kh: 'ពិធីកាត់សក់បង្កក់សិរី កូនប្រុស–កូនស្រី', en: 'Hair cutting', icon: 'icoScissors' },
    { time: '១១:០០ ព្រឹក', kh: 'ពិធីសំពះផ្ទឹមសែនចងដៃ បង្វិលពពិល និងព្រះថោងតោងស្បៃ', en: 'Knot-tying & passing of blessings', icon: 'icoPray' },
    { time: '១២:០០ ថ្ងៃត្រង់', kh: 'អញ្ជើញភ្ញៀវកិត្តិយស ពិសារអាហារពេលថ្ងៃត្រង់ បញ្ចប់កិច្ចអាពាហ៍ពិពាហ៍', en: 'Luncheon & close of ceremony', icon: 'icoDine' },
    { time: '០៥:០០ ល្ងាច', kh: 'អញ្ជើញភ្ញៀវកិត្តិយស ពិសារភោជនាហារពេលល្ងាច', en: 'Evening reception', icon: 'icoCheers' },
  ],

  venue: {
    lat: 11.556374,
    lng: 104.928207,
    zoom: 14.2,
    details: [
      { en: 'Address', kh: 'អាសយដ្ឋាន', body: 'វិមានពិភពថ្មីសែនសុខ (អគារ B) · Vimean Piphub Thmey Sen Sok (Building B)' },
      { en: 'Parking', kh: 'ចំណតរថយន្ត', body: 'ចំណតឥតគិតថ្លៃនៅខាងក្រោយសាល · Free parking at the rear' },
      { en: 'Dress code', kh: 'ការស្លៀកពាក់', body: 'សំលៀកបំពាក់ប្រពៃណីខ្មែរ ឬឈុតផ្លូវការ · Khmer traditional or formal' },
      { en: 'Contact', kh: 'ទំនាក់ទំនង', body: 'លោក ..... · 0XX XXX XXX · កញ្ញា ..... · 0XX XXX XXX' },
    ],
  },

  gratitude: {
    kh: 'យើងខ្ញុំជាមាតាបិតា កូនទាំងពីរ សូមថ្លែងអំណរគុណ យ៉ាងជ្រាលជ្រៅ ចំពោះវត្តមាន ដ៏ឧត្តុង្គឧត្តមរបស់ សម្តេច ឯកឧត្តម លោកជំទាវ លោកអ្នកឧកញ៉ា អ្នកឧកញ៉ា ឧកញ៉ា លោក លោកស្រី អ្នកនាង កញ្ញា ដែលបាន អញ្ជើញចូលរួមជាកិត្តិយស ក្នុងពិធីសិរីស្វស្តីអាពាហ៍ពិពាហ៍ កូនប្រុស កូនស្រី របស់យើងខ្ញុំ នាពេលខាងមុខនេះ។ យើងខ្ញុំសូមការខន្តីអភ័យទោស ដែលពុំបានជូនលិខិតអញ្ជើញនេះ ដោយផ្ទាល់ ។ ដោយគារវកិច្ចដ៏ខ្ពង់ខ្ពស់ពីយើងខ្ញុំ។',
    en: 'We are extremely thankful for H.E., L.C.T., Neak Okhna, Okhna, ladies and gentlemen for your presence in the upcoming marriage of our children. We would like to apologize if this invitation has not been personally delivered by us.',
  },

  // Drop photo files into public/assets/photos/ using these names (or change them here).
  // Missing photos show a soft placeholder instead.
  photos: {
    strip: ['/assets/photos/strip-1.jpg', '/assets/photos/strip-2.jpg', '/assets/photos/strip-3.jpg'],
    couple: '/assets/photos/couple.jpg',
    gallery: [
      { src: '/assets/photos/gallery-wide-1.jpg', label: 'Wide photo 1', shape: 'wide' },
      { src: '/assets/photos/gallery-1.jpg', label: 'Photo 1' },
      { src: '/assets/photos/gallery-2.jpg', label: 'Photo 2' },
      { src: '/assets/photos/gallery-3.jpg', label: 'Photo 3' },
      { src: '/assets/photos/gallery-4.jpg', label: 'Photo 4' },
      { src: '/assets/photos/gallery-wide-2.jpg', label: 'Wide photo 2', shape: 'landscape' },
      { src: '/assets/photos/gallery-5.jpg', label: 'Photo 5' },
      { src: '/assets/photos/gallery-6.jpg', label: 'Photo 6' },
      { src: '/assets/photos/gallery-7.jpg', label: 'Photo 7' },
      { src: '/assets/photos/gallery-8.jpg', label: 'Photo 8' },
      { src: '/assets/photos/gallery-wide-3.jpg', label: 'Wide photo 3', shape: 'wide' },
      { src: '/assets/photos/gallery-9.jpg', label: 'Photo 9 · tall', shape: 'tall' },
    ],
  },

  // Same knobs as the Claude Design properties panel.
  settings: {
    railWidth: 28,
    falling: 'Rose petals',
    petalCount: 64,
    sparkCount: 70,
    dustCount: 28,
    khmerFont: 'Preahvihear',
    latinFont: 'Playfair Display',
    // 'Khmer card mark' is the monogram printed on the invitation card; the previous choice was 'Khmer kbach mark'.
    monogram: 'Khmer card mark',
    dateMonogram: 'Khmer card mark',
    mapStyle: 'Dark matter',
    lockUntilOpened: true,
    intro: 'Envelope',
  },
};
