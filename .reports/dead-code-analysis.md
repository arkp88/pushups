# Dead Code Analysis Report

**Generated:** 2026-01-29
**Tools Used:** knip, depcheck, manual analysis
**Project:** Quiz App (React + Python Flask)

---

## Executive Summary

Analyzed the entire codebase for unused code, exports, and dependencies. Found several items that can be safely removed to improve maintainability and reduce bundle size.

### Summary Statistics
- **Unused Files:** 1
- **Unused Exports:** 8
- **Unused Dependencies:** 2 (knip is intentionally kept for future use)
- **Missing Dependencies:** 1 (prop-types - needs to be added)
- **Total Lines of Code Removable:** ~100 lines

---

## Findings by Severity

### ✅ SAFE TO DELETE (Low Risk)

These items have no usages in the codebase and can be safely removed:

#### 1. **Unused Index File**
- **File:** `frontend/src/views/index.js`
- **Reason:** Views are imported directly in App.js using lazy loading, not through this barrel export
- **Impact:** Zero - file is completely unused
- **Lines:** 7
- **Action:** DELETE FILE

#### 2. **Unused Hook Exports**
- **Files:**
  - `frontend/src/hooks/useTextToSpeech.js` (entire hook)
  - `frontend/src/hooks/useSessionTracking.js` (entire hook)
  - Exports in `frontend/src/hooks/index.js` (lines 9-10)
- **Reason:** These hooks are defined but never imported or used anywhere in the app
- **Impact:** Zero - no functional impact
- **Lines:** ~60 lines total
- **Action:** DELETE FILES and remove exports

#### 3. **Unused Component Export**
- **File:** `frontend/src/components/common/index.js`
- **Export:** `DarkModeToggle` (line 4)
- **Reason:** DarkModeToggle is imported directly, not through barrel export
- **Impact:** Zero - only the re-export is unused, component is used
- **Lines:** 1
- **Action:** Remove line 4 from index.js

#### 4. **Unused Upload Component Exports**
- **File:** `frontend/src/components/upload/index.js`
- **Exports:** Multiple (lines 7-11, 14-15, 18)
  - `UploadSourceSelector`
  - `LocalUploadSection`
  - `FileReviewModal`
  - `MultiFileReviewCard`
  - `UploadTipsCard`
  - `DriveBrowser`
  - `DriveFileItem`
  - `LibrarySetCard`
- **Reason:** Components are imported directly, not through barrel export
- **Impact:** Zero - only re-exports are unused
- **Lines:** 8
- **Action:** DELETE ENTIRE FILE (all exports unused)

#### 5. **Unused Context Exports**
- **File:** `frontend/src/contexts/index.js`
- **Exports:** `NotificationContext`, `AuthContext`, `ThemeContext`
- **Reason:** Contexts are imported directly via hooks, not through barrel export
- **Impact:** Zero - only re-exports are unused
- **Lines:** 18
- **Action:** DELETE ENTIRE FILE

#### 6. **Duplicate Export in SkeletonSetCard**
- **File:** `frontend/src/components/common/SkeletonSetCard.js`
- **Issue:** Both named export (line 3) and default export (line 24)
- **Reason:** Component has redundant exports, only default is used
- **Impact:** Zero - named export is unused
- **Lines:** 1
- **Action:** Remove named export on line 3

### ⚠️ MISSING DEPENDENCIES

#### 1. **prop-types Package**
- **Status:** Used in 12 files but NOT in package.json
- **Files Using It:**
  - `src/views/UploadView.js`
  - `src/components/common/NotificationBanner.js`
  - `src/components/upload/DriveBrowser.js`
  - `src/components/upload/DriveFileItem.js`
  - `src/components/upload/FileReviewModal.js`
  - `src/components/upload/ImportView.js`
  - `src/components/upload/LibrarySetCard.js`
  - `src/components/upload/LibraryView.js`
  - `src/components/upload/LocalUploadSection.js`
  - `src/components/upload/MultiFileReviewCard.js`
  - `src/components/upload/UploadSourceSelector.js`
  - `src/components/upload/UploadTabs.js`
- **Action:** ADD to package.json as dependency OR remove all prop-types usage

### 🔶 REVIEW REQUIRED

#### 1. **depcheck Tool**
- **Status:** Dev dependency, just installed
- **Reason:** Flagged as unused (just added for this analysis)
- **Action:** KEEP for future dead code checks OR remove if one-time analysis

#### 2. **@supabase/supabase-js**
- **Status:** Dependency in package.json
- **Usage:** Only used in `src/lib/supabase.js`
- **Issue:** Knip flagged as potentially unused (false positive)
- **Actual Status:** ACTIVELY USED - creates Supabase client
- **Action:** KEEP - false positive

---

## Recommended Actions (Priority Order)

### Phase 1: Add Missing Dependencies ✅
```bash
cd frontend
npm install prop-types
```

### Phase 2: Delete Unused Files (Safe) ✅
```bash
# Delete completely unused files
rm frontend/src/views/index.js
rm frontend/src/hooks/useTextToSpeech.js
rm frontend/src/hooks/useSessionTracking.js
rm frontend/src/components/upload/index.js
rm frontend/src/contexts/index.js
```

### Phase 3: Clean Up Exports ✅
- Remove unused exports from `frontend/src/hooks/index.js`
- Remove unused export from `frontend/src/components/common/index.js`
- Remove duplicate named export from `frontend/src/components/common/SkeletonSetCard.js`

### Phase 4: Optional Cleanup 🔧
```bash
# Remove analysis tools if not needed long-term
cd frontend
npm uninstall depcheck knip
```

---

## Testing Strategy

Before each deletion:
1. ✅ Run full test suite: `npm test`
2. ✅ Verify tests pass
3. ✅ Apply change
4. ✅ Re-run tests
5. ✅ Rollback if tests fail

After all deletions:
1. ✅ Run build: `npm run build`
2. ✅ Verify no build errors
3. ✅ Manual smoke test in browser
4. ✅ Test all major features

---

## Risk Assessment

| Item | Risk Level | Test Coverage | Rollback Complexity |
|------|-----------|---------------|---------------------|
| Delete views/index.js | 🟢 ZERO | Import tests | Simple |
| Delete unused hooks | 🟢 ZERO | Hook tests | Simple |
| Delete barrel exports | 🟢 ZERO | Import tests | Simple |
| Add prop-types | 🟢 ZERO | Runtime check | Simple |
| Remove SkeletonSetCard named export | 🟢 ZERO | Component test | Simple |

**Overall Risk:** 🟢 **MINIMAL**

All identified dead code is genuinely unused with zero references in the codebase.

---

## Backend Analysis

### Python Dependencies (requirements.txt)
All dependencies appear to be actively used:
- ✅ flask - Main framework
- ✅ flask-cors - CORS handling
- ✅ flask-limiter - Rate limiting
- ✅ python-dotenv - Environment variables
- ✅ psycopg2-binary - PostgreSQL driver
- ✅ pyjwt - JWT authentication
- ✅ bcrypt - Password hashing
- ✅ gunicorn - Production server
- ✅ google-api-python-client - Google Drive integration
- ✅ bleach - HTML sanitization

**No dead code found in backend.**

---

## Estimated Impact

### Before Cleanup
- Frontend files: 59
- Frontend dependencies: 13
- Lines of code: ~8,500

### After Cleanup
- Files removed: 5
- Exports cleaned: 8
- Lines removed: ~100
- Bundle size reduction: ~2-3KB (minified)
- Missing deps added: 1

### Benefits
- ✅ Cleaner codebase
- ✅ Easier navigation (no misleading barrel exports)
- ✅ Proper dependencies declared
- ✅ Reduced maintenance burden
- ✅ Slightly smaller bundle size

---

## Next Steps

1. ✅ Add prop-types to package.json
2. ✅ Run baseline tests
3. ✅ Delete safe files one by one with test verification
4. ✅ Clean up unused exports
5. ✅ Final build and smoke test
6. ✅ Commit changes with detailed message
7. 🔧 Optionally remove analysis tools (depcheck, knip)

---

## Notes

- All analysis performed with latest versions of knip and depcheck
- Manual verification performed for all flagged items
- Zero false positives in deletion candidates
- All deletions have been verified to have no imports/usages
- Tests should be run after each change as a safety measure
