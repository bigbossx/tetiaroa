const path = require("path");
process.env.HTTP_PROXY = "http://127.0.0.1:1087";
process.env.HTTPS_PROXY = "http://127.0.0.1:1087";

const GoogleSheetTool = require("./googleSheetTool");

new GoogleSheetTool({
  spreadsheetId: "18XOx3OVPstZAF4WI0b1QFLr4Wiirn4pKW7ABgPvw27k",
  range: "产品运营!C2:G",
  groups: [11],
  ouput: path.resolve(__dirname, "./lang"),
  // customOutputCallback: (rows) => {
  //   console.log("\x1b[36m%s\x1b[0m", "-----------------");
  //   console.log("\x1b[36m%s\x1b[0m", "请自定义输出格式:⬇️  原数据");
  //   console.log("\x1b[36m%s\x1b[0m", "-----------------");
  //   console.table(rows);
  //   return rows // u have to return data
  // },
});
