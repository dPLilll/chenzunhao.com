import * as esbuild from "esbuild";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outdir = resolve(here, "../prompt/assets");

const shared = {
  bundle: true,
  format: "iife",
  jsx: "automatic",
  target: "es2020",
  minify: true,
  charset: "utf8",
  legalComments: "none",
  define: { "process.env.NODE_ENV": '"production"' },
};

for (const name of ["sangang", "champion", "kids"]) {
  await esbuild.build({
    ...shared,
    entryPoints: [resolve(here, "entries", name + ".tsx")],
    outfile: resolve(outdir, name + ".js"),
  });
  console.log("built", name);
}
