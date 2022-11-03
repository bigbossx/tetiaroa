import { writeFileSync, readFileSync } from "fs";
import { google } from "googleapis";
import { createRequire } from "module";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import SheetTool from "../index.mjs";
import { getPort, createServer } from "../helper.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tokenPath = resolve(__dirname, "./token.json");

export default class GoogleSheetTool extends SheetTool {
  constructor(config) {
    super(config);
  }
  async authorize(options) {
    const require = createRequire(import.meta.url);
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
}
