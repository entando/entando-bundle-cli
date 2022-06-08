import {
  ParallelProcessExecutorService,
  ProcessExecutionResult
} from '../../../src/services/process-executor-service'

export class StubParallelProcessExecutorService extends ParallelProcessExecutorService {
  private readonly stubResults: ProcessExecutionResult[]

  constructor(stubResults: ProcessExecutionResult[]) {
    super([])
    this.stubResults = stubResults
  }

  public async execute(): Promise<ProcessExecutionResult[]> {
    for (const [i, result] of this.stubResults.entries()) {
      this.emit('done', i, result)
    }

    return this.stubResults
  }
}
