'use strict';
import * as Linter from 'tslint';
import * as fs from 'fs';

let fileName = 'src/index.ts';
let contents = fs.readFileSync(fileName, "utf8");
let configuration = {
  rules: {
    "variable-name": true,
    "quotemark": [true, "double"]
  }
};
let options = {
  formatter: "json",
  configuration: configuration,
  rulesDirectory: "customRules/", // can be an array of directories
  formattersDirectory: "customFormatters/"
};


let linter = new Linter(fileName, contents, options);
let result = linter.lint();

console.log(result);


