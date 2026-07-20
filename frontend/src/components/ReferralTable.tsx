const referrals = [
  {
    patient: 'John Cooper',
    from: 'City Clinic',
    to: 'City Hospital',
    reason: 'Cardiology Consultation',
    status: 'Pending',
    date: 'May 22, 2025',
    avatar: 'https://i.pravatar.cc/80?img=32'
  },
  {
    patient: 'Jane Smith',
    from: 'Health Plus',
    to: 'Metro Hospital',
    reason: 'Orthopedic Evaluation',
    status: 'Accepted',
    date: 'May 21, 2025',
    avatar: 'https://i.pravatar.cc/80?img=47'
  },
  {
    patient: 'Robert Johnson',
    from: 'Care Clinic',
    to: 'City Hospital',
    reason: 'Neurology Consultation',
    status: 'Rejected',
    date: 'May 20, 2025',
    avatar: 'https://i.pravatar.cc/80?img=12'
  },
  {
    patient: 'Emily Davis',
    from: 'City Clinic',
    to: 'Metro Hospital',
    reason: 'Blood Test',
    status: 'Accepted',
    date: 'May 20, 2025',
    avatar: 'https://i.pravatar.cc/80?img=44'
  },
  {
    patient: 'Michael Brown',
    from: 'Health Plus',
    to: 'City Hospital',
    reason: 'General Surgery',
    status: 'Pending',
    date: 'May 19, 2025',
    avatar: 'https://i.pravatar.cc/80?img=59'
  }
];

export default function ReferralTable() {
  return (
    <section className="panel referral-table">
      <div className="panel-header">
        <h2>Recent Referrals</h2>
        <button>View all</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>From</th>
              <th>To</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((referral) => (
              <tr key={`${referral.patient}-${referral.date}`}>
                <td>
                  <div className="patient-cell">
                    <img src={referral.avatar} alt={referral.patient} />
                    <span>{referral.patient}</span>
                  </div>
                </td>
                <td>{referral.from}</td>
                <td>{referral.to}</td>
                <td>{referral.reason}</td>
                <td>
                  <span className={`status ${referral.status.toLowerCase()}`}>{referral.status}</span>
                </td>
                <td>{referral.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
