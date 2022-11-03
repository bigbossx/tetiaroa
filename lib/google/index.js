const { writeFileSync, readFileSync } = require("fs");
const { google } = require("googleapis");
const { resolve } = require("path");
const SheetTool = require("../index.js");
const { getPort, createServer } = require("../helper.js");

const tokenPath = resolve(__dirname, "./token.json");

module.exports = class GoogleSheetTool extends SheetTool {
  constructor(config) {
    super(config);
  }
  async authorize(options) {
    const credentials = require("./credentials.json");
    const { client_secret, client_id } = credentials.installed;
    const port = await getPort();
    const oAuth2Client = await new google.auth.OAuth2(
      client_id,
      client_secret,
      `http://localhost:${port}`
    );
    try {
      const token = readFileSync(tokenPath);
      oAuth2Client.setCredentials(JSON.parse(token));
      return oAuth2Client;
    } catch (error) {
      const { getCode, closeServer } = await createServer(port);

      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: options.scope,
      });
      console.log("\x1b[36m%s\x1b[0m", "请访问该链接获取认证:", authUrl);
      const code = await getCode;

      const token = await new Promise((resolve, reject) => {
        oAuth2Client.getToken(code, (err, t) => {
          if (err) {
            reject(`${err}\n请参照README 开启代理`);
          }
          resolve(t);
        });
      });
      oAuth2Client.setCredentials(token);
      writeFileSync(tokenPath, JSON.stringify(token, null, 2), "utf-8");
      await closeServer();
      return oAuth2Client;
    }
  }

  async getSheetBatch(auth) {
    const { batch, customOutputCallback } = this.options;
    const sheets = google.sheets({ version: "v4", auth });
    const rows = await Promise.all(
      batch.map(
        (b) =>
          new Promise((resolve, reject) => {
            sheets.spreadsheets.values.get(b, (err, res) => {
              if (err) {
                return reject(err);
              }
              if (customOutputCallback) {
                resolve(customOutputCallback(res.data.values));
              } else {
                resolve(res.data.values);
              }
            });
          })
      )
    );
    return rows.reduce((per, cur) => per.concat(cur), []);
  }
};
