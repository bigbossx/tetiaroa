const axios = require("axios");
const { writeFileSync, readFileSync } = require("fs");
const { resolve } = require("path");
const { getPort, createServer } = require("../helper.js");
const SheetTool = require("../index.js");

const tokenPath = resolve(__dirname, "./token.json");

module.exports = class FeishuSheetTool extends SheetTool {
  constructor(config) {
    super(config);
  }
  async authorize() {
    try {
      return JSON.parse(readFileSync(tokenPath)).access_token;
    } catch (error) {
      const { app_id, app_secret } = require("./app.json");
      const {
        data: { tenant_access_token: tenantAccessToken },
      } = await axios({
        url: "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
        method: "POST",
        data: {
          app_id,
          app_secret,
        },
      });

      const port = await getPort();
      const { getCode, closeServer } = await createServer(port);
      const authUrl = `https://open.feishu.cn/open-apis/authen/v1/index?app_id=${app_id}&redirect_uri=${encodeURIComponent(
        `http://localhost:${port}`
      )}`;
      console.log("\x1b[36m%s\x1b[0m", "请访问该链接获取认证:", authUrl);
      const code = await getCode;

      const { data } = await axios({
        url: "https://open.feishu.cn/open-apis/authen/v1/access_token",
        method: "POST",
        headers: {
          Authorization: `Bearer ${tenantAccessToken}`,
        },
        data: {
          grant_type: "authorization_code",
          code,
        },
      });
      writeFileSync(tokenPath, JSON.stringify(data.data, null, 2), "utf-8");
      await closeServer();
      return data.data.access_token;
    }
  }
  async getSheetBatch(auth) {
    const { batch, customOutputCallback } = this.options;
    const rows = await Promise.all(
      batch.map(async ({ range, spreadsheetId }) => {
        const { data } = await axios({
          url: `https://open.feishu.cn/open-apis/sheets/v2/spreadsheets/${spreadsheetId}/values/${range}`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${auth}`,
          },
        });
        const values = data.data.valueRange.values;
        return customOutputCallback
          ? await customOutputCallback(values)
          : values;
      })
    );
    return rows.reduce((per, cur) => per.concat(cur), []);
  }
};
