import type { Doctor } from '../Types';
import { Star } from 'lucide-react';

type Props = {
  doctors: Doctor[];
};

export default function TopDoctors({ doctors }: Props) {
  return (
    <section className="panel top-doctors">
      <div className="panel-header">
        <h2>Top Doctors</h2>
      </div>
      <ul className="doctor-list">
        {doctors.map((doctor) => (
          <li key={doctor.id}>
            <img src={doctor.avatar} alt={doctor.name} />
            <div>
              <strong>{doctor.name}</strong>
              <p>{doctor.specialty}</p>
            </div>
            <span className="rating">
              <Star size={14} />
              {doctor.rating}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
