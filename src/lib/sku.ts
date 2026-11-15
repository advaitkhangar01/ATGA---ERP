/**
 * Automotive Glass SKU Generator
 * 
 * Standard naming format:
 * [Brand]-[CarBrand]-[Model]-[Type]-[Position]-[Feature]
 * Example: SG-MAR-SWIF-WS-FRN-ADAS
 */

export interface SkuParams {
  brand: string;
  carBrand: string;
  model: string;
  type: string;
  position?: string;
  feature?: string;
}

export const BRAND_ABBREVIATIONS: Record<string, string> = {
  'Saint Gobain': 'SG',
  'Clarion': 'CLA',
  'XYG': 'XYG',
  'Asahi': 'AIS',
  'AIS': 'AIS',
  'Fuyao': 'FY',
  'Pilkington': 'PIL',
};

export const CAR_BRAND_ABBREVIATIONS: Record<string, string> = {
  'Maruti': 'MAR',
  'Maruti Suzuki': 'MAR',
  'Honda': 'HON',
  'Hyundai': 'HYU',
  'Toyota': 'TOY',
  'Tata': 'TAT',
  'Mahindra': 'MAH',
  'Kia': 'KIA',
  'Ford': 'FOR',
  'Volkswagen': 'VW',
  'Skoda': 'SKO',
  'Renault': 'REN',
  'Nissan': 'NIS',
  'MG': 'MG',
};

export const GLASS_TYPE_ABBREVIATIONS: Record<string, string> = {
  'Windshield': 'WS',
  'Rear Glass': 'RG',
  'Back Light': 'BL',
  'Door Glass': 'DG',
  'Quarter Glass': 'QG',
  'Vent Glass': 'VG',
  'Front Door': 'FDG',
  'Rear Door': 'RDG',
};

export const POSITION_ABBREVIATIONS: Record<string, string> = {
  'Front': 'FRN',
  'Rear': 'REAR',
  'Front Left': 'FL',
  'Front Right': 'FR',
  'Rear Left': 'RL',
  'Rear Right': 'RR',
  'All': 'ALL',
};

export const FEATURE_ABBREVIATIONS: Record<string, string> = {
  'Standard Green': 'STD',
  'Standard': 'STD',
  'Rain Sensor': 'RS',
  'ADAS Bracket': 'ADAS',
  'ADAS': 'ADAS',
  'Acoustic PVB': 'AC',
  'Privacy Tint': 'PRV',
  'Demister Heated': 'HEAT',
  'Heated': 'HEAT',
};

function cleanString(str: string, maxLen = 4): string {
  return (str || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, maxLen);
}

export function generateSku(
  brandOrParams: string | SkuParams,
  carBrand?: string,
  model?: string,
  type?: string,
  position?: string,
  feature?: string
): string {
  let p: SkuParams;
  if (typeof brandOrParams === 'object') {
    p = brandOrParams;
  } else {
    p = {
      brand: brandOrParams,
      carBrand: carBrand || '',
      model: model || '',
      type: type || '',
      position: position || 'FRN',
      feature: feature || 'STD',
    };
  }

  const b = BRAND_ABBREVIATIONS[p.brand] || cleanString(p.brand, 3) || 'GEN';
  const cb = CAR_BRAND_ABBREVIATIONS[p.carBrand] || cleanString(p.carBrand, 3) || 'GEN';
  const m = cleanString(p.model, 4) || 'GEN';
  const t = GLASS_TYPE_ABBREVIATIONS[p.type] || cleanString(p.type, 2) || 'GL';
  const pos = p.position ? (POSITION_ABBREVIATIONS[p.position] || cleanString(p.position, 4)) : 'FRN';
  const feat = p.feature ? (FEATURE_ABBREVIATIONS[p.feature] || cleanString(p.feature, 4)) : 'STD';

  return `${b}-${cb}-${m}-${t}-${pos}-${feat}`;
}
