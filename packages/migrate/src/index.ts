export type {
  CloseCandidate,
  FilePlan,
  FreshState,
  MigrateOptions,
  MigratePlan,
  PlannedReplacement,
  SkippedReplacement,
  TokenSkipReason,
  UsageRef,
} from "./plan.js";
export { analyzeMigration, planMigration, withFreshStyles } from "./plan.js";
export type {
  ChosenTarget,
  ComponentPlanSummary,
  ComponentSkipReason,
  HeldComponentEdit,
  ModuleEnv,
  PlannedComponentEdit,
} from "./components.js";
export { countComponentEdits, exportKindOf, loadModuleEnv, planComponentEdits, resolveChosenTargets } from "./components.js";
export type { ImportNeed, ImportPlan } from "./imports.js";
export { planNamedImport, planNamedImports } from "./imports.js";
export { specifierForModule } from "./specifier.js";
export type { ApplyFileResult, ApplyResult } from "./apply.js";
export { applyMigration } from "./apply.js";
export type { PrefixRename, RenamePlan } from "./rename-prefix.js";
export { applyPrefixRename, leftoverRefs, planPrefixRename } from "./rename-prefix.js";
export type { RevertResult } from "./revert.js";
export { revertMigration } from "./revert.js";
export { planExcludes, projectComponents, projectStyles, residualByCategory, usageKey } from "./project.js";
export type { AuditNumbers } from "./report.js";
export { formatPlanSummary, pct, renderMigrateReport } from "./report.js";
export type { BranchCheck, BranchCheckOptions } from "./git.js";
export { abandonBranch, checkBranch, commitFiles, commitMessage, createBranch } from "./git.js";
