import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { Membership } from '../types';
import Card from '../components/Card';
import { Star, CheckCircle, Plus } from 'lucide-react';

const Memberships: React.FC = () => {
    const { memberships, setMemberships } = useAppContext();
    const [showModal, setShowModal] = useState(false);
    const [newMembership, setNewMembership] = useState<Omit<Membership, 'id'>>({
        name: '',
        price: 0,
        durationMonths: 1,
        benefits: [],
    });
    const [benefitsText, setBenefitsText] = useState('');

    const handleAddMembership = () => {
        if (!newMembership.name || newMembership.price <= 0 || newMembership.durationMonths <= 0) {
            alert('Valid Name, Price, and Duration are required.');
            return;
        }
        
        const benefitsArray = benefitsText.split('\n').filter(b => b.trim() !== '');
        if (benefitsArray.length === 0) {
            alert('Please add at least one benefit.');
            return;
        }

        const membershipToAdd: Membership = {
            ...newMembership,
            id: `MEM-${Date.now()}`,
            benefits: benefitsArray
        };
        
        setMemberships([...memberships, membershipToAdd]);
        setShowModal(false);
        setNewMembership({ name: '', price: 0, durationMonths: 1, benefits: [] });
        setBenefitsText('');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Membership Plans</h2>
                <button onClick={() => setShowModal(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center space-x-2">
                    <Plus size={20} />
                    <span>Add New Plan</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {memberships.map(plan => (
                    <Card key={plan.id} title={plan.name} icon={<Star className="text-yellow-500" />}>
                        <div className="flex flex-col h-full">
                            <p className="text-3xl font-bold text-teal-500 mb-4">
                                ${plan.price}<span className="text-base font-normal text-gray-500"> / {plan.durationMonths} mo</span>
                            </p>
                            <ul className="space-y-2 text-sm flex-grow">
                                {plan.benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-start">
                                        <CheckCircle size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Card>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Add New Membership Plan</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Plan Name</label>
                                <input type="text" placeholder="e.g., Gold Serenity" value={newMembership.name} onChange={(e) => setNewMembership({ ...newMembership, name: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price ($)</label>
                                    <input type="number" placeholder="e.g., 50" value={newMembership.price || ''} onChange={(e) => setNewMembership({ ...newMembership, price: parseFloat(e.target.value) || 0 })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Duration (Months)</label>
                                    <input type="number" placeholder="e.g., 1" value={newMembership.durationMonths || ''} onChange={(e) => setNewMembership({ ...newMembership, durationMonths: parseInt(e.target.value, 10) || 1 })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Benefits (one per line)</label>
                                <textarea 
                                    placeholder="- 10% off all services&#10;- Priority booking"
                                    value={benefitsText}
                                    onChange={(e) => setBenefitsText(e.target.value)}
                                    rows={4}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancel</button>
                            <button onClick={handleAddMembership} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Save Plan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Memberships;