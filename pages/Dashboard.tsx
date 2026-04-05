
import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import { useAppContext } from '../contexts/AppContext';
import { DollarSign, Calendar, Users, ArrowRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { invoices, appointments, customers } = useAppContext();

  const today = new Date().toISOString().split('T')[0];

  const todaysRevenue = invoices
    .filter(inv => inv.date.startsWith(today))
    .reduce((sum, inv) => sum + inv.total, 0);

  const upcomingAppointments = appointments
    .filter(apt => new Date(apt.date) >= new Date())
    .length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Today's Revenue" icon={<DollarSign size={24} />}>
          <p className="text-3xl font-bold text-teal-500">${todaysRevenue.toFixed(2)}</p>
        </Card>
        <Card title="Upcoming Appointments" icon={<Calendar size={24} />}>
          <p className="text-3xl font-bold text-blue-500">{upcomingAppointments}</p>
        </Card>
        <Card title="Total Customers" icon={<Users size={24} />}>
          <p className="text-3xl font-bold text-indigo-500">{customers.length}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Quick Actions">
          <div className="flex flex-col space-y-3">
            <Link to="/billing" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition">
              <span>Create New Bill</span>
              <ArrowRight size={20} />
            </Link>
            <Link to="/appointments" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition">
              <span>Schedule Appointment</span>
              <ArrowRight size={20} />
            </Link>
            <Link to="/customers" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition">
              <span>Add New Customer</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </Card>
        <Card title="Recent Invoices">
            {invoices.length > 0 ? (
                <ul className="space-y-2">
                {invoices.slice(-5).reverse().map(inv => (
                    <li key={inv.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <div>
                        <p className="font-medium">{inv.customerName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(inv.date).toLocaleString()}</p>
                    </div>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">${inv.total.toFixed(2)}</span>
                    </li>
                ))}
                </ul>
            ) : (
                <p>No recent invoices.</p>
            )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
