import type { Appointment } from '../Types';

type Props = {
  appointments: Appointment[];
};

export default function AppointmentList({ appointments }: Props) {
  return (
    <section className="panel appointment-panel">
      <div className="panel-header">
        <h2>Upcoming Appointments</h2>
        <button type="button">View all</button>
      </div>
      <div className="appointment-list">
        {appointments.length === 0 ? (
          <p className="empty-text">No upcoming appointments</p>
        ) : (
          appointments.map((appointment) => {
            const date = new Date(appointment.date);
            return (
              <article className="appointment-item" key={appointment.id}>
                <div className="date-pill">
                  <span>{date.toLocaleDateString('en-US', { month: 'short' })}</span>
                  <strong>{date.getDate()}</strong>
                  <small>{appointment.time}</small>
                </div>
                <div>
                  <strong>{appointment.patientName}</strong>
                  <p>{appointment.type}</p>
                  <small>{appointment.doctorName}</small>
                </div>
                <span className={`status ${appointment.status}`}>{appointment.status}</span>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
