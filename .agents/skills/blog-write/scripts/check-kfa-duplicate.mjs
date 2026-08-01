#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const sourceUrl = process.argv[2];
const localRoot = process.argv[3] ?? path.resolve(process.cwd(), "../korean-fe-article");
if (!sourceUrl) {
  console.error("사용법: node check-kfa-duplicate.mjs <원문 URL> [KFA 로컬 경로]");
  process.exit(2);
}

const normalize = (value) => {
  const url = new URL(value);
  url.hash = "";
  url.search = "";
  url.hostname = url.hostname.toLowerCase();
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString();
};
const target = normalize(sourceUrl);
const matches = [];
const ghOptions = { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 };

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.name.endsWith(".md")) {
      const text = fs.readFileSync(fullPath, "utf8");
      for (const raw of text.match(/https?:\/\/[^)\s>]+/g) ?? []) {
        try {
          if (normalize(raw) === target) matches.push({ type: "file", url: fullPath });
        } catch {}
      }
    }
  }
}

if (fs.existsSync(localRoot)) {
  for (const name of fs.readdirSync(localRoot)) {
    if (/^20\d{2}$/.test(name)) walk(path.join(localRoot, name));
  }
}

const userResult = spawnSync("gh", ["api", "user", "--jq", ".login"], ghOptions);
const result = spawnSync("gh", ["api", "--paginate", "--slurp", "repos/Korean-FE-Article/korean-fe-article/issues?state=all&per_page=100"], ghOptions);
if (userResult.status !== 0 || result.status !== 0) {
  console.error(`GitHub 중복 조회 실패: ${result.stderr.trim()}`);
  process.exit(2);
}
for (const item of JSON.parse(result.stdout).flat()) {
  const text = `${item.title ?? ""}\n${item.body ?? ""}`;
  for (const raw of text.match(/https?:\/\/[^)\s>]+/g) ?? []) {
    try {
      if (normalize(raw) === target) matches.push({
        type: item.pull_request ? "pr" : "issue",
        url: item.html_url,
        state: item.state,
        assignees: (item.assignees ?? []).map((assignee) => assignee.login),
      });
    } catch {}
  }
}

const unique = [...new Map(matches.map((match) => [`${match.type}:${match.url}`, match])).values()];
const currentUser = userResult.stdout.trim();
const resumable = unique.length > 0 && unique.every((match) =>
  match.type === "issue" && match.state === "open" && match.assignees.includes(currentUser)
);
if (resumable) {
  console.log(JSON.stringify({ status: "registered", sourceUrl, assignee: currentUser, matches: unique }, null, 2));
  process.exit(0);
}
if (unique.length) {
  console.log(JSON.stringify({ status: "duplicate", sourceUrl, matches: unique }, null, 2));
  process.exit(3);
}
console.log(JSON.stringify({ status: "available", sourceUrl, checked: ["files", "issues", "pull_requests"] }, null, 2));
