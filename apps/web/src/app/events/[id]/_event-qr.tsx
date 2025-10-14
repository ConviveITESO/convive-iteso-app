"use client";

import { QRCodeSVG } from "qrcode.react";

interface QrCodeProps {
	value: string;
	size?: number;
}

export function QrCode({ value, size = 256 }: QrCodeProps) {
	return (
		<div className="flex items-center justify-center">
			<QRCodeSVG value={value} size={size} />
		</div>
	);
}
