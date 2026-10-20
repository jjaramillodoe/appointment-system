'use client';

import { Home, UserCircle, Calendar as CalendarIcon } from 'lucide-react';
import { DASHBOARD_CONTENT_CLASS } from './shell';
import { useI18n } from '@/contexts/I18nContext';

type TabType = 'dashboard' | 'profile' | 'appointments';

interface TabNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  const { t } = useI18n();
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: t.dashboard.tabs.dashboard,
      icon: Home,
    },
    {
      id: 'profile' as TabType,
      label: t.dashboard.tabs.profile,
      icon: UserCircle,
    },
    {
      id: 'appointments' as TabType,
      label: t.dashboard.tabs.appointments,
      icon: CalendarIcon,
    },
  ];

  return (
    <div className="bg-white border-b-2 border-primary-200">
      <div className={DASHBOARD_CONTENT_CLASS}>
        <nav className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`py-4 px-4 rounded-t-lg font-semibold text-sm transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 border-b-4 border-primary-600'
                    : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 