'use strict';

import {IRuleMetadata, RuleFailure, RuleFailurePosition} from 'tslint';
import * as _ from 'lodash';
import * as CodeClimate from './codeclimate';
import {ContentRenderer} from './contentRenderer';
import {ITsLinterOption} from './tsLinter';
import autobind from 'autobind-decorator';

export class RuleNameNotFoundError extends Error {
  constructor(public ruleName: string) {
    super(`rule named ${ruleName} is not found in the metadata.`);
  }
}

@autobind
export class IssueConverter {
  readonly filePattern: RegExp;
  readonly contentRenderer: ContentRenderer;

  constructor(public option: ITsLinterOption) {
    this.filePattern = new RegExp(`${option.targetPath}(.*)`, 'i');
    this.contentRenderer = new ContentRenderer(option.linterPath);
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
    const rule: IRuleMetadata | null = _.find(this.option.rules, { ruleName: name });
    if (rule != null) {
      return this.contentRenderer.render(rule);
    } else {
      throw new RuleNameNotFoundError(name);
    }
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
