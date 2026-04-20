# Branch Protection Setup

This guide keeps CI and security checks enforced on `main` so risky changes cannot be merged by accident.

## Goal
Require pull requests and required status checks before merge.

## Configure on GitHub
1. Go to repository Settings.
2. Open Branches, then add or edit the protection rule for `main`.
3. Enable Require a pull request before merging.
4. Enable Require approvals and set at least 1 approval.
5. Enable Dismiss stale pull request approvals when new commits are pushed.
6. Enable Require status checks to pass before merging.
7. Select these checks as required:
   - CI / build-and-test
   - CSS Framework Major Guard / guard-css-framework-majors
   - Dependency Review / dependency-review
   - CodeQL / Analyze (JavaScript/TypeScript)
   - UI Visual Smoke / ui-smoke
   - Security Audit / npm-audit
8. Enable Require branches to be up to date before merging.
9. Save changes.

## Optional hardening
- Enable Require conversation resolution before merging.
- Enable Restrict who can push to matching branches.
- Enable Do not allow bypassing the above settings.

## Maintainer checklist
- After adding a new workflow, decide whether it should be required on `main`.
- Keep required checks aligned with workflow job names.
- Re-verify this list after renaming workflow or job identifiers.
