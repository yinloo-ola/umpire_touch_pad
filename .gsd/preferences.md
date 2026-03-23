---
version: 1
mode: solo
models:
  research: glm-5
  planning: glm-5
  execution: glm-4.7
  completion: glm-4.7
skill_discovery: auto
skill_staleness_days: 0
uat_dispatch: false
unique_milestone_ids: true
budget_ceiling: 5
budget_enforcement: pause
context_pause_threshold: 90
notifications:
cmux:
  enabled: false
  notifications: false
  sidebar: false
  splits: false
  browser: false
remote_questions:
git:
  main_branch: main
  auto_push: false
  push_branches: false
  snapshots: false
  pre_merge_check: auto
  merge_strategy: squash
  isolation: worktree
phases:
  skip_research: false
  skip_reassess: true
  skip_slice_research: false
  reassess_after_slice: false
---

# GSD Skill Preferences

See `~/.gsd/agent/extensions/gsd/docs/preferences-reference.md` for full field documentation and examples.
