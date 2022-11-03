# tetiaroa

> a useful multi-language automatic generation tool

## support

- google sheet
- feishu sheet

## why tetiaroa?

Quickly generate files in multiple languages, no more copy needed!

## install

```bash
  npm i tetiaroa@1 -D # commonjs
  npm i tetiaroa@latest -D # esm
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

|    key     | value |       ouput        |
| :--------: | :---: | :----------------: |
| rank.title |  hhh  | rank:{title:"hhh"} |
|    key     |  one  | key:['one','two']  |
|    key     |  two  | key:['one','two']  |

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
