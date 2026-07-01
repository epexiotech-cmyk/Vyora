import { randomUUID } from 'crypto';

import { VyoraDatabase } from '../client/db';
import { states } from '../schema/system';

const gstStates = [
  { code: '01', iso: 'IN-JK', name: 'Jammu and Kashmir', isUt: true },
  { code: '02', iso: 'IN-HP', name: 'Himachal Pradesh', isUt: false },
  { code: '03', iso: 'IN-PB', name: 'Punjab', isUt: false },
  { code: '04', iso: 'IN-CH', name: 'Chandigarh', isUt: true },
  { code: '05', iso: 'IN-UT', name: 'Uttarakhand', isUt: false },
  { code: '06', iso: 'IN-HR', name: 'Haryana', isUt: false },
  { code: '07', iso: 'IN-DL', name: 'Delhi', isUt: true },
  { code: '08', iso: 'IN-RJ', name: 'Rajasthan', isUt: false },
  { code: '09', iso: 'IN-UP', name: 'Uttar Pradesh', isUt: false },
  { code: '10', iso: 'IN-BR', name: 'Bihar', isUt: false },
  { code: '11', iso: 'IN-SK', name: 'Sikkim', isUt: false },
  { code: '12', iso: 'IN-AR', name: 'Arunachal Pradesh', isUt: false },
  { code: '13', iso: 'IN-NL', name: 'Nagaland', isUt: false },
  { code: '14', iso: 'IN-MN', name: 'Manipur', isUt: false },
  { code: '15', iso: 'IN-MZ', name: 'Mizoram', isUt: false },
  { code: '16', iso: 'IN-TR', name: 'Tripura', isUt: false },
  { code: '17', iso: 'IN-ML', name: 'Meghalaya', isUt: false },
  { code: '18', iso: 'IN-AS', name: 'Assam', isUt: false },
  { code: '19', iso: 'IN-WB', name: 'West Bengal', isUt: false },
  { code: '20', iso: 'IN-JH', name: 'Jharkhand', isUt: false },
  { code: '21', iso: 'IN-OR', name: 'Odisha', isUt: false },
  { code: '22', iso: 'IN-CT', name: 'Chhattisgarh', isUt: false },
  { code: '23', iso: 'IN-MP', name: 'Madhya Pradesh', isUt: false },
  { code: '24', iso: 'IN-GJ', name: 'Gujarat', isUt: false },
  { code: '25', iso: 'IN-DD', name: 'Daman and Diu', isUt: true },
  { code: '26', iso: 'IN-DN', name: 'Dadra and Nagar Haveli', isUt: true },
  { code: '27', iso: 'IN-MH', name: 'Maharashtra', isUt: false },
  { code: '28', iso: 'IN-AP', name: 'Andhra Pradesh (Old)', isUt: false },
  { code: '29', iso: 'IN-KA', name: 'Karnataka', isUt: false },
  { code: '30', iso: 'IN-GA', name: 'Goa', isUt: false },
  { code: '31', iso: 'IN-LD', name: 'Lakshadweep', isUt: true },
  { code: '32', iso: 'IN-KL', name: 'Kerala', isUt: false },
  { code: '33', iso: 'IN-TN', name: 'Tamil Nadu', isUt: false },
  { code: '34', iso: 'IN-PY', name: 'Puducherry', isUt: true },
  { code: '35', iso: 'IN-AN', name: 'Andaman and Nicobar Islands', isUt: true },
  { code: '36', iso: 'IN-TG', name: 'Telangana', isUt: false },
  { code: '37', iso: 'IN-AP', name: 'Andhra Pradesh', isUt: false },
  { code: '38', iso: 'IN-LA', name: 'Ladakh', isUt: true },
  { code: '97', iso: 'IN-OR', name: 'Other Territory', isUt: true },
];

export const seedGstStates = async (db: VyoraDatabase) => {
  const now = new Date();

  for (const state of gstStates) {
    await db
      .insert(states)
      .values({
        id: randomUUID(),
        gstStateCode: state.code,
        isoCode: state.iso,
        name: state.name,
        isUnionTerritory: state.isUt,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }
};
