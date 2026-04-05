import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { Employee } from '../types';
import Card from '../components/Card';

const Employees: React.FC = () => {
    const { employees, setEmployees } = useAppContext();
    const [showModal, setShowModal] = useState(false);
    const [newEmployee, setNewEmployee] = useState<Omit<Employee, 'id'>>({
        name: '',
        employmentType: 'commission',
        commissionRate: 0.1,
    });

    const handleAddEmployee = () => {
        if (!newEmployee.name) {
            alert('A valid name is required.');
            return;
        }

        const employeeToAdd: Partial<Employee> = {
            name: newEmployee.name,
            employmentType: newEmployee.employmentType,
        };

        if (newEmployee.employmentType === 'commission') {
            if (typeof newEmployee.commissionRate !== 'number' || newEmployee.commissionRate < 0 || newEmployee.commissionRate > 1) {
                alert('Please enter a valid commission rate between 0% and 100%.');
                return;
            }
            employeeToAdd.commissionRate = newEmployee.commissionRate;
        } else {
            if (typeof newEmployee.salary !== 'number' || newEmployee.salary <= 0) {
                alert('Please enter a valid positive salary.');
                return;
            }
            employeeToAdd.salary = newEmployee.salary;
        }

        setEmployees([...employees, { ...employeeToAdd, id: `EMP-${Date.now()}` } as Employee]);
        setShowModal(false);
        setNewEmployee({ name: '', employmentType: 'commission', commissionRate: 0.1 });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Employee Management</h2>
                <button onClick={() => setShowModal(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                    Add Employee
                </button>
            </div>
            <Card title="All Employees">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b dark:border-gray-600">
                            <tr>
                                <th className="p-2">Name</th>
                                <th className="p-2">Type</th>
                                <th className="p-2">Rate / Salary</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => (
                                <tr key={emp.id} className="border-b dark:border-gray-700">
                                    <td className="p-2">{emp.name}</td>
                                    <td className="p-2 capitalize">{emp.employmentType}</td>
                                    <td className="p-2">
                                        {emp.employmentType === 'commission'
                                            ? `${(emp.commissionRate ?? 0) * 100}%`
                                            : `$${emp.salary?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Add New Employee</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Employee Name</label>
                                <input type="text" placeholder="Full Name" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Employment Type</label>
                                <select 
                                    value={newEmployee.employmentType} 
                                    onChange={(e) => setNewEmployee({ ...newEmployee, employmentType: e.target.value as 'commission' | 'salaried' })} 
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="commission">Commission</option>
                                    <option value="salaried">Salaried</option>
                                </select>
                            </div>

                            {newEmployee.employmentType === 'commission' ? (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Commission Rate (%)</label>
                                    <input type="number" placeholder="e.g., 15" value={(newEmployee.commissionRate ?? 0) * 100} onChange={(e) => setNewEmployee({ ...newEmployee, commissionRate: (parseFloat(e.target.value) || 0) / 100 })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Monthly Salary ($)</label>
                                    <input type="number" placeholder="e.g., 3500" value={newEmployee.salary || ''} onChange={(e) => setNewEmployee({ ...newEmployee, salary: parseFloat(e.target.value) || 0 })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancel</button>
                            <button onClick={handleAddEmployee} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employees;