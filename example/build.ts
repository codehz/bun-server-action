import { ServerActionPlugin } from "..";

const result = await Bun.build({
  entrypoints: ["test.action.ts"],
  plugins: [new ServerActionPlugin({ baseDir: import.meta.dir, importSource: "./proxy" })],
  outdir: '.build'
});

console.log(result)
