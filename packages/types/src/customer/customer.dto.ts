// Phase 4.4B Foundation DTO

export interface CustomerDto {
  id: string;
  name: string;
  gstin?: string | null;
  mobile?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  balance: number;
  createdAt: Date;
}

export interface CreateCustomerInput {
  name: string;
  gstin?: string | null;
  mobile?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  balance?: number;
}

export interface UpdateCustomerInput {
  id: string;
  name?: string;
  gstin?: string | null;
  mobile?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  balance?: number;
}

export interface CustomerSearchResultDto {
  id: string;
  name: string;
  mobile?: string | null;
  city?: string | null;
  balance: number;
}
