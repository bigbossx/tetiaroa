const { FeishuSheetTool } = require("..");
const { resolve } = require("path");

new FeishuSheetTool({
  // log: true,
  batch: [
    {
      spreadsheetId: "shtcn9zTzJMl4twIj77Ske0BpWg",
      range: "gurXqj!D2:F100",
    },
  ],
  ouput: {
    path: resolve(__dirname, "./lang"),
    module: "es6", // support 'json' 'common' 'es6'
    ext: ".js",
  },
  lang: {
    ar: 1,
    en: 2,
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
