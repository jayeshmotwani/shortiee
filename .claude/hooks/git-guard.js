#!/usr/bin/env node
// PreToolUse guard for Bash(git *) commands.
// Blocks: force-push, and direct `git commit` while on `main`.
// Warns (asks for confirmation) when committing without recent evidence tests were run.
"use strict";

const { execSync } = require("child_process");

function readStdin() {
  try {
    return require("fs").readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function output(obj) {
  process.stdout.write(JSON.stringify(obj));
}

function allow() {
  output({ continue: true });
  process.exit(0);
}

function deny(reason) {
  output({
    continue: true,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  });
  process.exit(0);
}

function ask(reason) {
  output({
    continue: true,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: reason,
    },
  });
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(readStdin() || "{}");
} catch {
  allow();
}

const command = (payload && payload.tool_input && payload.tool_input.command) || "";
if (!command) allow();

const isForcePush =
  /\bgit\s+push\b/.test(command) &&
  (/(^|\s)--force(-with-lease)?(\s|$)/.test(command) || /(^|\s)-f(\s|$)/.test(command));

if (isForcePush) {
  deny("Force-push is disabled by project policy (see CLAUDE.md / .claude/settings.json hooks). Ask the user before force-pushing.");
}

const isCommit = /\bgit\s+commit\b/.test(command);
if (!isCommit) allow();

let branch = "";
try {
  branch = execSync("git branch --show-current", { encoding: "utf8" }).trim();
} catch {
  allow();
}

if (branch === "main") {
  deny("Direct commits to main are not allowed. Create/switch to a feature branch (claude/<type>/<desc>) first.");
}

// Heuristic: staged backend/frontend source changes without any staged test changes.
let stagedFiles = [];
try {
  stagedFiles = execSync("git diff --cached --name-only", { encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
} catch {
  stagedFiles = [];
}

const sourceTouched = stagedFiles.some(
  (f) =>
    (f.startsWith("backend/app/") && f.endsWith(".py")) ||
    (f.startsWith("frontend/src/") && (f.endsWith(".ts") || f.endsWith(".tsx")))
);
const testsTouched = stagedFiles.some(
  (f) =>
    f.startsWith("backend/tests/") ||
    f.startsWith("frontend/tests/") ||
    /\.test\.(ts|tsx|js)$/.test(f)
);

if (sourceTouched && !testsTouched) {
  ask(
    "Staged changes touch backend/app or frontend/src source files but no test files are staged. " +
      "Project policy requires unit tests for every feature/fix. Confirm this commit intentionally has no new tests (e.g. docs-only follow-up), or add tests first."
  );
}

// Heuristic: test suite not run recently before committing source changes.
if (sourceTouched) {
  const markerPath = ".claude/.last-test-run";
  let stale = true;
  try {
    const stat = require("fs").statSync(markerPath);
    const ageMs = Date.now() - stat.mtimeMs;
    stale = ageMs > 60 * 60 * 1000; // 60 minutes
  } catch {
    stale = true;
  }
  if (stale) {
    ask(
      "No recent test run detected (.claude/.last-test-run missing or >60min old). " +
        "Project policy requires running the test suite before marking work done. Run pytest/vitest, then commit."
    );
  }
}

allow();
