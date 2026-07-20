export interface User {
  _id: string;
  name: string;
  email: string;

  role:
    | "patient"
    | "clinic"
    | "hospital"
    | "lab"
    | "admin";
}