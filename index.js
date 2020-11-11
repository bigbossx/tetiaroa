const fs = require("fs");
const readline = require("readline");
const path = require("path");
const { inspect } = require("util");
const { google } = require("googleapis");
const Utils = require("./utils");
const TOKEN_PATH = "token.json";

// this tool rewrite from office exmaple
module.exports = class GoogleSheetTool {
  constructor(options) {
    this._greeting();
    this._verifyOptions(options);
    this.options = {
      lang: {
        zh: 2,
        en: 3,
        ar: 4,
      },
      ouput: {
        path: path.resolve(process.cwd(), "./lang"),
        module: "es6",
        ext: ".js",
      },
      SCOPES: ["https://www.googleapis.com/auth/spreadsheets"],
      ...options,
    };
    this._main();
  }

  // forceUpdate() {
  //   fs.unlinkSync(TOKEN_PATH);
  //   this._main();
  // }

  _main() {
    fs.readFile(Utils.pathResolveDir("./credentials.json"), (err, content) => {
      if (err) return console.log("Error loading client secret file:", err);
      // Authorize a client with credentials, then call the Google Docs API.
      this._authorize(JSON.parse(content), this._listMajors.bind(this));
    });
  }
  _greeting() {
    console.log(
      "\x1b[36m%s\x1b[0m",
      fs.readFileSync(Utils.pathResolveDir("./logo.txt"), "utf-8")
    );
  }
  _verifyOptions(options) {
    const { docs = [] } = options;
    for (let i = 0; i < docs.length - 1; i++) {
      const item = docs[i];
      if (!item.spreadsheetId) {
        throw new Error("options spreadsheetId is required");
      }
      if (!item.range) {
        throw new Error("options range is required");
      }
    }
  }
  _authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    // Check if we have previously stored a token.
    fs.readFile(Utils.pathResolveDir(TOKEN_PATH), (err, token) => {
      if (err) return this._getNewToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
  }

  _getNewToken(oAuth2Client, callback) {
    const { SCOPES } = this.options;
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
    });
    console.log("\x1b[36m%s\x1b[0m", "请访问该链接以获取google认证:", authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question("请将认证码粘贴到此: ", (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err)
          return console.error(
            "你被cc防火墙挡住了，请参照README 开启代理",
            err
          );
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(
          Utils.pathResolveDir(TOKEN_PATH),
          JSON.stringify(token),
          (err) => {
            if (err) console.error(err);
            console.log("\x1b[32m%s\x1b[0m", "Token stored to", TOKEN_PATH);
          }
        );
        callback(oAuth2Client);
      });
    });
  }

  /**
   * Prints the names and majors of students in a sample spreadsheet:
   * @see https://docs.google.com/spreadsheets/d/18XOx3OVPstZAF4WI0b1QFLr4Wiirn4pKW7ABgPvw27k/edit#gid=0 shayla
   * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
   */
  _listMajors(auth) {
    const { batch, customOutputCallback } = this.options;
    const sheets = google.sheets({ version: "v4", auth });
    let index = 0;
    let result = {};
    batch.map(({ spreadsheetId, range }) => {
      sheets.spreadsheets.values.get(
        {
          spreadsheetId,
          range,
        },
        (err, res) => {
          if (err) return console.log("The API returned an error: " + err);
          index++;
          const rows = res.data.values;
          if (rows.length) {
            let temp;
            if (customOutputCallback) {
              temp = customOutputCallback(rows);
            } else {
              temp = this._formatOuputData(rows);
            }
            Utils.merge(temp, result);
            if (index >= batch.length) {
              this._generateFile(result);
            }
          } else {
            console.log("No data found.");
          }
        }
      );
    });
  }
  _formatOuputData(data) {
    const { lang } = this.options;
    const result = {};

    while (data.length) {
      const row = data.shift();
      if (!row[0]) {
        continue;
      }
      for (const key in lang) {
        let curVal = row[lang[key]];
        let rowKey = row[0];
        if (Utils.is.hasColon(rowKey)) {
          const rowKeyArr = rowKey.split(":");
          rowKey = rowKeyArr[0];
          const objType = rowKeyArr[1];
          try {
            switch (objType) {
              case "Array":
                curVal = eval(curVal); //  😜
                break;
              default:
                break;
            }
          } catch (e) {
            throw new Error("Parse Error:" + e);
          }
        }
        if (Utils.is.hasWrap(curVal)) {
          curVal = curVal.split("\n");
        }
        Utils.setProperty(result, `${key}.${rowKey}`, curVal || "");
      }
    }
    return result;
  }
  _generateFile(result) {
    console.log("👇👇 已获取文档数据 👇👇");
    console.table(result);
    const { ouput, complete } = this.options;
    for (const key in result) {
      if (!fs.existsSync(ouput.path)) {
        fs.mkdirSync(ouput.path, { recursive: true });
      }
      const file = `${ouput.path}/${key}${ouput.ext}`;
      switch (ouput.ext) {
        case ".js":
          const prefix =
            ouput.module === "common" ? "module.exports = " : "export default ";
          fs.writeFileSync(file, `${prefix}${inspect(result[key])}`, "utf8");
          break;
        case ".json":
          fs.writeFileSync(file, JSON.stringify(result[key], null, 2), "utf8");
          break;
        default:
          break;
      }
      console.log(
        "\x1b[32m%s\x1b[0m",
        " 🌟  👋  💋  🐔 Successfully generate File🌟 :",
        file
      );
    }
    complete && complete();
  }
};
