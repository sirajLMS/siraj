export interface SonarIssue {
  key: string;
  rule: string;
  severity: string;
  component: string;
  line?: number;
  message: string;
  type: string;
  status: string;
  textRange?: {
    startLine: number;
    endLine: number;
    startOffset: number;
    endOffset: number;
  };
  flows?: Array<{
    locations?: Array<{
      component: string;
      textRange: {
        startLine: number;
        endLine: number;
        startOffset: number;
        endOffset: number;
      };
      msg?: string;
    }>;
  }>;
}

export interface DuplicationBlock {
  refPath: string;
  from: number;
  to: number;
  size: number;
}

export interface DuplicationGroup {
  blocks: DuplicationBlock[];
}

export interface DuplicationFileDetails {
  file: string;
  blockCount: number;
  groups: DuplicationGroup[];
}

export interface SonarResponse {
  total: number;
  p: number;
  ps: number;
  paging: {
    pageIndex: number;
    pageSize: number;
    total: number;
  };
  issues: SonarIssue[];
}

export interface SonarMeasure {
  metric: string;
  value?: string;
  periods?: Array<{ index: number; value: string }>;
}

export interface SonarDuplicationsResponse {
  duplications: Array<{
    blocks: Array<{
      from: number;
      size: number;
      _ref?: string;
    }>;
  }>;
  files: Record<string, { key: string; name: string }>;
}

export interface FetchResultsOptions {
  token: string;
  includeDuplications?: boolean;
  outputFilename?: string;
}
