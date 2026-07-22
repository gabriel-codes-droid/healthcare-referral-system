import type { Referral } from '../Types';

type Props = {
  referrals: Referral[];
  onViewAll?: () => void;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function ReferralTable({ referrals, onViewAll }: Props) {
  return (
    <>
    <section className="panel referral-table">
      <div className="panel-header">
        <h2>Recent Referrals</h2>
        <button type="button" onClick={onViewAll}>
          View all
        </button>
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
            {referrals.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  No referrals yet
                </td>
              </tr>
            ) : (
              referrals.map((referral) => (
                <tr key={referral.id}>
                  <td>
                    <div className="patient-cell">
                      <img
                        src={referral.patientAvatar || `https://i.pravatar.cc/80?u=${referral.patientName}`}
                        alt={referral.patientName}
                      />
                      <span>{referral.patientName}</span>
                    </div>
                  </td>
                  <td>{referral.fromOrganization}</td>
                  <td>{referral.toOrganization}</td>
                  <td>{referral.reason}</td>
                  <td>
                    <span className={`status ${referral.status}`}>{referral.status}</span>
                  </td>
                  <td>{formatDate(referral.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
    </>
  );
}
