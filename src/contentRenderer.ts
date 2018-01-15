'use strict';

import * as path from 'path';
import * as fs from 'fs';
import * as handlebars from 'handlebars';
import {IRuleMetadata} from 'tslint';
import * as _ from 'lodash';
import autobind from 'autobind-decorator';

handlebars.registerHelper('notesHeader', (rule: IRuleMetadata) => {
  return (rule.typescriptOnly || rule.hasFix || rule.requiresTypeInfo) ? `\n##### Notes\n` : '';
});
handlebars.registerHelper('json', (obj: any, escape: boolean = false, prefix: string) => {
  const json = escape ? JSON.stringify(obj, null, 2) : obj;
  const prefixString = !_.isEmpty(prefix) ? '"' + prefix + '": ' : '';
  return '```json\n' + prefixString + json + '\n```';
});

export class ContentRenderer {
  static templateFileName: string = 'body-template.md.hbs';

  readonly template: string;

  constructor(public templatePath: string) {
    const templateFile = path.join(templatePath, ContentRenderer.templateFileName);
    this.template = fs.readFileSync(templateFile).toString('UTF-8');
  }

  @autobind
  render(rule: IRuleMetadata): string {
    return handlebars.compile(this.template)({rule});
  }
}
