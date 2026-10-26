// Test-only helpers to set up data in the in-memory D1. All data is fictitious.
import { hashPassword } from '../password.ts';
import { newId, type AdminRole, type Db } from '../db.ts';

export async function insertAdminUser(
	db: Db,
	user: { username: string; password: string; role?: AdminRole; isActive?: boolean }
): Promise<string> {
	const id = newId();
	const { hash, salt } = await hashPassword(user.password);
	await db.run(
		`INSERT INTO admin_users (id, username, display_name, password_hash, password_salt, role, is_active)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		id,
		user.username,
		user.username,
		hash,
		salt,
		user.role ?? 'admin',
		user.isActive === false ? 0 : 1
	);
	return id;
}

/** Shifts a date by some minutes, to move through rate-limit windows without waiting. */
export const minutesAfter = (date: Date, minutes: number) =>
	new Date(date.getTime() + minutes * 60 * 1000);
