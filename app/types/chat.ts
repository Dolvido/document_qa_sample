export interface Citation {
  text: string;
  page: number;
  source: string;
}

export interface Message {
  text: string;
  isAi: boolean;
  citations?: Citation[];
} 