const FeishuSheetTool = require("./lib/feishu/index.js");
const GoogleSheetTool = require("./lib/google/index.js");

module.exports = GoogleSheetTool; // compat for old version
module.exports.FeishuSheetTool = FeishuSheetTool;
