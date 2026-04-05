
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileText, Calendar, Users, ShoppingBag, UserCheck, BarChart2, Settings, Receipt, Award, Activity, Sparkles } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/billing', icon: FileText, label: 'Billing' },
  { to: '/appointments', icon: Calendar, label: 'Appointments' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/services', icon: ShoppingBag, label: 'Services/Items' },
  { to: '/employees', icon: UserCheck, label: 'Employees' },
  { to: '/memberships', icon: Award, label: 'Memberships' },
  { to: '/membership-activity', icon: Activity, label: 'Benefit Usage' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/ai-studio', icon: Sparkles, label: 'AI Studio' },
];

const Sidebar: React.FC = () => {
  const linkClasses = "flex items-center px-4 py-3 text-gray-300 hover:bg-teal-700 hover:text-white rounded-lg transition-colors duration-200";
  const activeLinkClasses = "bg-teal-700 text-white";

  return (
    <aside className="w-64 bg-teal-800 text-white flex-shrink-0 flex flex-col p-4">
      <div className="text-2xl font-bold mb-8 px-4">Zenith Spa</div>
      <nav className="flex-1 space-y-2">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `${linkClasses} ${isActive ? activeLinkClasses : ''}`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto text-center text-xs text-gray-400">
        <p>&copy; 2024 Zenith POS</p>
        <p>Version 1.0.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;