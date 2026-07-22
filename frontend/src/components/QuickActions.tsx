import { CalendarPlus, ClipboardPlus, FlaskConical, UserPlus } from 'lucide-react';

type Props = {
  onNewReferral: () => void;
  onNewAppointment: () => void;
  onAddPatient: () => void;
  onLabRequest: () => void;
};

const actions = [
  { label: 'New Referral', icon: ClipboardPlus, key: 'referral' },
  { label: 'New Appointment', icon: CalendarPlus, key: 'appointment' },
  { label: 'Add Patient', icon: UserPlus, key: 'patient' },
  { label: 'Lab Request', icon: FlaskConical, key: 'lab' }
] as const;

export default function QuickActions({ onNewReferral, onNewAppointment, onAddPatient, onLabRequest }: Props) {
  const handlers = {
    referral: onNewReferral,
    appointment: onNewAppointment,
    patient: onAddPatient,
    lab: onLabRequest
  };

  return (
    <section className="panel quick-actions">
      <div className="panel-header">
        <h2>Quick Actions</h2>
      </div>
      <div className="action-grid">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              type="button"
              key={action.key}
              className="action-btn"
              onClick={handlers[action.key]}
            >
              <Icon size={22} />
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
