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

export function isValidGstin(gstin?: string | null): boolean {
  if (!gstin) return false;
  return GSTIN_REGEX.test(gstin.toUpperCase());
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
