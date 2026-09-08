import path from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { router } from "./routes/index.js";

const apiRoot = process.cwd();

export function createApp() {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "img-src": ["'self'", "data:", "https://img.youtube.com", "https:"],
          "frame-src": ["'self'", "https://www.youtube.com"],
          "media-src": ["'self'"],
          "connect-src": ["'self'"],
        },
      },
    }),
  );
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.use("/uploads", express.static(path.join(apiRoot, process.env.UPLOADS_DIR ?? "uploads")));

  app.use("/api", router);
  app.use("/api", notFoundHandler);
  app.use("/api", errorHandler);

  const distDir = path.join(apiRoot, "..", "dist");
  app.use(express.static(distDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });

  return app;
}
