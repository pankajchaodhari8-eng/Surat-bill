
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Billing from './pages/Billing';
import Appointments from './pages/Appointments';
import Customers from './pages/Customers';
import Services from './pages/Services';
import Employees from './pages/Employees';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Expenses from './pages/Expenses';
import Memberships from './pages/Memberships';
import MembershipActivity from './pages/MembershipActivity';
// Fix: Changed import to a named import as GeminiStudio is not a default export.
import { GeminiStudio } from './pages/GeminiStudio';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/services" element={<Services />} />
              <Route path="/employees" element={<Employees />} />
              <Route path="/memberships" element={<Memberships />} />
              <Route path="/membership-activity" element={<MembershipActivity />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/ai-studio" element={<GeminiStudio />} />
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  );
};

export default App;