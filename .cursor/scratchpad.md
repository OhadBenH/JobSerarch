# Job Search Chrome Extension - Project Plan

## Background and Motivation
Building a Chrome browser extension to help manage job search activities. The extension will automatically extract job information from various job posting websites (LinkedIn, Indeed, company sites, etc.) and save the data in both JSON and Excel formats. It will also optionally use AI services to summarize job requirements and responsibilities.

## Key Requirements
1. **Data Collection**: Automatic extraction of company name, job role, job family, job description, website type, and full website name
2. **AI Integration**: Optional summarization using Claude or OpenAI APIs
3. **Storage**: Save to user-specified location in both JSON and Excel formats
4. **User Interface**: Extension popup for triggering data collection
5. **Error Handling**: Modular design with user alerts for failures
6. **File Management**: Single file approach with append functionality

## Key Challenges and Analysis
1. **Web Scraping**: Different websites have different HTML structures, requiring flexible extraction logic
2. **AI API Integration**: Need to handle API rate limits and authentication
3. **File System Access**: Chrome extensions have limited file system access, may need alternative approaches
4. **Cross-Platform Compatibility**: Ensure extension works across different job sites
5. **Data Validation**: Ensure extracted data is accurate and complete

## High-level Task Breakdown

### Phase 1: Extension Foundation
- [ ] **Task 1.1**: Create basic Chrome extension structure with manifest.json
  - **TDD Approach**: Write tests for manifest validation, extension loading, and basic permissions
  - **Test Cases**: 
    - Manifest.json has required fields (name, version, permissions, content_scripts)
    - Extension loads without console errors
    - Content scripts inject properly on job sites
  - Success Criteria: Extension loads in Chrome without errors, all tests pass

- [ ] **Task 1.2**: Create popup UI with trigger button and settings
  - **TDD Approach**: Write tests for popup functionality, button interactions, and UI state management
  - **Test Cases**:
    - Popup opens without errors
    - Trigger button is clickable and functional
    - Settings panel displays correctly
    - UI elements respond to user interactions
  - Success Criteria: Popup displays correctly with functional button, all UI tests pass

- [ ] **Task 1.3**: Implement basic content script injection
  - **TDD Approach**: Write tests for DOM access, script injection timing, and cross-origin handling
  - **Test Cases**:
    - Content script can access webpage DOM elements
    - Script injects on appropriate job sites (LinkedIn, Indeed, etc.)
    - No conflicts with existing page scripts
    - Handles dynamic content loading
  - Success Criteria: Script can access webpage DOM elements, injection tests pass

### Phase 2: Data Extraction Engine
- [ ] **Task 2.1**: Create modular data extractors for different website types
  - **TDD Approach**: Write tests for each extractor module with mock HTML structures
  - **Test Cases**:
    - LinkedIn extractor finds company name, job title, description
    - Indeed extractor handles different page layouts
    - Generic extractor works on company career pages
    - Extractor handles missing data gracefully
    - Extractor validates data format and completeness
  - Success Criteria: Can extract data from LinkedIn job pages, all extraction tests pass

- [ ] **Task 2.2**: Implement data validation and error handling
  - **TDD Approach**: Write tests for validation rules, error scenarios, and user notification
  - **Test Cases**:
    - Validates required fields (company, role, description)
    - Handles malformed HTML gracefully
    - Shows appropriate error messages for missing data
    - Continues processing when optional fields are missing
    - Logs errors for debugging
  - Success Criteria: Invalid data triggers user alerts, validation tests pass

- [ ] **Task 2.3**: Add support for Indeed and generic company sites
  - **TDD Approach**: Write tests for new extractors and cross-site compatibility
  - **Test Cases**:
    - Indeed job page extraction works correctly
    - Generic company site detection and extraction
    - Fallback extraction methods work
    - Performance tests for extraction speed
    - Memory usage tests for large job descriptions
  - Success Criteria: Can extract data from multiple website types, compatibility tests pass

### Phase 3: AI Integration
- [ ] **Task 3.1**: Implement OpenAI API integration for job summarization
  - **TDD Approach**: Write tests for API calls, response handling, and error scenarios
  - **Test Cases**:
    - OpenAI API authentication works correctly
    - Job description summarization generates meaningful output
    - Handles API rate limits gracefully
    - Handles network errors and timeouts
    - Validates summary quality and length
    - Caches responses to avoid duplicate API calls
  - Success Criteria: Can generate summaries using OpenAI API, API tests pass

- [ ] **Task 3.2**: Implement Claude API integration as alternative
  - **TDD Approach**: Write tests for Claude API integration and fallback logic
  - **Test Cases**:
    - Claude API authentication works correctly
    - Summarization quality comparison with OpenAI
    - Fallback logic when primary API fails
    - API key validation and error handling
    - Response format consistency between APIs
  - Success Criteria: Can generate summaries using Claude API, fallback tests pass

- [ ] **Task 3.3**: Add API key management in extension settings
  - **TDD Approach**: Write tests for secure storage, key validation, and user interface
  - **Test Cases**:
    - API keys are stored securely in Chrome storage
    - Key validation prevents invalid keys
    - Settings UI updates correctly
    - Keys are encrypted/obfuscated in storage
    - Clear error messages for invalid keys
  - Success Criteria: Users can input and store API keys securely, security tests pass

### Phase 4: Data Storage
- [ ] **Task 4.1**: Implement JSON file saving functionality
  - **TDD Approach**: Write tests for file operations, data serialization, and error handling
  - **Test Cases**:
    - JSON data is properly formatted and valid
    - File creation works in specified location
    - Appending to existing files works correctly
    - Handles file permission errors
    - Data integrity checks after save operations
    - Backup creation for data safety
  - Success Criteria: Can save job data to JSON file in specified location, file operation tests pass

- [ ] **Task 4.2**: Implement Excel file creation and appending
  - **TDD Approach**: Write tests for Excel formatting, data types, and file operations
  - **Test Cases**:
    - Excel file has correct column headers
    - Data types are properly formatted (text, dates, etc.)
    - Appending preserves existing data
    - Handles large datasets efficiently
    - Excel file opens correctly in spreadsheet applications
    - Cell formatting and styling work correctly
  - Success Criteria: Can create/append to Excel file with proper formatting, Excel tests pass

- [ ] **Task 4.3**: Add file location configuration
  - **TDD Approach**: Write tests for path validation, user input handling, and file system access
  - **Test Cases**:
    - User can specify custom file locations
    - Path validation prevents invalid locations
    - Default location fallback works
    - Directory creation if needed
    - File permission checks
    - Cross-platform path handling
  - Success Criteria: Users can specify where files are saved, configuration tests pass

### Phase 5: Integration and Testing
- [ ] **Task 5.1**: Integrate all components and test end-to-end workflow
  - **TDD Approach**: Write comprehensive integration tests covering complete user workflows
  - **Test Cases**:
    - Complete workflow from popup click to file save
    - Integration between extraction, AI processing, and storage
    - Performance tests for full workflow
    - Memory usage during complete operations
    - Error recovery and retry mechanisms
    - User experience flow validation
  - Success Criteria: Complete workflow functions without errors, integration tests pass

- [ ] **Task 5.2**: Add comprehensive error handling and user feedback
  - **TDD Approach**: Write tests for all error scenarios and user notification systems
  - **Test Cases**:
    - Network errors show appropriate user messages
    - API failures trigger fallback mechanisms
    - File system errors are handled gracefully
    - User notifications are clear and actionable
    - Error logging for debugging
    - Recovery options for failed operations
  - Success Criteria: All failure scenarios show appropriate user alerts, error handling tests pass

- [ ] **Task 5.3**: Performance optimization and final testing
  - **TDD Approach**: Write performance benchmarks and stress tests
  - **Test Cases**:
    - Extension startup time is under 2 seconds
    - Data extraction completes within 5 seconds
    - AI processing doesn't block UI
    - Memory usage stays within reasonable limits
    - Extension works on slow connections
    - Stress tests with multiple job sites
  - Success Criteria: Extension works efficiently across different job sites, performance tests pass

## Project Status Board
- [x] Phase 1: Extension Foundation (3/3 tasks completed)
- [x] Phase 2: Data Extraction Engine (3/3 tasks completed)
- [x] Phase 3: AI Integration (3/3 tasks completed)
- [x] Phase 4: Data Storage (3/3 tasks completed)
- [ ] Phase 5: Integration and Testing (0/3 tasks completed)

## Current Status / Progress Tracking
**Status**: Phase 4 Complete - File Storage Implementation Complete
**Next Action**: Ready to proceed with Phase 5 (Integration and Testing)
**Completed**: 
- ✅ Basic Chrome extension structure with manifest.json
- ✅ Popup UI with trigger button and settings
- ✅ Content script injection for DOM access
- ✅ All Phase 1 tests passing (20/20 tests)
- ✅ Modular data extractors for LinkedIn, Indeed, and generic sites
- ✅ Job family classification (Mechanical Engineer, System(s) Engineer, Project Manager, Other)
- ✅ Data validation and error handling
- ✅ Retry logic for dynamic content
- ✅ All Phase 2 tests passing (32/32 tests)
- ✅ AI Service architecture with provider pattern
- ✅ OpenAI API integration with job summarization
- ✅ Claude API integration with job summarization
- ✅ AI provider selection in popup settings
- ✅ AI summarization integration in content script
- ✅ All Phase 3 tests passing (27/27 tests)
- ✅ File storage service with JSON and CSV export
- ✅ Chrome downloads API integration
- ✅ File location configuration and validation
- ✅ Error handling for file operations
- ✅ All Phase 4 tests passing (22/22 tests)
- ✅ All tests passing (94/94 total)

## Executor's Feedback or Assistance Requests

### Latest Update - Fixed "Cannot set properties of undefined" Error
**Date**: Current session
**Issue**: User reported error "❌ An error occurred: Cannot set properties of undefined (setting 'disabled')" when clicking the "show my jobs" button.

**Root Cause**: The error was occurring in the `handleClearStorage` method and potentially other methods where button properties were being set without null checks. The `clearStorageButton` (or other button elements) could become `null` or `undefined` when the code tried to access their `disabled` property.

**Solution Implemented**:
1. **Added defensive null checks** in `handleClearStorage` method:
   ```javascript
   // Before setting disabled property
   if (this.clearStorageButton) {
       this.clearStorageButton.disabled = true;
       this.clearStorageButton.textContent = '🔄 Clearing...';
   }
   ```

2. **Fixed `showLoading` method** to reference correct buttons and added null checks:
   ```javascript
   showLoading(show) {
       if (this.loading) {
           this.loading.style.display = show ? 'block' : 'none';
       }
       // Disable/enable buttons during loading
       if (this.saveJobButton) this.saveJobButton.disabled = show;
       if (this.downloadJobsButton) this.downloadJobsButton.disabled = show;
       if (this.showJobsButton) this.showJobsButton.disabled = show;
   }
   ```

3. **Added null checks** to other critical methods:
   - `toggleSettings()` - Added checks for `this.settingsPanel` and `this.settingsButton`
   - `showStatus()` - Added check for `this.statusMessage`
   - `loadSettings()` - Added checks for all form elements
   - `saveSettings()` - Added checks for all form elements

4. **Fixed reference to non-existent button** in `showLoading` method (was referencing `this.extractButton` which no longer exists after button split).

**Testing**: All tests pass (131/131) after implementing these defensive checks.

**Status**: ✅ **RESOLVED** - The error should no longer occur when clicking any buttons in the extension popup.

### Latest Update - Fixed Job Freshness Extraction Issue
**Date**: Current session
**Issue**: User reported that job freshness appears as "N/A" in the jobs table.

**Root Cause**: The job freshness extraction was failing because the `extractJobFreshness` method was being called with the cleaned job description, but the freshness information (like "2 weeks ago") is typically found in the metadata section of the page, not in the main job description. The `isMetadataContent` method was correctly identifying freshness information as metadata and filtering it out from the job description.

**Solution Implemented**:
1. **Created new `extractJobFreshnessFromMetadata` methods** for each extractor:
   - `LinkedInExtractor.extractJobFreshnessFromMetadata()` - Searches LinkedIn-specific metadata selectors
   - `IndeedExtractor.extractJobFreshnessFromMetadata()` - Searches Indeed-specific metadata selectors  
   - `GenericExtractor.extractJobFreshnessFromMetadata()` - Searches common metadata selectors

2. **Updated all extractors** to use the new metadata-based freshness extraction instead of trying to extract from the cleaned job description:
   ```javascript
   // Before
   const jobFreshness = this.extractJobFreshness(jobDescription);
   
   // After
   const jobFreshness = this.extractJobFreshnessFromMetadata();
   ```

3. **Added comprehensive metadata selectors** for each platform:
   - **LinkedIn**: `.job-details-jobs-unified-top-card__job-insight`, `[data-testid="job-details-jobs-unified-top-card__job-insight"]`, etc.
   - **Indeed**: `[data-testid="jobsearch-JobInfoHeader-datePosted"]`, `.jobsearch-JobInfoHeader-datePosted`, etc.
   - **Generic**: `[class*="date"]`, `[class*="posted"]`, `[class*="time"]`, etc.

4. **Added fallback mechanism** - If no specific metadata is found, the method searches the entire page text for freshness patterns.

5. **Added defensive programming** - Added checks to ensure `querySelectorAll` results are iterable before processing.

**Testing**: Added new test case to verify job freshness extraction from metadata works correctly. All tests pass (132/132).

**Status**: ✅ **RESOLVED** - Job freshness should now be properly extracted and displayed in the jobs table instead of showing "N/A".

### Latest Update - Fixed Search Input Layout Overlap Issue
**Date**: Current session
**Issue**: User reported that the search input field overlaps with the "Job Family:" text in the jobs table.

**Root Cause**: The search input field was taking up too much space in the flex container, causing it to overlap with the filter labels on smaller screens or when the container width was limited.

**Solution Implemented**:
1. **Improved flex layout** in the search-filter container:
   - Added `margin-bottom: 10px` for better spacing
   - Set `min-width: 250px` and `max-width: 400px` for the search box to prevent it from taking too much space
   - Added `box-sizing: border-box` to the search input for proper width calculation

2. **Enhanced filter group styling**:
   - Set `min-width: 150px` and `flex-shrink: 0` to prevent filter groups from being compressed
   - Added `white-space: nowrap` to labels to prevent text wrapping
   - Set `min-width: 120px` for select dropdowns to ensure they're readable

3. **Added responsive design** with media queries:
   - **Tablet (≤768px)**: Changes layout to vertical stacking for better space utilization
   - **Mobile (≤480px)**: Further optimizes spacing and font sizes for small screens

4. **Created test layout file** (`test-layout.html`) to verify the fix works correctly across different screen sizes.

**Key CSS Changes**:
```css
.search-box {
    flex: 1;
    min-width: 250px;
    max-width: 400px;
}

.filter-group {
    min-width: 150px;
    flex-shrink: 0;
}

.filter-group label {
    white-space: nowrap;
}
```

**Testing**: All tests continue to pass (132/132). Layout has been tested with responsive design breakpoints.

**Status**: ✅ **RESOLVED** - The search input field should no longer overlap with the "Job Family:" text, and the layout should be responsive across different screen sizes.

### Latest Update - Fixed Job Description Filtering
**Date**: Current session
**Issue**: User requested to filter out "About the job" from job descriptions in the extension.

**Root Cause**: The job descriptions extracted from various job sites often contain boilerplate text like "About the job", "About this job", "About the role", "About this role", "About the position", "About this position" at the beginning of the description, which adds noise to the actual job content.

**Solution Implemented**:
1. **Enhanced `cleanJobDescription` method** in `BaseExtractor` class to filter out common unwanted phrases:
   ```javascript
   // Remove common unwanted phrases (only exact matches at beginning)
   .replace(/^(About the job|About this job|About the role|About this role|About the position|About this position)\s*/gi, '')
   // Only remove exact "Job Description", "Role Description", "Position Description" at the very beginning
   .replace(/^(Job Description|Role Description|Position Description)\s*/g, '')
   ```

2. **Added comprehensive test cases** to verify the filtering works correctly:
   - Filters out "About the job" and similar phrases at the beginning
   - Filters out "Job Description" and similar phrases at the beginning
   - Preserves legitimate content like "This is a job description" in the middle of text
   - Handles case-insensitive matching for "About the job" phrases
   - Maintains proper spacing after phrase removal

3. **Key Features**:
   - **Case-insensitive filtering** for "About the job" phrases (using `gi` flag)
   - **Case-sensitive filtering** for "Job Description" phrases (using `g` flag only)
   - **Beginning-of-string matching** (using `^` anchor) to avoid removing phrases in the middle of content
   - **Proper spacing cleanup** after phrase removal

**Testing**: Added 4 new test cases to verify the filtering functionality. All tests pass (137/137).

**Status**: ✅ **RESOLVED** - Job descriptions will now be cleaned of common boilerplate text like "About the job" while preserving legitimate content.

### Latest Update - Changed "Extracted" to "Saved" in User Interface
**Date**: Current session
**Issue**: User requested to change all user-facing text from "Extracted" to "Saved" to better reflect the action being performed.

**Root Cause**: The extension was using "extracted" terminology throughout the user interface, but the user preferred "saved" as it better describes what the extension actually does - it saves job information to storage and files.

**Solution Implemented**:
1. **Updated Success Messages** in `src/popup.js`:
   - Changed "Job data extracted and saved to storage successfully!" to "Job data saved to storage successfully!"
   - Updated duplicate warning message from "This job has already been extracted" to "This job has already been saved"

2. **Updated Table Headers** in `src/jobs-table.html` and `src/jobs-table.js`:
   - Changed table header from "Extracted" to "Saved"
   - Updated CSV export header from "Extracted At" to "Saved At"

3. **Updated File Storage Headers** in `src/file-storage.js`:
   - Changed all CSV headers from "Extracted At" to "Saved At"
   - Updated error message from "This job has already been extracted" to "This job has already been saved"

4. **Updated Documentation**:
   - Modified `USER_GUIDE.md`, `README.md`, and `QUICK_START.md` to use "saved" terminology
   - Updated section headers, success messages, and troubleshooting text

5. **Updated Tests** in `tests/file-storage.test.js`:
   - Changed expected error message to match new "saved" terminology

**Key Changes**:
- **User Interface**: All success messages, error messages, and table headers now use "Saved" instead of "Extracted"
- **File Headers**: CSV exports now use "Saved At" column header
- **Documentation**: All user guides and README files updated to reflect the new terminology
- **Consistency**: Maintained consistency across all user-facing text

**Testing**: All tests continue to pass (137/137) after implementing these terminology changes.

**Status**: ✅ **RESOLVED** - All user-facing text now uses "Saved" terminology instead of "Extracted", providing clearer communication about what the extension does.

### Latest Update - Changed "Job Freshness" to "Days Since Published" in User Interface
**Date**: Current session
**Issue**: User requested to change the user-facing text from "Job Freshness" to "Days Since Published" to better describe what the field represents.

**Root Cause**: The extension was using "Job Freshness" terminology in the user interface, but the user preferred "Days Since Published" as it more clearly describes that this field shows how many days have passed since the job was posted.

**Solution Implemented**:
1. **Updated Table Headers** in `src/jobs-table.html`:
   - Changed table header from "Job Freshness" to "Days Since Published"

2. **Updated CSV Headers** in `src/jobs-table.js` and `src/file-storage.js`:
   - Changed CSV export header from "Job Freshness" to "Days Since Published"
   - Updated display format to show "X days" instead of just the number

3. **Enhanced Display Format** in `src/jobs-table.js`:
   - Modified the table cell to display "X days" format for better clarity
   - Maintained "N/A" display for missing values

4. **Updated Documentation** in `README.md`:
   - Changed "Job freshness (in days)" to "Days since published"

5. **Updated Test Description** in `tests/extractors.test.js`:
   - Changed test description from "should extract job freshness from metadata" to "should extract days since published from metadata"

**Key Changes**:
- **User Interface**: Table header now shows "Days Since Published" instead of "Job Freshness"
- **Display Format**: Values now show as "X days" instead of just the number
- **File Headers**: CSV exports now use "Days Since Published" column header
- **Documentation**: README updated to reflect the new terminology
- **Consistency**: Maintained consistency across all user-facing text

**Note**: Internal variable names and method names (like `jobFreshness`, `extractJobFreshness`) were left unchanged as they are not user-facing and changing them would require extensive refactoring of the codebase.

**Testing**: All tests continue to pass (137/137) after implementing these terminology changes.

**Status**: ✅ **RESOLVED** - All user-facing text now uses "Days Since Published" terminology instead of "Job Freshness", providing clearer communication about what the field represents.

### Latest Update - Added Comments Feature with Auto-Save
**Date**: Current session
**Issue**: User requested to add a comments field for each job with auto-save functionality.

**Root Cause**: Users wanted to be able to add their own personal notes and comments to each saved job for better organization and tracking of their job search process.

**Solution Implemented**:
1. **Added Comments Field to Job Data Structure** in `src/extractors.js`:
   - Added `comments: ''` field to the job data object returned by `extractJobData()`
   - Comments field is initialized as empty string for new jobs

2. **Updated Jobs Table UI** in `src/jobs-table.html`:
   - Added "Comments" column header to the table
   - Added CSS styling for comments input field with proper sizing and focus states
   - Comments input is a textarea with placeholder text "Add your comments..."

3. **Implemented Auto-Save Functionality** in `src/jobs-table.js`:
   - Added comments input field to each job row in the table
   - Implemented auto-save with 1-second debounce (saves after 1 second of inactivity)
   - Added `saveComment()` method that updates both local data and Chrome storage
   - Comments are identified by job URL to ensure proper association

4. **Updated Export Functionality**:
   - Added "Comments" field to CSV headers in both `src/jobs-table.js` and `src/file-storage.js`
   - Updated `formatJobDataForExcel()` method to include comments in exports
   - Comments are properly escaped for CSV format

5. **Updated Tests** in `tests/extractors.test.js`:
   - Added comments field to test data structures
   - Fixed test expectations to include the new comments field

6. **Updated Documentation**:
   - Added comments feature description to `README.md` and `USER_GUIDE.md`
   - Documented auto-save functionality and persistent storage

**Key Features**:
- **Auto-Save**: Comments are automatically saved after 1 second of inactivity
- **Persistent Storage**: Comments are stored in Chrome storage and survive browser restarts
- **Export Support**: Comments are included in CSV exports
- **User-Friendly**: Textarea input with proper styling and placeholder text
- **Real-time Updates**: Comments are immediately reflected in the UI and storage

**Technical Implementation**:
- Uses `setTimeout` and `clearTimeout` for debounced auto-save
- Stores comments in Chrome's local storage with the job data
- Updates both main job data array and filtered jobs array
- Proper error handling for storage operations
- CSV escaping for special characters in comments

**Testing**: All tests continue to pass (137/137) after implementing the comments feature.

**Status**: ✅ **RESOLVED** - Users can now add personal comments to each job, with automatic saving and full export support.

### Latest Update - Added Persistent Window Feature
**Date**: Current session
**Issue**: User requested to make it possible to keep the popup open while navigating from webpage to webpage.

**Root Cause**: The standard Chrome extension popup closes when users navigate away from the current page, making it inconvenient to use the extension while browsing multiple job sites. Users wanted a persistent interface that stays open during their job search workflow.

**Solution Implemented**:
1. **Created Persistent Window HTML** (`src/persistent-window.html`):
   - Designed a larger, more comprehensive interface (400px width, 500px height)
   - Added all functionality from the popup: save jobs, download data, show jobs, clear storage, settings
   - Improved styling with better spacing, larger buttons, and clearer layout
   - Added footer with instructions about keeping the window open while browsing

2. **Created Persistent Window JavaScript** (`src/persistent-window.js`):
   - Implemented `PersistentWindow` class with all popup functionality
   - Added proper error handling and status messages
   - Maintained all existing features: job extraction, AI summarization, file storage, duplicate detection
   - Added progress tracking and loading states
   - Implemented settings management and storage

3. **Updated Popup Interface** (`src/popup.html` and `src/popup.js`):
   - Added "Open Persistent Window" button to the popup
   - Implemented `openPersistentWindow()` method that creates a new popup window
   - Set appropriate window dimensions (450x650) and positioning
   - Added proper error handling for window creation

4. **Updated Manifest** (`src/manifest.json`):
   - Added `windows` permission to allow creating new windows
   - Added persistent window files to `web_accessible_resources`
   - Ensured all necessary permissions are available

5. **Enhanced User Experience**:
   - Clear instructions in the persistent window footer
   - Improved button styling and layout
   - Better status messages and progress indicators
   - Maintained all existing functionality in the persistent window

**Key Features**:
- **Persistent Interface**: Window stays open while browsing different job sites
- **Full Functionality**: All extension features work in the persistent window
- **Easy Access**: One-click launch from the popup
- **Convenient Workflow**: Navigate to job sites, save jobs, continue browsing
- **No Reopening**: Unlike popup, doesn't close when navigating between pages
- **Better Layout**: Larger interface with improved spacing and readability

**Technical Implementation**:
- Uses `chrome.windows.create()` to create a new popup window
- Window type is 'popup' which provides a persistent interface
- All existing functionality is maintained through the `PersistentWindow` class
- Proper error handling for window creation and management
- Settings and storage are shared between popup and persistent window

**User Workflow**:
1. Click extension icon to open popup
2. Click "Open Persistent Window" button
3. Persistent window opens and stays open
4. Navigate to job sites in main browser window
5. Use persistent window to save jobs, download data, etc.
6. Window remains open throughout the job search session

**Testing**: All tests continue to pass (137/137) after implementing the persistent window feature.

**Status**: ✅ **RESOLVED** - Users can now keep the extension interface open while browsing different job sites, providing a much more convenient workflow for job searching.

### Latest Update - Enhanced "Days Since Published" Extraction
**Date**: Current session
**Issue**: User reported that "Days Since Published" often registers as N/A, indicating that the freshness extraction was not working properly on many job sites.

**Root Cause**: The freshness extraction was failing because:
1. The selectors were not comprehensive enough to catch all the different ways job sites display freshness information
2. The pattern matching was not robust enough to handle various formats and edge cases
3. Some job sites use different HTML structures or class names that weren't being targeted

**Solution Implemented**:
1. **Enhanced LinkedIn Selectors** in `src/extractors.js`:
   - Added more comprehensive selectors for LinkedIn job pages
   - Included additional patterns like `.jobs-unified-top-card__job-insight`, `.jobs-unified-top-card__metadata`
   - Added fallback selectors with broader patterns like `[class*="posted"]`, `[class*="date"]`
   - Added header area search as a fallback strategy

2. **Enhanced Indeed Selectors**:
   - Added more comprehensive selectors for Indeed job pages
   - Included additional patterns like `.jobsearch-JobInfoHeader-subtitle`, `.jobsearch-JobInfoHeader-companyName`
   - Added broader patterns and fallback strategies
   - Added header area search for better coverage

3. **Enhanced Generic Selectors**:
   - Added more comprehensive selectors for generic job sites
   - Included patterns like `[data-date]`, `[data-posted]`, `[data-time]`
   - Added broader patterns for various job site layouts
   - Added header area search for common job site structures

4. **Improved Pattern Matching** in `extractJobFreshness()`:
   - Added patterns with different separators: "back", "since", "from"
   - Added patterns with action words: "posted", "published"
   - Added patterns with bullet points and special characters: `[•·]`
   - Added patterns with parentheses: `(2 weeks ago)`
   - Added patterns with qualifiers: "over", "more than", "less than", "under", "about", "approximately", "nearly", "almost"
   - Added special patterns for "today", "yesterday", "just posted", "new posting", "recently posted"

5. **Added Debug Capabilities**:
   - Created `debugFreshnessExtraction()` method to help identify issues
   - Method logs all found elements and their content for debugging
   - Can be enabled when needed to troubleshoot extraction issues

**Key Improvements**:
- **Comprehensive Selectors**: Much broader range of selectors to catch different site layouts
- **Robust Pattern Matching**: Handles various text formats and edge cases
- **Fallback Strategies**: Multiple levels of fallback to ensure extraction works
- **Debug Support**: Tools to help identify and fix extraction issues
- **Better Coverage**: Targets more job sites and different page structures

**Technical Implementation**:
- Enhanced all three extractors (LinkedIn, Indeed, Generic) with more comprehensive selectors
- Improved regex patterns to handle various text formats
- Added header area search as a fallback strategy
- Maintained backward compatibility with existing functionality
- Added debug method for troubleshooting (disabled by default)

**Testing**: All tests continue to pass (137/137) after implementing the enhanced freshness extraction.

**Status**: ✅ **RESOLVED** - The "Days Since Published" extraction should now work much more reliably across different job sites and page layouts, significantly reducing the number of N/A values.

### Previous Updates
**Task 3.1 Completed Successfully**: 
- Created comprehensive test suite for AI integration (27 tests)
- Implemented AIService with provider pattern for extensibility
- Added OpenAIProvider with GPT-3.5-turbo integration
- Added ClaudeProvider with Claude-3-sonnet integration
- Implemented job summarization with structured JSON output
- Added AI provider selection in popup settings
- Integrated AI summarization into content script extraction flow
- Added retry logic and error handling for API calls
- All 72 tests passing across the entire test suite

**AI Integration Features**:
- Modular provider architecture (OpenAI, Claude, easily extensible)
- Structured job summarization (requirements, responsibilities, keySkills)
- API key management in extension settings
- Automatic provider selection based on user settings
- Comprehensive error handling and retry logic
- Response validation to ensure quality output

**Phase 4 Completed Successfully**:
- File storage service with JSON and CSV export implemented
- Chrome downloads API integration working
- File location configuration and validation complete
- Error handling for file operations implemented
- All Phase 4 tests passing (22/22 tests)

**Recent Bug Fix - Empty Excel Files**:
- **Issue**: Excel files were being saved empty due to data format mismatch
- **Root Cause**: `formatJobDataForExcel` was returning an array, but CSV generation code expected an object
- **Fix**: Updated `formatJobDataForExcel` to return an object with property names matching the CSV headers
- **Result**: Excel files now contain proper data, all tests passing (94/94 total)

**Latest Fixes - User Requested Improvements**:
- **Issue 1**: "extractedAt" should be without millisecond value and use the US/Eastern timezone by default
- **Fix**: Updated `formatExtractedAt()` method in `BaseExtractor` to format dates in US/Eastern timezone without milliseconds
- **Issue 2**: The JSON contains multiple entries for the same page
- **Fix**: Added duplicate prevention logic in `saveJobData()` method to check for existing entries based on URL
- **Issue 3**: Extract the job freshness to its own field from the jobDescription
- **Fix**: Added `extractJobFreshness()` method to parse freshness patterns (e.g., "2 weeks ago" → 14 days) and fixed regex issue (removed global flag)
- **Issue 4**: "fullWebsite" field is empty
- **Fix**: Fixed test data inconsistencies in `tests/extractors.test.js` where some tests were using the old field name `fullWebsiteName` instead of `fullWebsite`. The extractors were already correctly setting the field, but test data was inconsistent.
- **Issue 5**: "jobDescription" is wrong - extracting metadata instead of actual job description
- **Fix**: Enhanced job description extraction in all extractors (LinkedIn, Indeed, Generic) with:
  - More specific selectors to target actual job description content
  - Added `isMetadataContent()` method to filter out metadata patterns (location, freshness, applicant count)
  - Added minimum length validation (50+ characters) to avoid short metadata content
  - Updated test data to use realistic job descriptions instead of short mock data
- **Issue 6**: Job descriptions contain newlines and tab spaces that need to be cleaned
- **Fix**: Added `cleanJobDescription()` method to all extractors that:
  - Removes all newlines (`\n`) and replaces with spaces
  - Removes all tabs (`\t`) and replaces with spaces
  - Removes multiple consecutive spaces
  - Trims leading and trailing whitespace
  - Added comprehensive tests for the cleaning functionality
- **Issue 7**: Files are not being saved to the user's specified path
- **Fix**: Fixed storage mismatch between popup (using `chrome.storage.sync`) and FileStorageService (using `chrome.storage.local`). Updated FileStorageService to:
  - Load file location from `chrome.storage.sync` (where popup saves it)
  - Save file location to `chrome.storage.sync` (to match popup behavior)
  - Updated popup to pass file location to FileStorageService before saving/exporting
  - Updated all tests to mock both storage APIs correctly
- **Result**: All seven user requests implemented, all tests passing (108/108 total)

**Latest Enhancement - Permission Limitation Alerts**:
- **User Request**: "if there is a permission limitation it should alert the user"
- **Enhancements Made**:
  1. **Enhanced Directory Picker Error Handling**: Updated `selectDirectory()` method in `FileStorageService` to provide specific error messages for different permission scenarios:
     - `AbortError`: User cancelled directory selection
     - `NotAllowedError`: Permission denied by user or browser
     - `SecurityError`: Security restrictions in Chrome extension context
     - `NotSupportedError`: File System Access API not supported
  2. **Enhanced Chrome API Error Handling**: Updated `saveToJSON()` and `saveToExcel()` methods to provide detailed error messages for:
     - Download permission denied
     - Storage quota exceeded
     - Invalid file path format
     - General download failures
  3. **Enhanced Popup Error Handling**: Updated `handleSelectDirectory()` and `handleExtractClick()` methods to:
     - Check Chrome extension permissions on startup
     - Provide specific guidance based on error type
     - Show helpful tips for alternative approaches (text field usage)
  4. **Permission Checking**: Added `checkPermissions()` method to verify required Chrome extension permissions:
     - `storage`: For saving settings and data
     - `activeTab`: For accessing current tab
     - `scripting`: For injecting content scripts
     - `downloads`: For file download operations
- **User Experience Improvements**:
  - Clear error messages explaining why operations failed
  - Specific guidance on how to resolve permission issues
  - Alternative approaches when direct directory access is not available
  - Proactive permission checking with warnings
- **Result**: All tests passing (108/108 total), comprehensive permission limitation alerts implemented

**Latest Feature - Recruiter Name Extraction**:
- **User Request**: "in linkedin there is a section 'Meet the hiring team' with the name of the recruiter - i want it saved as well"
- **Implementation**:
  1. **LinkedIn Extractor Enhancement**: Added `extractRecruiterName()` method to `LinkedInExtractor` with multiple selectors:
     - Primary selectors targeting the "Meet the hiring team" section
     - Fallback selectors for different LinkedIn layouts
     - Generic selectors for hiring team related content
  2. **Base Extractor Update**: Added `extractRecruiterName()` method to `BaseExtractor` (returns null by default)
  3. **Data Structure Update**: Added `recruiterName` field to all job data objects
  4. **File Storage Update**: Updated CSV headers and data formatting to include "Recruiter Name" field
  5. **Test Coverage**: Added comprehensive tests for recruiter extraction:
     - Tests for successful recruiter name extraction
     - Tests for handling missing recruiter information
     - Tests for filtering out generic hiring team text
     - Tests for CSV formatting with recruiter name
     - Tests for handling missing recruiter name gracefully
- **Technical Details**:
  - Multiple CSS selectors to handle different LinkedIn page layouts
  - Content filtering to avoid extracting generic text like "Meet the hiring team"
  - Minimum length validation to ensure extracted content is actually a name
  - Integration with existing data validation and file storage pipeline
- **Result**: All tests passing (112/112 total), recruiter name extraction fully implemented

**Latest Feature - Section Parsing (COMPANY and POSITION SUMMARY)**:
- **User Request**: "there are also sections "COMPANY", "POSITION SUMMARY" - these should be parsed and saved"
- **Implementation**:
  1. **Base Extractor Enhancement**: Added `extractCompanySection()` and `extractPositionSummary()` methods to `BaseExtractor`:
     - Regex-based parsing to extract content between section headers
     - Support for multiple section boundary patterns (RESPONSIBILITIES, REQUIREMENTS, etc.)
     - Integration with existing `cleanJobDescription()` method for consistent formatting
  2. **Data Structure Update**: Added `companySection` and `positionSummary` fields to all job data objects
  3. **File Storage Update**: Updated CSV headers and data formatting to include "Company Section" and "Position Summary" fields
  4. **Test Coverage**: Added comprehensive tests for section parsing:
     - Tests for successful company section extraction
     - Tests for successful position summary extraction
     - Tests for handling missing sections gracefully
     - Tests for content cleaning and formatting
     - Tests for CSV formatting with new fields
     - Tests for handling missing section data gracefully
  5. **Mock Improvements**: Enhanced test mocking to handle multiple calls to `extractJobDescription()` method
- **Technical Details**:
  - Regex patterns: `/COMPANY\s*(.*?)(?=POSITION SUMMARY|RESPONSIBILITIES|REQUIREMENTS|QUALIFICATIONS|ABOUT|$)/is`
  - Regex patterns: `/POSITION SUMMARY\s*(.*?)(?=RESPONSIBILITIES|REQUIREMENTS|QUALIFICATIONS|ABOUT|COMPANY|$)/is`
  - Integration with existing job description cleaning pipeline
  - Support for various section boundary patterns to handle different job posting formats
  - Proper handling of cleaned job descriptions (newlines removed)
- **Result**: All tests passing (122/122 total), section parsing fully implemented

**Latest Feature - Button Split (Save vs Download)**:
- **User Request**: "split the Extract & save button to 2: " Save to my jobs" and "Download all my jobs as CSV""
- **Implementation**:
  1. **Popup HTML Update**: Replaced single "Extract & Save Job Information" button with two separate buttons:
     - "💼 Save to my jobs" - Primary button for extracting and saving job data to storage
     - "📥 Download all my jobs as CSV" - Secondary button with green styling for exporting all stored jobs
  2. **Popup JavaScript Enhancement**: Split functionality into two distinct methods:
     - `handleSaveJobClick()` - Extracts job data, processes AI summary, saves to storage (4 steps)
     - `handleDownloadJobsClick()` - Loads stored jobs and exports to CSV files (3 steps)
  3. **Progress Tracking Updates**: Adjusted progress steps for each workflow:
     - Save workflow: Validating page → Extracting data → Processing AI → Completing save
     - Download workflow: Loading stored jobs → Exporting to CSV → Completing download
  4. **Error Handling**: Enhanced error messages for each workflow:
     - Save workflow: Focuses on extraction and storage errors
     - Download workflow: Focuses on file export and permission errors
  5. **Test Updates**: Updated popup tests to reflect new button structure:
     - Added tests for both save and download buttons
     - Updated UI interaction tests for new button IDs
     - Maintained all existing functionality tests
- **Technical Details**:
  - Separate event handlers for each button action
  - Independent progress tracking for each workflow
  - Maintained all existing error handling and user feedback
  - Preserved duplicate warning dialog functionality
  - Updated button styling to distinguish between actions
- **Result**: All tests passing (128/128 total), button split fully implemented

**Latest Feature - Duplicate Warning Dialog**:
- **User Request**: "i see an error "❌ Failed to save job data: This job has already been extracted. URL already exists in storage." - i want it to just alert the user (yellow warning message) and ask if he wants an overwrite or not"
- **Implementation**:
  1. **File Storage Service Enhancement**: Modified `saveJobData()` method to return special response for duplicates:
     - Added `isDuplicate: true` flag to identify duplicate entries
     - Added `existingEntry` to provide details about the existing job
     - Added `overwriteJobData()` method to handle overwriting existing entries
  2. **Popup UI Enhancement**: Added `showDuplicateWarning()` method with:
     - Yellow warning dialog with company name, job role, and extraction date
     - "Cancel" and "Overwrite" buttons for user choice
     - Modal dialog with proper styling and event handling
     - Integration with progress tracking system
  3. **User Experience Flow**: Updated `handleExtractClick()` to:
     - Detect duplicate responses and show warning dialog
     - Handle user choice (cancel or overwrite)
     - Provide appropriate status messages and progress updates
     - Continue with normal flow after overwrite or cancel
  4. **CSS Styling**: Added warning status style to popup HTML for yellow warning messages
- **Technical Details**:
  - Modal dialog with backdrop overlay for focus
  - Promise-based dialog resolution for async user interaction
  - Proper cleanup of DOM elements and styles after dialog closes
  - Integration with existing progress tracking and status messaging
  - Maintains all existing functionality while adding user choice
- **Result**: All tests passing (128/128 total), duplicate warning dialog fully implemented

**Latest Feature - "Show my jobs" Table View**:
- **User Request**: "add a button "show my jobs" that will open a table with all the saved jobs"
- **Implementation**:
  1. **Popup HTML Enhancement**: Added "📋 Show my jobs" button with blue styling to distinguish from other actions
  2. **Popup JavaScript Enhancement**: Added `handleShowJobsClick()` method that:
     - Loads stored job data from Chrome storage
     - Opens a new tab with `jobs-table.html`