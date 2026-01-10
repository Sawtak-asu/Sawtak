/**
 * Egypt Administrative Divisions
 * Shared backend version of egypt-locations for Team routing
 * This should stay in sync with Front-end/lib/egypt-locations.ts
 */

export interface Ministry {
    id: string;
    name: string;
    nameAr: string;
}

export interface Center {
    id: string;
    name: string;
    nameAr: string;
}

export interface Governorate {
    id: string;
    name: string;
    nameAr: string;
    centers?: Center[];
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

// Egyptian Governorates (simplified - just IDs and names for backend)
export const GOVERNORATES: Governorate[] = [
    { id: "gov_cairo", name: "Cairo", nameAr: "القاهرة" },
    { id: "gov_giza", name: "Giza", nameAr: "الجيزة" },
    { id: "gov_qalyubia", name: "Qalyubia", nameAr: "القليوبية" },
    { id: "gov_alexandria", name: "Alexandria", nameAr: "الإسكندرية" },
    { id: "gov_dakahlia", name: "Dakahlia", nameAr: "الدقهلية" },
    { id: "gov_sharqia", name: "Sharqia", nameAr: "الشرقية" },
    { id: "gov_gharbia", name: "Gharbia", nameAr: "الغربية" },
    { id: "gov_monufia", name: "Monufia", nameAr: "المنوفية" },
    { id: "gov_beheira", name: "Beheira", nameAr: "البحيرة" },
    { id: "gov_kafr_sheikh", name: "Kafr El-Sheikh", nameAr: "كفر الشيخ" },
    { id: "gov_damietta", name: "Damietta", nameAr: "دمياط" },
    { id: "gov_port_said", name: "Port Said", nameAr: "بورسعيد" },
    { id: "gov_suez", name: "Suez", nameAr: "السويس" },
    { id: "gov_ismailia", name: "Ismailia", nameAr: "الإسماعيلية" },
    { id: "gov_fayoum", name: "Fayoum", nameAr: "الفيوم" },
    { id: "gov_beni_suef", name: "Beni Suef", nameAr: "بني سويف" },
    { id: "gov_minya", name: "Minya", nameAr: "المنيا" },
    { id: "gov_asyut", name: "Asyut", nameAr: "أسيوط" },
    { id: "gov_sohag", name: "Sohag", nameAr: "سوهاج" },
    { id: "gov_qena", name: "Qena", nameAr: "قنا" },
    { id: "gov_luxor", name: "Luxor", nameAr: "الأقصر" },
    { id: "gov_aswan", name: "Aswan", nameAr: "أسوان" },
    { id: "gov_red_sea", name: "Red Sea", nameAr: "البحر الأحمر" },
    { id: "gov_north_sinai", name: "North Sinai", nameAr: "شمال سيناء" },
    { id: "gov_south_sinai", name: "South Sinai", nameAr: "جنوب سيناء" },
    { id: "gov_matrouh", name: "Matrouh", nameAr: "مطروح" },
    { id: "gov_new_valley", name: "New Valley", nameAr: "الوادي الجديد" },
];

// Helper functions
export function getMinistryById(id: string): Ministry | undefined {
    return MINISTRIES.find(m => m.id === id);
}

export function getGovernorateById(id: string): Governorate | undefined {
    return GOVERNORATES.find(g => g.id === id);
}
