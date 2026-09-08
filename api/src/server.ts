import "dotenv/config";
import { createApp } from "./app.js";

function resolvePort(): number {
  const fromPort = Number(process.env.PORT);
  if (Number.isInteger(fromPort) && fromPort > 0 && fromPort <= 65535) {
    return fromPort;
  }

  if (process.env.APP_URL) {
    try {
      const fromUrl = Number(new URL(process.env.APP_URL).port);
      if (Number.isInteger(fromUrl) && fromUrl > 0 && fromUrl <= 65535) {
        return fromUrl;
      }
    } catch {
      /* ignore invalid APP_URL */
    }
  }

  return 3333;
}

const port = resolvePort();
const app = createApp();

app.listen(port, () => {
  const publicUrl = process.env.APP_URL?.replace(/\/$/, "") ?? `http://localhost:${port}`;
  console.log(`API rodando em ${publicUrl}`);
});
