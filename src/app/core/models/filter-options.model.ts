export interface FilterCategoryOption {
  id: number;
  name: string;
}

export interface FilterUserOption {
  id: number;
  fullName: string;
}

export interface FilterOptionsResponse {
  categories: FilterCategoryOption[];
  users: FilterUserOption[] | null;
}
