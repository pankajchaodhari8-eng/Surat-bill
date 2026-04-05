import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import Card from '../components/Card';
import {
    LayoutDashboard, FileText, MessageSquare, UserCheck, Banknote, History, Wallet,
    FileClock, UserCog, Send, ChevronLeft, ChevronRight, DollarSign, Users, Package, Calendar, UserPlus, Gift, FileX
} from 'lucide-react';
import type { Invoice, Customer, Employee, Service, Membership } from '../types';

type ReportType = 'daily_summary' | 'billing' | 'enquiry' | 'service_provider' | 'payments' | 'history' | 'balance' | 'advance' | 'attendance' | 'sms_history';

const ITEMS_PER_PAGE = 10;

// --- HELPER & CHILD COMPONENTS ---

const ReportSidebar: React.FC<{ activeReport: ReportType; setActiveReport: (report: ReportType) => void }> = ({ activeReport, setActiveReport }) => {
    const navItems = [
        { id: 'daily_summary', label: 'Daily Summary', icon: LayoutDashboard },
        { id: 'billing', label: 'Billing Reports', icon: FileText },
        { id: 'enquiry', label: 'Enquiry Reports', icon: MessageSquare },
        { id: 'service_provider', label: 'Service Provider', icon: UserCheck },
        { id: 'payments', label: 'Pending Payments', icon: Banknote },
        { id: 'history', label: 'History', icon: History },
        { id: 'balance', label: 'Balance Reports', icon: Wallet },
        { id: 'advance', label: 'Advance Reports', icon: FileClock },
        { id: 'attendance', label: 'Attendance', icon: UserCog },
        { id: 'sms_history', label: 'SMS History', icon: Send },
    ];

    return (
        <Card title="Reports Menu" className="md:col-span-1">
            <nav className="space-y-2">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveReport(item.id as ReportType)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors ${
                            activeReport === item.id
                                ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-200 font-semibold'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                        }`}
                    >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>
        </Card>
    );
};

const ComingSoonPlaceholder: React.FC<{ title: string }> = ({ title }) => (
    <Card title={title}>
        <div className="text-center text-gray-500 py-10">
            <p className="font-semibold">Coming Soon!</p>
            <p className="text-sm">This feature is under development and will be available in a future update.</p>
        </div>
    </Card>
);

const DailySummaryReport: React.FC<{ invoices: Invoice[], appointments: any[], memberships: Membership[] }> = ({ invoices, appointments, memberships }) => {
    const today = new Date().toISOString().split('T')[0];
    const todaysInvoices = invoices.filter(inv => inv.date.startsWith(today));

    const totalCustomers = new Set(todaysInvoices.map(i => i.customerId)).size;
    const totalServices = todaysInvoices.reduce((sum, inv) => sum + inv.items.length, 0);
    const totalBilling = todaysInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalDiscounts = todaysInvoices.reduce((sum, inv) => sum + inv.discount, 0);
    const outstandingBalance = todaysInvoices.filter(i => i.paymentMode === 'credit').reduce((sum, inv) => sum + inv.total, 0);
    const newMemberships = todaysInvoices.flatMap(inv => inv.items).filter(item => memberships.some(m => m.id === item.serviceId)).length;
    
    const paymentsByMode = todaysInvoices.reduce((acc, inv) => {
        acc[inv.paymentMode] = (acc[inv.paymentMode] || 0) + inv.total;
        return acc;
    }, {} as Record<Invoice['paymentMode'], number>);

    return (
        <Card title="Today's Summary">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><Users className="inline-block mr-2 text-blue-500" />Customers Served: <span className="font-bold">{totalCustomers}</span></div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><Package className="inline-block mr-2 text-green-500" />Services Completed: <span className="font-bold">{totalServices}</span></div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><DollarSign className="inline-block mr-2 text-teal-500" />Total Billing: <span className="font-bold">${totalBilling.toFixed(2)}</span></div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><Gift className="inline-block mr-2 text-yellow-500" />Discounts Given: <span className="font-bold">${totalDiscounts.toFixed(2)}</span></div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><FileX className="inline-block mr-2 text-red-500" />Outstanding Balance: <span className="font-bold">${outstandingBalance.toFixed(2)}</span></div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"><UserPlus className="inline-block mr-2 text-indigo-500" />New Memberships Sold: <span className="font-bold">{newMemberships}</span></div>
            </div>
            <div className="mt-6">
                <h4 className="font-semibold mb-2">Payments Received Today:</h4>
                <div className="space-y-2">
                    {Object.entries(paymentsByMode).map(([mode, total]) => (
                        <div key={mode} className="flex justify-between p-2 bg-gray-100 dark:bg-gray-700/50 rounded-md text-sm">
                            <span className="capitalize">{mode}</span>
                            <span className="font-semibold">${(total as number).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
};

const BillingReport: React.FC<{ allInvoices: Invoice[], customers: Customer[], services: Service[], employees: Employee[] }> = ({ allInvoices, customers, services, employees }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({ startDate: '', endDate: '', customerId: 'all', employeeId: 'all' });

    const filteredInvoices = useMemo(() => {
        return allInvoices
            .filter(inv => {
                if (filters.startDate && inv.date < filters.startDate) return false;
                if (filters.endDate && inv.date > `${filters.endDate}T23:59:59`) return false;
                if (filters.customerId !== 'all' && inv.customerId !== filters.customerId) return false;
                if (filters.employeeId !== 'all' && !inv.items.some(item => item.employeeId === filters.employeeId)) return false;
                return true;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allInvoices, filters]);

    const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);

    return (
        <Card title="Billing Reports">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                <select value={filters.customerId} onChange={e => setFilters({...filters, customerId: e.target.value})} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                    <option value="all">All Customers</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={filters.employeeId} onChange={e => setFilters({...filters, employeeId: e.target.value})} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                    <option value="all">All Providers</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr>
                            <th className="p-2">Invoice #</th>
                            <th className="p-2">Date</th>
                            <th className="p-2">Customer</th>
                            <th className="p-2">Provider(s)</th>
                            <th className="p-2">Payment</th>
                            <th className="p-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedInvoices.map(inv => {
                            const employeeNames = [...new Set(inv.items.map(i => i.employeeId)
                                .map(eId => employees.find(e => e.id === eId)?.name)
                                .filter(Boolean))].join(', ');
                            return (
                                <tr key={inv.id}>
                                    <td className="p-2 font-mono text-xs">{inv.id}</td>
                                    <td className="p-2">{new Date(inv.date).toLocaleString()}</td>
                                    <td className="p-2">{inv.customerName}</td>
                                    <td className="p-2">{employeeNames || 'N/A'}</td>
                                    <td className="p-2 capitalize">{inv.paymentMode}</td>
                                    <td className="p-2 text-right font-semibold">${inv.total.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                 <div className="flex justify-between items-center mt-4 pt-4 border-t dark:border-gray-700">
                    <span>Page {currentPage} of {totalPages}</span>
                    <div className="flex space-x-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}><ChevronLeft/></button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}><ChevronRight/></button>
                    </div>
                 </div>
            )}
        </Card>
    );
};

const ServiceProviderReport: React.FC<{ invoices: Invoice[], employees: Employee[] }> = ({ invoices, employees }) => {
    const performanceData = useMemo(() => {
        const data = employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            services: 0,
            revenue: 0,
            commission: 0,
            invoiceIds: new Set<string>()
        }));

        invoices.forEach(inv => {
            inv.items.forEach(item => {
                const empIndex = data.findIndex(e => e.id === item.employeeId);
                if (empIndex !== -1) {
                    const employee = employees[empIndex];
                    data[empIndex].services++;
                    data[empIndex].revenue += item.price;
                    data[empIndex].invoiceIds.add(inv.id);
                    if (employee.employmentType === 'commission' && typeof employee.commissionRate === 'number') {
                        data[empIndex].commission += item.price * employee.commissionRate;
                    }
                }
            });
        });

        return data
            .map(d => ({ ...d, avgBillValue: d.invoiceIds.size > 0 ? d.revenue / d.invoiceIds.size : 0 }))
            .sort((a,b) => b.revenue - a.revenue);

    }, [invoices, employees]);

    return (
        <Card title="Service Provider Report">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead><tr><th className="p-2">Provider</th><th className="p-2">Services</th><th className="p-2">Revenue</th><th className="p-2">Avg. Bill</th><th className="p-2">Commission</th></tr></thead>
                    <tbody>
                        {performanceData.map(p => (
                            <tr key={p.id}>
                                <td className="p-2 font-semibold">{p.name}</td>
                                <td className="p-2">{p.services}</td>
                                <td className="p-2">${p.revenue.toFixed(2)}</td>
                                <td className="p-2">${p.avgBillValue.toFixed(2)}</td>
                                <td className="p-2">${p.commission.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const PendingPaymentsReport: React.FC<{ invoices: Invoice[], customers: Customer[] }> = ({ invoices, customers }) => {
    const pendingInvoices = invoices
        .filter(inv => inv.paymentMode === 'credit')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Card title="Received & Pending Payments">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead><tr><th className="p-2">Customer</th><th className="p-2">Invoice #</th><th className="p-2">Date</th><th className="p-2 text-right">Balance Pending</th></tr></thead>
                    <tbody>
                        {pendingInvoices.length > 0 ? pendingInvoices.map(inv => (
                             <tr key={inv.id}>
                                <td className="p-2">{inv.customerName}</td>
                                <td className="p-2 font-mono text-xs">{inv.id}</td>
                                <td className="p-2">{new Date(inv.date).toLocaleDateString()}</td>
                                <td className="p-2 text-right font-bold text-red-500">${inv.total.toFixed(2)}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="text-center p-4 text-gray-500">No pending payments.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

// --- MAIN COMPONENT ---
const Reports: React.FC = () => {
    const { invoices, customers, services, employees, appointments, memberships } = useAppContext();
    const [activeReport, setActiveReport] = useState<ReportType>('daily_summary');

    const renderReportContent = () => {
        switch (activeReport) {
            case 'daily_summary':
                return <DailySummaryReport invoices={invoices} appointments={appointments} memberships={memberships} />;
            case 'billing':
                return <BillingReport allInvoices={invoices} customers={customers} services={services} employees={employees} />;
            case 'service_provider':
                return <ServiceProviderReport invoices={invoices} employees={employees} />;
            case 'payments':
                return <PendingPaymentsReport invoices={invoices} customers={customers} />;
            case 'enquiry':
                return <ComingSoonPlaceholder title="Enquiry Reports" />;
            case 'history':
                return <ComingSoonPlaceholder title="History" />;
            case 'balance':
                return <ComingSoonPlaceholder title="Balance Reports" />;
            case 'advance':
                return <ComingSoonPlaceholder title="Advance Reports" />;
            case 'attendance':
                return <ComingSoonPlaceholder title="Attendance Report" />;
            case 'sms_history':
                return <ComingSoonPlaceholder title="SMS History" />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Spa Reports Module</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                <ReportSidebar activeReport={activeReport} setActiveReport={setActiveReport} />
                <div className="md:col-span-3">
                    {renderReportContent()}
                </div>
            </div>
        </div>
    );
};

export default Reports;
