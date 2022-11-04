const { readFileSync } = require("fs");
const { resolve } = require("path");
const { getPort, createServer } = require("../helper.js");
const SheetTool = require("../index.js");
const { FeishuApi } = require("./api.js");

const tokenPath = resolve(__dirname, "./token.json");

module.exports = class FeishuSheetTool extends SheetTool {
  constructor(config) {
    super(config);
  }
  async authorize() {
    const appConfig = require("./app.json");
    try {
      const now = Date.now();
      const {
        access_token,
        refresh_token,
        refresh_expires_in_timestamp,
        expires_in_timestamp,
      } = JSON.parse(readFileSync(tokenPath));

      if (now < expires_in_timestamp) {
        return access_token;
      } else if (now < refresh_expires_in_timestamp) {
        const { app_access_token } = await FeishuApi.getAppAccessToken(
          appConfig
        );
        const { data } = await FeishuApi.refreshAccessToken(
          app_access_token,
          refresh_token
        );
        FeishuApi.writeAuthToDisk(tokenPath, data);
        return data.access_token;
      } else {
        throw new Error("feishu need relogin");
      }
    } catch (error) {
      const { tenant_access_token } = await FeishuApi.getTenantAccessToken(
        appConfig
      );
      const port = await getPort();
      const { getCode, closeServer } = await createServer(port);
      const authUrl = FeishuApi.generateAuthUrl(appConfig.app_id, port);
      console.log("\x1b[36m%s\x1b[0m", "请访问该链接获取认证:", authUrl);
      const code = await getCode;

      const { data } = await FeishuApi.getUserAccessToken(
        code,
        tenant_access_token
      );
      FeishuApi.writeAuthToDisk(tokenPath, data);
      await closeServer();
      return data.access_token;
    }
  }
  async getSheetBatch(auth) {
    const { batch, customOutputCallback } = this.options;
    const rows = await Promise.all(
      batch.map(async (b) => {
        const { data } = await FeishuApi.getSheet({ ...b, auth });
        const values = data.valueRange.values;
        return customOutputCallback
          ? await customOutputCallback(values)
          : values;
      })
    );
    return rows.reduce((per, cur) => per.concat(cur), []);
  }
};
