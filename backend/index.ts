import * as Gluon from "@gluon-framework/gluon";
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

if (fs.existsSync(path.join(dirname, "../dist/"))) {
  app.use(express.static(path.join(dirname, "../dist")));
} else if (fs.existsSync(path.join(dirname, "dist"))) {
  app.use(express.static(path.join(dirname, "dist")));
}

const port = process.argv[2]
  ? parseInt(process.argv[2])
  : await getListeningPort();
const window = await Gluon.open(`http://localhost:${port}`, {
  allowHTTP: true,
});

const closeInterval = setInterval(() => {
  if (window.closed) {
    clearInterval(closeInterval);
    console.log("Window closed, exiting");
    process.exit(0);
  }
}, 2000);

async function getListeningPort() {
  let port = 3050;
  for (let i = 0; i < 50; i++) {
    try {
      await bindToPort(port);
      return port;
    } catch (err) {
      port++;
    }
  }
  throw new Error("No available port found");
}

function bindToPort(port: number) {
  return new Promise<void>((resolve, reject) => {
    app
      .listen(port, () => {
        console.log(`Listening on port ${port}`);
        resolve();
      })
      .on("error", (err: { errno?: string }) => {
        if ("EADDRINUSE" === err?.errno) {
          console.log(`Error: ${err}`);
          reject(err);
        }
      });
  });
}
