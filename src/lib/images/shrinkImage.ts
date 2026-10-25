// Browser-only: downsizes large JPEG/PNG images before upload. The logo is embedded in every
// generated PDF, so a 4000px / 1.5 MB banner would make each certificate needlessly heavy.

export const LOGO_MAX_WIDTH = 1600;
const SMALL_ENOUGH_BYTES = 400 * 1024;
const JPEG_QUALITY = 0.85;

export async function shrinkImage(file: File, maxWidth = LOGO_MAX_WIDTH): Promise<File> {
	if (file.type !== 'image/jpeg' && file.type !== 'image/png') return file;

	const bitmap = await createImageBitmap(file);
	try {
		if (bitmap.width <= maxWidth && file.size <= SMALL_ENOUGH_BYTES) return file;

		const scale = Math.min(1, maxWidth / bitmap.width);
		const canvas = document.createElement('canvas');
		canvas.width = Math.round(bitmap.width * scale);
		canvas.height = Math.round(bitmap.height * scale);
		const context = canvas.getContext('2d');
		if (!context) return file;
		context.imageSmoothingQuality = 'high';
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, file.type, JPEG_QUALITY)
		);
		if (!blob || blob.size >= file.size) return file;
		return new File([blob], file.name, { type: file.type, lastModified: Date.now() });
	} finally {
		bitmap.close();
	}
}

export function formatBytes(bytes: number): string {
	return bytes >= 1024 * 1024
		? `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
		: `${Math.round(bytes / 1024)} KB`;
}
