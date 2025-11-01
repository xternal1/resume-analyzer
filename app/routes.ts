import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("/auth", "routes/auth.tsx"),
    route("/upload/:id", "routes/upload.tsx"), // <- taruh sebelum /upload
    route("/upload", "routes/upload.tsx"),
    route("/resume/:id", "routes/resume.tsx"),
    route("/cipher", "routes/cipher.tsx"),
] satisfies RouteConfig;
