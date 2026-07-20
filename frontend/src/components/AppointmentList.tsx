const appointments = [
  { patient: 'John Cooper', type: 'General Checkup', doctor: 'Dr. Sarah Wilson', time: '10:30 AM', status: 'Confirmed' },
  { patient: 'Jane Smith', type: 'Cardiology', doctor: 'Dr. Michael Brown', time: '11:00 AM', status: 'Confirmed' },
  { patient: 'Robert Johnson', type: 'Follow-up', doctor: 'Dr. Emily Davis', time: '02:00 PM', status: 'Pending' }
];

export default function AppointmentList() {
  return (
    <section className="panel appointment-panel">
      <div className="panel-header">
        <h2>Upcoming Appointments</h2>
        <button>View all</button>
      </div>
      <div className="appointment-list">
        {appointments.map((appointment) => (
          <article className="appointment-item" key={`${appointment.patient}-${appointment.time}`}>
            <div className="date-pill">
              <span>May</span>
              <strong>22</strong>
              <small>{appointment.time}</small>
            </div>
            <div>
              <strong>{appointment.patient}</strong>
              <p>{appointment.type}</p>
              <small>{appointment.doctor}</small>
            </div>
            <span className={`status ${appointment.status.toLowerCase()}`}>{appointment.status}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
