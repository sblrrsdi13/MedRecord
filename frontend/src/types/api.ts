export type RoleName = "ADMIN" | "RECEPTIONIST" | "NURSE" | "DOCTOR" | "PHARMACY" | "CASHIER" | "PATIENT";

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export type UserSession = {
  id: string;
  name: string;
  email: string;
  role: RoleName;
};

export type Patient = {
  id: string;
  patientCode?: string | null;
  medicalRecordNo?: string | null;
  userId?: string | null;
  name: string;
  nik?: string;
  gender: "MALE" | "FEMALE";
  birthDate: string;
  phone?: string;
  address?: string;
  bloodType?: string;
  allergyNotes?: string;
};

export type QueueStatus = "waiting" | "called" | "in_progress" | "skipped" | "completed" | "cancelled";

export type QueueItem = {
  id: string;
  queueNumber: string;
  sequence: number;
  status: QueueStatus;
  polyclinicId: string;
  patient?: Patient;
  polyclinic: {
    id: string;
    name: string;
    queuePrefix: string;
  };
};



