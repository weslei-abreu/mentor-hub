import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

function copyHtaccess() {
  return {
    name: "copy-htaccess",
    closeBundle() {
      const from = path.resolve(process.cwd(), "public", ".htaccess");
      const to = path.resolve(process.cwd(), "dist", ".htaccess");
      if (existsSync(from)) copyFileSync(from, to);
    },
  };
}

function listenFromAppUrl(value: string | undefined) {
  if (!value) return {};
  try {
    const url = new URL(value);
    return {
      host: url.hostname,
      ...(url.port ? { port: Number(url.port) } : {}),
    };
  } catch {
    return {};
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiOrigin = env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3333";
  const listen = listenFromAppUrl(env.VITE_APP_URL);
  const proxy = {
    "/api": apiOrigin,
    "/uploads": apiOrigin,
  };

  return {
    plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      tsconfigPaths(),
      copyHtaccess(),
    ],
    server: {
      ...listen,
      proxy,
    },
    preview: {
      ...listen,
      proxy,
    },
    optimizeDeps: {
      include: [
        "recharts",
        "lucide-react",
        "sonner",
        "@radix-ui/react-dialog",
        "@radix-ui/react-select",
        "@radix-ui/react-progress",
        "@radix-ui/react-tabs",
        "@radix-ui/react-alert-dialog",
      ],
    },
  };
});
