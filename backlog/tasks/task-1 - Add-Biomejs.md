---
id: task-1
title: Add Biomejs
status: To Do
assignee: []
created_date: '2025-08-14'
updated_date: '2025-08-14'
labels: []
dependencies: []
---

# Add Biomejs

NOTE:

Biomejs does not yet fully support Svelte projects, so it was replaced with prettier and eslint

## Install

```
pnpm add -D -E @biomejs/biome@2.1.4
```

## Add the configuration file

- Add a `biome.json` file to the project root

```json
{
	"$schema": "https://biomejs.dev/schemas/2.1.4/schema.json",
	"vcs": {
		"enabled": true,
		"clientKind": "git",
		"useIgnoreFile": true
	},
	"files": {
		"ignoreUnknown": false
	},
	"formatter": {
		"enabled": true,
		"indentStyle": "space",
		"indentWidth": 2
	},
	"linter": {
		"enabled": true,
		"rules": {
			"recommended": true
		}
	},
	"javascript": {
		"formatter": {
			"quoteStyle": "single"
		}
	},
	"assist": {
		"enabled": true,
		"actions": {
			"source": {
				"organizeImports": "on"
			}
		}
	},
	"overrides": [
		{
			"includes": ["**/*.svelte"],
			"linter": {
				"rules": {
					"style": {
						"useConst": "off"
					}
				}
			}
		}
	]
}
```

## Add pre-commit config

- Add or extend the `.pre-commit-config.yaml` in the project root

```yaml
repos:
  - repo: https://github.com/biomejs/pre-commit
    rev: v2.1.4
    hooks:
      - id: biome-check
  - repo: https://github.com/python-jsonschema/check-jsonschema
    rev: 0.33.2
    hooks:
      - id: check-jsonschema
        files: biome.json
        args: ['--check-metaschema']
```

- Install it with `pre-commit install`
- Run it once with `pre-commit run --all-files`

## Add the following lines to `pagage.json`

```
"format": "biome format --write .",
"format:check": "biome format .",
"lint": "biome lint .",
"lint:fix": "biome lint --write ."
```

# Cleanup

Add all files to git and then commit with the message "Add Biomejs".
If the pre-commit hook for biomejs fails, try again a second time.
If it also fails the second time, prompt the user for instructions
