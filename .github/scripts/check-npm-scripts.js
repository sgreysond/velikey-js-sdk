#!/usr/bin/env node
/**
 * Detect dangerous patterns in the local package.json's `scripts`:
 *  - Lifecycle hooks (preinstall, install, postinstall, prepare) that
 *    auto-run at `npm install` time and can be exploited by malicious
 *    transitive dependencies.
 *  - Outbound network calls embedded in npm scripts (curl/wget/http(s)),
 *    which often indicate supply-chain shell-script bootstrapping.
 *
 * Replaces the inline `node -e` script that used to be in
 * .github/workflows/secure-node.yml; the inline version crashed with
 * "Invalid regular expression flags" because of YAML+shell double-
 * unescaping the regex literals (\\s -> literal "\\" + "s" rather than
 * the intended whitespace match, plus a stray `/` closed the regex
 * prematurely). Pulled out to its own file so we don't have to fight
 * three layers of escaping.
 */

const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const pkgPath = path.join(cwd, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const scripts = pkg.scripts || {};

const lifecycleHooks = ['preinstall', 'install', 'postinstall', 'prepare'];
const present = lifecycleHooks.filter((h) => scripts[h]);
if (present.length > 0) {
  console.error(
    `Blocked lifecycle scripts in ${cwd}: ${present.join(', ')}\n` +
    'Lifecycle hooks run automatically at install time and are a supply-chain risk.\n' +
    'If you need install-time work, run it explicitly via a separate script + npm run.'
  );
  process.exit(1);
}

// Concatenate every script body to do a single substring check.
const allScriptBodies = Object.values(scripts).join(' || ');

// indexOf checks, no regex - immune to escape-layering bugs.
// We look for command-prefixed forms ("curl ", "wget ") so we don't
// false-positive on a script literally named e.g. `curl-config`.
const networkPrefixes = ['curl ', 'wget ', 'http://', 'https://'];
const hits = networkPrefixes.filter((p) => allScriptBodies.toLowerCase().includes(p));
if (hits.length > 0) {
  console.error(
    `Blocked network calls in npm scripts in ${cwd}: ${hits.join(', ')}\n` +
    'Embedding outbound network calls in package.json scripts is a supply-chain risk.\n' +
    'Move bootstrap fetches to a documented provisioning step instead.'
  );
  process.exit(1);
}

console.log(`No dangerous lifecycle or network calls in npm scripts. (${cwd})`);
