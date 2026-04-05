import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { MembershipUsage, Customer } from '../types';
import Card from '../components/Card';
import { Plus, X } from 'lucide-react';

const initialFormState: Omit<MembershipUsage, 'id'> = {
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    serviceDescription: '',
    therapistId: '',
    room: '',
    durationHours: 1,
};

const MembershipActivity: React.FC = () => {
    const { membershipUsages, addMembershipUsage, customers, employees } = useAppContext();
    const [showModal, setShowModal] = useState(false);
    const [newUsage, setNewUsage] = useState<Omit<MembershipUsage, 'id'>>(initialFormState);
    const [customerSearch, setCustomerSearch] = useState('');

    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) return [];
        const searchLower = customerSearch.toLowerCase();
        // Show only members
        return customers.filter(c =>
            c.isMember && (c.name.toLowerCase().includes(searchLower) || c.phone.includes(customerSearch))
        );
    }, [customerSearch, customers]);
    
    const handleSelectCustomer = (customer: Customer) => {
        setNewUsage({ ...newUsage, customerId: customer.id });
        setCustomerSearch('');
    };

    const handleClearCustomer = () => {
        setNewUsage({ ...newUsage, customerId: '' });
    };

    const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomerSearch(e.target.value);
    };

    const handleAddUsage = () => {
        if (!newUsage.customerId || !newUsage.serviceDescription || !newUsage.therapistId || !newUsage.room) {
            alert('Please fill all fields.');
            return;
        }
        if (newUsage.durationHours <= 0) {
            alert('Duration must be a positive number.');
            return;
        }
        addMembershipUsage(newUsage);
        setShowModal(false);
        setNewUsage(initialFormState);
    };

    const sortedUsages = [...membershipUsages].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Membership Benefit Usage</h2>
                <button onClick={() => setShowModal(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center space-x-2">
                    <Plus size={20} />
                    <span>Log Benefit Usage</span>
                </button>
            </div>
            <Card title="Usage History">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b dark:border-gray-600">
                            <tr>
                                <th className="p-2">Date</th>
                                <th className="p-2">Customer</th>
                                <th className="p-2">Service / Benefit Used</th>
                                <th className="p-2">Therapist</th>
                                <th className="p-2">Room</th>
                                <th className="p-2 text-right">Duration (hrs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedUsages.map(usage => {
                                const customer = customers.find(c => c.id === usage.customerId);
                                const therapist = employees.find(e => e.id === usage.therapistId);
                                return (
                                    <tr key={usage.id} className="border-b dark:border-gray-700">
                                        <td className="p-2">{new Date(usage.date).toLocaleDateString()}</td>
                                        <td className="p-2">{customer?.name || 'N/A'}</td>
                                        <td className="p-2">{usage.serviceDescription}</td>
                                        <td className="p-2">{therapist?.name || 'N/A'}</td>
                                        <td className="p-2">{usage.room}</td>
                                        <td className="p-2 text-right">{usage.durationHours}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                     {sortedUsages.length === 0 && <p className="text-center p-4 text-gray-500">No benefit usage has been logged yet.</p>}
                </div>
            </Card>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg shadow-xl">
                        <h3 className="text-xl font-bold mb-4">Log New Benefit Usage</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Customer</label>
                                {newUsage.customerId ? (
                                    <div className="flex items-center justify-between w-full p-2 bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 rounded-md">
                                        <span>{customers.find(c => c.id === newUsage.customerId)?.name}</span>
                                        <button type="button" onClick={handleClearCustomer} className="text-red-500 hover:text-red-700" aria-label="Clear customer selection">
                                            <X size={16}/>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative w-full">
                                        <input
                                            type="text"
                                            placeholder="Search member by name or phone..."
                                            value={customerSearch}
                                            onChange={handleCustomerSearchChange}
                                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        {filteredCustomers.length > 0 && (
                                            <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border dark:border-gray-600 rounded shadow-lg max-h-40 overflow-y-auto">
                                                {filteredCustomers.map(c => (
                                                    <li
                                                        key={c.id}
                                                        onClick={() => handleSelectCustomer(c)}
                                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                    >
                                                        {c.name} <span className="text-sm text-gray-500">({c.membershipNumber})</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Service / Benefit Description</label>
                                <input type="text" placeholder="e.g., Complimentary monthly massage" value={newUsage.serviceDescription} onChange={(e) => setNewUsage({ ...newUsage, serviceDescription: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium mb-1">Therapist</label>
                                <select value={newUsage.therapistId} onChange={(e) => setNewUsage({ ...newUsage, therapistId: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                    <option value="">Select Therapist</option>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                             <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date</label>
                                    <input type="date" value={newUsage.date} onChange={(e) => setNewUsage({ ...newUsage, date: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Room No.</label>
                                    <input type="text" placeholder="e.g., 5B" value={newUsage.room} onChange={(e) => setNewUsage({ ...newUsage, room: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Duration (hrs)</label>
                                    <input type="number" step="0.5" min="0" placeholder="e.g., 1.5" value={newUsage.durationHours || ''} onChange={(e) => setNewUsage({ ...newUsage, durationHours: parseFloat(e.target.value) || 0 })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancel</button>
                            <button onClick={handleAddUsage} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Save Log</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembershipActivity;