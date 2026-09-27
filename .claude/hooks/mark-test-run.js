#!/usr/bin/env node
// PostToolUse (Bash) hook: when a test-runner command is executed, timestamp a marker file
// so git-guard.js can tell whether tests were run recently before allowing a commit.
"use strict";

const fs = require("fs");

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

let payload;
try {
  payload = JSON.parse(readStdin() || "{}");
} catch {
  process.exit(0);
}

const command = (payload && payload.tool_input && payload.tool_input.command) || "";
const isTestRun =
  /\bpytest\b/.test(command) ||
  /\bvitest\b/.test(command) ||
  /\bnpm\s+(run\s+)?test\b/.test(command) ||
  /\bnpx\s+vitest\b/.test(command);

if (isTestRun) {
  try {
    fs.mkdirSync(".claude", { recursive: true });
    fs.writeFileSync(".claude/.last-test-run", new Date().toISOString());
  } catch {
    // non-fatal
  }
}

process.exit(0);
