import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import type { InvoiceItem, Customer, Invoice, Employee } from '../types';
import { PlusCircle, Trash2, X, CreditCard, Landmark, Smartphone, DollarSign, Plus, Wallet } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ThermalReceipt from '../components/ThermalReceipt';
import StandardReceipt from '../components/StandardReceipt';

type SellableItem = {
    id: string;
    name: string;
    price: number;
    type: 'service' | 'product' | 'package' | 'membership';
    stock?: number;
};

type CartItemType = InvoiceItem & { 
    name: string; 
    type: 'service' | 'product' | 'package' | 'membership';
};


// Define Child Components outside ParentComponent
const ServiceItem: React.FC<{ item: SellableItem; onAdd: () => void }> = ({ item, onAdd }) => {
    const typeLabels: Record<SellableItem['type'], string> = {
        service: 'Service',
        product: 'Product',
        package: 'Package',
        membership: 'Membership'
    };
    return (
        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer" onClick={onAdd}>
            <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{typeLabels[item.type]}</p>
            </div>
            <div className="flex items-center space-x-4">
                <span className="font-bold text-teal-500">${item.price.toFixed(2)}</span>
                <PlusCircle className="text-green-500" />
            </div>
        </div>
    );
};

const CartItem: React.FC<{ item: CartItemType; onRemove: () => void; onAssignEmployee: (employeeId: string) => void; employees: Employee[] }> = ({ item, onRemove, onAssignEmployee, employees }) => (
    <div className="p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
        <div className="flex justify-between items-start">
            <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm font-bold text-teal-500">${item.price.toFixed(2)}</p>
            </div>
            <button onClick={onRemove} className="text-red-500 hover:text-red-700">
                <Trash2 size={20} />
            </button>
        </div>
        {item.type === 'service' && (
            <select
                value={item.employeeId}
                onChange={(e) => onAssignEmployee(e.target.value)}
                className="mt-2 w-full p-2 bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md"
            >
                <option value="">Assign Employee</option>
                {employees.filter(e => e.employmentType === 'commission').map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
        )}
    </div>
);

const Billing: React.FC = () => {
  const { services, employees, customers, settings, addInvoice, setCustomers, addCustomer, memberships } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('guest');
  const [discount, setDiscount] = useState(0);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showUPIModal, setShowUPIModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', isMember: false });
  const [customerSearch, setCustomerSearch] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const appointmentData = location.state?.appointmentToBill;
    if (appointmentData) {
        const { customerId, serviceId, employeeId } = appointmentData;
        const customer = customers.find(c => c.id === customerId);
        const service = services.find(s => s.id === serviceId);

        if (customer && service) {
            setSelectedCustomerId(customer.id);
            const newItem: CartItemType = {
                serviceId: service.id,
                employeeId: employeeId || '',
                price: service.price,
                name: service.name,
                type: service.type as 'service' | 'product' | 'package',
            };
            setCart([newItem]);
            // Clear the state from navigation history
            navigate('.', { replace: true, state: {} });
        }
    }
  }, []); // Run only on component mount

  const sellableItems = useMemo<SellableItem[]>(() => {
    const allItems: SellableItem[] = [
        ...services.filter(s => s.isActive),
        ...memberships.map(m => ({
            id: m.id,
            name: m.name,
            price: m.price,
            type: 'membership' as const,
        }))
    ];
    return allItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [services, memberships, searchTerm]);

  
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const searchLower = customerSearch.toLowerCase();
    
    const results = customers.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.phone.includes(customerSearch) ||
        String(c.loyaltyPoints).includes(customerSearch)
    );

    return results.slice(0, 5);
  }, [customerSearch, customers]);
    
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const isGuest = selectedCustomerId === 'guest';
  const selectedCustomer = useMemo(() => isGuest ? null : customers.find(c => c.id === selectedCustomerId), [customers, selectedCustomerId, isGuest]);
  const isMemberDiscountApplied = !isGuest && !!selectedCustomer && selectedCustomer.isMember;

  const customerToPrint = useMemo(() => {
    if (!invoiceToPrint || !invoiceToPrint.customerId) return null;
    return customers.find(c => c.id === invoiceToPrint.customerId) || null;
  }, [invoiceToPrint, customers]);

  useEffect(() => {
    if (isMemberDiscountApplied) {
      const memberDiscount = subtotal * 0.10;
      setDiscount(memberDiscount);
    } else if (isGuest || !selectedCustomer?.isMember) {
      setDiscount(0);
    }
  }, [isMemberDiscountApplied, subtotal, isGuest, selectedCustomer]);

  useEffect(() => {
    if (invoiceToPrint) {
        const timer = setTimeout(() => {
            window.print();
            setInvoiceToPrint(null);
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [invoiceToPrint]);


  const addToCart = (item: SellableItem) => {
    if (item.type === 'membership') {
        if (cart.some(cartItem => cartItem.type === 'membership')) {
            alert('Only one membership can be purchased per transaction.');
            return;
        }
        if (isGuest) {
            alert('Please select a customer before adding a membership to the cart.');
            return;
        }
    }
    const newItem: CartItemType = {
        serviceId: item.id,
        employeeId: '',
        price: item.price,
        name: item.name,
        type: item.type,
    };
    setCart([...cart, newItem]);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };
  
  const assignEmployeeToCartItem = (index: number, employeeId: string) => {
    const newCart = [...cart];
    newCart[index].employeeId = employeeId;
    setCart(newCart);
  };

  const handleProcessPayment = (paymentMode: Invoice['paymentMode']) => {
     if (cart.length === 0) {
      alert("Cart is empty.");
      return;
    }
    
    const unassignedService = cart.find(item => item.type === 'service' && !item.employeeId);
    if (unassignedService) {
        alert(`Please assign an employee to ${unassignedService.name}.`);
        return;
    }
    
    if (paymentMode === 'upi' && settings.upiId) {
        setShowUPIModal(true);
    } else {
        handleCreateInvoice(paymentMode);
    }
  };

  const handleConfirmUPIPayment = () => {
    setShowUPIModal(false);
    handleCreateInvoice('upi');
  };

  const handleAddCustomer = () => {
    if (!newCustomer.name || !newCustomer.phone) {
        alert('Name and Phone are required.');
        return;
    }
    const createdCustomer = addCustomer(newCustomer);
    setShowAddCustomerModal(false);
    setNewCustomer({ name: '', phone: '', isMember: false });
    setSelectedCustomerId(createdCustomer.id);
};

  const handleCreateInvoice = (paymentMode: Invoice['paymentMode']) => {
    const customer = selectedCustomer;
    const customerName = customer ? customer.name : 'Guest Customer';
    const customerIdForInvoice = customer ? customer.id : null;

    const taxAmount = (subtotal - discount) * (settings.vatRate / 100);
    const total = subtotal - discount + taxAmount;
    
    if (customer && total > 0) {
      const pointsToAdd = Math.floor(total / 10);
      let updatedCustomer: Customer = { ...customer, loyaltyPoints: customer.loyaltyPoints + pointsToAdd };
      
      const membershipInCart = cart.find(item => item.type === 'membership');
      if (membershipInCart) {
          const membershipPlan = memberships.find(m => m.id === membershipInCart.serviceId);
          if (membershipPlan) {
              const expiryDate = new Date();
              expiryDate.setMonth(expiryDate.getMonth() + membershipPlan.durationMonths);
              const membershipNumber = `ZNTH-${customer.id.slice(-3)}${Math.floor(Math.random() * 900) + 100}`;
              
              updatedCustomer = {
                  ...updatedCustomer,
                  isMember: true,
                  membershipId: membershipPlan.id,
                  membershipExpiry: expiryDate.toISOString(),
                  membershipNumber: updatedCustomer.membershipNumber || membershipNumber, // Assign new number if they don't have one
              };
              alert(`${customer.name} is now a ${membershipPlan.name} member! Membership #: ${updatedCustomer.membershipNumber}`);
          }
      }
      setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    }

    const newInvoice = addInvoice({
      customerId: customerIdForInvoice,
      customerName,
      items: cart.map(({ serviceId, employeeId, price }) => ({ serviceId, employeeId, price })),
      subtotal,
      taxAmount,
      discount,
      total,
      date: new Date().toISOString(),
      paymentMode,
    });

    setInvoiceToPrint(newInvoice);

    setCart([]);
    setDiscount(0);
    setSelectedCustomerId('guest');
    setCustomerSearch('');
  };
  
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setCustomerSearch('');
  };
  
  const handleAddNewFromSearch = () => {
    // Simple check if it's mostly numbers, could be phone or points
    const isNumeric = /^\d+$/.test(customerSearch.replace(/\s/g, ''));
    setNewCustomer(prev => ({
        ...prev,
        name: !isNumeric ? customerSearch : '',
        phone: isNumeric ? customerSearch : '',
    }));
    setShowAddCustomerModal(true);
    setCustomerSearch(''); // Clear search to hide dropdown
  };

  const handleClearCustomer = () => {
    if (cart.some(item => item.type === 'membership')) {
        alert('Cannot clear customer when a membership is in the cart.');
        return;
    }
    setSelectedCustomerId('guest');
  };

  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerSearch(e.target.value);
    if (e.target.value === '') {
        setSelectedCustomerId('guest');
    }
  };
  
  const taxAmount = (subtotal - discount) * (settings.vatRate / 100);
  const total = subtotal - discount + taxAmount;


  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Left: Services List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col h-[calc(100vh-120px)]">
          <input
            type="text"
            placeholder="Search services, products, or memberships..."
            className="w-full p-2 mb-4 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {sellableItems.map(item => (
              <ServiceItem key={item.id} item={item} onAdd={() => addToCart(item)} />
            ))}
          </div>
        </div>

        {/* Right: Cart and Billing */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex flex-col h-[calc(100vh-120px)]">
          <h3 className="text-2xl font-bold mb-4 border-b-2 border-teal-500 pb-2 text-teal-600 dark:text-teal-400">Current Bill</h3>
          
          <div className="mb-4">
            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-300">Customer</label>
            <div className="flex items-center space-x-2">
                <div className="relative w-full">
                    {selectedCustomerId !== 'guest' && selectedCustomer ? (
                        <div className="flex items-center justify-between w-full p-2 bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 rounded-md">
                            <span>{selectedCustomer.name}</span>
                            <button type="button" onClick={handleClearCustomer} className="text-red-500 hover:text-red-700" aria-label="Clear customer selection">
                                <X size={16}/>
                            </button>
                        </div>
                    ) : (
                        <input
                            type="text"
                            placeholder="Search by name, phone, or points..."
                            value={customerSearch}
                            onChange={handleCustomerSearchChange}
                            className="w-full p-2 bg-gray-50 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md"
                            aria-label="Search for customer"
                        />
                    )}
                    {customerSearch.trim() && (
                      <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border dark:border-gray-600 rounded shadow-lg max-h-80 overflow-y-auto">
                          {filteredCustomers.length > 0 ? (
                              filteredCustomers.map(c => (
                                  <li
                                      key={c.id}
                                      onClick={() => handleSelectCustomer(c)}
                                      onKeyDown={(e) => e.key === 'Enter' && handleSelectCustomer(c)}
                                      className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700 last:border-b-0"
                                      tabIndex={0}
                                  >
                                      <div className="flex justify-between items-center">
                                          <span className="font-semibold">{c.name}</span>
                                          {c.isMember ? (
                                              <span className="text-xs bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 px-2 py-1 rounded-full">Member</span>
                                          ) : (
                                              <span className="text-xs bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">Non-Member</span>
                                          )}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                          <span>{c.phone}</span>
                                          <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                                          <span>Loyalty Points: {c.loyaltyPoints}</span>
                                      </div>
                                  </li>
                              ))
                          ) : (
                              <li
                                  onClick={handleAddNewFromSearch}
                                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-center text-teal-600 font-semibold flex items-center justify-center"
                              >
                                  <Plus size={16} className="mr-2" />
                                  Add "{customerSearch}" as new customer
                              </li>
                          )}
                      </ul>
                    )}
                </div>
                <button onClick={() => setShowAddCustomerModal(true)} className="bg-teal-500 text-white p-2 rounded-lg hover:bg-teal-600 flex-shrink-0" aria-label="Add new customer">
                    <Plus size={20} />
                </button>
            </div>

            {selectedCustomer && !isGuest && (
                <div className="text-sm my-2 p-2 bg-teal-50 dark:bg-teal-900/50 rounded-md">
                    <p><span className="font-semibold">Loyalty Points:</span> {selectedCustomer.loyaltyPoints}</p>
                    {isMemberDiscountApplied && <p className="font-semibold text-green-500">10% Member Discount Applied!</p>}
                </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-center mt-8">Cart is empty</p>
            ) : (
              cart.map((item, index) => (
                <CartItem key={index} item={item} onRemove={() => removeFromCart(index)} onAssignEmployee={(empId) => assignEmployeeToCartItem(index, empId)} employees={employees} />
              ))
            )}
          </div>

          <div className="mt-auto pt-4 border-t dark:border-gray-600">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between items-center">
                <span>Discount</span>
                <input type="number" 
                      value={discount.toFixed(2)} 
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} 
                      className="w-20 p-1 text-right bg-gray-100 dark:bg-gray-700 rounded-md disabled:bg-gray-200 disabled:dark:bg-gray-800 disabled:cursor-not-allowed"
                      disabled={isMemberDiscountApplied}
                />
              </div>
              <div className="flex justify-between"><span>Tax ({settings.vatRate}%)</span><span>${taxAmount.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold text-teal-500"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
            <div className="mt-4">
                <p className="text-center font-semibold mb-2 text-gray-700 dark:text-gray-300">Complete Payment & Print</p>
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => handleProcessPayment('cash')} className="flex items-center justify-center p-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition shadow-sm">
                        <DollarSign size={20} className="mr-2"/> Cash
                    </button>
                    <button onClick={() => handleProcessPayment('card')} className="flex items-center justify-center p-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition shadow-sm">
                        <CreditCard size={20} className="mr-2"/> Card
                    </button>
                    <button onClick={() => handleProcessPayment('upi')} className="flex items-center justify-center p-3 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 transition shadow-sm">
                        <Smartphone size={20} className="mr-2"/> UPI
                    </button>
                    <button onClick={() => handleProcessPayment('credit')} className="flex items-center justify-center p-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition shadow-sm">
                        <Landmark size={20} className="mr-2"/> Credit
                    </button>
                     <button onClick={() => handleProcessPayment('wallet')} className="flex items-center justify-center p-3 bg-cyan-500 text-white rounded-lg font-bold hover:bg-cyan-600 transition shadow-sm">
                        <Wallet size={20} className="mr-2"/> Wallet
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
      {invoiceToPrint && (
        <div className="printable-receipt">
            {settings.thermalPrintSettings.selectedPrinter === 'thermal_80mm' ? (
                <ThermalReceipt 
                    invoice={invoiceToPrint} 
                    settings={settings} 
                    services={services} 
                    customer={customerToPrint}
                    employees={employees}
                />
            ) : (
                <StandardReceipt
                    invoice={invoiceToPrint} 
                    settings={settings} 
                    services={services} 
                    customer={customerToPrint}
                    employees={employees}
                />
            )}
        </div>
      )}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl">
                <h3 className="text-xl font-bold mb-4">Add New Customer</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <input type="text" placeholder="Full Name" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                        <input type="text" placeholder="Phone Number" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <label className="flex items-center pt-2">
                        <input type="checkbox" checked={newCustomer.isMember} onChange={(e) => setNewCustomer({ ...newCustomer, isMember: e.target.checked })} className="form-checkbox h-5 w-5 text-teal-600" />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">Is Regular Member?</span>
                    </label>
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                    <button onClick={() => setShowAddCustomerModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700">Cancel</button>
                    <button onClick={handleAddCustomer} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Save & Select</button>
                </div>
            </div>
        </div>
      )}
      {showUPIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-sm shadow-xl text-center">
                <h3 className="text-xl font-bold mb-2">Scan to Pay</h3>
                <p className="text-sm text-gray-500 mb-4">Dynamic UPI QR Code</p>
                
                <div className="bg-white p-4 rounded-lg inline-block mb-4 border-4 border-teal-500">
                    <QRCodeSVG 
                        value={`upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.merchantName)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Invoice for ${selectedCustomer?.name || 'Guest'}`)}`}
                        size={200}
                        level="H"
                        includeMargin={true}
                    />
                </div>
                
                <div className="mb-6">
                    <p className="text-2xl font-bold text-teal-600">₹{total.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Payable to: {settings.merchantName}</p>
                    <p className="text-[10px] text-gray-400">{settings.upiId}</p>
                </div>
                
                <div className="flex flex-col space-y-2">
                    <button onClick={handleConfirmUPIPayment} className="w-full py-3 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 shadow-md">
                        Confirm Payment & Print
                    </button>
                    <button onClick={() => setShowUPIModal(false)} className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};

export default Billing;