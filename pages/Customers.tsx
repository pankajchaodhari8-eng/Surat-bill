import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import type { Customer } from '../types';
import Card from '../components/Card';
import { ChevronLeft, ChevronRight, CalendarPlus } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const Customers: React.FC = () => {
    const { customers, setCustomers, memberships } = useAppContext();
    const [showModal, setShowModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState<Omit<Customer, 'id' | 'loyaltyPoints' | 'membershipId' | 'membershipExpiry'>>({
        name: '',
        phone: '',
        isMember: false
    });
    const [currentPage, setCurrentPage] = useState(1);
    const navigate = useNavigate();

    const handleAddCustomer = () => {
        if (!newCustomer.name || !newCustomer.phone) {
            alert('Name and Phone are required.');
            return;
        }
        setCustomers([...customers, { ...newCustomer, id: `CUST-${Date.now()}`, loyaltyPoints: 0 }]);
        setShowModal(false);
        setNewCustomer({ name: '', phone: '', isMember: false });
    };

    const handleBookAppointment = (customerId: string) => {
        navigate('/appointments', { state: { customerToBook: customerId } });
    };

    const paginatedCustomers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        // Sort by name before slicing for consistent order
        return customers
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(startIndex, endIndex);
    }, [customers, currentPage]);

    const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Customer Management</h2>
                <button onClick={() => setShowModal(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                    Add Customer
                </button>
            </div>
            <Card title="All Customers">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b dark:border-gray-600">
                            <tr>
                                <th className="p-2">Name</th>
                                <th className="p-2">Phone</th>
                                <th className="p-2">Membership No.</th>
                                <th className="p-2">Membership Plan</th>
                                <th className="p-2">Loyalty Points</th>
                                <th className="p-2 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedCustomers.map(customer => {
                                const membership = customer.membershipId ? memberships.find(m => m.id === customer.membershipId) : null;
                                return (
                                    <tr key={customer.id} className="border-b dark:border-gray-700">
                                        <td className="p-2">{customer.name}</td>
                                        <td className="p-2">{customer.phone}</td>
                                        <td className="p-2 font-mono text-xs">{customer.membershipNumber || 'N/A'}</td>
                                        <td className="p-2">
                                            {membership ? (
                                              <div className="flex flex-col">
                                                <span className="font-semibold text-teal-600 dark:text-teal-400">{membership.name}</span>
                                                {customer.membershipExpiry && <span className="text-xs text-gray-500">Expires: {new Date(customer.membershipExpiry).toLocaleDateString()}</span>}
                                              </div>
                                            ) : (
                                              <span>{customer.isMember ? 'Legacy Member' : 'No'}</span>
                                            )}
                                        </td>
                                        <td className="p-2">{customer.loyaltyPoints}</td>
                                        <td className="p-2 text-right">
                                            <button
                                                onClick={() => handleBookAppointment(customer.id)}
                                                className="flex items-center justify-center ml-auto px-3 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200 rounded-md hover:bg-teal-200 dark:hover:bg-teal-800 text-sm transition-colors"
                                                aria-label={`Book appointment for ${customer.name}`}
                                            >
                                                <CalendarPlus size={14} className="mr-1.5" />
                                                Book
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                 {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4 pt-4 border-t dark:border-gray-700">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-md bg-gray-200 dark:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-500"
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-md bg-gray-200 dark:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-500"
                                aria-label="Next page"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Add New Customer</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Name" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <input type="text" placeholder="Phone" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <label className="flex items-center">
                                <input type="checkbox" checked={newCustomer.isMember} onChange={(e) => setNewCustomer({ ...newCustomer, isMember: e.target.checked })} className="form-checkbox" />
                                <span className="ml-2">Is Regular Member?</span>
                            </label>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancel</button>
                            <button onClick={handleAddCustomer} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Customers;