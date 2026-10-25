// Domain types shared by server and client code.

export type Gender = 'F' | 'M';
export type CertificateTypeCode = 'residence' | 'residence_conduct' | 'conduct';
export type CertificateStatus = 'pending' | 'approved' | 'rejected';
export type AdminRole = 'admin' | 'reviewer';

/** Shape of `certificates.resident_snapshot` (JSON). */
export interface ResidentSnapshot {
	nationalId: string;
	firstNames: string;
	lastNames: string;
	gender: Gender;
	maritalStatus: string | null;
	occupation: string | null;
	streetAddress: string;
	houseNumber: string | null;
	phone: string | null;
}
