'use strict';

import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import {IRuleMetadata} from 'tslint';
import Utils from '../utils';

const moduleRulePath = 'node_modules/tslint-eslint-rules/dist/rules';

export function loadTslintEslintRules(basePath: string): IRuleMetadata[] {
  const rulePath = path.join(basePath, moduleRulePath);
  return fs.readdirSync(rulePath)
    .filter(file => file.endsWith('.js'))
    .map(file => {
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



