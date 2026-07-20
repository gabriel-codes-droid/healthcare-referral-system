export interface Referral {
  _id: string;

  patientName: string;

  clinicName: string;

  hospitalName: string;

  status:
    | "pending"
    | "accepted"
    | "rejected";
}
