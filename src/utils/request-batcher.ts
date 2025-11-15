/**
 * Request batching utility to combine multiple API requests
 */

export interface BatchRequest {
  id: string;
  command: string;
  params?: any;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

export interface RequestBatcherOptions {
  /** Maximum time to wait before flushing batch (ms) */
  maxWaitTime?: number;
  /** Maximum number of requests in a batch */
  maxBatchSize?: number;
  /** Enable batching */
  enabled?: boolean;
}

/**
 * Batches multiple requests together to reduce HTTP calls
 */
export class RequestBatcher {
  private queue: BatchRequest[] = [];
  private timer: NodeJS.Timeout | null = null;
  private readonly maxWaitTime: number;
  private readonly maxBatchSize: number;
  private readonly enabled: boolean;
  private flushHandler: ((requests: BatchRequest[]) => Promise<void>) | null = null;

  constructor(options: RequestBatcherOptions = {}) {
    this.maxWaitTime = options.maxWaitTime || 10; // 10ms default
    this.maxBatchSize = options.maxBatchSize || 50; // Max 50 requests per batch
    this.enabled = options.enabled !== false;
  }

  /**
   * Set the flush handler that processes batched requests
   */
  setFlushHandler(handler: (requests: BatchRequest[]) => Promise<void>): void {
    this.flushHandler = handler;
  }

  /**
   * Add a request to the batch queue
   */
  add(command: string, params?: any): Promise<any> {
    if (!this.enabled || !this.flushHandler) {
      // If batching is disabled or no handler, execute immediately
      return this.executeSingle(command, params);
    }

    return new Promise((resolve, reject) => {
      const request: BatchRequest = {
        id: this.generateId(),
        command,
        params,
        resolve,
        reject
      };

      this.queue.push(request);

      // Start timer if not already running
      if (!this.timer) {
        this.timer = setTimeout(() => {
          this.flush();
        }, this.maxWaitTime);
      }

      // Flush immediately if we hit max batch size
      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      }
    });
  }

  /**
   * Execute a single request without batching
   */
  private executeSingle(command: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const request: BatchRequest = {
        id: this.generateId(),
        command,
        params,
        resolve,
        reject
      };

      if (this.flushHandler) {
        this.flushHandler([request]).catch(reject);
      } else {
        reject(new Error('No flush handler configured'));
      }
    });
  }

  /**
   * Flush all pending requests
   */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) {
      return;
    }

    const batch = this.queue.splice(0, this.queue.length);
    
    if (this.flushHandler) {
      try {
        await this.flushHandler(batch);
      } catch (error) {
        // Reject all requests in batch on error
        batch.forEach(req => req.reject(error as Error));
      }
    }
  }

  /**
   * Get current queue size
   */
  get queueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    // Reject all pending requests
    const error = new Error('Request batch cleared');
    this.queue.forEach(req => req.reject(error));
    this.queue = [];
  }

  /**
   * Generate unique request ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Destroy the batcher and cleanup resources
   */
  destroy(): void {
    this.clear();
    this.flushHandler = null;
  }
}
