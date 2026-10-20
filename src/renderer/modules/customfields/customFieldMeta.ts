import {
  AlignLeft,
  Calculator,
  Calendar,
  CheckSquare,
  Hash,
  ListChecks,
  Paperclip,
  Type,
} from 'lucide-react';
import type { CustomFieldType } from '../../shared/types/models';

export const FIELD_TYPES: { value: CustomFieldType; label: string; icon: typeof Type }[] = [
  { value: 'text', label: 'Short text', icon: Type },
  { value: 'textarea', label: 'Paragraph', icon: AlignLeft },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'select', label: 'Dropdown', icon: ListChecks },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'file', label: 'File upload', icon: Paperclip },
  { value: 'calculated', label: 'Calculated', icon: Calculator },
];

export const TYPE_LABELS = Object.fromEntries(FIELD_TYPES.map((t) => [t.value, t.label])) as Record<
  CustomFieldType,
  string
>;

export const TYPE_ICONS: Record<CustomFieldType, typeof Type> = {
  text: Type,
  textarea: AlignLeft,
  number: Hash,
  date: Calendar,
  select: ListChecks,
  checkbox: CheckSquare,
  file: Paperclip,
  calculated: Calculator,
};
