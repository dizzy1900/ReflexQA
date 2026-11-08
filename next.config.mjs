/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Hides the dev build badge so it never appears in the agent's screenshots.
  devIndicators: { buildActivity: false },
  experimental: {
    // Playwright ships native binaries and must stay out of the server bundle.
    serverComponentsExternalPackages: ["playwright", "playwright-core"],
  },
};

export default nextConfig;
