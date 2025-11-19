import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	images: {
		remotePatterns: [
			{
				protocol: "http",
				hostname: "localhost",
				port: "4566",
				pathname: "/**",
			},
			// TODO: Remove picsum.photos once real event images are uploaded
			{
				protocol: "https",
				hostname: "picsum.photos",
				pathname: "/**",
			},
			// Production S3 bucket
			{
				protocol: "https",
				hostname: "convive-iteso-prod.s3.us-east-1.amazonaws.com",
				pathname: "/**",
			},
			// Alternative S3 URL format
			{
				protocol: "https",
				hostname: "convive-iteso-prod.s3.amazonaws.com",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
