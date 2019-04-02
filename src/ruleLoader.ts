'use strict';

import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import {IRuleMetadata} from 'tslint';
import Utils from './utils';
import autobind from 'autobind-decorator';

export default class RuleLoader {
  constructor(public basePath: string) { }
  @autobind
  loadRules(moduleRulePath: string): IRuleMetadata[] {
    const rulePath = path.join(this.basePath, moduleRulePath);
    return fs.readdirSync(rulePath)
      .filter(this.isRuleFile)
      .map((file) => {
        const rule = require(path.join(rulePath, file)).Rule || { };
        if (rule.metadata) {
          return rule.metadata as IRuleMetadata;
        } else {
          const ruleName: string = rule.RULE_NAME || _.kebabCase(file.match(/(.*)Rule\.js$/).pop());
          return Utils.createEmptyRuleMetadata(ruleName);
        }
      })
      .filter(metadata => !!metadata)
      ;
  }

  private isRuleFile(fileName: string): boolean {
    return fileName.endsWith('Rule.js');
  }
}
