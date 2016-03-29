'use strict';

export type Location = LineLocation|PositionLocation;
export type Position = LineColumnPosition|OffsetPosition;

export interface Config {
  include_paths?: string[];
  enabled?: boolean;
  config?: string;
}

export interface Issue {
  type: string;
  check_name: string;
  description: string;
  content?: Contents;
  categories: Category[];
  location: Location;
  other_locations?: Location[];
  trace?: Trace;
  remediation_points?: number;
  severity?: Severity;
  fingerprint?: string;
}

export interface Contents {
  body: string;
}

export interface LineLocation {
  path: string;
  lines: {
    begin: number;
    end: number;
  }
}

export interface PositionLocation {
  path: string;
  positions: {
    begin: Position;
    end: Position;
  }
}

export interface LineColumnPosition {
  line: number;
  column: number;
}

export interface OffsetPosition {
  offset: number;
}

export interface Trace {
  locations: Location[];
  stacktrace?: boolean;
}

export namespace IssueTypes {
  export const Issue = 'issue';
}

export type Category = 'Bug Risk'|'Clarity'|'Compatibility'|'Complexity'|'Duplication'|'Performance'|'Security'|'Style';

export type Severity = 'info'|'normal'|'critical';


