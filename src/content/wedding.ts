// All wedding text, dates, places, photos and look-and-feel settings live here.
// Edit this file to change what guests see. Anything written as "....." is
// still a placeholder carried over from the design.

export type ProgramIcon =
  | 'icoTray' | 'icoBlessing' | 'icoMonk' | 'icoScissors'
  | 'icoRings' | 'icoDine' | 'icoGuests' | 'icoMusic';

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
  monogram: 'Khmer ម ន mark' | 'Khmer kbach mark' | 'Latin MN mark' | 'Khmer ម ន letters';
  dateMonogram: 'Khmer ម ន mark' | 'Khmer kbach mark' | 'Latin MN mark' | 'M & N lettering';
  mapStyle: MapStyle;
  /** Keep the page covered (and unscrollable) until the guest taps "Open invitation". */
  lockUntilOpened: boolean;
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
  letter: { inviteKh: string; inviteEn: string; detailsKh: string; detailsEn: string };
  program: ProgramItem[];
  venue: { lat: number; lng: number; zoom: number; details: VenueDetail[] };
  gratitude: Bilingual;
  photos: { strip: [string, string, string]; couple: string; gallery: GalleryPhoto[] };
  wishes: Wish[];
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
    lunarKh: 'ថ្ងៃអាទិត្យ ១២រោច ខែកត្តឹ',
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

  // The four parent names at the top of the letter (left→right, top→bottom).
  parents: ['លោក ..... ', 'លោក ..... ', 'លោកជំទាវ ..... ', 'លោកស្រី ..... '],

  letter: {
    inviteKh: 'សម្តេច ឯកឧត្តម លោកជំទាវ លោកអ្នកឧកញ៉ា អ្នកឧកញ៉ា ឧកញ៉ា លោក លោកស្រី អ្នកនាង កញ្ញា អញ្ជើញជាអធិបតី និងជាភ្ញៀវកិត្តិយស ដើម្បីប្រសិទ្ធពរជ័យសិរីសួស្តី ជូនមង្គល ក្នុងពិធីសិរីមង្គលអាពាហ៍ពិពាហ៍ កូនប្រុស–កូនស្រី របស់យើងខ្ញុំ',
    inviteEn: 'We respectfully request the honour of your presence at the wedding ceremony of our son and daughter.',
    detailsKh: 'ដែលនឹងប្រព្រឹត្តទៅនៅថ្ងៃអាទិត្យ ទី៦ ខែធ្នូ ឆ្នាំ២០២៦ ត្រូវនឹងថ្ងៃ ..... ខែធ្នូ ឆ្នាំម្មី អដ្ឋសក ព.ស ២៥៧០ វេលាម៉ោង ..... នៅ ..... ',
    detailsEn: 'Sunday 6 December 2026 · ..... · reception from .....',
  },

  program: [
    { time: '០៥:០០ ព្រឹក', kh: 'ពិធីហែជំនូន', en: "Groom's procession", icon: 'icoTray' },
    { time: '០៦:៣០ ព្រឹក', kh: 'ពិធីជាយាសីដំណើរ', en: 'Welcoming rite', icon: 'icoBlessing' },
    { time: '០៨:០០ ព្រឹក', kh: 'ពិធីសូត្រមន្តជ័យតោ', en: "Monks' blessing", icon: 'icoMonk' },
    { time: '០៩:៣០ ព្រឹក', kh: 'ពិធីកាត់សក់បង្គាប់ការ', en: 'Hair cutting', icon: 'icoScissors' },
    { time: '១០:៣០ ព្រឹក', kh: 'ពិធីបង្វិលពពិល និងចងដៃ', en: 'Passing of blessings', icon: 'icoRings' },
    { time: '១២:០០ ថ្ងៃត្រង់', kh: 'អាហារពេលថ្ងៃត្រង់', en: 'Luncheon', icon: 'icoDine' },
    { time: '០៥:០០ ល្ងាច', kh: 'ទទួលភ្ញៀវកិត្តិយស', en: 'Guests received', icon: 'icoGuests' },
    { time: '០៦:៣០ ល្ងាច', kh: 'ជប់លៀង និងកម្មវិធីសិល្បៈ', en: 'Reception', icon: 'icoMusic' },
  ],

  venue: {
    lat: 11.556374,
    lng: 104.928207,
    zoom: 14.2,
    details: [
      { en: 'Address', kh: 'អាសយដ្ឋាន', body: 'ឈ្មោះសាល · ផ្លូវលេខ ..... សង្កាត់ ..... ខណ្ឌ ..... រាជធានីភ្នំពេញ' },
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

  // Sample wishes from the design — replace or empty this list before sharing.
  wishes: [
    { name: 'Guest name', message: 'សូមជូនពរឱ្យគូស្វាមីភរិយាមានសុភមង្គលរាប់អានគ្នាជារៀងរហូត · Wishing you a lifetime of happiness together.' },
    { name: 'Guest name', message: 'អបអរសាទរ! សូមឱ្យសេចក្ដីស្រឡាញ់នេះនៅស្ថិតស្ថេរ · Congratulations to you both.' },
    { name: 'Guest name', message: 'សូមជូនពរជោគជ័យ និងសុខភាពល្អ · Health, joy and blessings always.' },
  ],

  // Same knobs as the Claude Design properties panel.
  settings: {
    railWidth: 28,
    falling: 'Rose petals',
    petalCount: 64,
    sparkCount: 70,
    dustCount: 28,
    khmerFont: 'Preahvihear',
    latinFont: 'Playfair Display',
    monogram: 'Khmer kbach mark',
    dateMonogram: 'Khmer kbach mark',
    mapStyle: 'Dark matter',
    lockUntilOpened: true,
  },
};
