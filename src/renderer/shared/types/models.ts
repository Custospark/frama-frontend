export type UserRole = 'manager' | 'executive' | 'platform_admin';

export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'file'
  | 'calculated';

export type CustomFieldScope = 'asset' | 'report';

export interface CustomFieldOption {
  value: string;
  label: string;
}

export interface CustomFieldValidation {
  min?: number;
  max?: number;
  max_length?: number;
  max_file_kb?: number;
  accept?: string;
  formula?: string;
  precision?: number;
}

export interface BusinessType {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  assets_count?: number;
  custom_fields_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CustomField {
  id: number;
  scope: CustomFieldScope;
  business_type_id: number | null;
  business_type?: { id: number; name: string; slug: string } | null;
  branch_id: number | null;
  key: string;
  label: string;
  type: CustomFieldType;
  type_label: string;
  help_text: string | null;
  placeholder: string | null;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  options: CustomFieldOption[];
  validation: CustomFieldValidation;
}

export type CustomValues = Record<string, string | number | boolean | null>;

export interface AuthUser {
  id: number;
  name: string;
  email: string | null;
  access_code: string | null;
  role: UserRole;
  branch_id: number | null;
  is_active: boolean;
  last_login_at: string | null;
  branch?: Branch | null;
}

export interface Branch {
  id: number;
  branch_name: string;
  code: string;
  slug: string | null;
  business_type_id: number | null;
  business_type?: { id: number; name: string; slug: string | null } | null;
  manager_name: string | null;
  phone: string | null;
  is_active: boolean;
  assets_count?: number;
  created_at?: string;
}

export interface Asset {
  id: number;
  branch_id: number;
  business_type_id: number | null;
  business_type?: { id: number; name: string; slug: string; icon: string | null } | null;
  name: string;
  unit_price: number | null;
  is_active: boolean;
  custom_values?: CustomValues;
  created_at?: string;
}

export interface Report {
  id: number;
  branch_id: number;
  branch_name?: string;
  branch_code?: string;
  report_date: string;
  rooms_rev: number;
  bar_rev: number;
  food_rev: number;
  sauna_rev: number;
  total_rev: number;
  expenses: number;
  cash_handed_over: number;
  comment: string | null;
  business_type_ids: number[];
  business_types?: { id: number; name: string; slug: string | null }[];
  attachments?: ReportAttachment[];
  attachments_count?: number;
  downloads_all_url?: string;
  manager_name: string | null;
  status: 'Submitted' | 'Pending';
  submitted_at: string | null;
  custom_values?: CustomValues;
  created_at?: string;
}

export interface ReportAttachment {
  id: number;
  original_name: string;
  url: string;
  download_url: string;
  mime_type: string | null;
  size: number;
  is_archive: boolean;
  is_image: boolean;
}

export interface DashboardRow {
  branch_id: number;
  branch_name: string;
  branch_code: string;
  date: string;
  rooms_rev: number;
  bar_rev: number;
  food_rev: number;
  sauna_rev: number;
  total_rev: number;
  expenses: number;
  net_rev: number;
  cash_handed_over: number;
  comment: string | null;
  manager_name: string | null;
  attachments_count: number;
  first_attachment_url: string | null;
  first_attachment_is_image: boolean;
  attachments?: ReportAttachment[];
  report_id: number | null;
  status: 'Submitted' | 'Pending';
  submitted_at: string | null;
  custom_values?: CustomValues;
}

export interface DashboardCustomFieldMeta {
  key: string;
  label: string;
  type: CustomFieldType;
  business_type_id: number | null;
  business_type: string | null;
  aggregate: boolean;
}

export interface DashboardSummary {
  date: string;
  rows: DashboardRow[];
  grand_total: number;
  submitted_count: number;
  pending_count: number;
  custom_fields?: DashboardCustomFieldMeta[];
  custom_grand_totals?: Record<string, number>;
}

export interface TrendPoint {
  date: string;
  total: number;
}

export interface Paginated<T> {
  data: T[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/** Public, read-only branch summary served by `GET /share/branch/{token}`. */
export interface PublicBranchSummary {
  branch: {
    id: number;
    branch_name: string;
    slug: string | null;
    manager_name: string | null;
  };
  today: PublicBranchReport | null;
  recent: PublicBranchReport[];
  trend: TrendPoint[];
  month_total: number;
  submitted_this_month: number;
  generated_at: string;
}

export interface PublicBranchReport {
  report_date: string;
  rooms_rev: number;
  bar_rev: number;
  food_rev: number;
  sauna_rev: number;
  total_rev: number;
  manager_name: string | null;
  submitted_at: string | null;
}
