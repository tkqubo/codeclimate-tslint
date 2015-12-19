'use strict';

export interface Issue {
  type: string;
  check_name: string;
  description: string;
  content?: Contents;
  categories: string[];
  location: LinePosition|PositionLocation;
  other_locations?: (LinePosition|PositionLocation)[];
  trace?: Trace;
  remediation_points?: number;
  severity?: string;
  fingerprint?: string;
}

export interface Contents {
  body: string;
}

export interface LinePosition {
  path: string;
  lines: {
    begin: number;
    end: number;
  }
}

export interface PositionLocation {
  path: string;
  positions: {
    begin: LineColumnPosition|OffsetPosition;
    end: LineColumnPosition|OffsetPosition;
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
  locations: (LinePosition|PositionLocation)[];
  stacktrace?: boolean;
}