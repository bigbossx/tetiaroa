import GoogleSheetTool from "../lib/google/index.js";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

process.env.HTTP_PROXY = "http://127.0.0.1:1087";
process.env.HTTPS_PROXY = "http://127.0.0.1:1087";

new GoogleSheetTool({
  // log: true,
  batch: [
    {
      spreadsheetId: "18XOx3OVPstZAF4WI0b1QFLr4Wiirn4pKW7ABgPvw27k",
      range: "Web多语言!C2:G",
    },
    {
      spreadsheetId: "18XOx3OVPstZAF4WI0b1QFLr4Wiirn4pKW7ABgPvw27k",
      range: "产品运营!C2:G",
    },
  ],
  lang: {
    ar: 1,
    en: 2,
  },
  ouput: {
    path: resolve(__dirname, "./lang"),
    module: "es6", // support 'json' 'common' 'es6'
    ext: ".js",
  },
  complete: () => {
    console.log("done");
  },
  // customOutputCallback: (rows) => {
  //   console.log("\x1b[36m%s\x1b[0m", "-----------------");
  //   console.log("\x1b[36m%s\x1b[0m", "请自定义输出格式:⬇️  原数据");
  //   console.log("\x1b[36m%s\x1b[0m", "-----------------");
  //   console.table(rows);
  //   return rows // u have to return data
  // },
});
