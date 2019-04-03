'use strict';

import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import {IRuleMetadata} from 'tslint';
import Utils from './utils';

/** Tslint rule file which is installed by `./bin/get-tslint-rules` */
export const tslintRuleFile: string = '../tslint/docs/rules';
/** Rule paths that are provided by third parties */
export const additionalRulePaths = [
  'node_modules/tslint-eslint-rules/dist/rules',
  'node_modules/codelyzer',
  'node_modules/tslint-plugin-prettier/rules',
  'node_modules/tslint-microsoft-contrib',
];

export function getRules(additionalRuleBasePath: string): IRuleMetadata[] {
  return getTslintRules().concat(getAdditionalRules(additionalRuleBasePath));
}

export function getTslintRules(): IRuleMetadata[] {
  return require(tslintRuleFile) as IRuleMetadata[];
}

export function getAdditionalRules(basePath: string): IRuleMetadata[] {
  const rules = additionalRulePaths
    .map(p => path.join(basePath, p))
    .map(loadRules);
  return _.flatten(rules);
}

export function loadRules(rulePath: string): IRuleMetadata[] {
  return fs.readdirSync(rulePath)
    .filter(isRuleFile)
    .map(file => {
      const rule = require(path.join(rulePath, file)).Rule || { };
      if (rule.metadata) {
        return rule.metadata as IRuleMetadata;
      } else {
        const ruleName = rule.RULE_NAME || _.kebabCase(file.match(/(.*)Rule\.js$/).pop());
        return Utils.createEmptyRuleMetadata(ruleName);
      }
    })
    .filter(metadata => !!metadata);
}

export function isRuleFile(fileName: string): boolean {
  return fileName.endsWith('Rule.js');
}
