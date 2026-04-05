
import React from 'react';
import { Clock, UserCircle } from 'lucide-react';
import GlobalSearch from './GlobalSearch';

const Header: React.FC = () => {
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center gap-4">
      <GlobalSearch />
      <div className="flex items-center space-x-4 flex-shrink-0">
        <div className="hidden sm:flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <Clock size={20} />
          <span>{time.toLocaleTimeString()}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <UserCircle size={24} />
          <span className="font-medium">Admin</span>
        </div>
      </div>
    </header>
  );
};

export default Header;