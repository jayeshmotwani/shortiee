#!/usr/bin/env node
// PreToolUse guard for Write|Edit: blocks edits to .env and other secret/credential files.
// .env.example (and similar .*.example files) are explicitly allowed.
"use strict";

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

let payload;
try {
  payload = JSON.parse(readStdin() || "{}");
} catch {
  output({ continue: true });
  process.exit(0);
}

const filePath = (payload && payload.tool_input && payload.tool_input.file_path) || "";
const normalized = filePath.replace(/\\/g, "/");
const basename = normalized.split("/").pop() || "";

const isExampleFile = /\.example$/i.test(basename) || basename === ".env.example";

const protectedPatterns = [
  /^\.env(\..+)?$/i, // .env, .env.local, .env.production, etc.
  /\.pem$/i,
  /\.key$/i,
  /^credentials\.json$/i,
  /^secrets\.json$/i,
  /^service-account.*\.json$/i,
];

const isProtected = !isExampleFile && protectedPatterns.some((re) => re.test(basename));

if (isProtected) {
  output({
    continue: true,
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason:
        `Editing "${basename}" is blocked by project policy (.env/secrets/credentials files must not be modified by Claude). Ask the user to edit it directly.`,
    },
  });
  process.exit(0);
}

output({ continue: true });
