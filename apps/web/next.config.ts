import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	// TODO: Remove this when moving to production and add the proper domains
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
		],
	},
};

export default nextConfig;
