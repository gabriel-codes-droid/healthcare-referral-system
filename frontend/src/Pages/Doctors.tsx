import { useEffect, useState } from 'react';
import { Star, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Doctor } from '../Types';

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    api.getDoctors().then(setDoctors).catch(console.error);
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/" className="back-link-header">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1>Doctors</h1>
          <p>Specialists across the Sympra network</p>
        </div>
      </div>
      <section className="doctor-grid">
        {doctors.map((doctor) => (
          <article key={doctor.id} className="doctor-card">
            <img src={doctor.avatar} alt={doctor.name} />
            <div>
              <strong>{doctor.name}</strong>
              <p>{doctor.specialty}</p>
              <span className="rating">
                <Star size={14} /> {doctor.rating}
              </span>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
