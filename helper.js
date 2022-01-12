const path = require("path");

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

exports.PATH = {
  token: "./token.json",
  credentials: "./credentials.json",
  lang: "./lang",
  logo: "./logo.txt",
};

exports.getPathFromCwd = (...args) => path.join(process.cwd(), ...args);

exports.getPathFromCurrent = (...args) => path.join(__dirname, ...args);

exports.is = {
  hasWrap: (val) => /\n/g.test(val),
};
