import * as Gluon from "@gluon-framework/gluon";
import express from "express";
import path from "node:path";
import { existsSync, createWriteStream } from "node:fs";
import { readFile, writeFile, readdir, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import archiver from "archiver";
import yauzl from "yauzl";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

if (existsSync(path.join(dirname, "../dist/"))) {
  app.use(express.static(path.join(dirname, "../dist")));
} else if (existsSync(path.join(dirname, "dist"))) {
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

window.ipc.expose("save", async (data: string, id: string) => {
  await mkdir(path.join(dirname, "saves"), { recursive: true });
  const stream = createWriteStream(path.join(dirname, "saves", `${id}.zip`));
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });
  archive.pipe(stream);
  return new Promise((resolve) => {
    archive.on("close", resolve);
    archive.append(data, { name: "save.yaml" });
    archive.finalize();
  });
});

window.ipc.expose("setLatestSave", async (id: string) => {
  await mkdir(path.join(dirname, "data"), { recursive: true });
  await writeFile(path.join(dirname, "data", "latestSave"), id);
});

window.ipc.expose("getLatestSave", async () => {
  try {
    return await readFile(path.join(dirname, "data", "latestSave"), "utf8");
  } catch (err) {
    return null;
  }
});

window.ipc.expose("load", async (id: string) => {
  try {
    const data = await readFile(path.join(dirname, "saves", `${id}.zip`));
    return await new Promise((resolve, reject) => {
      yauzl.fromBuffer(data, { lazyEntries: true }, (err, zipfile) => {
        if (err) return reject(err);
        zipfile.readEntry();
        zipfile.on("entry", (entry) => {
          if (entry.fileName !== "save.yaml") {
            zipfile.readEntry();
            return;
          }
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) return reject(err);
            let data = "";
            readStream.on("data", (chunk) => {
              data += chunk;
            });
            readStream.on("end", () => {
              zipfile.close();
              resolve(data);
            });
          });
        });
      });
    });
  } catch (err) {
    return null;
  }
});

window.ipc.expose("delete", async (id: string) => {
  try {
    await rm(path.join(dirname, "saves", `${id}.zip`));
  } catch (err) {
    console.error(err);
  }
});

window.ipc.expose("list", async () => {
  try {
    return (await readdir(path.join(dirname, "saves"))).map((file) => {
      return file.replace(/\.zip$/, "");
    });
  } catch (err) {
    return [];
  }
});
