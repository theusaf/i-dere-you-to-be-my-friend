import {
  ExtensionFormatLoose,
  ExtensionType,
  LoaderParser,
  LoaderParserPriority,
  extensions,
  utils,
} from "pixi.js";
import { parse } from "yaml";

export function registerYAMLParserExtension(): void {
  const yamlLoaderParser: LoaderParser = {
    test(url): boolean {
      const { pathname } = new URL(url);
      return (
        utils.path.extname(pathname) === ".yaml" ||
        utils.path.extname(pathname) === ".yml"
      );
    },
    async load<T>(url: string): Promise<T> {
      return (await fetch(url).then((res) => res.text())) as T;
    },
    async testParse(asset: unknown): Promise<boolean> {
      return typeof asset === "string" && !!asset;
    },
    parse<T>(asset: string): T {
      return parse(asset);
    },
  };
  const yamlParserExtension: ExtensionFormatLoose = {
    name: "yaml-parser",
    type: ExtensionType.LoadParser,
    ref: yamlLoaderParser,
    priority: LoaderParserPriority.High,
  };

  extensions.add(yamlParserExtension);
}
