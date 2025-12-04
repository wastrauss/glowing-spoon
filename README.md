# Sort and Validate Translation Files Workflow

## Overview
This GitHub Actions workflow automatically sorts YAML translation files, validates translation file keys against an English reference file, and attempts to auto-fill any missing keys in non-English files with the corresponding English values. It can commit and push formatting/autofix changes and will open or update an issue when mismatches require manual review.

## When It Runs
- **Trigger**: Push events that modify translation YAML files (configured via the `paths` pattern; default is "translations/**/*.yml").

## Main Steps
1. **Checkout repository**.
2. **Setup Node.js** (default node-version: 20) and install js-yaml.
3. **Sort YAML files**:
   - Recursively sorts object keys in each YAML file (preserving arrays).
   - Skips files inside .github/workflows and node_modules.
   - Writes formatted YAML back to the files using js-yaml dump options (indent, no refs, quoting behavior, etc.).
4. **Validate translations against English**:
   - Loads a configured ENGLISH_FILE (default "./translations/en_US.yml").
   - Computes flattened "dot" keys for nested objects.
   - For each translation file in TRANSLATION_DIR (excluding the English file):
     - Detects extra keys present in the translation but missing from English. These are reported and require manual review.
     - Detects missing keys (present in English but missing in the translation) and AUTO-FILLS them using the English value, then re-sorts and writes the file.
   - If extra keys are found for any language, a validation report is written to validation_results.txt and the step exits with a non-zero status.
   - If only missing keys were present, they are auto-fixed and files are updated.

## Files and Artifacts
- **validation_results.txt**: Contains a Markdown-formatted report listing keys present in translation files but missing in the English reference.

## Git Behavior
- After processing, the workflow checks for git changes.
- If files were modified (sorting or auto-filled keys), it commits and pushes the changes using the GITHUB_TOKEN (configured via actions/checkout).

## Issue Creation
- If validation fails (extra keys found) the job exits non-zero and:
  - Creates a new issue or comments on an existing open issue labeled "translation-sync" with the contents of validation_results.txt.
  - The issue contains context like commit SHA and triggering user.

## Configuration Options
- **paths** (workflow trigger): Adjust which files/dirs should trigger the workflow.
- **ENGLISH_FILE**: Path to the English reference YAML file used for comparisons.
- **TRANSLATION_DIR**: Directory containing translation YAML files to process.
- Node.js version and js-yaml options (indentation, quoting, line width).
- Patterns to include/exclude additional translation locations (e.g., locales/, i18n/).

## Permissions
- **contents: write** — Required to commit and push changes.
- **issues: write** — Required to create or comment on issues.

## Important Behavior & Limitations
- Missing keys are auto-filled with the English value. This is by design to keep translation files structurally consistent, but those entries should be translated later by human translators.
- Extra keys are NOT automatically removed; they are reported for manual review.
- Arrays are preserved and mapped through the sorting function — the items themselves are not re-ordered.
- The script relies on js-yaml's load/dump behavior; complex YAML constructs (anchors, custom tags) may not round-trip exactly.
- The workflow currently skips any files under .github/workflows and node_modules.

## Troubleshooting & Testing Locally
- To test locally, run the Node.js scripts used in the workflow against your translation directory. Ensure js-yaml is installed (npm install js-yaml).
- Verify ENGLISH_FILE path points to the correct English reference file.
- Inspect validation_results.txt for details if an issue is opened.

## Security & Maintenance Notes
- The workflow uses the repository's GITHUB_TOKEN for commits and issue creation.
- Keep node and js-yaml up to date to receive bug and security fixes.

## Suggested Next Steps After Receiving a Validation Issue
- Review the listed extra keys and decide whether they should be added to English or removed/renamed in the translation file.
- Translate any auto-filled English values in the non-English files and commit.