# Nested Translation File Structure

## Overview

Fresh-i18n now supports arbitrary nesting of translation files within locale directories. This allows you to organize translations hierarchically by feature, domain, or any logical structure that makes sense for your application.

## How It Works

The plugin recursively scans your locale directories and automatically builds namespace keys from the folder/file structure:

```
locales/en/
  ├── common.json                    → common.*
  ├── common/
  │   ├── actions.json               → common.actions.*
  │   ├── states.json                → common.states.*
  │   └── labels.json                → common.labels.*
  ├── features/
  │   ├── navigator/
  │   │   ├── dashboard.json         → features.navigator.dashboard.*
  │   │   └── pdi-modals.json        → features.navigator.pdiModals.*
  │   └── indicators/
  │       ├── list.json              → features.indicators.list.*
  │       └── form.json              → features.indicators.form.*
  └── matrix/
      ├── config.json                → matrix.config.*
      └── types.json                 → matrix.types.*
```

## File Naming Conventions

### Kebab-case to camelCase Conversion

File names are automatically converted from kebab-case to camelCase:

```
pdi-modals.json → pdiModals
user-settings.json → userSettings
goal-form.json → goalForm
```

This keeps URLs and file names readable while maintaining JavaScript naming conventions in your code.

### Example Structure

**Directory:**

```
locales/en/features/navigator/pdi-modals.json
```

**File content:**

```json
{
  "title": "Create Development Plan",
  "description": "Start a new plan",
  "submit": "Create"
}
```

**Usage in code:**

```tsx
t("features.navigator.pdiModals.title");
// → "Create Development Plan"
```

## Recommended Organization

### Common Folder Structure

Organize truly reusable strings in a `common/` folder:

```
locales/en/common/
  ├── actions.json      → common.actions.* (save, edit, delete, etc.)
  ├── states.json       → common.states.* (loading, success, error)
  ├── labels.json       → common.labels.* (name, description, date)
  ├── navigation.json   → common.navigation.* (home, back, next)
  └── business.json     → common.business.* (contract, indicator, node)
```

**Example: common/actions.json**

```json
{
  "save": "Save",
  "cancel": "Cancel",
  "edit": "Edit",
  "delete": "Delete",
  "create": "Create",
  "update": "Update"
}
```

**Usage:**

```tsx
<Button>{t("common.actions.save")}</Button>
<Button>{t("common.actions.cancel")}</Button>
```

### Feature-based Organization

Group feature-specific translations by domain:

```
locales/en/features/
  ├── dashboard/
  │   ├── overview.json
  │   ├── stats.json
  │   └── widgets.json
  ├── users/
  │   ├── list.json
  │   ├── form.json
  │   └── profile.json
  └── settings/
      ├── account.json
      └── preferences.json
```

## Nesting Within Files

You can still use nested objects within JSON files for logical grouping:

```json
{
  "title": "Dashboard",
  "stats": {
    "users": "Total Users",
    "revenue": "Revenue",
    "growth": "Growth Rate"
  },
  "actions": {
    "refresh": "Refresh Data",
    "export": "Export Report"
  }
}
```

Access with dot notation:

```tsx
t("features.dashboard.stats.users");
t("features.dashboard.actions.refresh");
```

## Backwards Compatibility

The plugin still supports flat file structures:

```
locales/en/
  ├── common.json
  ├── error.json
  └── metadata.json
```

Both flat and nested structures can coexist in the same application.

## Benefits

✅ **Scalability** - Grow your translations without file bloat\
✅ **Organization** - Mirror your app structure in translations\
✅ **Team collaboration** - Multiple people can work on different files\
✅ **Lazy loading potential** - Load only needed translations per route\
✅ **Clear ownership** - Feature teams own their translation files\
✅ **Easy refactoring** - Delete features and their translations together

## Migration Guide

### From Single File

**Before:**

```json
// locales/en/common.json (1000+ lines)
{
  "saveButton": "Save",
  "cancelButton": "Cancel",
  "loadingState": "Loading...",
  "dashboardTitle": "Dashboard",
  "dashboardWelcome": "Welcome"
  // ... many more
}
```

**After:**

```
locales/en/
  ├── common/
  │   ├── actions.json
  │   └── states.json
  └── features/
      └── dashboard.json
```

**Update your code:**

```tsx
// Before
t("common.saveButton");
t("common.loadingState");

// After
t("common.actions.save");
t("common.states.loading");
```

### Gradual Migration

You can migrate incrementally:

1. Keep existing `common.json` file
2. Create new nested structure for new features
3. Gradually move sections from `common.json` to nested files
4. Update translation keys in components as you go

## Example

See `/examples/basic/` for a working example with nested translation structure.

Run the example:

```bash
cd examples/basic
deno task dev
```

Visit: http://localhost:8000/en/test

## Technical Details

The plugin uses `Deno.readDir()` to recursively scan locale directories and builds a map of namespace → file path. Translation files are then loaded and merged with their namespace prefix automatically applied.

File path transformation:

```
locales/en/features/navigator/pdi-modals.json
         ↓
features.navigator.pdiModals
```
