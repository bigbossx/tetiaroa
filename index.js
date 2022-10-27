const { inspect } = require("util");
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { google } = require("googleapis");
const http = require("http");
const url = require("url");
const getPort = require("get-port");
const { name } = require("./package.json");
const {
  setProperty,
  is,
  PATH,
  getPathFromCwd,
  getPathFromCurrent,
} = require("./helper");

// this tool rewrite from office exmaple

let authorizeStatus = null; // 保证多个实例并彳亍时，只会进行一次授权

const authorize = async (options) => {
  const credentials = JSON.parse(
    readFileSync(
      getPathFromCurrent(PATH.credentials) // this json cv from google developer
    )
  );
  const { client_secret, client_id } = credentials.installed;
  const port = await getPort();

  const oAuth2Client = await new google.auth.OAuth2(
    client_id,
    client_secret,
    `http://localhost:${port}`
  );
  try {
    const token = readFileSync(getPathFromCurrent(PATH.token));
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (error) {
    let getCodePromiseResolve;
    const getCode = new Promise((resolve) => {
      getCodePromiseResolve = resolve;
    });

    const closeServer = await createHttpServer(port, async (req, res) => {
      const queryObject = url.parse(req.url, true).query;
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("It worked! ! ! Just close this tab");
      getCodePromiseResolve(queryObject.code);
    });

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: options.scope,
    });

    console.log("\x1b[36m%s\x1b[0m", "请访问该链接以获取google认证:", authUrl);
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
    writeFileSync(
      getPathFromCurrent(PATH.token),
      JSON.stringify(token),
      "utf-8"
    );
    await closeServer();
    return oAuth2Client;
  }
};

const createHttpServer = async (port, callback) =>
  new Promise((resolve) => {
    const server = http.createServer(callback);
    server.listen(port, () => {
      resolve(() => new Promise((res) => server.close(res)));
    });
  });

module.exports = class GoogleSheetTool {
  constructor(options) {
    this.options = this.mergeOptions(options);
    this.run();
  }

  mergeOptions(userConfig) {
    const options = {
      lang: {
        zh: 2,
        en: 3,
        ar: 4,
      },
      ouput: {
        path: getPathFromCwd(PATH.lang),
        module: "es6",
        ext: ".js",
      },
      scope: ["https://www.googleapis.com/auth/spreadsheets"],
      ...userConfig,
    };

    const truely =
      options.batch &&
      options.batch.length &&
      options.batch.every((b) => b.spreadsheetId && b.range);

    if (!truely) {
      this.error(
        "config error for not spreadsheetId or range in batch, or batch in not array"
      );
    }
    return options;
  }

  async run() {
    this.logger(() => {
      console.log(
        "\x1b[36m%s\x1b[0m",
        readFileSync(getPathFromCurrent(PATH.logo))
      );
    });

    const auth = await (authorizeStatus ||
      (authorizeStatus = authorize(this.options)));
    const sheets = await this.getSheetBatch(auth);
    const afterSheets = await this.resolveSheet(sheets);
    await this.generateOutput(afterSheets);
  }

  /**
   * Prints the names and majors of students in a sample spreadsheet:
   * @see https://docs.google.com/spreadsheets/d/18XOx3OVPstZAF4WI0b1QFLr4Wiirn4pKW7ABgPvw27k/edit#gid=0 shayla
   * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
   */
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

  async resolveSheet(rows) {
    const { lang } = this.options;
    const result = {};

    while (rows.length) {
      const row = rows.shift();
      if (!row[0]) {
        continue;
      }
      for (const key in lang) {
        let curVal = row[lang[key]];
        let rowKey = row[0];
        if (is.hasWrap(curVal)) {
          curVal = curVal.split("\n");
        }
        setProperty(result, `${key}.${rowKey}`, curVal || "");
      }
    }
    return result;
  }

  async generateOutput(result) {
    this.logger(() => {
      console.log("👇👇 已获取文档数据 👇👇");
      console.table(result);
    });
    const { ouput, complete } = this.options;
    for (const key in result) {
      if (!existsSync(ouput.path)) {
        mkdirSync(ouput.path, { recursive: true });
      }
      const file = `${ouput.path}/${key}${ouput.ext}`;
      switch (ouput.ext) {
        case ".js":
          const prefix =
            ouput.module === "common" ? "module.exports = " : "export default ";
          writeFileSync(file, `${prefix}${inspect(result[key])}`, "utf-8");
          break;
        case ".json":
          writeFileSync(file, JSON.stringify(result[key], null, 2), "utf-8");
          break;
        default:
          this.error("not support output file ext");
      }
      this.logger(() => {
        console.log(
          "\x1b[32m%s\x1b[0m",
          " 🌟  👋  💋  🐔 Successfully generate File🌟 :",
          file
        );
      });
    }
    complete && complete();
  }

  logger(fn) {
    const { log } = this.options;
    if (log) {
      fn && fn();
    }
  }
  error(message) {
    console.log("\x1b[31m%s\x1b[0m", `[${name}] ${message}`);
    process.exit(1);
  }
};
