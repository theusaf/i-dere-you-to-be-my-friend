import { buildSync } from "esbuild";

buildSync({
  platform: "node",
  bundle: true,
  format: "esm",
  banner: {
    // hack from https://github.com/evanw/esbuild/pull/2067#issuecomment-1324171716
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
  minify: true,
  outfile: "./build-backend/app.js",
  entryPoints: ["./backend/index.ts"],
});
