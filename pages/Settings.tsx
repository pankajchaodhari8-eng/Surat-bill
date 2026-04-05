import React, { useState, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import Card from '../components/Card';
import { generateSmsContent } from '../services/geminiService';
import type { User as UserType, Role, Permission } from '../types';
import { ALL_PERMISSIONS } from '../types';
import { 
    UploadCloud, Copy, Building, User, Users, Settings as SettingsIcon, SlidersHorizontal, Printer, FileText, Bot, 
    Database, Globe, Barcode, MessageSquare, Banknote, ShieldCheck, Signature, UserPlus, Edit, Power, PowerOff, CheckCircle, Shield, KeyRound
} from 'lucide-react';

type SettingsTab = 
    'companyDetails' | 'profile' | 'allUsers' | 'general' | 'preferences' | 
    'thermalPrint' | 'barcode' | 'signatures' | 'notesAndTerms' | 'reminders' |
    'banking' | 'integrations' | 'database';

// A reusable ToggleSwitch component
const ToggleSwitch: React.FC<{ label: string; description?: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; name: string; }> = ({ label, description, checked, onChange, name }) => (
    <label htmlFor={name} className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-md">
        <div>
            <span className="font-medium text-gray-800 dark:text-gray-200">{label}</span>
            {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
        <div className="relative">
            <input id={name} name={name} type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
            <div className={`block w-14 h-8 rounded-full transition-colors ${checked ? 'bg-teal-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
        </div>
    </label>
);

// Settings sidebar item
const NavItem: React.FC<{ label: string; icon: React.FC<any>; active: boolean; onClick: () => void; }> = ({ label, icon: Icon, active, onClick }) => (
    <button onClick={onClick} className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors ${active ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-200 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300'}`}>
        <Icon size={18} />
        <span>{label}</span>
    </button>
);

// Placeholder for unimplemented features
const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
    <Card title={title}>
        <div className="text-center text-gray-500 py-10">
            <p className="font-semibold">Coming Soon!</p>
            <p className="text-sm">This feature is under development and will be available in a future update.</p>
        </div>
    </Card>
);

const UsersTab: React.FC = () => {
    const { users, setUsers, roles } = useAppContext();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        roleId: roles.find(r => r.name === 'Staff')?.id || ''
    });

    const handleOpenModal = (user: UserType | null = null) => {
        setEditingUser(user);
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
                roleId: user.roleId
            });
        } else {
            setFormData({
                name: '',
                email: '',
                password: '',
                roleId: roles.find(r => r.name === 'Staff')?.id || ''
            });
        }
        setShowModal(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveUser = () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            alert('Name and Email are required.');
            return;
        }
        if (!editingUser && !formData.password) {
            alert('Password is required for new users.');
            return;
        }

        if (editingUser) {
            setUsers(users.map(u => u.id === editingUser.id ? {
                ...u,
                name: formData.name,
                email: formData.email,
                roleId: formData.roleId,
                passwordHash: formData.password ? `hashed_${formData.password}` : u.passwordHash
            } : u));
        } else {
            const newUser: UserType = {
                id: `USER-${Date.now()}`,
                name: formData.name,
                email: formData.email,
                passwordHash: `hashed_${formData.password}`,
                roleId: formData.roleId,
                isActive: true
            };
            setUsers([...users, newUser]);
        }
        setShowModal(false);
    };

    const handleToggleStatus = (userId: string) => {
        const userToToggle = users.find(u => u.id === userId);
        const roleOfUser = roles.find(r => r.id === userToToggle?.roleId);
        
        if (roleOfUser?.name === 'Administrator' && userToToggle?.isActive) {
            const activeAdmins = users.filter(u => {
                const role = roles.find(r => r.id === u.roleId);
                return u.isActive && role?.name === 'Administrator';
            });
            if (activeAdmins.length <= 1) {
                alert('Cannot deactivate the last active Administrator.');
                return;
            }
        }
        setUsers(users.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    };

    return <>
        <div className="flex justify-end mb-4">
            <button onClick={() => handleOpenModal()} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center space-x-2">
                <UserPlus size={18} />
                <span>Add New User</span>
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b dark:border-gray-600">
                    <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Role</th>
                        <th className="p-2">Status</th>
                        <th className="p-2 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} className="border-b dark:border-gray-700">
                            <td className="p-2 font-medium">{user.name}</td>
                            <td className="p-2 text-gray-600 dark:text-gray-400">{user.email}</td>
                            <td className="p-2 capitalize">{roles.find(r => r.id === user.roleId)?.name || 'Unknown Role'}</td>
                            <td className="p-2">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-300'}`}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                            <td className="p-2 text-center">
                                <div className="flex justify-center space-x-2">
                                    <button onClick={() => handleOpenModal(user)} className="text-blue-500 hover:text-blue-700" aria-label={`Edit ${user.name}`}>
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleToggleStatus(user.id)} className={user.isActive ? "text-yellow-600 hover:text-yellow-800" : "text-green-600 hover:text-green-800"} aria-label={user.isActive ? `Deactivate ${user.name}` : `Activate ${user.name}`}>
                                        {user.isActive ? <PowerOff size={18} /> : <Power size={18} />}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input type="password" name="password" placeholder={editingUser ? 'Leave blank to keep current password' : ''} value={formData.password} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Role</label>
                            <select name="roleId" value={formData.roleId} onChange={handleInputChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-4">
                        <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancel</button>
                        <button onClick={handleSaveUser} className="px-4 py-2 bg-teal-600 text-white rounded-lg">{editingUser ? 'Update User' : 'Save User'}</button>
                    </div>
                </div>
            </div>
        )}
    </>
}

const RolesTab: React.FC = () => {
    const { roles, setRoles, users } = useAppContext();
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState<{name: string, permissions: Permission[]}>({ name: '', permissions: []});
    
    const permissionGroups = useMemo(() => {
        return Object.entries(ALL_PERMISSIONS).reduce((acc, [key, value]) => {
            const group = key.split(':')[0];
            if (!acc[group]) acc[group] = [];
            acc[group].push({ key: key as Permission, value });
            return acc;
        }, {} as Record<string, {key: Permission, value: string}[]>);
    }, []);

    const handleOpenModal = (role: Role | null = null) => {
        setEditingRole(role);
        if (role) {
            setFormData({ name: role.name, permissions: [...role.permissions] });
        } else {
            setFormData({ name: '', permissions: [] });
        }
        setShowModal(true);
    };

    const handlePermissionChange = (permission: Permission, isChecked: boolean) => {
        setFormData(prev => {
            const newPermissions = new Set(prev.permissions);
            if (isChecked) {
                newPermissions.add(permission);
            } else {
                newPermissions.delete(permission);
            }
            return { ...prev, permissions: Array.from(newPermissions) };
        });
    };

    const handleSaveRole = () => {
        if (!formData.name.trim()) {
            alert('Role name is required.');
            return;
        }

        if (editingRole) {
            setRoles(roles.map(r => r.id === editingRole.id ? { ...r, ...formData } : r));
        } else {
            const newRole: Role = {
                id: `ROLE-${Date.now()}`,
                ...formData
            };
            setRoles([...roles, newRole]);
        }
        setShowModal(false);
    };

    const usersPerRole = (roleId: string) => users.filter(u => u.roleId === roleId).length;

    return <>
        <div className="flex justify-end mb-4">
            <button onClick={() => handleOpenModal()} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 flex items-center space-x-2">
                <ShieldCheck size={18} />
                <span>Add New Role</span>
            </button>
        </div>
        <div className="space-y-4">
            {roles.map(role => (
                <div key={role.id} className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-lg text-teal-600 dark:text-teal-400">{role.name}</h4>
                            <p className="text-sm text-gray-500">{usersPerRole(role.id)} user(s) in this role</p>
                        </div>
                        <button onClick={() => handleOpenModal(role)} className="text-blue-500 hover:text-blue-700" aria-label={`Edit ${role.name}`}>
                            <Edit size={18} />
                        </button>
                    </div>
                    <div className="mt-3">
                        <h5 className="text-sm font-semibold mb-2">Permissions:</h5>
                        <div className="flex flex-wrap gap-2">
                            {role.permissions.map(p => (
                                <span key={p} className="text-xs bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded-full">{ALL_PERMISSIONS[p]}</span>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {showModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl">
                    <h3 className="text-xl font-bold mb-4">{editingRole ? 'Edit Role' : 'Add New Role'}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Role Name</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1">Permissions</label>
                             <div className="max-h-80 overflow-y-auto space-y-4 p-3 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                {Object.entries(permissionGroups).map(([group, permissions]) => (
                                    <div key={group}>
                                        <h4 className="font-semibold capitalize text-teal-700 dark:text-teal-300 mb-2 border-b dark:border-gray-700 pb-1">{group}</h4>
                                        <div className="space-y-2">
                                            {permissions.map(p => (
                                                <label key={p.key} className="flex items-center space-x-2 cursor-pointer">
                                                    <input type="checkbox" checked={formData.permissions.includes(p.key)} onChange={e => handlePermissionChange(p.key, e.target.checked)} className="form-checkbox h-4 w-4 text-teal-600"/>
                                                    <span>{p.value}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end space-x-4">
                        <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">Cancel</button>
                        <button onClick={handleSaveRole} className="px-4 py-2 bg-teal-600 text-white rounded-lg">{editingRole ? 'Update Role' : 'Save Role'}</button>
                    </div>
                </div>
            </div>
        )}
    </>
}

const UserManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
    
    return (
        <Card title="">
             <div className="flex border-b dark:border-gray-700 mb-4">
                <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-4 py-2 font-semibold ${activeTab === 'users' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500'}`}>
                    <Users size={18} /> All Users
                </button>
                <button onClick={() => setActiveTab('roles')} className={`flex items-center gap-2 px-4 py-2 font-semibold ${activeTab === 'roles' ? 'border-b-2 border-teal-500 text-teal-600' : 'text-gray-500'}`}>
                    <KeyRound size={18} /> Roles & Permissions
                </button>
            </div>
            {activeTab === 'users' ? <UsersTab /> : <RolesTab />}
        </Card>
    );
};


const Settings: React.FC = () => {
    const { settings, setSettings, customers, services, employees, invoices, appointments, expenses, memberships } = useAppContext();
    const [localSettings, setLocalSettings] = useState(settings);
    const [activeTab, setActiveTab] = useState<SettingsTab>('companyDetails');
    const [smsPrompt, setSmsPrompt] = useState('');
    const [generatedSms, setGeneratedSms] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [onlineBookingEnabled, setOnlineBookingEnabled] = useState(false);
    
    const bookingUrl = 'https://zenithspa.book.online/xyz123';
    const embedCode = `<iframe src="${bookingUrl}" width="100%" height="600" style="border:none;"></iframe>`;

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
        const finalValue = isCheckbox ? checked : (type === 'number' ? parseFloat(value) || 0 : value);

        setLocalSettings(prev => {
            if (Object.keys(prev.thermalPrintSettings).includes(name)) {
                return { ...prev, thermalPrintSettings: { ...prev.thermalPrintSettings, [name]: finalValue }};
            }
            return { ...prev, [name]: finalValue };
        });
    };
    
    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalSettings(prev => ({ ...prev, thermalPrintSettings: { ...prev.thermalPrintSettings, companyLogo: reader.result as string }}));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveSettings = () => {
        setSettings(localSettings);
        alert('Settings saved successfully!');
    };

    const handleBackup = () => {
        const data = { customers, services, employees, invoices, appointments, expenses, settings, memberships };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zenith-spa-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target?.result as string);
                    if (data.customers && data.settings) {
                        alert("Restoring data is a premium feature. For now, we've just loaded it.");
                        console.log("Restored data:", data);
                    } else { throw new Error("Invalid backup file format"); }
                } catch (error) {
                    alert("Failed to restore data. The file might be corrupted or in the wrong format.");
                }
            };
            reader.readAsText(file);
        }
    };
    
    const handleGenerateSms = async () => {
        if (!smsPrompt) return;
        setIsLoading(true);
        setGeneratedSms('');
        const fullPrompt = `Generate a short, friendly, and professional SMS message for a spa promotion. The message should be under 160 characters. Topic: "${smsPrompt}"`;
        const content = await generateSmsContent(fullPrompt);
        setGeneratedSms(content);
        setIsLoading(false);
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'companyDetails':
                return (
                    <Card title="Company Details">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                                <label className="block font-medium mb-1">Company Name</label>
                                <input type="text" name="companyName" value={localSettings.companyName} onChange={handleSettingsChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                             <div>
                                <label className="block font-medium mb-1">Company Phone</label>
                                <input type="text" name="companyPhone" value={localSettings.companyPhone} onChange={handleSettingsChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block font-medium mb-1">Company Address</label>
                                <textarea name="companyAddress" value={localSettings.companyAddress} onChange={handleSettingsChange} rows={3} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"></textarea>
                            </div>
                             <div>
                                <label className="block font-medium mb-1">Tax Info (e.g., VAT ID, GSTIN)</label>
                                <input type="text" name="taxInfo" value={localSettings.taxInfo} onChange={handleSettingsChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                            </div>
                             <div>
                                <h4 className="font-medium mb-1 text-gray-700 dark:text-gray-300">Company Logo</h4>
                                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800">
                                    {localSettings.thermalPrintSettings.companyLogo ? (
                                        <img src={localSettings.thermalPrintSettings.companyLogo} alt="Logo Preview" className="h-full object-contain p-2"/>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center">
                                            <UploadCloud className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400"/>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Upload Logo</p>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                                </label>
                            </div>
                        </div>
                    </Card>
                );
             case 'general':
                return (
                    <Card title="General System Settings">
                         <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg max-w-sm">
                            <label className="block font-medium mb-1">VAT / Tax Rate (%)</label>
                            <input type="number" name="vatRate" value={localSettings.vatRate} onChange={handleSettingsChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                        </div>
                    </Card>
                );
            case 'thermalPrint':
                return (
                    <Card title="Thermal Print Settings">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                            <div>
                                <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Receipt Elements</h4>
                                <div className="space-y-1 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                    <ToggleSwitch label="Terms & Conditions" name="printTerms" checked={localSettings.thermalPrintSettings.printTerms} onChange={handleSettingsChange} description="Print terms on receipt."/>
                                    <ToggleSwitch label="Company Details" name="printCompanyDetails" checked={localSettings.thermalPrintSettings.printCompanyDetails} onChange={handleSettingsChange} description="Include company details."/>
                                    <ToggleSwitch label="Item Description" name="printItemDescription" checked={localSettings.thermalPrintSettings.printItemDescription} onChange={handleSettingsChange} description="Print product descriptions." />
                                    <ToggleSwitch label="Taxable Amount" name="printTaxableAmount" checked={localSettings.thermalPrintSettings.printTaxableAmount} onChange={handleSettingsChange} description="Display taxable amount."/>
                                    <ToggleSwitch label="Show Item HSN/SAC" name="showHSN" checked={localSettings.thermalPrintSettings.showHSN} onChange={handleSettingsChange} description="Show HSN code."/>
                                    <ToggleSwitch label="Show Cash Received" name="showCashReceived" checked={localSettings.thermalPrintSettings.showCashReceived} onChange={handleSettingsChange} description="Display amount received."/>
                                </div>
                            </div>
                             <div>
                                <h4 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">Branding & Printer</h4>
                                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-medium mb-1 text-sm">Org. Name Font</label>
                                            <input type="number" name="orgNameFontSize" value={localSettings.thermalPrintSettings.orgNameFontSize} onChange={handleSettingsChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                        </div>
                                        <div>
                                            <label className="block font-medium mb-1 text-sm">Co. Name Font</label>
                                            <input type="number" name="companyNameFontSize" value={localSettings.thermalPrintSettings.companyNameFontSize} onChange={handleSettingsChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Select Printer</label>
                                        <select name="selectedPrinter" value={localSettings.thermalPrintSettings.selectedPrinter} onChange={handleSettingsChange} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                                            <option value="thermal_80mm">80mm Thermal Printer</option>
                                            <option value="standard_a4">Standard Printer (A4)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">QR Codes</label>
                                        <div className="space-y-1 p-1 bg-white dark:bg-gray-800 rounded-lg flex flex-col justify-center">
                                            <ToggleSwitch label="Google Reviews" name="showGoogleReviewsQR" checked={localSettings.thermalPrintSettings.showGoogleReviewsQR} onChange={handleSettingsChange} />
                                            <ToggleSwitch label="Static Payment QR" name="showPaymentQR" checked={localSettings.thermalPrintSettings.showPaymentQR} onChange={handleSettingsChange} />
                                            <ToggleSwitch label="Dynamic UPI QR" name="showDynamicUPIQR" checked={localSettings.thermalPrintSettings.showDynamicUPIQR} onChange={handleSettingsChange} description="QR with amount and invoice ID." />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                );
            case 'notesAndTerms':
                return (
                     <Card title="Notes & Terms">
                        <label className="block font-medium mb-1">Default notes for receipts, quotes, or invoices</label>
                        <textarea name="notes" value={localSettings.thermalPrintSettings.notes} onChange={handleSettingsChange} rows={5} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"></textarea>
                    </Card>
                );
            case 'database':
                return (
                    <Card title="Database Management">
                        <p className="mb-4">Backup or restore your application data. Use with caution.</p>
                        <div className="flex space-x-4">
                            <button onClick={handleBackup} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Backup Data</button>
                            <label className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 cursor-pointer">
                                <span>Restore Data</span>
                                <input type="file" accept=".json" onChange={handleRestore} className="hidden" />
                            </label>
                        </div>
                    </Card>
                );
             case 'integrations':
                return (
                     <div className="space-y-6">
                        <Card title="Online Booking & Appointments">
                            <p className="mb-4">Allow customers to book appointments directly from your website.</p>
                            <div className="space-y-4">
                                <ToggleSwitch label="Enable Online Booking Page" name="onlineBooking" checked={onlineBookingEnabled} onChange={(e) => setOnlineBookingEnabled(e.target.checked)} description="Activates your public booking page."/>
                                {onlineBookingEnabled && (
                                <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                                    <div>
                                    <label className="block font-medium mb-1">Your Booking Link</label>
                                    <div className="flex items-center space-x-2">
                                        <input type="text" readOnly value={bookingUrl} className="w-full p-2 bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 rounded-md" />
                                        <button onClick={() => navigator.clipboard.writeText(bookingUrl)} className="bg-gray-200 dark:bg-gray-600 px-3 py-2 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                    </div>
                                    <div>
                                    <label className="block font-medium mb-1">Embed on Your Website</label>
                                    <textarea readOnly value={embedCode} rows={3} className="w-full p-2 bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 rounded-md font-mono text-sm"></textarea>
                                    </div>
                                </div>
                                )}
                            </div>
                        </Card>
                        <Card title="AI Marketing Assistant (SMS)">
                            <p className="mb-4">Use AI to generate promotional SMS for your customers.</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-medium mb-1">Promotion Topic</label>
                                    <input type="text" value={smsPrompt} onChange={(e) => setSmsPrompt(e.target.value)} placeholder="e.g., 20% off on weekend massages" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                                </div>
                                <button onClick={handleGenerateSms} disabled={isLoading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                                    {isLoading ? 'Generating...' : 'Generate SMS'}
                                </button>
                                {generatedSms && (
                                    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                                        <h4 className="font-semibold mb-2">Generated Message:</h4>
                                        <p className="italic">{generatedSms}</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                     </div>
                );
            case 'profile': return <ComingSoon title="My Profile" />;
            case 'allUsers': return <UserManagement />;
            case 'preferences': return <ComingSoon title="Interface Preferences" />;
            case 'barcode': return <ComingSoon title="Barcode Settings" />;
            case 'signatures': return <ComingSoon title="Digital Signatures" />;
            case 'reminders': return <ComingSoon title="Auto Reminders" />;
            case 'banking':
                return (
                    <Card title="Banking & Payments">
                        <div className="space-y-6">
                            <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-lg">
                                <h4 className="font-bold text-teal-800 dark:text-teal-200 flex items-center mb-2">
                                    <Smartphone className="mr-2" size={20} />
                                    Dynamic UPI QR Configuration
                                </h4>
                                <p className="text-sm text-teal-700 dark:text-teal-300 mb-4">
                                    Configure your UPI details to generate dynamic QR codes for each transaction. 
                                    This will auto-fill the amount and invoice ID for your customers.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Merchant UPI ID</label>
                                        <input 
                                            type="text" 
                                            name="upiId" 
                                            value={localSettings.upiId} 
                                            onChange={handleSettingsChange} 
                                            placeholder="e.g., merchant@upi" 
                                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" 
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">Your VPA (Virtual Payment Address)</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Merchant Name</label>
                                        <input 
                                            type="text" 
                                            name="merchantName" 
                                            value={localSettings.merchantName} 
                                            onChange={handleSettingsChange} 
                                            placeholder="e.g., Zenith Spa" 
                                            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" 
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">Name displayed on customer's payment app</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 border dark:border-gray-700 rounded-lg">
                                    <h4 className="font-semibold mb-3 flex items-center">
                                        <Banknote className="mr-2" size={18} />
                                        Bank Account Details
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Account Number</label>
                                            <input type="text" placeholder="XXXX XXXX XXXX" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">IFSC Code</label>
                                            <input type="text" placeholder="ABCD0123456" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 text-sm" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                    <h4 className="font-semibold mb-2">Payment Methods Enabled</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Cash Payments</span>
                                            <CheckCircle size={16} className="text-green-500" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">UPI Payments (Dynamic)</span>
                                            <CheckCircle size={16} className="text-green-500" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Card Payments</span>
                                            <CheckCircle size={16} className="text-green-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                );
            default: return null;
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Settings</h2>
                <button onClick={handleSaveSettings} className="bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors">
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                {/* --- SIDEBAR --- */}
                <div className="md:col-span-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md space-y-4">
                    <div>
                        <h3 className="px-3 py-2 text-xs font-bold uppercase text-gray-400">Profile & Company</h3>
                        <NavItem label="Company Details" icon={Building} active={activeTab === 'companyDetails'} onClick={() => setActiveTab('companyDetails')} />
                        <NavItem label="My Profile" icon={User} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                        <NavItem label="User Management" icon={Users} active={activeTab === 'allUsers'} onClick={() => setActiveTab('allUsers')} />
                    </div>
                    <div>
                        <h3 className="px-3 py-2 text-xs font-bold uppercase text-gray-400">System</h3>
                        <NavItem label="General" icon={SettingsIcon} active={activeTab === 'general'} onClick={() => setActiveTab('general')} />
                        <NavItem label="Preferences" icon={SlidersHorizontal} active={activeTab === 'preferences'} onClick={() => setActiveTab('preferences')} />
                        <NavItem label="Thermal Print" icon={Printer} active={activeTab === 'thermalPrint'} onClick={() => setActiveTab('thermalPrint')} />
                        <NavItem label="Barcode" icon={Barcode} active={activeTab === 'barcode'} onClick={() => setActiveTab('barcode')} />
                    </div>
                     <div>
                        <h3 className="px-3 py-2 text-xs font-bold uppercase text-gray-400">Documents</h3>
                        <NavItem label="Notes & Terms" icon={FileText} active={activeTab === 'notesAndTerms'} onClick={() => setActiveTab('notesAndTerms')} />
                        <NavItem label="Auto Reminders" icon={MessageSquare} active={activeTab === 'reminders'} onClick={() => setActiveTab('reminders')} />
                        <NavItem label="Signatures" icon={Signature} active={activeTab === 'signatures'} onClick={() => setActiveTab('signatures')} />
                    </div>
                    <div>
                        <h3 className="px-3 py-2 text-xs font-bold uppercase text-gray-400">Advanced</h3>
                        <NavItem label="Banking" icon={Banknote} active={activeTab === 'banking'} onClick={() => setActiveTab('banking')} />
                        <NavItem label="Integrations" icon={Bot} active={activeTab === 'integrations'} onClick={() => setActiveTab('integrations')} />
                        <NavItem label="Database" icon={Database} active={activeTab === 'database'} onClick={() => setActiveTab('database')} />
                    </div>
                </div>

                {/* --- CONTENT --- */}
                <div className="md:col-span-3">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default Settings;