'use strict';

export type Location = ILineLocation|IPositionLocation;
export type Position = ILineColumnPosition|IOffsetPosition;

export interface IConfig {
  enabled?: boolean;
  channel?: string;
  include_paths: string[];
  config?: string;
  ignore_warnings?: boolean;
}

export interface IIssue {
  type: string;
  check_name: string;
  description: string;
  content?: IContents;
  categories: Category[];
  location: Location;
  other_locations?: Location[];
  trace?: ITrace;
  remediation_points: number;
  severity?: Severity;
  fingerprint?: string;
}

export interface IContents {
  body: string;
}

export interface ILineLocation {
  path: string;
  lines: {
    begin: number;
    end: number;
  };
}

export interface IPositionLocation {
  path: string;
  positions: {
    begin: Position;
    end: Position;
  };
}

export interface ILineColumnPosition {
  line: number;
  column: number;
}

export interface IOffsetPosition {
  offset: number;
}

export interface ITrace {
  locations: Location[];
  stacktrace?: boolean;
}

export const issueTypes = {
  Issue: 'issue'
};

export type Category = 'Bug Risk'|'Clarity'|'Compatibility'|'Complexity'|'Duplication'|'Performance'|'Security'|'Style';

export type Severity = 'info'|'normal'|'critical';
