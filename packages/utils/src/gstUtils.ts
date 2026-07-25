export const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (Old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export function isValidGstin(gstin?: string | null): boolean {
  if (!gstin) return false;
  return GSTIN_REGEX.test(gstin.toUpperCase());
}

export function isValidPan(pan?: string | null): boolean {
  if (!pan) return false;
  return PAN_REGEX.test(pan.toUpperCase());
}

export function validateGstinPartial(val: string): {
  valid: boolean;
  isComplete: boolean;
  error?: string;
} {
  const upperVal = val.toUpperCase();
  if (upperVal.length > 15)
    return { valid: false, isComplete: false, error: 'Maximum 15 characters allowed' };

  const patterns = [
    /^[0-9]$/,
    /^[0-9]$/,
    /^[A-Z]$/,
    /^[A-Z]$/,
    /^[A-Z]$/,
    /^[A-Z]$/,
    /^[A-Z]$/,
    /^[0-9]$/,
    /^[0-9]$/,
    /^[0-9]$/,
    /^[0-9]$/,
    /^[A-Z]$/,
    /^[0-9A-Z]$/,
    /^Z$/,
    /^[0-9A-Z]$/,
  ];

  for (let i = 0; i < upperVal.length; i++) {
    if (!patterns[i].test(upperVal[i])) {
      return { valid: false, isComplete: false, error: `Invalid character at position ${i + 1}` };
    }
  }

  if (upperVal.length < 15) {
    return { valid: true, isComplete: false, error: '15 characters are needed in GSTIN format' };
  }
  return { valid: true, isComplete: true };
}

export function validatePanPartial(val: string): {
  valid: boolean;
  isComplete: boolean;
  error?: string;
} {
  const upperVal = val.toUpperCase();
  if (upperVal.length > 10)
    return { valid: false, isComplete: false, error: 'Maximum 10 characters allowed' };

  const patterns = [
    /^[A-Z]$/,
    /^[A-Z]$/,
    /^[A-Z]$/,
    /^[A-Z]$/,
    /^[A-Z]$/,
    /^[0-9]$/,
    /^[0-9]$/,
    /^[0-9]$/,
    /^[0-9]$/,
    /^[A-Z]$/,
  ];

  for (let i = 0; i < upperVal.length; i++) {
    if (!patterns[i].test(upperVal[i])) {
      return { valid: false, isComplete: false, error: `Invalid character at position ${i + 1}` };
    }
  }

  if (upperVal.length < 10) {
    return { valid: true, isComplete: false, error: '10 characters are needed in PAN format' };
  }
  return { valid: true, isComplete: true };
}

export function extractPanFromGstin(gstin?: string | null): string | null {
  if (!gstin || gstin.length < 15) return null;
  const upperGstin = gstin.toUpperCase();
  if (!GSTIN_REGEX.test(upperGstin)) return null;
  return upperGstin.substring(2, 12);
}

export function extractStateCodeFromGstin(gstin?: string | null): string | null {
  if (!gstin || gstin.length < 2) return null;
  const stateCode = gstin.substring(0, 2);
  if (GST_STATE_CODES[stateCode]) {
    return stateCode;
  }
  return null;
}

export function getStateFromGstin(
  gstin?: string | null,
): { stateCode: string; stateName: string } | null {
  const stateCode = extractStateCodeFromGstin(gstin);
  if (stateCode) {
    return { stateCode, stateName: GST_STATE_CODES[stateCode]! };
  }
  return null;
}

export interface GstUqcMasterItem {
  name: string;
  shortName: string;
  uqcCode: string;
  uqcDescription: string;
}

export interface GstUqcCategory {
  category: string;
  units: GstUqcMasterItem[];
}

export const GST_UQC_MASTER: GstUqcCategory[] = [
  {
    category: 'Weight',
    units: [
      { name: 'Kilograms', shortName: 'KGS', uqcCode: 'KGS', uqcDescription: 'KILOGRAMS' },
      { name: 'Grams', shortName: 'GMS', uqcCode: 'GMS', uqcDescription: 'GRAMS' },
      { name: 'Metric Tons', shortName: 'MTS', uqcCode: 'MTS', uqcDescription: 'METRIC TONNES' },
      { name: 'Quintals', shortName: 'QTL', uqcCode: 'QTL', uqcDescription: 'QUINTALS' },
      { name: 'Pounds', shortName: 'LBS', uqcCode: 'LBS', uqcDescription: 'POUNDS' },
      { name: 'Ounces', shortName: 'OZT', uqcCode: 'OZT', uqcDescription: 'OUNCES' },
    ],
  },
  {
    category: 'Count',
    units: [
      { name: 'Pieces', shortName: 'PCS', uqcCode: 'PCS', uqcDescription: 'PIECES' },
      { name: 'Numbers', shortName: 'NOS', uqcCode: 'NOS', uqcDescription: 'NUMBERS' },
      { name: 'Dozens', shortName: 'DOZ', uqcCode: 'DOZ', uqcDescription: 'DOZENS' },
      { name: 'Great Gross', shortName: 'GGK', uqcCode: 'GGK', uqcDescription: 'GREAT GROSS' },
      { name: 'Gross', shortName: 'GRS', uqcCode: 'GRS', uqcDescription: 'GROSS' },
      { name: 'Sets', shortName: 'SET', uqcCode: 'SET', uqcDescription: 'SETS' },
      { name: 'Pairs', shortName: 'PRS', uqcCode: 'PRS', uqcDescription: 'PAIRS' },
    ],
  },
  {
    category: 'Length',
    units: [
      { name: 'Meters', shortName: 'MTR', uqcCode: 'MTR', uqcDescription: 'METERS' },
      { name: 'Centimeters', shortName: 'CMT', uqcCode: 'CMT', uqcDescription: 'CENTIMETERS' },
      { name: 'Inches', shortName: 'INC', uqcCode: 'INC', uqcDescription: 'INCHES' },
      { name: 'Yards', shortName: 'YDS', uqcCode: 'YDS', uqcDescription: 'YARDS' },
      { name: 'Feet', shortName: 'FTS', uqcCode: 'FTS', uqcDescription: 'FEET' },
    ],
  },
  {
    category: 'Area',
    units: [
      { name: 'Square Meters', shortName: 'SQM', uqcCode: 'SQM', uqcDescription: 'SQUARE METERS' },
      { name: 'Square Feet', shortName: 'SQF', uqcCode: 'SQF', uqcDescription: 'SQUARE FEET' },
      { name: 'Square Inches', shortName: 'SQI', uqcCode: 'SQI', uqcDescription: 'SQUARE INCHES' },
      { name: 'Square Yards', shortName: 'SQY', uqcCode: 'SQY', uqcDescription: 'SQUARE YARDS' },
    ],
  },
  {
    category: 'Volume',
    units: [
      { name: 'Liters', shortName: 'LTR', uqcCode: 'LTR', uqcDescription: 'LITERS' },
      { name: 'Milliliters', shortName: 'MLT', uqcCode: 'MLT', uqcDescription: 'MILLILITERS' },
      { name: 'Cubic Meters', shortName: 'CBM', uqcCode: 'CBM', uqcDescription: 'CUBIC METERS' },
      { name: 'US Gallons', shortName: 'UGN', uqcCode: 'UGN', uqcDescription: 'US GALLONS' },
    ],
  },
  {
    category: 'Packaging',
    units: [
      { name: 'Boxes', shortName: 'BOX', uqcCode: 'BOX', uqcDescription: 'BOX' },
      { name: 'Cartons', shortName: 'CTN', uqcCode: 'CTN', uqcDescription: 'CARTONS' },
      { name: 'Packs', shortName: 'PAC', uqcCode: 'PAC', uqcDescription: 'PACKS' },
      { name: 'Bags', shortName: 'BAG', uqcCode: 'BAG', uqcDescription: 'BAGS' },
      { name: 'Bales', shortName: 'BAL', uqcCode: 'BAL', uqcDescription: 'BALE' },
      { name: 'Bundles', shortName: 'BDL', uqcCode: 'BDL', uqcDescription: 'BUNDLES' },
    ],
  },
  {
    category: 'Industrial',
    units: [
      { name: 'Rolls', shortName: 'ROL', uqcCode: 'ROL', uqcDescription: 'ROLLS' },
      { name: 'Drums', shortName: 'DRM', uqcCode: 'DRM', uqcDescription: 'DRUM' },
      { name: 'Bottles', shortName: 'BTL', uqcCode: 'BTL', uqcDescription: 'BOTTLES' },
      { name: 'Cans', shortName: 'CAN', uqcCode: 'CAN', uqcDescription: 'CANS' },
      { name: 'Tubs', shortName: 'TUB', uqcCode: 'TUB', uqcDescription: 'TUBS' },
      { name: 'Vials', shortName: 'VIL', uqcCode: 'VIL', uqcDescription: 'VIALS' },
      { name: 'Carats', shortName: 'CRT', uqcCode: 'CRT', uqcDescription: 'CARATS' },
      { name: 'Kilometers', shortName: 'KME', uqcCode: 'KME', uqcDescription: 'KILOMETERS' },
    ],
  },
];

/**
 * Parses the legacy combined UQC string (e.g. "KGS-KILOGRAMS") into structured components.
 * Useful for bridging current database schema with GST portal integration until the database is normalized.
 */
export function parseUqcCode(combinedUqc?: string | null): {
  code: string | null;
  description: string | null;
} {
  if (!combinedUqc) return { code: null, description: null };
  const parts = combinedUqc.split('-');
  return {
    code: parts[0]?.trim() || null,
    description: parts.slice(1).join('-').trim() || null,
  };
}
