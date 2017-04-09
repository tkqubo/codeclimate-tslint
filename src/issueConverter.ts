'use strict';

import { RuleFailure, RuleFailurePosition, IRuleMetadata } from 'tslint';
import * as CodeClimate from './codeclimateDefinitions';
import autobind = require('autobind-decorator');

@autobind
export class IssueConverter {
  readonly filePattern: RegExp;

  constructor(basePath: string, private rules: IRuleMetadata[]) {
    this.filePattern = new RegExp(`${basePath}(.*)`, 'i');
  }

  convert(failure: RuleFailure): CodeClimate.IIssue {
    return {
      type: CodeClimate.issueTypes.Issue,
      check_name: failure.getRuleName(),
      content: {
        body: this.contentBody(failure.getRuleName())
      },
      description: failure.getFailure(),
      categories: ['Style'], // currently only Style is available
      remediation_points: 50000, // all style issues are 50k
      location: this.convertToLocation(failure)
    };
  }

  private contentBody(name: string): string {
    const rule = this.rules.find((el) =>  el.ruleName === name);
    const examplesString = (rule.optionExamples || []).reduce((agg: string, ex: string) => {
      return agg + '\n' + '```' + ex + '```';
    }, '');
    const schemaString = rule.options != null ? `
      ## Schema
      ${'```' + JSON.stringify(rule.options, null, 2) + '```'}
    ` : '';

    return `
    # Rule: ${name}
    ## Config
    ${rule.optionsDescription}

    ## Examples
    ${examplesString}

    ${schemaString}

    For more information see [this page](https://palantir.github.io/tslint/rules/${name}).
    `;
  }

  private convertToLocation(failure: RuleFailure): CodeClimate.Location {
    return {
      path: this.getFilePath(failure),
      positions: {
        begin: this.convertToLineColumnPosition(failure.getStartPosition()),
        end: this.convertToLineColumnPosition(failure.getEndPosition())
      }
    };
  }

  private getFilePath(failure: RuleFailure): string {
    return this.filePattern.exec(failure.getFileName()).pop();
  }

  private convertToLineColumnPosition(position: RuleFailurePosition): CodeClimate.ILineColumnPosition {
    return {
      line: position.getLineAndCharacter().line + 1,
      column: position.getLineAndCharacter().character + 1
    };
  }
}
