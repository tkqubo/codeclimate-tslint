'use strict';
import {IRuleMetadata} from 'tslint';

class Utils {
  createEmptyRuleMetadata(ruleName: string): IRuleMetadata {
    return {
      ruleName,
      type: 'style',
      description: '*No description is given*',
      optionsDescription: '',
      options: {},
      typescriptOnly: false
    };
  }
}

export default new Utils();
