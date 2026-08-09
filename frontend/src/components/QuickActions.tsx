import { useNavigate } from 'react-router-dom';
import { CalendarPlus, ClipboardPlus, FlaskConical, UserPlus, ListChecks } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

type Props = {
  onNewReferral: () => void;
  onNewAppointment: () => void;
  onAddPatient: () => void;
  onLabRequest: () => void;
};

export default function QuickActions({ onNewReferral, onNewAppointment, onAddPatient, onLabRequest }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const actions =
    user?.role === 'lab'
      ? [
          { label: t('dashboard.viewTestQueue'), icon: ListChecks, onClick: () => navigate('/laboratories') },
          { label: t('dashboard.addPatient'), icon: UserPlus, onClick: onAddPatient }
        ]
      : [
          { label: t('dashboard.newReferral'), icon: ClipboardPlus, onClick: onNewReferral },
          { label: t('dashboard.newAppointment'), icon: CalendarPlus, onClick: onNewAppointment },
          { label: t('dashboard.addPatient'), icon: UserPlus, onClick: onAddPatient },
          { label: t('dashboard.labRequest'), icon: FlaskConical, onClick: onLabRequest }
        ];

  return (
    <section className="panel quick-actions">
      <div className="panel-header">
        <h2>{t('dashboard.quickActions')}</h2>
      </div>
      <div className="action-grid">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button type="button" key={action.label} className="action-btn" onClick={action.onClick}>
              <Icon size={22} />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
