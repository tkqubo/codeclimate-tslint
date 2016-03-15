'use strict';

export type Location = LineLocation|PositionLocation;
export type Position = LineColumnPosition|OffsetPosition;

export function createIssueFromError(e: Error): Issue {
  return {
    type: IssueTypes.Issue,
    check_name: '(runtime error)',
    description: e.message,
    categories: ['Bug Risk'],
    location: {
      path: '',
      positions: {
        begin: { line: 0, column: 0 },
        end: { line: 0, column: 0 }
      }
    },
  };
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


