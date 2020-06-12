# Code Climate TSLint-Engine

[![CircleCI](https://img.shields.io/circleci/project/tkqubo/codeclimate-tslint.svg)](https://circleci.com/gh/tkqubo/codeclimate-tslint)
[![Code Climate](https://codeclimate.com/github/tkqubo/codeclimate-tslint/badges/gpa.svg)](https://codeclimate.com/github/tkqubo/codeclimate-tslint)
![David](https://david-dm.org/tkqubo/codeclimate-tslint.svg)
[![License](http://img.shields.io/:license-mit-blue.svg)](http://doge.mit-license.org)

:warning: __TSLint has been deprecated as of 2019.__
Please see this issue for more details: [Roadmap: TSLint → ESLint](https://github.com/palantir/tslint/issues/4534). [typescript-eslint](https://github.com/typescript-eslint/typescript-eslint) is now your best option for linting TypeScript.

`codeclimate-tslint` is a Code Climate engine that wraps [tslint](http://palantir.github.io/tslint/). You can run it on your command line using the Code Climate CLI, or on Code Climate's hosted analysis platform.

`TSLint` is a linter for the TypeScript language.


### Installation

1. If you haven't already, [install the Code Climate CLI](https://github.com/codeclimate/codeclimate).
2. Run `codeclimate engines:enable tslint`. This command both installs the engine and enables it in your `.codeclimate.yml` file.
3. You're ready to analyze! Browse into your project's folder and run `codeclimate analyze`.

### Need help?

For help with `tslint`, [check out their documentation](http://palantir.github.io/tslint/).

If you're running into a Code Climate issue, first look over this project's [GitHub Issues](https://github.com/tkqubo/codeclimate-tslint/issues), as your question may have already been covered.
