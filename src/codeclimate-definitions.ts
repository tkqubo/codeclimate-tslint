'use strict';

export type Location = LineLocation|PositionLocation;
export type Position = LineColumnPosition|OffsetPosition;

export interface Issue {
  type: string;
  check_name: string;
  description: string;
  content?: Contents;
  categories: string[];
  location: Location;
  other_locations?: Location[];
  trace?: Trace;
  remediation_points?: number;
  severity?: string;
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

export namespace Categories {
  export const BugRisk = 'Bug Risk';
  export const Clarity = 'Clarity';
  export const Compatibility = 'Compatibility';
  export const Complexity = 'Complexity';
  export const Duplication = 'Duplication';
  export const Performance = 'Performance';
  export const Security = 'Security';
  export const Style = 'Style';
}

export namespace Severities {
  export const Info = 'info';
  export const Normal = 'normal';
  export const Critical = 'critical';
}

