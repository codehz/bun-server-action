import type { BunPlugin, PluginBuilder, Target } from "bun";
import { relative } from "node:path";

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

function escapeString(value: string) {
  return JSON.stringify(value);
}

export class ServerActionPlugin implements BunPlugin {
  name = "bun-server-action";
  target = "browser" as Target;
  #transpiler = new Bun.Transpiler();
  #collected: [string, string[]][] = [];
  constructor(public options: { baseDir: string; importSource: string }) {}

  get routes(): Record<string, string[]> {
    return Object.fromEntries(
      this.#collected.toSorted((a, b) => a[0].localeCompare(b[0]))
    );
  }
  setup = ({ onLoad }: PluginBuilder) => {
    const { baseDir, importSource } = this.options;
    this.#collected = [];
    onLoad(
      {
        filter: new RegExp(
          "^" + escapeRegExp(baseDir) + "/.*" + "\\.action\\.[tj]sx?$"
        ),
      },
      async ({ path }) => {
        const { exports } = this.#transpiler.scan(await Bun.file(path).text());
        this.#collected.push([path, exports]);
        const escapedPath = escapeString(relative(baseDir, path));
        const code = exports
          .map(
            (fn) =>
              `export const ${fn} = __createServerActionProxy(${escapedPath}, "${fn}");`
          )
          .join("\n");
        return {
          contents: `import { createServerActionProxy as __createServerActionProxy } from "${importSource}";\n${code}\n`,
          loader: "js",
        };
      }
    );
  };
}
