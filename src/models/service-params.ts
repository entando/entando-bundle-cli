import FSService from "../services/fs-service"
import { GitService } from "../services/git-service"

export default interface ServiceParams {
  name: string
  parentDirectory: string
}

export interface ServiceTools {
  git: GitService,
  filesys: FSService
}
