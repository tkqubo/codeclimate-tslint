'use strict';

export type Location = LineLocation|PositionLocation;
export type Position = LineColumnPosition|OffsetPosition;

export interface IConfig {
  include_paths?: string[];
  enabled?: boolean;
  config?: string;
}

export interface IIssue {
  type: string;
  check_name: string;
  description: string;
  content?: Contents;
  categories: Category[];
  location: Location;
  other_locations?: Location[];
  trace?: Trace;
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
  }
}

export interface IPositionLocation {
  path: string;
  positions: {
    begin: Position;
    end: Position;
  }
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

export namespace IssueTypes {
  export const Issue = 'issue';
}

export type Category = 'Bug Risk'|'Clarity'|'Compatibility'|'Complexity'|'Duplication'|'Performance'|'Security'|'Style';

export type Severity = 'info'|'normal'|'critical';
