import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Captura del comprobante de pago (Yape / Plin): hasta 5 MB más el sobre del formulario.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
