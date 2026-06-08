export interface UqcDto {
  id: number;
  gstUqcCode: string;
  displayName: string;
  uqcDescription: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}
