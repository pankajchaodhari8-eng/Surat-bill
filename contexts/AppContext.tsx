import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Customer, Service, Employee, Invoice, Appointment, Expense, AppSettings, Membership, MembershipUsage, User, Role, Permission } from '../types';
import { ALL_PERMISSIONS } from '../types';

interface AppContextType {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  memberships: Membership[];
  setMemberships: React.Dispatch<React.SetStateAction<Membership[]>>;
  membershipUsages: MembershipUsage[];
  setMembershipUsages: React.Dispatch<React.SetStateAction<MembershipUsage[]>>;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Invoice;
  addCustomer: (customer: Omit<Customer, 'id' | 'loyaltyPoints'>) => Customer;
  addMembershipUsage: (usage: Omit<MembershipUsage, 'id'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialAdminRole: Role = {
    id: 'ROLE-ADMIN',
    name: 'Administrator',
    permissions: Object.keys(ALL_PERMISSIONS) as Permission[],
};

const initialStaffRole: Role = {
    id: 'ROLE-STAFF',
    name: 'Staff',
    permissions: [
        'billing:create',
        'appointments:manage',
        'customers:manage',
        'services:manage',
        'memberships:manage',
        'expenses:manage',
    ],
};

// Fix: Add an interface for initialData to ensure correct type inference for string literal union types.
interface InitialDataType {
  customers: Customer[];
  services: Service[];
  employees: Employee[];
  users: User[];
  roles: Role[];
  invoices: Invoice[];
  appointments: Appointment[];
  expenses: Expense[];
  settings: AppSettings;
  memberships: Membership[];
  membershipUsages: MembershipUsage[];
}

const initialData: InitialDataType = {
    customers: [
        { id: 'CUST-001', name: 'Alice Johnson', phone: '555-0101', loyaltyPoints: 150, isMember: true, membershipId: 'MEM-001', membershipExpiry: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(), membershipNumber: 'ZNTH-001' },
        { id: 'CUST-002', name: 'Bob Smith', phone: '555-0102', loyaltyPoints: 75, isMember: false },
    ],
    services: [
        { id: 'SERV-001', name: 'Swedish Massage (60 min)', price: 80, type: 'service', category: 'Massage', isActive: true },
        { id: 'SERV-002', name: 'Deep Tissue Massage (60 min)', price: 95, type: 'service', category: 'Massage', isActive: false },
        { id: 'SERV-003', name: 'Aromatherapy Facial', price: 70, type: 'service', category: 'Facial', isActive: true },
        { id: 'PROD-001', name: 'Organic Lavender Oil', price: 25, type: 'product', stock: 50, category: 'Retail', isActive: true },
        { id: 'PACK-001', name: 'Relaxation Package', price: 140, type: 'package', packageItems: ['SERV-001', 'PROD-001'], category: 'Packages', isActive: true },
    ],
    employees: [
        { id: 'EMP-001', name: 'Clara Oswald', employmentType: 'commission', commissionRate: 0.20 },
        { id: 'EMP-002', name: 'Dan Lewis', employmentType: 'salaried', salary: 3500 },
    ],
    users: [
        { id: 'USER-001', name: 'Admin User', email: 'admin@zenith.com', passwordHash: 'hashed_password_admin', roleId: 'ROLE-ADMIN', isActive: true },
        { id: 'USER-002', name: 'Staff User', email: 'staff@zenith.com', passwordHash: 'hashed_password_staff', roleId: 'ROLE-STAFF', isActive: true },
        { id: 'USER-003', name: 'Inactive Staff', email: 'inactive@zenith.com', passwordHash: 'hashed_password_inactive', roleId: 'ROLE-STAFF', isActive: false },
    ],
    roles: [initialAdminRole, initialStaffRole],
    memberships: [
        { id: 'MEM-001', name: 'Silver Wellness', price: 50, durationMonths: 1, benefits: ['10% off all services', 'Priority booking', '1 free sauna session per month'] },
        { id: 'MEM-002', name: 'Gold Serenity', price: 120, durationMonths: 3, benefits: ['15% off all services & products', 'Unlimited sauna access', '1 complimentary massage per month'] },
        { id: 'MEM-003', name: 'Platinum Oasis', price: 450, durationMonths: 12, benefits: ['20% off everything', 'Unlimited sauna & steam room', '2 complimentary massages per month', 'Guest pass eligibility'] },
    ],
    membershipUsages: [
      { id: 'MU-001', customerId: 'CUST-001', date: new Date().toISOString(), serviceDescription: 'Monthly free sauna session', therapistId: 'EMP-002', room: '3', durationHours: 1 },
    ],
    invoices: [],
    appointments: [
        { 
            id: 'APT-AUTO-001', 
            customerId: 'CUST-001',
            serviceId: 'SERV-001',
            employeeId: 'EMP-001',
            date: new Date().toISOString().split('T')[0],
            time: '15:00', 
            status: 'scheduled',
            notes: 'Automatically added appointment.'
        }
    ],
    expenses: [
        { id: 'EXP-001', description: 'Monthly rent for premises', payee: 'City Properties Inc.', amount: 2500, date: new Date().toISOString(), category: 'Rent' },
        { id: 'EXP-002', description: 'Restock of essential oils', payee: 'Spa Essentials Co.', amount: 500, date: new Date().toISOString(), category: 'Supplies' }
    ],
    settings: {
        companyName: 'Zenith Spa & Wellness',
        companyAddress: '123 Serenity Lane, Suite 100, Tranquility City, 12345',
        companyPhone: '555-123-4567',
        taxInfo: 'VAT ID: 987654321',
        vatRate: 5, // 5%
        upiId: 'sequence@okaxis',
        merchantName: 'Zenith Spa',
        thermalPrintSettings: {
            printTerms: true,
            printCompanyDetails: true,
            printItemDescription: false,
            printTaxableAmount: true,
            showHSN: false,
            showCashReceived: true,
            companyLogo: null,
            showGoogleReviewsQR: false,
            showPaymentQR: true,
            showDynamicUPIQR: true,
            orgNameFontSize: 24,
            companyNameFontSize: 18,
            selectedPrinter: 'thermal_80mm',
            notes: 'Thank you for your visit! We hope to see you again soon.'
        }
    }
}


export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>(() => {
      const saved = localStorage.getItem('customers');
      return saved ? JSON.parse(saved) : initialData.customers;
  });
  const [services, setServices] = useState<Service[]>(() => {
      const saved = localStorage.getItem('services');
      if (saved) {
          const parsedServices = JSON.parse(saved) as Service[];
          // For backward compatibility, add stock property to products if it doesn't exist
          return parsedServices.map(s => ({
              ...s,
              stock: s.type === 'product' && s.stock === undefined ? 0 : s.stock,
              isActive: s.isActive === undefined ? true : s.isActive,
          }));
      }
      return initialData.services;
  });
  const [employees, setEmployees] = useState<Employee[]>(() => {
      const saved = localStorage.getItem('employees');
      return saved ? JSON.parse(saved) : initialData.employees;
  });
  const [users, setUsers] = useState<User[]>(() => {
      const saved = localStorage.getItem('users');
      if (saved) {
        const parsedUsers = JSON.parse(saved);
        // Migration from old `role` string to `roleId`
        if (parsedUsers.length > 0 && parsedUsers[0].role) {
            return parsedUsers.map((user: any) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                passwordHash: user.passwordHash,
                isActive: user.isActive,
                roleId: user.role === 'admin' ? 'ROLE-ADMIN' : 'ROLE-STAFF',
            }));
        }
        return parsedUsers;
    }
      return initialData.users;
  });
   const [roles, setRoles] = useState<Role[]>(() => {
      const saved = localStorage.getItem('roles');
      return saved ? JSON.parse(saved) : initialData.roles;
  });
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
      const saved = localStorage.getItem('invoices');
      return saved ? JSON.parse(saved) : initialData.invoices;
  });
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
      const saved = localStorage.getItem('appointments');
      return saved ? JSON.parse(saved) : initialData.appointments;
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('expenses');
    if (saved) return JSON.parse(saved);

    // Migration from old `supplierPayments`
    const oldSaved = localStorage.getItem('supplierPayments');
    if (oldSaved) {
        const oldPayments: {id: string, supplierName: string, amount: number, date: string}[] = JSON.parse(oldSaved);
        const migratedExpenses: Expense[] = oldPayments.map(p => ({
            id: p.id.replace('SUP-PAY', 'EXP'),
            description: `Payment to ${p.supplierName}`,
            payee: p.supplierName,
            amount: p.amount,
            date: p.date,
            category: 'Supplies' // Default category for migration
        }));
        localStorage.setItem('expenses', JSON.stringify(migratedExpenses));
        localStorage.removeItem('supplierPayments');
        return migratedExpenses;
    }

    return initialData.expenses;
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('settings');
     if (saved) {
        const parsed = JSON.parse(saved);
        // Deep merge for backward compatibility, ensuring new fields from initialData are added if they don't exist in storage.
        const mergedSettings = {
            ...initialData.settings,
            ...parsed,
            thermalPrintSettings: {
                ...initialData.settings.thermalPrintSettings,
                ...(parsed.thermalPrintSettings || {}),
            }
        };
        
        // Migration for selectedPrinter after merging
        const currentPrinter = mergedSettings.thermalPrintSettings.selectedPrinter;
        if (!['thermal_80mm', 'standard_a4'].includes(currentPrinter)) {
            mergedSettings.thermalPrintSettings.selectedPrinter = 'thermal_80mm';
        }

        return mergedSettings;
    }
    return initialData.settings;
  });
  const [memberships, setMemberships] = useState<Membership[]>(() => {
      const saved = localStorage.getItem('memberships');
      return saved ? JSON.parse(saved) : initialData.memberships;
  });
  const [membershipUsages, setMembershipUsages] = useState<MembershipUsage[]>(() => {
    const saved = localStorage.getItem('membershipUsages');
    return saved ? JSON.parse(saved) : initialData.membershipUsages;
  });

  useEffect(() => { localStorage.setItem('customers', JSON.stringify(customers)) }, [customers]);
  useEffect(() => { localStorage.setItem('services', JSON.stringify(services)) }, [services]);
  useEffect(() => { localStorage.setItem('employees', JSON.stringify(employees)) }, [employees]);
  useEffect(() => { localStorage.setItem('users', JSON.stringify(users)) }, [users]);
  useEffect(() => { localStorage.setItem('roles', JSON.stringify(roles)) }, [roles]);
  useEffect(() => { localStorage.setItem('invoices', JSON.stringify(invoices)) }, [invoices]);
  useEffect(() => { localStorage.setItem('appointments', JSON.stringify(appointments)) }, [appointments]);
  useEffect(() => { localStorage.setItem('expenses', JSON.stringify(expenses)) }, [expenses]);
  useEffect(() => { localStorage.setItem('settings', JSON.stringify(settings))}, [settings]);
  useEffect(() => { localStorage.setItem('memberships', JSON.stringify(memberships)) }, [memberships]);
  useEffect(() => { localStorage.setItem('membershipUsages', JSON.stringify(membershipUsages)) }, [membershipUsages]);


  const addInvoice = (invoice: Omit<Invoice, 'id'>): Invoice => {
    const newInvoice = { ...invoice, id: `INV-${Date.now()}` };
    setInvoices(prev => [...prev, newInvoice]);
    
    // Decrement stock for products sold, including those in packages
    setServices(currentServices => {
        const servicesToUpdate = new Map<string, number>(); // serviceId -> quantity sold
        
        newInvoice.items.forEach(item => {
            const service = currentServices.find(s => s.id === item.serviceId);
            if (!service) return;

            if (service.type === 'product') {
                servicesToUpdate.set(item.serviceId, (servicesToUpdate.get(item.serviceId) || 0) + 1);
            } else if (service.type === 'package' && service.packageItems) {
                service.packageItems.forEach(packageItemId => {
                    const packageItemService = currentServices.find(s => s.id === packageItemId);
                    if (packageItemService && packageItemService.type === 'product') {
                         servicesToUpdate.set(packageItemId, (servicesToUpdate.get(packageItemId) || 0) + 1);
                    }
                });
            }
        });

        if (servicesToUpdate.size === 0) return currentServices;

        return currentServices.map(service => {
            if (servicesToUpdate.has(service.id) && service.stock !== undefined) {
                const newStock = service.stock - (servicesToUpdate.get(service.id) || 0);
                return { ...service, stock: newStock >= 0 ? newStock : 0 };
            }
            return service;
        });
    });

    return newInvoice;
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'loyaltyPoints'>): Customer => {
    const newCustomer = { ...customer, id: `CUST-${Date.now()}`, loyaltyPoints: 0 };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  const addMembershipUsage = (usage: Omit<MembershipUsage, 'id'>) => {
    const newUsage = { ...usage, id: `MU-${Date.now()}` };
    setMembershipUsages(prev => [...prev, newUsage]);
  };
  
  const value = {
    customers, setCustomers,
    services, setServices,
    employees, setEmployees,
    users, setUsers,
    roles, setRoles,
    invoices, setInvoices,
    appointments, setAppointments,
    expenses, setExpenses,
    settings, setSettings,
    memberships, setMemberships,
    membershipUsages, setMembershipUsages,
    addInvoice,
    addCustomer,
    addMembershipUsage,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};