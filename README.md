# 🌍 Translation Sync Automation

This repository includes an automated workflow to maintain the hygiene of our translation files (`translations/*.yml`).

### What it does
1.  **Alphabetizes Keys:** Automatically sorts all keys in all translation files to prevent merge conflicts and keep files tidy.
2.  **Syncs Structure:** If a key exists in English (`en_US.yml`) but is missing in other languages (e.g., `fr.yml`), it automatically adds the key to the target file (using the English value as a placeholder).
3.  **Detects Orphans:** Checks for keys that exist in foreign files but have been deleted from the English source.

### How it works
* **Trigger:** Runs automatically on every `push` that modifies files in the `translations/` folder.
* **Auto-Commit:** The workflow will commit the sorted/synced files back to the branch automatically.
* **Reporting:** If "Orphaned" keys are found (keys that should likely be deleted), a GitHub Issue will be created (or updated) tagging the user who pushed the code.

### 🛑 How to stop infinite loops
The automation appends `[skip ci]` to its commits. This ensures the workflow does not trigger itself in a loop.

### 🛠 Configuration
The logic is handled in `scripts/translation-manager.js`.
* **Source:** `translations/en_US.yml`
* **Targets:** `es-419.yml`, `fr.yml`, `pt-BR.yml`, `sv-SE.yml`