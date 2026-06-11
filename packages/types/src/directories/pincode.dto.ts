export interface PincodeDTO {
  id: number;
  pincode: string;
  officeName: string | null;
  district: string | null;
  stateName: string | null;
  regionName: string | null;
  divisionName: string | null;
  officeType: string | null;
  deliveryStatus: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string | null;
}

export interface PincodeSearchResponse {
  data: PincodeDTO[];
  total: number;
}

export interface PincodeDynamicCacheDTO {
  id: number;
  pincode: string;
  officeName: string | null;
  district: string | null;
  stateName: string | null;
  regionName: string | null;
  divisionName: string | null;
  source: 'MASTER' | 'API' | 'MANUAL';
  lookupCount: number;
  lastUsedAt: string | null;
  lastVerifiedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PostalApiPostOfficeDTO {
  Name: string;
  Description: string | null;
  BranchType: string;
  DeliveryStatus: 'Delivery' | 'Non-Delivery' | string;
  Circle: string;
  District: string;
  Division: string;
  Region: string;
  Block: string;
  State: string;
  Country: string;
  Pincode: string;
}

export interface PostalApiResponseDTO {
  Message: string;
  Status: 'Success' | 'Error' | string;
  PostOffice: PostalApiPostOfficeDTO[] | null;
}

export interface SmartPincodeLookupResponse {
  pincode: string;
  offices: PincodeDTO[];
  source: 'MASTER' | 'API' | 'CACHE' | 'NOT_FOUND';
  error?: string;
}
