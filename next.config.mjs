import path from "node:path";

const nextConfig = {
  typedRoutes: true,
  output: "standalone",
  outputFileTracingRoot: path.resolve(process.cwd())
};

export default nextConfig;
