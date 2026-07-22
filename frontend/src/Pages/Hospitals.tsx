import { useEffect, useState } from 'react';
import { Building2, FlaskConical, Stethoscope } from 'lucide-react';
import { api } from '../services/api';
import type { Hospital } from '../Types';

const icons = {
  hospital: Building2,
  clinic: Stethoscope,
  laboratory: FlaskConical
};

export default function Hospitals() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  useEffect(() => {
    api.getHospitals().then(setHospitals).catch(console.error);
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Hospitals & Clinics</h1>
          <p>Network facilities for referrals and care</p>
        </div>
      </div>
      <section className="hospital-grid">
        {hospitals.map((hospital) => {
          const Icon = icons[hospital.type];
          return (
            <article key={hospital.id} className="hospital-card">
              <span className="hospital-icon">
                <Icon size={24} />
              </span>
              <div>
                <strong>{hospital.name}</strong>
                <p className="capitalize">{hospital.type}</p>
                <small>{hospital.location}</small>
              </div>
            </article>
          );
        })}
      </section>
    </>
  );
}
