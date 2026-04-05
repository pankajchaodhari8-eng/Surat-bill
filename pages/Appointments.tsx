import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import type { Appointment, Customer, Service, Employee } from '../types';
import Card from '../components/Card';
import { generateSmsContent } from '../services/geminiService';
import { Mail, Sparkles, Plus, X, RefreshCw, FileText, UserCheck, Save } from 'lucide-react';

interface AppointmentFormState {
    customerId: string;
    serviceId: string;
    employeeId: string;
    date: string;
    time: string;
    recurrence: 'none' | 'weekly' | 'monthly';
    recurrenceEndDate: string;
    notes: string;
}

const initialFormState: AppointmentFormState = {
    customerId: '',
    serviceId: '',
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    recurrence: 'none',
    recurrenceEndDate: '',
    notes: '',
};

const statusColors: Record<Appointment['status'], string> = {
    scheduled: 'bg-blue-500',
    'checked-in': 'bg-yellow-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
    'no-show': 'bg-gray-400',
};

const statusLabels: Record<Appointment['status'], string> = {
    scheduled: 'Scheduled',
    'checked-in': 'Checked-In',
    completed: 'Completed',
    cancelled: 'Cancelled',
    'no-show': 'No-Show',
};

const toYYYYMMDD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Detail Modal Component
const AppointmentDetailModal: React.FC<{
    appointment: Appointment;
    onClose: () => void;
    onUpdate: (updatedAppointment: Appointment) => void;
}> = ({ appointment, onClose, onUpdate }) => {
    const { customers, services, employees } = useAppContext();
    const [notes, setNotes] = useState(appointment.notes);
    const navigate = useNavigate();

    const customer = customers.find(c => c.id === appointment.customerId);
    const service = services.find(s => s.id === appointment.serviceId);
    const employee = employees.find(e => e.id === appointment.employeeId);

    const handleStatusChange = (newStatus: Appointment['status']) => {
        onUpdate({ ...appointment, status: newStatus });
    };

    const handleSaveNotes = () => {
        onUpdate({ ...appointment, notes });
    };

    const handleGenerateBill = () => {
        navigate('/billing', { 
            state: { 
                appointmentToBill: { 
                    customerId: appointment.customerId, 
                    serviceId: appointment.serviceId, 
                    employeeId: appointment.employeeId 
                } 
            } 
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg shadow-xl relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                    <X size={24} />
                </button>

                <div className="flex items-center mb-4">
                     <span className={`w-3 h-3 rounded-full mr-3 ${statusColors[appointment.status]}`}></span>
                     <h3 className="text-xl font-bold">{service?.name}</h3>
                </div>

                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                   <p><strong>Customer:</strong> {customer?.name}</p>
                   <p><strong>Therapist:</strong> {employee?.name}</p>
                   <p><strong>Time:</strong> {new Date(appointment.date).toLocaleDateString()} at {appointment.time}</p>
                   <div className="flex items-center gap-2">
                        <strong>Status:</strong> 
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${statusColors[appointment.status]}`}>
                            {statusLabels[appointment.status]}
                        </span>
                   </div>

                    <div>
                        <label className="block font-semibold mb-1">Notes</label>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                            placeholder="Add customer preferences or session notes..."
                        />
                        <button onClick={handleSaveNotes} disabled={notes === appointment.notes} className="mt-2 flex items-center gap-2 text-sm bg-gray-200 dark:bg-gray-600 px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">
                            <Save size={14} /> Save Notes
                        </button>
                    </div>

                    <div className="pt-4 border-t dark:border-gray-700">
                        <p className="font-semibold mb-2">Actions</p>
                        <div className="flex flex-wrap gap-2">
                            {appointment.status === 'scheduled' && (
                                <button onClick={() => handleStatusChange('checked-in')} className="bg-yellow-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-yellow-600 flex items-center gap-2">
                                    <UserCheck size={16} /> Check In
                                </button>
                            )}
                            {appointment.status === 'checked-in' && (
                                <button onClick={() => handleStatusChange('completed')} className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600">
                                    Mark as Completed
                                </button>
                            )}
                            <button onClick={handleGenerateBill} className="bg-teal-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-teal-700 flex items-center gap-2">
                                <FileText size={16} /> Generate Bill
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper to extract duration in minutes from service name
const getServiceDuration = (serviceName: string): number => {
    const match = serviceName.match(/\((\d+)\s*min\)/i);
    if (match && match[1]) {
        return parseInt(match[1], 10);
    }
    return 60; // Default to 60 minutes
};

const calculateRecurrenceCount = (
    recurrence: 'none' | 'weekly' | 'monthly',
    startDateStr: string,
    endDateStr: string
): number => {
    if (recurrence === 'none' || !endDateStr || !startDateStr) {
        return 0;
    }

    const parseDate = (str: string) => {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    const startDate = parseDate(startDateStr);
    const endDate = parseDate(endDateStr);

    if (startDate > endDate) return 0;

    let count = 0;
    let currentDate = new Date(startDate);
    const maxOccurrences = 53; // Safety limit

    while (currentDate <= endDate && count <= maxOccurrences) {
        count++;
        if (recurrence === 'weekly') {
            currentDate.setDate(currentDate.getDate() + 7);
        } else if (recurrence === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
    }
    return count > maxOccurrences ? maxOccurrences : count;
};


const MultiResourceDayView: React.FC<{
    appointments: Appointment[];
    customers: Customer[];
    services: Service[];
    employees: Employee[];
    currentDate: Date;
    onAppointmentClick: (appointment: Appointment) => void;
    onTimeSlotDoubleClick: (time: string, employeeId: string) => void;
}> = ({ appointments, customers, services, employees, currentDate, onAppointmentClick, onTimeSlotDoubleClick }) => {
    const curDateStr = toYYYYMMDD(currentDate);
    const dayAppointments = appointments.filter(apt => apt.date === curDateStr);

    const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8 AM to 11 PM (23:00)
    const hourHeight = 60; // pixels per hour
    const therapists = employees.filter(e => e.employmentType === 'commission');

    const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(null);

    useEffect(() => {
        const updateCurrentTime = () => {
            const now = new Date();
            if (toYYYYMMDD(now) === curDateStr) {
                const hours = now.getHours();
                const minutes = now.getMinutes();
                const totalMinutesFrom8AM = (hours - 8) * 60 + minutes;
                setCurrentTimePosition((totalMinutesFrom8AM / 60) * hourHeight);
            } else {
                setCurrentTimePosition(null);
            }
        };

        updateCurrentTime();
        const interval = setInterval(updateCurrentTime, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [currentDate, curDateStr]);


    const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>, employeeId: string) => {
        const rect = e.currentTarget.getBoundingClientRect();
        // Adjust for the header height (40px)
        const offsetY = e.clientY - rect.top - 40;
        
        if (offsetY < 0) return; // Ignore clicks on the header

        const totalMinutes = (offsetY / hourHeight) * 60;
        let hour = Math.floor(totalMinutes / 60) + 8;
        let minute = Math.round((totalMinutes % 60) / 15) * 15;
    
        if (minute === 60) {
            hour += 1;
            minute = 0;
        }
        
        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        onTimeSlotDoubleClick(timeString, employeeId);
    };

    return (
        <div className="h-[calc(100vh-200px)] overflow-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="flex relative bg-[#FFF8E1] dark:bg-gray-800/50">
                {/* Time column */}
                <div className="w-20 flex-shrink-0 text-right pr-2">
                    <div className="h-10 border-b border-r border-gray-300 dark:border-gray-700 sticky top-0 bg-[#FFF8E1] dark:bg-gray-800/50 z-20"></div>
                    {hours.map(hour => (
                        <div key={hour} className="h-[60px] text-xs text-gray-400 relative">
                            <span className="absolute -top-1.5 right-2">{`${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour < 12 || hour === 24 ? 'AM' : 'PM'}`}</span>
                        </div>
                    ))}
                </div>

                {/* Schedule area */}
                <div className="flex-1 overflow-x-auto">
                    <div className="flex min-w-max relative">
                        {therapists.map(employee => {
                            const employeeAppointments = dayAppointments.filter(apt => apt.employeeId === employee.id);
                            return (
                                <div 
                                    key={employee.id} 
                                    className="w-48 border-r border-gray-300 dark:border-gray-600 flex-shrink-0 relative cursor-pointer"
                                    onDoubleClick={(e) => handleDoubleClick(e, employee.id)}
                                >
                                    <div className="h-10 border-b border-gray-300 dark:border-gray-700 text-center font-semibold flex items-center justify-center sticky top-0 bg-[#FFF8E1] dark:bg-gray-800/50 z-10">
                                        {employee.name}
                                    </div>
                                    {/* Hour lines */}
                                    {hours.map(hour => (
                                        <div key={hour} className="h-[60px] border-t border-gray-200 dark:border-gray-700 border-dotted"></div>
                                    ))}

                                    {/* Appointments */}
                                    {employeeAppointments.map(apt => {
                                        const service = services.find(s => s.id === apt.serviceId);
                                        const customer = customers.find(c => c.id === apt.customerId);
                                        if (!service || !customer) return null;

                                        const [h, m] = apt.time.split(':').map(Number);
                                        const duration = getServiceDuration(service.name);

                                        const top = (h - 8 + m / 60) * hourHeight;
                                        const height = (duration / 60) * hourHeight;

                                        return (
                                            <div
                                                key={apt.id}
                                                onClick={(e) => { e.stopPropagation(); onAppointmentClick(apt); }}
                                                className={`absolute left-1 right-1 p-1 rounded text-white shadow-md cursor-pointer overflow-hidden ${statusColors[apt.status]}`}
                                                style={{ top: `${top + 40}px`, height: `${height - 2}px`, minHeight: '20px' }} // +40 for header
                                                title={`${service.name} with ${customer.name}`}
                                            >
                                                <p className="font-bold text-xs truncate leading-tight">{apt.time} - {customer.name}</p>
                                                <p className="text-xs truncate text-gray-200 leading-tight">{service.name}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                        {/* Current Time Indicator */}
                        {currentTimePosition !== null && (
                            <div 
                                className="absolute left-0 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
                                style={{ top: `${currentTimePosition + 40}px` }} // +40 for header
                            >
                                <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const Appointments: React.FC = () => {
    const { appointments, setAppointments, customers, services, employees, addCustomer } = useAppContext();
    const [view, setView] = useState<'day' | 'calendar'>('day');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAppointment, setNewAppointment] = useState<AppointmentFormState>(initialFormState);
    const [detailedAppointment, setDetailedAppointment] = useState<Appointment | null>(null);
    
    const [showSmsModal, setShowSmsModal] = useState(false);
    const [smsContent, setSmsContent] = useState('');
    const [isSmsLoading, setIsSmsLoading] = useState(false);
    const [smsTone, setSmsTone] = useState('Friendly');

    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', isMember: false });

    const [customerSearch, setCustomerSearch] = useState('');
    
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const customerIdToBook = location.state?.customerToBook;
        if (customerIdToBook && customers.length > 0) {
            const customer = customers.find(c => c.id === customerIdToBook);
            if (customer) {
                setShowAddModal(true);
                setNewAppointment(prev => ({
                    ...initialFormState,
                    customerId: customer.id,
                }));
                navigate('.', { replace: true, state: {} });
            }
        }
    }, [location.state, customers, navigate]);

    const filteredCustomers = useMemo(() => {
        if (!customerSearch.trim()) return [];
        const searchLower = customerSearch.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(searchLower) ||
            c.phone.includes(customerSearch)
        );
    }, [customerSearch, customers]);

    const handleSelectCustomer = (customer: Customer) => {
        setNewAppointment({ ...newAppointment, customerId: customer.id });
        setCustomerSearch('');
    };

    const handleClearCustomer = () => {
        setNewAppointment({ ...newAppointment, customerId: '' });
    };

    const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomerSearch(e.target.value);
    };

    const handleUpdateAppointment = (updatedAppointment: Appointment) => {
        setAppointments(prev => prev.map(apt => apt.id === updatedAppointment.id ? updatedAppointment : apt));
        if (detailedAppointment?.id === updatedAppointment.id) {
            setDetailedAppointment(updatedAppointment);
        }
        alert(`Appointment for ${customers.find(c => c.id === updatedAppointment.customerId)?.name} updated!`);
    };

    const handleAddAppointment = () => {
        if (!newAppointment.customerId || !newAppointment.serviceId || !newAppointment.employeeId) {
            alert('Please fill all required fields: Customer, Service, and Employee.');
            return;
        }
    
        if (newAppointment.recurrence !== 'none') {
            if (!newAppointment.recurrenceEndDate) {
                alert('Please select an end date for the recurring appointment.');
                return;
            }
    
            const startDate = new Date(`${newAppointment.date}T${newAppointment.time}`);
            const endDate = new Date(`${newAppointment.recurrenceEndDate}T${newAppointment.time}`);
    
            if (startDate > endDate) {
                alert('End date cannot be before the start date.');
                return;
            }
    
            const appointmentsToAdd: Appointment[] = [];
            let currentDate = new Date(startDate);
            const recurrenceId = `RECUR-${Date.now()}`;
            const maxOccurrences = 53;
    
            while (currentDate <= endDate && appointmentsToAdd.length < maxOccurrences) {
                appointmentsToAdd.push({
                    id: `APT-${Date.now()}-${appointmentsToAdd.length}`,
                    customerId: newAppointment.customerId,
                    serviceId: newAppointment.serviceId,
                    employeeId: newAppointment.employeeId,
                    date: currentDate.toISOString().split('T')[0],
                    time: newAppointment.time,
                    recurrenceId: recurrenceId,
                    status: 'scheduled',
                    notes: newAppointment.notes,
                });
    
                if (newAppointment.recurrence === 'weekly') {
                    currentDate.setDate(currentDate.getDate() + 7);
                } else if (newAppointment.recurrence === 'monthly') {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
            }
            
            if (appointmentsToAdd.length >= maxOccurrences) {
                alert(`Recurring appointments are limited to ${maxOccurrences} occurrences to ensure system performance.`);
            }
    
            setAppointments(prev => [...prev, ...appointmentsToAdd]);
        } else {
            const singleAppointment: Omit<Appointment, 'id'> = {
                customerId: newAppointment.customerId,
                serviceId: newAppointment.serviceId,
                employeeId: newAppointment.employeeId,
                date: newAppointment.date,
                time: newAppointment.time,
                status: 'scheduled',
                notes: newAppointment.notes,
            };
            setAppointments(prev => [...prev, { ...singleAppointment, id: `APT-${Date.now()}` }]);
        }
    
        setShowAddModal(false);
        setNewAppointment(initialFormState);
    };

    const handleOpenSmsModal = (e: React.MouseEvent, appointment: Appointment) => {
        e.stopPropagation();
        const customer = customers.find(c => c.id === appointment.customerId);
        const service = services.find(s => s.id === appointment.serviceId);
        if (!customer || !service) return;

        const defaultMessage = `Hi ${customer.name}, this is a confirmation for your appointment for a ${service.name} on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time}. We look forward to seeing you at Zenith Spa!`;
        
        setDetailedAppointment(appointment);
        setSmsContent(defaultMessage);
        setShowSmsModal(true);
    };
    
    const handleAddNewCustomer = () => {
        if (!newCustomerData.name || !newCustomerData.phone) {
            alert('Name and Phone are required.');
            return;
        }
        const createdCustomer = addCustomer(newCustomerData);
        setNewAppointment(prev => ({ ...prev, customerId: createdCustomer.id }));
        setShowAddCustomerModal(false);
        setNewCustomerData({ name: '', phone: '', isMember: false });
    };

    const handleGenerateSmsFromAI = async () => {
        if (!detailedAppointment) return;

        const customer = customers.find(c => c.id === detailedAppointment.customerId);
        const service = services.find(s => s.id === detailedAppointment.serviceId);
        if (!customer || !service) return;

        const prompt = `Generate a ${smsTone.toLowerCase()} and professional SMS to confirm a spa appointment. Keep it under 160 characters. Details: Customer name is ${customer.name}, service is "${service.name}", date is ${new Date(detailedAppointment.date).toLocaleDateString()}, and time is ${detailedAppointment.time}.`;

        setIsSmsLoading(true);
        const generatedContent = await generateSmsContent(prompt);
        setSmsContent(generatedContent);
        setIsSmsLoading(false);
    };

    const handleSendSms = () => {
        if (!detailedAppointment || !smsContent) return;
        const customer = customers.find(c => c.id === detailedAppointment.customerId);
        if (!customer) return;

        alert(`SMS sent to ${customer.name} (${customer.phone}):\n\n"${smsContent}"`);
        
        setShowSmsModal(false);
        setDetailedAppointment(null);
        setSmsContent('');
    };

    const handleTimeSlotDoubleClick = (time: string, employeeId: string) => {
        setNewAppointment({
            ...initialFormState,
            date: toYYYYMMDD(currentDate),
            time: time,
            employeeId: employeeId,
        });
        setShowAddModal(true);
    };
    
    const handlePrev = useCallback(() => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (view === 'day') {
                newDate.setDate(newDate.getDate() - 1);
            } else { // calendar/month view
                newDate.setMonth(newDate.getMonth() - 1);
            }
            return newDate;
        });
    }, [view]);

    const handleNext = useCallback(() => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (view === 'day') {
                newDate.setDate(newDate.getDate() + 1);
            } else { // calendar/month view
                newDate.setMonth(newDate.getMonth() + 1);
            }
            return newDate;
        });
    }, [view]);
    

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const calendarDays = Array.from({ length: firstDayOfMonth }, (_, i) => <div key={`empty-${i}`} className="border dark:border-gray-700"></div>);
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayAppointments = appointments.filter(apt => apt.date.startsWith(dateStr));
        calendarDays.push(
            <div key={day} className="border dark:border-gray-700 p-2 min-h-[120px]">
                <div className="font-bold">{day}</div>
                <div className="text-xs space-y-1 mt-1">
                    {dayAppointments.map(apt => {
                        const customer = customers.find(c => c.id === apt.customerId);
                        return (
                          <div key={apt.id} onClick={() => setDetailedAppointment(apt)} className="bg-blue-100 dark:bg-blue-900 p-1 rounded flex items-center justify-between cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800">
                              <div className="flex items-center gap-2 truncate">
                                <span title={statusLabels[apt.status]} className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[apt.status]}`}></span>
                                <span className="truncate">{customer?.name} @ {apt.time}</span>
                              </div>
                              {apt.recurrenceId && <span title="Recurring Appointment"><RefreshCw size={10} className="text-blue-700 dark:text-blue-300 flex-shrink-0" /></span>}
                          </div>
                        )
                    })}
                </div>
            </div>
        );
    }
    
    const recurrenceCount = useMemo(() => 
        calculateRecurrenceCount(newAppointment.recurrence, newAppointment.date, newAppointment.recurrenceEndDate),
        [newAppointment.recurrence, newAppointment.date, newAppointment.recurrenceEndDate]
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <div className="flex items-center space-x-2">
                    <button onClick={handlePrev} className="p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600">&lt;</button>
                    <button onClick={handleNext} className="p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600">&gt;</button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-white dark:bg-gray-700 rounded-md shadow-sm text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-600">Today</button>
                </div>
                <h2 className="text-xl font-bold text-center">
                    { view === 'day' 
                        ? currentDate.toLocaleString('default', { month: 'long', day: 'numeric', year: 'numeric' })
                        : currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
                    }
                </h2>
                <div className="flex items-center space-x-4">
                     <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg shadow-sm">
                        <button onClick={() => setView('day')} className={`px-4 py-2 text-sm font-semibold rounded-l-lg ${view === 'day' ? 'bg-teal-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}>Day</button>
                        <button onClick={() => alert('Week view coming soon!')} className={`px-4 py-2 text-sm font-semibold border-x border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300`}>Week</button>
                        <button onClick={() => setView('calendar')} className={`px-4 py-2 text-sm font-semibold rounded-r-lg ${view === 'calendar' ? 'bg-teal-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}>Month</button>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                        Add Appointment
                    </button>
                </div>
            </div>
            
            {view === 'calendar' && (
                <Card title="Appointment Calendar">
                    <div className="grid grid-cols-7 text-center font-semibold">
                        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                    </div>
                    <div className="grid grid-cols-7">
                        {calendarDays}
                    </div>
                </Card>
            )}

            {view === 'day' && (
                <MultiResourceDayView 
                    appointments={appointments}
                    customers={customers}
                    services={services}
                    employees={employees}
                    currentDate={currentDate}
                    onAppointmentClick={setDetailedAppointment}
                    onTimeSlotDoubleClick={handleTimeSlotDoubleClick}
                />
            )}
            
            {detailedAppointment && (
                <AppointmentDetailModal 
                    appointment={detailedAppointment}
                    onClose={() => setDetailedAppointment(null)}
                    onUpdate={handleUpdateAppointment}
                />
            )}

            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl">
                        <h3 className="text-xl font-bold mb-6">New Appointment</h3>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">1. Client Information</label>
                                <div className="flex items-center space-x-2">
                                     {newAppointment.customerId ? (
                                        <div className="flex items-center justify-between w-full p-2 bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 rounded-md">
                                            <span>{customers.find(c => c.id === newAppointment.customerId)?.name}</span>
                                            <button type="button" onClick={handleClearCustomer} className="text-red-500 hover:text-red-700" aria-label="Clear customer selection">
                                                <X size={16}/>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative w-full">
                                            <input
                                                type="text"
                                                placeholder="Search customer by name or phone..."
                                                value={customerSearch}
                                                onChange={handleCustomerSearchChange}
                                                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                                aria-label="Search for customer"
                                            />
                                            {filteredCustomers.length > 0 && (
                                                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-900 border dark:border-gray-600 rounded shadow-lg max-h-40 overflow-y-auto">
                                                    {filteredCustomers.map(c => (
                                                        <li
                                                            key={c.id}
                                                            onClick={() => handleSelectCustomer(c)}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleSelectCustomer(c)}
                                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                                            tabIndex={0}
                                                        >
                                                            {c.name} <span className="text-sm text-gray-500">({c.phone})</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                    <button onClick={() => setShowAddCustomerModal(true)} className="bg-teal-500 text-white p-2 rounded-lg hover:bg-teal-600 flex-shrink-0" aria-label="Add new customer">
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">2. Service Details</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service</label>
                                        <select value={newAppointment.serviceId} onChange={(e) => setNewAppointment({ ...newAppointment, serviceId: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                            <option value="">Select Service</option>
                                            {services.filter(s => s.type === 'service').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee/Therapist</label>
                                        <select value={newAppointment.employeeId} onChange={(e) => setNewAppointment({ ...newAppointment, employeeId: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                            <option value="">Select Employee</option>
                                            {employees.filter(e => e.employmentType === 'commission').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">3. Scheduling</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                                        <input type="date" value={newAppointment.date} onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                                        <input type="time" value={newAppointment.time} onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">4. Recurrence (Optional)</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                                        <select value={newAppointment.recurrence} onChange={(e) => setNewAppointment({ ...newAppointment, recurrence: e.target.value as AppointmentFormState['recurrence'] })} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                            <option value="none">Does not repeat</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                    {newAppointment.recurrence !== 'none' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Repeat Until</label>
                                            <input type="date" value={newAppointment.recurrenceEndDate} onChange={(e) => setNewAppointment({ ...newAppointment, recurrenceEndDate: e.target.value })} min={newAppointment.date} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                        </div>
                                    )}
                                </div>
                                {recurrenceCount > 0 && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                        This will create <strong>{recurrenceCount}</strong> {newAppointment.recurrence} appointments until {new Date(newAppointment.recurrenceEndDate).toLocaleDateString()}.
                                    </p>
                                )}
                            </div>

                             <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">5. Additional Notes</label>
                                <textarea
                                    value={newAppointment.notes}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                                    rows={3}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="e.g., Customer prefers lavender oil, focus on lower back..."
                                />
                            </div>
                        </div>
                        <div className="mt-8 flex justify-end space-x-4">
                            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancel</button>
                            <button onClick={handleAddAppointment} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Save</button>
                        </div>
                    </div>
                </div>
            )}
            
            {showSmsModal && detailedAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">Send SMS Notification</h3>
                        <div className="space-y-4">
                            <p>To: <span className="font-semibold">{customers.find(c => c.id === detailedAppointment.customerId)?.name}</span></p>
                            <div>
                                <label className="block font-medium mb-1">Message Tone</label>
                                <select 
                                    value={smsTone}
                                    onChange={(e) => setSmsTone(e.target.value)}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="Friendly">Friendly</option>
                                    <option value="Formal">Formal</option>
                                    <option value="Concise">Concise</option>
                                </select>
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Message</label>
                                <textarea 
                                    value={smsContent}
                                    onChange={(e) => setSmsContent(e.target.value)}
                                    rows={5}
                                    className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <button onClick={handleGenerateSmsFromAI} disabled={isSmsLoading} className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center justify-center space-x-2">
                                {isSmsLoading ? (
                                    <span>Generating...</span>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        <span>Generate with AI</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button onClick={() => setShowSmsModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancel</button>
                            <button onClick={handleSendSms} className="px-4 py-2 bg-teal-600 text-white rounded-lg">Send</button>
                        </div>
                    </div>
                </div>
            )}

            {showAddCustomerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md shadow-xl">
                        <h3 className="text-xl font-bold mb-4">Add New Customer</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                                <input type="text" placeholder="Full Name" value={newCustomerData.name} onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                                <input type="text" placeholder="Phone Number" value={newCustomerData.phone} onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            </div>
                            <label className="flex items-center pt-2">
                                <input type="checkbox" checked={newCustomerData.isMember} onChange={(e) => setNewCustomerData({ ...newCustomerData, isMember: e.target.checked })} className="form-checkbox h-5 w-5 text-teal-600" />
                                <span className="ml-2 text-gray-700 dark:text-gray-300">Is Regular Member?</span>
                            </label>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button onClick={() => setShowAddCustomerModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700">Cancel</button>
                            <button onClick={handleAddNewCustomer} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">Save & Select</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Appointments;