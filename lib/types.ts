export type GridPosition =
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'center' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right';

export interface PoemTags {
  subjects: string[];
  moods: string[];
  seasons: string[];
  scenes: string[];
  palette: string[];
}

export interface Poem {
  id: string;
  line: string;
  title: string;
  author: string;
  full_poem: string;
  tags: PoemTags;
}

export interface PoemStyle {
  fontFamily: string;
  fontSize: string;
  tracking: string;
  lineHeight: number;
  isVertical: boolean;
  textColor: string;
  textShadow: string;
  textOpacity: number;
  signature: boolean;
  sealText: string;
}

export interface ImageAnalysis {
  tags: PoemTags;
  subject_region: GridPosition;
  text_placement: GridPosition;
}

export interface MatchResult {
  line: string;
  couplet: string[]; // 两句：[出句, 对句]
  title: string;
  author: string;
  full_poem: string;
  text_placement: GridPosition;
  style: PoemStyle;
}

export interface Vocabulary {
  subjects: string[];
  moods: string[];
  seasons: string[];
  scenes: string[];
  palette: string[];
}
