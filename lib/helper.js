const GetPort = require("get-port");
const http = require("http");
const { parse } = require("url");
const stoppable = require("stoppable");

const DEFAULT_PROT = 9527;
const isType = (obj) => Object.prototype.toString.call(obj).slice(8, -1);

exports.setProperty = (obj, name = "", value) => {
  name = name.split(".");
  for (var i = 0; i < name.length - 1; i++) {
    if (typeof obj[name[i]] !== "object" || !obj[name[i]]) obj[name[i]] = {};
    obj = obj[name[i]];
  }
  const realKey = name.pop();
  if (obj[realKey]) {
    if (isType(obj[realKey]) !== "Array") {
      obj[realKey] = [].concat(obj[realKey]);
    }
    obj[realKey] = obj[realKey].concat(value);
  } else {
    obj[realKey] = value;
  }
};

exports.is = {
  hasWrap: (val) => /\n/g.test(val),
};

exports.getPort = () => GetPort({ port: DEFAULT_PROT });

exports.createServer = async (port) => {
  let getCodePromiseResolve;
  const getCode = new Promise((res) => {
    getCodePromiseResolve = res;
  });
  const closeServer = await new Promise((resolve) => {
    const server = stoppable(
      http.createServer((req, res) => {
        const queryObject = parse(req.url, true).query;
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("It worked! ! ! Just close this tab");
        getCodePromiseResolve(queryObject.code);
      })
    );
    server.listen(port, () => {
      resolve(() => new Promise((res) => server.stop(res)));
    });
  });
  return {
    closeServer,
    getCode,
  };
};
