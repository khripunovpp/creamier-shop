export enum LogLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success'
}

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
  source?: string;
  url?: string;
}

export class LogEntryModel implements LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  data?: any;
  source?: string;
  url?: string;

  constructor(level: LogLevel, message: string, data?: any, source?: string, url?: string) {
    this.id = this.generateId();
    this.level = level;
    this.message = message;
    this.timestamp = new Date();
    this.data = data;
    this.source = source;
    this.url = url;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  toJSON(): LogEntry {
    return {
      id: this.id,
      level: this.level,
      message: this.message,
      timestamp: this.timestamp,
      data: this.data,
      source: this.source,
      url: this.url
    };
  }

  static fromJSON(json: LogEntry): LogEntryModel {
    const entry = new LogEntryModel(json.level, json.message, json.data, json.source, json.url);
    entry.id = json.id;
    entry.timestamp = new Date(json.timestamp);
    return entry;
  }
} 