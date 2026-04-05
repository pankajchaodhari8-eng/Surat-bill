import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { Expense } from '../types';
import Card from '../components/Card';
import { Plus } from 'lucide-react';

const expenseCategories: Expense['category'][] = ['Supplies', 'Rent', 'Utilities', 'Marketing', 'Salaries', 'Other'];

const initialFormState: Omit<Expense, 'id'> = {
    description: '',
    payee: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: 'Other'
};

const Expenses: React.FC = () => {
    const { expenses, setExpenses } = useAppContext();
    const [showModal, setShowModal] = useState(false);
    const [newExpense, setNewExpense] = useState<Omit<Expense, 'id'>>(initialFormState);

    const handleAddExpense = () => {
        if (!newExpense.description || newExpense.amount <= 0) {
            alert('A valid description and positive amount are required.');
            return;
        }
        setExpenses(prev => [...prev, { ...newExpense, id: `EXP-${Date.now()}` }]);
        setShowModal(false);
        setNewExpense(initialFormState);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Expense Management</h2>
                <button onClick={() => setShowModal(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center space-x-2">
                    <Plus size={20} />
                    <span>Add Expense</span>
                </button>
            </div>
            <Card title="All Expenses">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b dark:border-gray-600">
                            <tr>
                                <th className="p-2">Date</th>
                                <th className="p-2">Description</th>
                                <th className="p-2">Payee</th>
                                <th className="p-2">Category</th>
                                <th className="p-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                                <tr key={exp.id} className="border-b dark:border-gray-700">
                                    <td className="p-2">{new Date(exp.date).toLocaleDateString()}</td>
                                    <td className="p-2">{exp.description}</td>
                                    <td className="p-2">{exp.payee}</td>
                                    <td className="p-2">{exp.category}</td>
                                    <td className="p-2 text-right font-semibold text-red-500">${exp.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Add New Expense</h3>
                        <div className="space-y-4">
                            <input type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <input type="text" placeholder="Description (e.g., Monthly electricity bill)" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <input type="text" placeholder="Payee (e.g., Power Company)" value={newExpense.payee} onChange={(e) => setNewExpense({ ...newExpense, payee: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <input type="number" placeholder="Amount" value={newExpense.amount || ''} onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as Expense['category'] })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancel</button>
                            <button onClick={handleAddExpense} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Save Expense</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;