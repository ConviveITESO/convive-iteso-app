import crypto from "node:crypto";

export function sha256(buffer: string): Buffer {
	return crypto.createHash("sha256").update(buffer).digest();
}

export function randomBytes(size: number): Buffer {
	return crypto.randomBytes(size);
}
