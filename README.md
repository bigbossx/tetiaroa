# tetiaroa

> a useful multi-language automatic generation tool

## why tetiaroa?

the fucking name tetiaroa comes from a beautiful island,don’t ask me why I took this name, I don’t know too. this tool just reduce U cv times,nothing else. it fork from gooleapi,you can also customize your tools according to the documentation https://developers.google.com/sheets/api ,enjoy it!

## install

```
  npm i tetiaroa
```

## Usage

### 1.options

|         Name         |                    Type                    |                                Default                                 |           Description            |
| :------------------: | :----------------------------------------: | :--------------------------------------------------------------------: | :------------------------------: |
|        batch         | Array[{spreadsheetId:string,range:string}] |                                   /                                    | 文档 id 与该文档下的某个区间区域 |
|        ouput         |                   Object                   | {path:path.resolve(process.cwd(), "./lang"), module: "es6",ext: ".js"} |       输出文件的路径与格式       |
|         lang         |                   Object                   |                          {zh: 2,en: 3,ar: 4,}                          |          多语言对应的行          |
|       complete       |                  function                  |                                   /                                    |          事件完成的回调          |
| customOutputCallback |                  function                  |                                   /                                    |          自定义数据转换          |

### 2.example

```js
// js file
// if you have not authorized, you must open vpn first !!!

process.env.HTTP_PROXY = "http://127.0.0.1:1087"; // start proxy in node
process.env.HTTPS_PROXY = "http://127.0.0.1:1087";
```

config in google doc
| key | value | ouput |
| :------------------: | :------------------: | :------------------: |
| rank.title | hhh | rank:{title:"hhh"} |
| key | one | key:['one','two'] |
| key | two | key:['one','two'] |

```js
// js file
new tetiaroa({
  batch: [
    {
      spreadsheetId: "18XOx3OVPstZAF4WI0b1QFLr4Wiirn4pKW7ABgPvw27k",
      range: "产品运营!C2:G",
    },
    {
      spreadsheetId: "18XOx3OVPstZAF4WI0b1QFLr4Wiirn4pKW7ABgPvw27k",
      range: "Web多语言!C2:G",
    },
  ],
  lang: {
    zh: 2,
    index: 3,
    ar: 4,
  },
  ouput: {
    path: path.resolve(__dirname, "./lang"),
    module: "common", // support 'json' 'common' 'es6'
    ext: ".json",
  },
  complete: () => {
    // todo
  },
});
```

## FAQ

if you have any problems during use, please solve by yourself
