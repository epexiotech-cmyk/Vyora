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
