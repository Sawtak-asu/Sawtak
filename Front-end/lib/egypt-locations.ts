/**
 * Egypt Administrative Divisions
 * This file contains the governorates, centers (markaz), and major townships of Egypt
 * Used for "Directed To" field in complaints for routing to appropriate administrators
 */

export interface Township {
  id: string;
  name: string;
  nameAr: string;
}

export interface Center {
  id: string;
  name: string;
  nameAr: string;
  townships?: Township[];
}

export interface Governorate {
  id: string;
  name: string;
  nameAr: string;
  centers?: Center[];
}

export interface Ministry {
  id: string;
  name: string;
  nameAr: string;
}

// Egyptian Ministries
export const MINISTRIES: Ministry[] = [
  { id: "min_interior", name: "Ministry of Interior", nameAr: "وزارة الداخلية" },
  { id: "min_justice", name: "Ministry of Justice", nameAr: "وزارة العدل" },
  { id: "min_health", name: "Ministry of Health", nameAr: "وزارة الصحة" },
  { id: "min_education", name: "Ministry of Education", nameAr: "وزارة التربية والتعليم" },
  { id: "min_higher_education", name: "Ministry of Higher Education", nameAr: "وزارة التعليم العالي" },
  { id: "min_transport", name: "Ministry of Transport", nameAr: "وزارة النقل" },
  { id: "min_housing", name: "Ministry of Housing", nameAr: "وزارة الإسكان" },
  { id: "min_finance", name: "Ministry of Finance", nameAr: "وزارة المالية" },
  { id: "min_manpower", name: "Ministry of Manpower", nameAr: "وزارة القوى العاملة" },
  { id: "min_local_dev", name: "Ministry of Local Development", nameAr: "وزارة التنمية المحلية" },
  { id: "min_environment", name: "Ministry of Environment", nameAr: "وزارة البيئة" },
  { id: "min_social_solidarity", name: "Ministry of Social Solidarity", nameAr: "وزارة التضامن الاجتماعي" },
  { id: "min_supply", name: "Ministry of Supply", nameAr: "وزارة التموين" },
  { id: "min_electricity", name: "Ministry of Electricity", nameAr: "وزارة الكهرباء" },
  { id: "min_water", name: "Ministry of Water Resources", nameAr: "وزارة الموارد المائية" },
  { id: "min_communications", name: "Ministry of Communications", nameAr: "وزارة الاتصالات" },
];

// Egyptian Governorates with major centers
export const GOVERNORATES: Governorate[] = [
  // Greater Cairo Region
  {
    id: "gov_cairo",
    name: "Cairo",
    nameAr: "القاهرة",
    centers: [
      { id: "cairo_nasr_city", name: "Nasr City", nameAr: "مدينة نصر" },
      { id: "cairo_maadi", name: "Maadi", nameAr: "المعادي" },
      { id: "cairo_heliopolis", name: "Heliopolis", nameAr: "مصر الجديدة" },
      { id: "cairo_downtown", name: "Downtown Cairo", nameAr: "وسط البلد" },
      { id: "cairo_shubra", name: "Shubra", nameAr: "شبرا" },
      { id: "cairo_new_cairo", name: "New Cairo", nameAr: "القاهرة الجديدة" },
      { id: "cairo_15_may", name: "15th of May City", nameAr: "مدينة 15 مايو" },
      { id: "cairo_helwan", name: "Helwan", nameAr: "حلوان" },
    ]
  },
  {
    id: "gov_giza",
    name: "Giza",
    nameAr: "الجيزة",
    centers: [
      { id: "giza_dokki", name: "Dokki", nameAr: "الدقي" },
      { id: "giza_mohandessin", name: "Mohandessin", nameAr: "المهندسين" },
      { id: "giza_haram", name: "Haram", nameAr: "الهرم" },
      { id: "giza_6october", name: "6th of October City", nameAr: "مدينة 6 أكتوبر" },
      { id: "giza_sheikh_zayed", name: "Sheikh Zayed City", nameAr: "مدينة الشيخ زايد" },
      { id: "giza_faisal", name: "Faisal", nameAr: "فيصل" },
      { id: "giza_imbaba", name: "Imbaba", nameAr: "إمبابة" },
    ]
  },
  {
    id: "gov_qalyubia",
    name: "Qalyubia",
    nameAr: "القليوبية",
    centers: [
      { id: "qalyubia_banha", name: "Banha", nameAr: "بنها" },
      { id: "qalyubia_shubra_alkhaymah", name: "Shubra Al-Khaymah", nameAr: "شبرا الخيمة" },
      { id: "qalyubia_qalyub", name: "Qalyub", nameAr: "قليوب" },
      { id: "qalyubia_obour", name: "El Obour City", nameAr: "مدينة العبور" },
    ]
  },
  // Alexandria Region
  {
    id: "gov_alexandria",
    name: "Alexandria",
    nameAr: "الإسكندرية",
    centers: [
      { id: "alex_montazah", name: "Montazah", nameAr: "المنتزه" },
      { id: "alex_raml", name: "El Raml", nameAr: "الرمل" },
      { id: "alex_sidi_gaber", name: "Sidi Gaber", nameAr: "سيدي جابر" },
      { id: "alex_miami", name: "Miami", nameAr: "ميامي" },
      { id: "alex_smouha", name: "Smouha", nameAr: "سموحة" },
      { id: "alex_agami", name: "Agami", nameAr: "العجمي" },
      { id: "alex_borg_alarab", name: "Borg El Arab", nameAr: "برج العرب" },
    ]
  },
  // Delta Governorates
  {
    id: "gov_dakahlia",
    name: "Dakahlia",
    nameAr: "الدقهلية",
    centers: [
      { id: "dakahlia_mansoura", name: "Mansoura", nameAr: "المنصورة" },
      { id: "dakahlia_mit_ghamr", name: "Mit Ghamr", nameAr: "ميت غمر" },
      { id: "dakahlia_talkha", name: "Talkha", nameAr: "طلخا" },
    ]
  },
  {
    id: "gov_sharqia",
    name: "Sharqia",
    nameAr: "الشرقية",
    centers: [
      { id: "sharqia_zagazig", name: "Zagazig", nameAr: "الزقازيق" },
      { id: "sharqia_10th_ramadan", name: "10th of Ramadan City", nameAr: "مدينة العاشر من رمضان" },
      { id: "sharqia_abu_hammad", name: "Abu Hammad", nameAr: "أبو حماد" },
    ]
  },
  {
    id: "gov_gharbia",
    name: "Gharbia",
    nameAr: "الغربية",
    centers: [
      { id: "gharbia_tanta", name: "Tanta", nameAr: "طنطا" },
      { id: "gharbia_mahalla", name: "El-Mahalla El-Kubra", nameAr: "المحلة الكبرى" },
      { id: "gharbia_kafr_zayat", name: "Kafr El-Zayat", nameAr: "كفر الزيات" },
    ]
  },
  {
    id: "gov_monufia",
    name: "Monufia",
    nameAr: "المنوفية",
    centers: [
      { id: "monufia_shibin", name: "Shibin El Kom", nameAr: "شبين الكوم" },
      { id: "monufia_menouf", name: "Menouf", nameAr: "منوف" },
      { id: "monufia_sadat", name: "Sadat City", nameAr: "مدينة السادات" },
    ]
  },
  {
    id: "gov_beheira",
    name: "Beheira",
    nameAr: "البحيرة",
    centers: [
      { id: "beheira_damanhour", name: "Damanhour", nameAr: "دمنهور" },
      { id: "beheira_kafr_dawwar", name: "Kafr El-Dawwar", nameAr: "كفر الدوار" },
      { id: "beheira_rashid", name: "Rashid", nameAr: "رشيد" },
    ]
  },
  {
    id: "gov_kafr_sheikh",
    name: "Kafr El-Sheikh",
    nameAr: "كفر الشيخ",
    centers: [
      { id: "kafr_sheikh_capital", name: "Kafr El-Sheikh", nameAr: "كفر الشيخ" },
      { id: "kafr_sheikh_desouk", name: "Desouk", nameAr: "دسوق" },
    ]
  },
  {
    id: "gov_damietta",
    name: "Damietta",
    nameAr: "دمياط",
    centers: [
      { id: "damietta_capital", name: "Damietta", nameAr: "دمياط" },
      { id: "damietta_new", name: "New Damietta", nameAr: "دمياط الجديدة" },
    ]
  },
  // Canal Region
  {
    id: "gov_port_said",
    name: "Port Said",
    nameAr: "بورسعيد",
    centers: [
      { id: "port_said_east", name: "East Port Said", nameAr: "شرق بورسعيد" },
      { id: "port_said_west", name: "West Port Said", nameAr: "غرب بورسعيد" },
    ]
  },
  {
    id: "gov_suez",
    name: "Suez",
    nameAr: "السويس",
    centers: [
      { id: "suez_capital", name: "Suez", nameAr: "السويس" },
    ]
  },
  {
    id: "gov_ismailia",
    name: "Ismailia",
    nameAr: "الإسماعيلية",
    centers: [
      { id: "ismailia_capital", name: "Ismailia", nameAr: "الإسماعيلية" },
    ]
  },
  // Upper Egypt
  {
    id: "gov_fayoum",
    name: "Fayoum",
    nameAr: "الفيوم",
    centers: [
      { id: "fayoum_capital", name: "Fayoum", nameAr: "الفيوم" },
    ]
  },
  {
    id: "gov_beni_suef",
    name: "Beni Suef",
    nameAr: "بني سويف",
    centers: [
      { id: "beni_suef_capital", name: "Beni Suef", nameAr: "بني سويف" },
    ]
  },
  {
    id: "gov_minya",
    name: "Minya",
    nameAr: "المنيا",
    centers: [
      { id: "minya_capital", name: "Minya", nameAr: "المنيا" },
      { id: "minya_new", name: "New Minya", nameAr: "المنيا الجديدة" },
    ]
  },
  {
    id: "gov_asyut",
    name: "Asyut",
    nameAr: "أسيوط",
    centers: [
      { id: "asyut_capital", name: "Asyut", nameAr: "أسيوط" },
      { id: "asyut_new", name: "New Asyut", nameAr: "أسيوط الجديدة" },
    ]
  },
  {
    id: "gov_sohag",
    name: "Sohag",
    nameAr: "سوهاج",
    centers: [
      { id: "sohag_capital", name: "Sohag", nameAr: "سوهاج" },
    ]
  },
  {
    id: "gov_qena",
    name: "Qena",
    nameAr: "قنا",
    centers: [
      { id: "qena_capital", name: "Qena", nameAr: "قنا" },
    ]
  },
  {
    id: "gov_luxor",
    name: "Luxor",
    nameAr: "الأقصر",
    centers: [
      { id: "luxor_capital", name: "Luxor", nameAr: "الأقصر" },
    ]
  },
  {
    id: "gov_aswan",
    name: "Aswan",
    nameAr: "أسوان",
    centers: [
      { id: "aswan_capital", name: "Aswan", nameAr: "أسوان" },
    ]
  },
  // Red Sea and Sinai
  {
    id: "gov_red_sea",
    name: "Red Sea",
    nameAr: "البحر الأحمر",
    centers: [
      { id: "red_sea_hurghada", name: "Hurghada", nameAr: "الغردقة" },
      { id: "red_sea_safaga", name: "Safaga", nameAr: "سفاجا" },
      { id: "red_sea_marsa_alam", name: "Marsa Alam", nameAr: "مرسى علم" },
    ]
  },
  {
    id: "gov_north_sinai",
    name: "North Sinai",
    nameAr: "شمال سيناء",
    centers: [
      { id: "north_sinai_arish", name: "El-Arish", nameAr: "العريش" },
    ]
  },
  {
    id: "gov_south_sinai",
    name: "South Sinai",
    nameAr: "جنوب سيناء",
    centers: [
      { id: "south_sinai_sharm", name: "Sharm El-Sheikh", nameAr: "شرم الشيخ" },
      { id: "south_sinai_dahab", name: "Dahab", nameAr: "دهب" },
      { id: "south_sinai_nuweiba", name: "Nuweiba", nameAr: "نويبع" },
    ]
  },
  // Western Desert
  {
    id: "gov_matrouh",
    name: "Matrouh",
    nameAr: "مطروح",
    centers: [
      { id: "matrouh_capital", name: "Marsa Matrouh", nameAr: "مرسى مطروح" },
      { id: "matrouh_siwa", name: "Siwa Oasis", nameAr: "واحة سيوة" },
    ]
  },
  {
    id: "gov_new_valley",
    name: "New Valley",
    nameAr: "الوادي الجديد",
    centers: [
      { id: "new_valley_kharga", name: "Kharga Oasis", nameAr: "الخارجة" },
      { id: "new_valley_dakhla", name: "Dakhla Oasis", nameAr: "الداخلة" },
    ]
  },
];

// Expanded complaint categories
export const COMPLAINT_CATEGORIES = [
  { id: "general", name: "General", nameAr: "عام" },
  { id: "corruption", name: "Corruption", nameAr: "فساد" },
  { id: "misconduct", name: "Misconduct", nameAr: "سوء سلوك" },
  { id: "harassment", name: "Harassment", nameAr: "تحرش" },
  { id: "discrimination", name: "Discrimination", nameAr: "تمييز" },
  { id: "fraud", name: "Fraud", nameAr: "احتيال" },
  { id: "safety", name: "Safety Concerns", nameAr: "مخاوف السلامة" },
  { id: "environment", name: "Environmental Issues", nameAr: "قضايا بيئية" },
  { id: "infrastructure", name: "Infrastructure Problems", nameAr: "مشاكل البنية التحتية" },
  { id: "healthcare", name: "Healthcare Issues", nameAr: "قضايا صحية" },
  { id: "education", name: "Education Issues", nameAr: "قضايا تعليمية" },
  { id: "public_services", name: "Public Services", nameAr: "خدمات عامة" },
  { id: "other", name: "Other", nameAr: "أخرى" },
] as const;

// Types for the "Directed To" field
export type DirectedToType = "ministry" | "governorate" | "center";

export interface DirectedTo {
  type: DirectedToType;
  ministryId?: string;
  governorateId?: string;
  centerId?: string;
}

// Helper functions to get data
export function getMinistryById(id: string): Ministry | undefined {
  return MINISTRIES.find(m => m.id === id);
}

export function getGovernorateById(id: string): Governorate | undefined {
  return GOVERNORATES.find(g => g.id === id);
}

export function getCenterById(governorateId: string, centerId: string): Center | undefined {
  const gov = getGovernorateById(governorateId);
  return gov?.centers?.find(c => c.id === centerId);
}

// Get a flat list of all centers with their governorate for display
export function getAllCentersFlat(): Array<{ governorateId: string; governorateName: string; center: Center }> {
  const result: Array<{ governorateId: string; governorateName: string; center: Center }> = [];
  for (const gov of GOVERNORATES) {
    if (gov.centers) {
      for (const center of gov.centers) {
        result.push({
          governorateId: gov.id,
          governorateName: gov.name,
          center
        });
      }
    }
  }
  return result;
}

// Get display name for a DirectedTo value
export function getDirectedToDisplayName(directedTo: DirectedTo): string {
  if (directedTo.type === "ministry" && directedTo.ministryId) {
    const ministry = getMinistryById(directedTo.ministryId);
    return ministry?.name || "Unknown Ministry";
  }
  if (directedTo.type === "governorate" && directedTo.governorateId) {
    const gov = getGovernorateById(directedTo.governorateId);
    return gov?.name || "Unknown Governorate";
  }
  if (directedTo.type === "center" && directedTo.governorateId && directedTo.centerId) {
    const gov = getGovernorateById(directedTo.governorateId);
    const center = getCenterById(directedTo.governorateId, directedTo.centerId);
    if (gov && center) {
      return `${center.name}, ${gov.name}`;
    }
  }
  return "Unknown";
}
