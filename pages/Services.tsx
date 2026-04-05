import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { Service } from '../types';
import Card from '../components/Card';
import { Package, Edit, Archive, Undo2 } from 'lucide-react';

const serviceCategories = ['Uncategorized', 'Massage', 'Facial', 'Retail', 'Hair', 'Nails', 'Packages'];

const Services: React.FC = () => {
    const { services, setServices } = useAppContext();
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Service | null>(null);
    const [newItem, setNewItem] = useState<Omit<Service, 'id'>>({
        name: '',
        price: 0,
        type: 'service',
        category: 'Uncategorized',
        stock: 0,
        packageItems: [],
        isActive: true,
    });

    const handleOpenAddModal = () => {
        setEditingItem(null);
        setNewItem({
            name: '',
            price: 0,
            type: 'service',
            category: 'Uncategorized',
            stock: 0,
            packageItems: [],
            isActive: true,
        });
        setShowModal(true);
    };

    const handleEditItem = (item: Service) => {
        setEditingItem(item);
        setNewItem({
            name: item.name,
            price: item.price,
            type: item.type,
            category: item.category || 'Uncategorized',
            stock: item.stock || 0,
            packageItems: item.packageItems || [],
            isActive: item.isActive,
        });
        setShowModal(true);
    };

    const handleToggleStatus = (itemId: string) => {
        setServices(services.map(s => 
            s.id === itemId ? { ...s, isActive: !s.isActive } : s
        ));
    };

    const handleSaveItem = () => {
        if (!newItem.name || newItem.price <= 0) {
            alert('Valid Name and Price are required.');
            return;
        }
         if (newItem.type === 'product' && (newItem.stock === undefined || newItem.stock < 0)) {
            alert('A valid, non-negative stock quantity is required for products.');
            return;
        }
        if (newItem.type === 'package' && (!newItem.packageItems || newItem.packageItems.length < 2)) {
            alert('Packages must contain at least two items.');
            return;
        }

        const itemToSave: Partial<Service> = { ...newItem };
        if (itemToSave.type !== 'product') {
            delete itemToSave.stock;
        }
        if (itemToSave.type !== 'package') {
            delete itemToSave.packageItems;
        }
        
        if (editingItem) {
            // Update existing item
            setServices(services.map(s => s.id === editingItem.id ? { ...s, ...itemToSave } as Service : s));
        } else {
            // Add new item
            setServices([...services, { ...itemToSave, id: `${newItem.type.toUpperCase()}-${Date.now()}` } as Service]);
        }
        
        setShowModal(false);
        setEditingItem(null);
    };

    const handlePackageItemToggle = (serviceId: string) => {
        setNewItem(prev => {
            const currentItems = prev.packageItems || [];
            if (currentItems.includes(serviceId)) {
                return { ...prev, packageItems: currentItems.filter(id => id !== serviceId) };
            } else {
                return { ...prev, packageItems: [...currentItems, serviceId] };
            }
        });
    };

    const nonPackageServices = services.filter(s => s.type !== 'package' && s.isActive);
    const selectedPackageItemsTotal = newItem.packageItems?.reduce((total, id) => {
        const item = services.find(s => s.id === id);
        return total + (item?.price || 0);
    }, 0) || 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Services & Products</h2>
                <button onClick={handleOpenAddModal} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                    Add New
                </button>
            </div>
            <Card title="All Services & Products">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b dark:border-gray-600">
                            <tr>
                                <th className="p-2">Name</th>
                                <th className="p-2">Category</th>
                                <th className="p-2">Type</th>
                                <th className="p-2">Price</th>
                                <th className="p-2">Stock</th>
                                <th className="p-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map(service => (
                                <tr key={service.id} className={`border-b dark:border-gray-700 ${!service.isActive ? 'opacity-50' : ''}`}>
                                    <td className={`p-2 flex items-center ${!service.isActive ? 'line-through' : ''}`}>
                                      {service.name}
                                      {service.type === 'package' && <span title="Package Deal"><Package size={14} className="ml-2 text-indigo-500" /></span>}
                                    </td>
                                    <td className="p-2">{service.category || 'N/A'}</td>
                                    <td className="p-2 capitalize">{service.type}</td>
                                    <td className="p-2">${service.price.toFixed(2)}</td>
                                    <td className="p-2">{service.type === 'product' ? service.stock : 'N/A'}</td>
                                    <td className="p-2 text-center">
                                        <div className="flex justify-center space-x-2">
                                            <button onClick={() => handleEditItem(service)} className="text-blue-500 hover:text-blue-700" aria-label={`Edit ${service.name}`}>
                                                <Edit size={18} />
                                            </button>
                                            <button onClick={() => handleToggleStatus(service.id)} className={service.isActive ? "text-yellow-600 hover:text-yellow-800" : "text-green-600 hover:text-green-800"} aria-label={service.isActive ? `Deactivate ${service.name}` : `Activate ${service.name}`}>
                                                {service.isActive ? <Archive size={18} /> : <Undo2 size={18} />}
                                            </button>
                                        </div>
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
                        <h3 className="text-xl font-bold mb-4">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Item Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <input type="number" placeholder="Price" value={newItem.price || ''} onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <div className="grid grid-cols-2 gap-4">
                                <select value={newItem.type} onChange={(e) => setNewItem({ ...newItem, type: e.target.value as 'service' | 'product' | 'package' })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                    <option value="service">Service</option>
                                    <option value="product">Product</option>
                                    <option value="package">Package</option>
                                </select>
                                <select value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                    {serviceCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                             {newItem.type === 'product' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Quantity</label>
                                    <input type="number" placeholder="e.g., 50" value={newItem.stock || ''} onChange={(e) => setNewItem({ ...newItem, stock: parseInt(e.target.value, 10) || 0 })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                </div>
                            )}
                            {newItem.type === 'package' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 my-2">Package Items</label>
                                    <div className="max-h-40 overflow-y-auto border dark:border-gray-600 rounded-lg p-2 space-y-2">
                                        {nonPackageServices.map(s => (
                                            <label key={s.id} className="flex items-center space-x-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={newItem.packageItems?.includes(s.id)}
                                                    onChange={() => handlePackageItemToggle(s.id)}
                                                    className="form-checkbox h-4 w-4 text-teal-600"
                                                />
                                                <span>{s.name} (${s.price.toFixed(2)})</span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="text-xs text-right mt-1 text-gray-500">
                                        Individual value: ${selectedPackageItemsTotal.toFixed(2)}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancel</button>
                            <button onClick={handleSaveItem} className="px-4 py-2 bg-teal-600 text-white rounded-lg">{editingItem ? 'Update' : 'Save'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Services;