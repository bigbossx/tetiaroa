import { inspect } from "util";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { is, setProperty } from "./helper.mjs";
import ora from "ora";
import { createRequire } from "module";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const { name } = require("../package.json");

const __dirname = dirname(fileURLToPath(import.meta.url));
const logoPath = resolve(__dirname, "./logo.txt");

let authorizeStatus = null; // 保证多个实例并彳亍时，只会进行一次授权

export default class SheetTool {
  constructor(config) {
    this.spinner = ora().start();
    this.options = this.mergeOptions(config);
    this.run();
  }
  async run() {
    this.logger(() => {
      console.log("\x1b[36m%s\x1b[0m", readFileSync(logoPath));
    });
    const auth = await (authorizeStatus ||
      (authorizeStatus = this.authorize(this.options)));
    const sheets = await this.getSheetBatch(auth);
    const afterSheets = await this.resolveSheet(sheets);
    await this.generateOutput(afterSheets);
    this.spinner.succeed();
    process.exit(0); // fix mac m1 13 server.close not working
  }
  mergeOptions(userConfig) {
    const options = {
      scope: ["https://www.googleapis.com/auth/spreadsheets"],
      ...userConfig,
    };

    const truely =
      options.batch &&
      options.batch.length &&
      options.batch.every((b) => b.spreadsheetId && b.range);

    if (!truely) {
      this.error(
        "config error for not spreadsheetId or range in batch, or batch in not array"
      );
    }
    return options;
  }
  async resolveSheet(rows) {
    const { lang } = this.options;
    const result = {};

    while (rows.length) {
      const row = rows.shift();
      if (!row[0]) {
        continue;
      }
      for (const key in lang) {
        let curVal = row[lang[key]];
        let rowKey = row[0];
        if (is.hasWrap(curVal)) {
          curVal = curVal.split("\n");
        }
        setProperty(result, `${key}.${rowKey}`, curVal || "");
      }
    }
    return result;
  }
  async generateOutput(result) {
    this.logger(() => {
      console.log("👇👇 已获取文档数据 👇👇");
      console.table(result);
    });
    const { ouput, complete } = this.options;
    for (const key in result) {
      !existsSync(ouput.path) && mkdirSync(ouput.path, { recursive: true });

      const file = `${ouput.path}/${key}${ouput.ext}`;
      switch (ouput.ext) {
        case ".js":
          const prefix =
            ouput.module === "common" ? "module.exports = " : "export default ";
          writeFileSync(file, `${prefix}${inspect(result[key])}`, "utf-8");
          break;
        case ".json":
          writeFileSync(file, JSON.stringify(result[key], null, 2), "utf-8");
          break;
        default:
          this.error("not support output file ext");
      }
      this.logger(() => {
        console.log(
          "\x1b[32m%s\x1b[0m",
          " 🌟  👋  💋  🐔 Successfully generate File🌟 :",
          file
        );
      });
    }
    complete && complete();
  }

  logger(fn) {
    const { log } = this.options;
    log && fn && fn();
  }
  error(message) {
    console.log("\x1b[31m%s\x1b[0m", `[${name}] ${message}`);
    process.exit(1);
  }
}
