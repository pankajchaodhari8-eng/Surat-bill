export const ALL_PERMISSIONS = {
  'billing:create': 'Create and manage bills',
  'appointments:manage': 'Manage all appointments',
  'customers:manage': 'Manage customer data',
  'services:manage': 'Manage services and products',
  'employees:manage': 'Manage employee data',
  'memberships:manage': 'Manage membership plans & usage',
  'expenses:manage': 'Manage expenses',
  'reports:view': 'View all business reports',
  'settings:manage': 'Access and modify system settings',
  'users:manage': 'Manage users and roles',
  'ai_studio:use': 'Access the AI Studio features',
} as const;

export type Permission = keyof typeof ALL_PERMISSIONS;

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface Service {
  id: string;
  name: string;
  price: number;
  type: 'service' | 'product' | 'package';
  category?: string;
  stock?: number;
  packageItems?: string[]; // Array of service/product IDs for packages
  isActive: boolean;
}

export interface Employee {
  id:string;
  name: string;
  employmentType: 'commission' | 'salaried';
  commissionRate?: number; // e.g., 0.1 for 10%
  salary?: number; // e.g., 3000 for $3000/month
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // This would be a proper hash in a real backend
  roleId: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  loyaltyPoints: number;
  isMember: boolean;
  membershipId?: string; // ID of the purchased membership
  membershipExpiry?: string; // ISO string
  membershipNumber?: string;
}

export interface Membership {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  benefits: string[];
}

export interface MembershipUsage {
  id: string;
  customerId: string;
  date: string; // ISO string
  serviceDescription: string;
  therapistId: string;
  room: string;
  durationHours: number;
}

export interface InvoiceItem {
  serviceId: string;
  employeeId: string;
  price: number; // Price at the time of sale
}

export interface Invoice {
  id: string;
  customerId: string | null; // null for guest customers
  customerName: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  date: string; // ISO string
  paymentMode: 'cash' | 'card' | 'upi' | 'credit' | 'wallet';
}

export interface Appointment {
  id: string;
  customerId: string;
  serviceId: string;
  employeeId: string;
  date: string; // ISO string
  time: string; // e.g., "14:30"
  recurrenceId?: string; // ID to group recurring appointments
  status: 'scheduled' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';
  notes: string;
}

export interface Expense {
    id: string;
    description: string;
    payee: string; // e.g. 'Spa Essentials Co.', 'Landlord'
    amount: number;
    date: string; // ISO string
    category: 'Supplies' | 'Rent' | 'Utilities' | 'Marketing' | 'Salaries' | 'Other';
}

export interface ThermalPrintSettings {
    printTerms: boolean;
    printCompanyDetails: boolean;
    printItemDescription: boolean;
    printTaxableAmount: boolean;
    showHSN: boolean;
    showCashReceived: boolean;
    companyLogo: string | null; // Base64 string
    showGoogleReviewsQR: boolean;
    showPaymentQR: boolean;
    showDynamicUPIQR: boolean;
    orgNameFontSize: number;
    companyNameFontSize: number;
    selectedPrinter: 'thermal_80mm' | 'standard_a4';
    notes: string;
}

export interface AppSettings {
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    taxInfo: string; // e.g., VAT ID, GSTIN
    vatRate: number; // Percentage
    upiId: string;
    merchantName: string;
    thermalPrintSettings: ThermalPrintSettings;
}