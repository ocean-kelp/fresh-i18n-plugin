# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.4] - 2026-01-27

### Fixed

- **AsyncLocalStorage singleton pattern** - Ensures all module instances share the same translation context
  - Prevents "Translation data not found" errors when module is loaded multiple times
  - Uses global Symbol registry to enforce singleton pattern across different import paths
  - Critical fix for Docker and production deployments with complex module resolution

### Added

- Comprehensive test suite for AsyncLocalStorage context isolation
- Tests validating singleton pattern across multiple module loads
- Tests for concurrent context isolation

## [0.2.0] - 2026-01-19

### Added

- **Nested folder structure support** - Organize translations with unlimited nesting depth
- Automatic namespace generation from folder/file paths
- Kebab-case to camelCase conversion for file names (e.g., `pdi-modals.json` → `pdiModals`)
- Recursive directory scanning to discover all translation files
- Documentation for nested structure organization patterns
- Example implementation with nested structure in `/examples/basic/`

### Changed

- Removed hardcoded namespace list - now auto-discovers all translation files
- Plugin now recursively scans locale directories instead of loading fixed namespaces
- Updated `loadTranslation` function to accept file path directly

### Technical

- Added `discoverTranslationFiles()` function for recursive file discovery
- Added `kebabToCamel()` utility for file name transformation
- Imported `relative` from `@std/path` for path manipulation

### Backwards Compatibility

- Fully backwards compatible with flat file structures
- Existing translation keys and file organization continue to work unchanged
- Both flat and nested structures can coexist in the same project

## [0.1.4] - Previous Release

- Initial features (see previous documentation)
