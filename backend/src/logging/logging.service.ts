import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

interface LogEntry {
  timestamp: string;
  level: string;
  context: string;
  message: string;
  data?: any;
}

@Injectable()
export class LoggingService {
  private readonly logger = new Logger(LoggingService.name);
  private readonly logDirectory: string;

  constructor(private configService: ConfigService) {
    this.logDirectory = this.configService.get<string>('logging.directory', 'logs');
    this.ensureLogDirectoryExists();
  }

  private ensureLogDirectoryExists() {
    if (!fs.existsSync(this.logDirectory)) {
      try {
        fs.mkdirSync(this.logDirectory, { recursive: true });
        this.logger.log(`Log dizini oluşturuldu: ${this.logDirectory}`);
      } catch (error) {
        this.logger.error(`Log dizini oluşturulamadı: ${error.message}`);
      }
    }
  }

  private writeToLogFile(logEntry: LogEntry) {
    const date = new Date();
    const fileName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.log`;
    
    const filePath = path.join(this.logDirectory, fileName);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFile(filePath, logLine, (err) => {
      if (err) {
        this.logger.error(`Log dosyasına yazılamadı: ${err.message}`);
      }
    });
  }

  log(context: string, message: string, data?: any) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      context,
      message,
      data,
    };
    
    this.logger.log(`[${context}] ${message}`);
    this.writeToLogFile(logEntry);
    
    return logEntry;
  }

  logError(context: string, message: string, data?: any) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      context,
      message,
      data,
    };
    
    this.logger.error(`[${context}] ${message}`);
    this.writeToLogFile(logEntry);
    
    return logEntry;
  }

  logWarning(context: string, message: string, data?: any) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      context,
      message,
      data,
    };
    
    this.logger.warn(`[${context}] ${message}`);
    this.writeToLogFile(logEntry);
    
    return logEntry;
  }

  logDebug(context: string, message: string, data?: any) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'debug',
      context,
      message,
      data,
    };
    
    this.logger.debug(`[${context}] ${message}`);
    this.writeToLogFile(logEntry);
    
    return logEntry;
  }

  async getLogsByDate(date: Date): Promise<LogEntry[]> {
    const fileName = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.log`;
    const filePath = path.join(this.logDirectory, fileName);
    
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    try {
      const fileContent = await fs.promises.readFile(filePath, 'utf8');
      const logs = fileContent
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => JSON.parse(line) as LogEntry);
      
      return logs;
    } catch (error) {
      this.logger.error(`Log dosyası okunamadı: ${error.message}`);
      return [];
    }
  }
}