import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
    Visitor photographs are served from Supabase storage. Next refuses remote
    images from hosts it has not been told about, which is a sensible default —
    without this the gallery renders nothing and the error only appears in the
    server log.
  */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qnsomzxhnagzjwjhetzu.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  /* config options here */
};

export default nextConfig;
