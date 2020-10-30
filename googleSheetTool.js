const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const TOKEN_PATH = "token.json";

// this tool rewrite from office exmaple
module.exports = class GoogleSheetTool {
  constructor(options) {
    this._greeting();
    this._verifyOptions(options);
    this.options = {
      version: "v4",
      lang: {
        zh: 2,
        en: 3,
        ar: 4,
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
    fs.readFile("./credentials.json", (err, content) => {
      if (err) return console.log("Error loading client secret file:", err);
      // Authorize a client with credentials, then call the Google Docs API.
      this._authorize(JSON.parse(content), this._listMajors.bind(this));
    });
  }
  _greeting() {
    console.log("\x1b[36m%s\x1b[0m", fs.readFileSync("./logo.txt", "utf-8"));
  }
  _verifyOptions(options) {
    if (!options.spreadsheetId) {
      return console.error("options spreadsheetId is required");
    }
    if (!options.range) {
      return console.error("options range is required");
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
    fs.readFile(TOKEN_PATH, (err, token) => {
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
        if (err) return console.error("Error retrieving access token", err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) console.error(err);
          console.log("\x1b[32m", "Token stored to", TOKEN_PATH);
        });
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
    const {
      spreadsheetId,
      range,
      version,
      customOutputCallback,
    } = this.options;
    const sheets = google.sheets({ version, auth });
    sheets.spreadsheets.values.get(
      {
        spreadsheetId,
        range,
      },
      (err, res) => {
        if (err) return console.log("The API returned an error: " + err);
        const rows = res.data.values;
        if (rows.length) {
          let res;
          if (customOutputCallback) {
            res = customOutputCallback(rows);
          } else {
            res = this._formatOuputData(rows);
          }
          this._generateFile(res);
        } else {
          console.log("No data found.");
        }
      }
    );
  }
  _formatOuputData(data) {
    const { groups = [], lang } = this.options;
    const result = {};
    for (const key in lang) {
      result[key] = {};
    }
    let index = 0;

    while (groups.length) {
      const group = groups.shift();
      if (group <= 1) return;
      const groupData = data.splice(0, group);
      for (const key in lang) {
        result[key][`group${index}`] = groupData.map((row) => row[lang[key]]);
      }
      index++;
    }
    while (data.length) {
      const row = data.shift();
      if (!row[0]) {
        continue;
      }
      for (const key in lang) {
        this._setProperty(result[key], row[0], row[lang[key]] || "");
      }
    }
    return result;
  }
  _generateFile(result) {
    console.log("👇👇 已获取文档数据 👇👇");
    console.table(result);
    const { ouput } = this.options;
    for (const key in result) {
      fs.mkdirSync(ouput, { recursive: true });
      fs.writeFile(
        `${ouput}/${key}.js`,
        `export default ${JSON.stringify(result[key], null, 2)}`,
        "utf8",
        (err) => {
          if (err) {
            return console.error(err);
          }
          console.log(
            "\x1b[32m",
            " 🌟  👋  💋  🐔 Successfully generate File🌟 :",
            `${ouput}/${key}.js`
          );
        }
      );
    }
  }
  _setProperty(obj, name = "", value) {
    name = name.split(".");
    for (var i = 0; i < name.length - 1; i++) {
      if (typeof obj[name[i]] !== "object" || !obj[name[i]]) obj[name[i]] = {};
      obj = obj[name[i]];
    }
    obj[name.pop()] = value;
  }
};
