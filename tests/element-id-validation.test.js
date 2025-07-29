const fs = require('fs');
const path = require('path');

describe('Element ID Validation', () => {
  const srcDir = path.join(__dirname, '../src');

  // Extract element IDs from HTML files
  function extractElementIds(htmlContent) {
    const idRegex = /id=["']([^"']+)["']/g;
    const ids = [];
    let match;
    
    while ((match = idRegex.exec(htmlContent)) !== null) {
      ids.push(match[1]);
    }
    
    return [...new Set(ids)]; // Remove duplicates
  }

  // Extract element references from JavaScript files
  function extractElementReferences(jsContent) {
    const patterns = [
      /getElementById\(["']([^"']+)["']\)/g,
      /document\.getElementById\(["']([^"']+)["']\)/g,
      /this\.(\w+)\s*=\s*document\.getElementById\(["']([^"']+)["']\)/g
    ];
    
    const references = [];
    
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(jsContent)) !== null) {
        if (match[1] && match[2]) {
          // For patterns with capture groups for both property and ID
          references.push(match[2]);
        } else if (match[1]) {
          // For patterns with single capture group
          references.push(match[1]);
        }
      }
    });
    
    // Filter out dynamically created elements
    const dynamicElements = [
      'cancelOverwrite',
      'confirmOverwrite',
      'clearConfirm',
      'clearCancel'
    ];
    
    return [...new Set(references)].filter(ref => !dynamicElements.includes(ref));
  }

  describe('Popup Element ID Validation', () => {
    let popupHtmlIds;
    let popupJsReferences;

    beforeAll(() => {
      const popupHtmlPath = path.join(srcDir, 'popup.html');
      const popupJsPath = path.join(srcDir, 'popup.js');
      
      const popupHtmlContent = fs.readFileSync(popupHtmlPath, 'utf8');
      const popupJsContent = fs.readFileSync(popupJsPath, 'utf8');
      
      popupHtmlIds = extractElementIds(popupHtmlContent);
      popupJsReferences = extractElementReferences(popupJsContent);
    });

    test('all JavaScript element references exist in HTML', () => {
      popupJsReferences.forEach(reference => {
        expect(popupHtmlIds).toContain(reference);
      });
    });

    test('critical button IDs are correctly referenced', () => {
      const criticalIds = [
        'mainSaveButton',
        'clearStorageButton',
        'settingsButton',
        'fileLocation',
        'selectDirectory'
      ];
      
      criticalIds.forEach(id => {
        expect(popupHtmlIds).toContain(id);
        expect(popupJsReferences).toContain(id);
      });
    });

    test('no old element IDs are referenced', () => {
      const oldIds = [
        'saveJobButton',
        'downloadJobsButton',
        'showJobsButton',
        'saveJob',
        'downloadJobs',
        'showJobs', 
        'clearStorage',
        'settingsToggle'
      ];
      
      oldIds.forEach(id => {
        expect(popupJsReferences).not.toContain(id);
      });
    });
  });

  describe('Persistent Window Element ID Validation', () => {
    let persistentHtmlIds;
    let persistentJsReferences;

    beforeAll(() => {
      const persistentHtmlPath = path.join(srcDir, 'persistent-window.html');
      const persistentJsPath = path.join(srcDir, 'persistent-window.js');
      
      const persistentHtmlContent = fs.readFileSync(persistentHtmlPath, 'utf8');
      const persistentJsContent = fs.readFileSync(persistentJsPath, 'utf8');
      
      persistentHtmlIds = extractElementIds(persistentHtmlContent);
      persistentJsReferences = extractElementReferences(persistentJsContent);
    });

    test('all JavaScript element references exist in HTML', () => {
      persistentJsReferences.forEach(reference => {
        expect(persistentHtmlIds).toContain(reference);
      });
    });

    test('critical button IDs are correctly referenced', () => {
      const criticalIds = [
        'mainSaveButton',
        'clearStorageButton',
        'settingsButton',
        'fileLocationInput',
        'bringToFrontButton'
      ];
      
      criticalIds.forEach(id => {
        expect(persistentHtmlIds).toContain(id);
        expect(persistentJsReferences).toContain(id);
      });
    });

    test('no old element IDs are referenced', () => {
      const oldIds = [
        'saveJobButton',
        'downloadJobsButton',
        'showJobsButton',
        'saveJob',
        'downloadJobs',
        'showJobs',
        'clearStorage', 
        'settingsToggle',
        'fileLocation'
      ];
      
      oldIds.forEach(id => {
        expect(persistentJsReferences).not.toContain(id);
      });
    });
  });

  describe('Jobs Table Element ID Validation', () => {
    let jobsTableHtmlIds;
    let jobsTableJsReferences;

    beforeAll(() => {
      const jobsTableHtmlPath = path.join(srcDir, 'jobs-table.html');
      const jobsTableJsPath = path.join(srcDir, 'jobs-table.js');
      
      const jobsTableHtmlContent = fs.readFileSync(jobsTableHtmlPath, 'utf8');
      const jobsTableJsContent = fs.readFileSync(jobsTableJsPath, 'utf8');
      
      jobsTableHtmlIds = extractElementIds(jobsTableHtmlContent);
      jobsTableJsReferences = extractElementReferences(jobsTableJsContent);
    });

    test('all JavaScript element references exist in HTML', () => {
      jobsTableJsReferences.forEach(reference => {
        expect(jobsTableHtmlIds).toContain(reference);
      });
    });

    test('critical table element IDs are correctly referenced', () => {
      const criticalIds = [
        'searchInput',
        'jobFamilyFilter',
        'websiteFilter',
        'totalJobs',
        'showingJobs',
        'lastUpdated',
        'jobsTable',
        'jobsTableBody',
        'loading',
        'noJobs',
        'error',
        'errorMessage',
        'refreshBtn',
        'exportBtn',
        'clearBtn'
      ];
      
      criticalIds.forEach(id => {
        expect(jobsTableHtmlIds).toContain(id);
        expect(jobsTableJsReferences).toContain(id);
      });
    });
  });

  describe('Element ID Consistency Across Files', () => {
    test('popup and persistent window use consistent ID naming', () => {
      const popupHtmlPath = path.join(srcDir, 'popup.html');
      const persistentHtmlPath = path.join(srcDir, 'persistent-window.html');
      
      const popupHtmlContent = fs.readFileSync(popupHtmlPath, 'utf8');
      const persistentHtmlContent = fs.readFileSync(persistentHtmlPath, 'utf8');
      
      const popupIds = extractElementIds(popupHtmlContent);
      const persistentIds = extractElementIds(persistentHtmlContent);
      
      // Common IDs should be consistent
      const commonIds = [
        'mainSaveButton',
        'clearStorageButton',
        'settingsButton'
      ];
      
      commonIds.forEach(id => {
        expect(popupIds).toContain(id);
        expect(persistentIds).toContain(id);
      });
    });

    test('no duplicate IDs within HTML files', () => {
      const htmlFiles = ['popup.html', 'persistent-window.html', 'jobs-table.html'];
      
      htmlFiles.forEach(file => {
        const filePath = path.join(srcDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const ids = extractElementIds(content);
        
        // Check for duplicates
        const uniqueIds = [...new Set(ids)];
        expect(ids.length).toBe(uniqueIds.length);
      });
    });
  });

  describe('Element ID Format Validation', () => {
    test('all element IDs follow proper naming convention', () => {
      const htmlFiles = ['popup.html', 'persistent-window.html', 'jobs-table.html'];
      
      htmlFiles.forEach(file => {
        const filePath = path.join(srcDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const ids = extractElementIds(content);
        
        // IDs should be camelCase or kebab-case
        const validIdPattern = /^[a-z][a-zA-Z0-9]*$|^[a-z][a-z0-9-]*[a-z0-9]$/;
        
        ids.forEach(id => {
          expect(id).toMatch(validIdPattern);
        });
      });
    });

    test('no reserved JavaScript keywords used as IDs', () => {
      const reservedKeywords = [
        'class', 'function', 'var', 'let', 'const', 'if', 'else', 'for', 'while',
        'return', 'break', 'continue', 'switch', 'case', 'default', 'try', 'catch',
        'finally', 'throw', 'new', 'delete', 'typeof', 'instanceof', 'void', 'null',
        'undefined', 'true', 'false', 'this', 'super', 'import', 'export', 'default'
      ];
      
      const htmlFiles = ['popup.html', 'persistent-window.html', 'jobs-table.html'];
      
      htmlFiles.forEach(file => {
        const filePath = path.join(srcDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const ids = extractElementIds(content);
        
        ids.forEach(id => {
          expect(reservedKeywords).not.toContain(id);
        });
      });
    });
  });
});