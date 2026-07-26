import { CreditCard, Calendar, Download, Plus, Trash2 } from 'lucide-react';

export default function Billing() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>Billing</h1>
          <p>Manage your billing information and payment methods</p>
        </div>
        <button type="button" className="btn-primary">
          <Plus size={18} /> Add Payment Method
        </button>
      </div>

      <div className="billing-container">
        <section className="billing-section">
          <h2>Payment Methods</h2>
          <div className="payment-methods">
            <div className="payment-card">
              <div className="payment-card-header">
                <CreditCard size={24} />
                <span className="card-type">Visa ending in 4242</span>
                <span className="card-default">Default</span>
              </div>
              <div className="payment-card-body">
                <p>Expires 12/2025</p>
              </div>
              <div className="payment-card-actions">
                <button type="button" className="btn-secondary btn-sm">
                  Edit
                </button>
                <button type="button" className="btn-danger btn-sm">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="billing-section">
          <h2>Billing History</h2>
          <div className="billing-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Jan 15, 2026</td>
                  <td>Monthly Subscription - Pro Plan</td>
                  <td>$49.00</td>
                  <td><span className="status completed">Paid</span></td>
                  <td>
                    <button type="button" className="btn-secondary btn-sm">
                      <Download size={14} /> Invoice
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>Dec 15, 2025</td>
                  <td>Monthly Subscription - Pro Plan</td>
                  <td>$49.00</td>
                  <td><span className="status completed">Paid</span></td>
                  <td>
                    <button type="button" className="btn-secondary btn-sm">
                      <Download size={14} /> Invoice
                    </button>
                  </td>
                </tr>
                <tr>
                  <td>Nov 15, 2025</td>
                  <td>Monthly Subscription - Pro Plan</td>
                  <td>$49.00</td>
                  <td><span className="status completed">Paid</span></td>
                  <td>
                    <button type="button" className="btn-secondary btn-sm">
                      <Download size={14} /> Invoice
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="billing-section">
          <h2>Current Plan</h2>
          <div className="plan-card">
            <div className="plan-header">
              <h3>Pro Plan</h3>
              <span className="plan-price">$49/month</span>
            </div>
            <ul className="plan-features">
              <li>Unlimited referrals</li>
              <li>Advanced analytics</li>
              <li>Priority support</li>
              <li>Hospital routing</li>
              <li>Custom branding</li>
            </ul>
            <button type="button" className="btn-secondary">
              Change Plan
            </button>
          </div>
        </section>

        <section className="billing-section">
          <h2>Next Billing Date</h2>
          <div className="next-billing">
            <Calendar size={24} />
            <div>
              <p>February 15, 2026</p>
              <small>Your next payment of $49.00 will be processed automatically</small>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
