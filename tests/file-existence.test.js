const fs = require('fs');
const path = require('path');

describe('File Existence and Reference Validation', () => {
  const srcDir = path.join(__dirname, '../src');
  const testDir = path.join(__dirname, '..');

  // Files that should exist in src directory
  const requiredSrcFiles = [
    'manifest.json',
    'popup.html',
    'popup.js',
    'persistent-window.html',
    'persistent-window.js',
    'background.js',
    'content.js',
    'extractors.js',
    'file-storage.js',
    'jobs-table.html',
    'jobs-table.js'
  ];

  // Files that should NOT exist (deleted AI files)
  const deletedFiles = [
    'ai-integration.js',
    'test-ai.html',
    'ai-summary-demo.html'
  ];

  // Files that should NOT be referenced in code
  const forbiddenReferences = [
    'ai-integration.js',
    'AIService',
    'OpenAIProvider',
    'ClaudeProvider'
  ];

  describe('Required Files Exist', () => {
    requiredSrcFiles.forEach(file => {
      test(`${file} exists in src directory`, () => {
        const filePath = path.join(srcDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Deleted Files Do Not Exist', () => {
    deletedFiles.forEach(file => {
      test(`${file} does not exist in src directory`, () => {
        const filePath = path.join(srcDir, file);
        expect(fs.existsSync(filePath)).toBe(false);
      });
    });

    test('ai-integration.test.js does not exist in tests directory', () => {
      const testFilePath = path.join(__dirname, 'ai-integration.test.js');
      expect(fs.existsSync(testFilePath)).toBe(false);
    });
  });

  describe('No Forbidden References in JavaScript Files', () => {
    const jsFiles = [
      'popup.js',
      'persistent-window.js',
      'background.js',
      'content.js',
      'extractors.js',
      'file-storage.js',
      'jobs-table.js'
    ];

    jsFiles.forEach(file => {
      test(`${file} does not reference deleted AI files`, () => {
        const filePath = path.join(srcDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        forbiddenReferences.forEach(forbiddenRef => {
          expect(content).not.toContain(forbiddenRef);
        });
      });
    });
  });

  describe('Manifest File Validation', () => {
    test('manifest.json does not reference deleted files', () => {
      const manifestPath = path.join(srcDir, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Check content scripts
      if (manifest.content_scripts && manifest.content_scripts[0]) {
        const contentScriptFiles = manifest.content_scripts[0].js || [];
        contentScriptFiles.forEach(file => {
          expect(file).not.toBe('ai-integration.js');
        });
      }

      // Check web accessible resources
      if (manifest.web_accessible_resources && manifest.web_accessible_resources[0]) {
        const webAccessibleFiles = manifest.web_accessible_resources[0].resources || [];
        webAccessibleFiles.forEach(file => {
          expect(file).not.toBe('ai-integration.js');
        });
      }

      // Check host permissions for AI APIs
      if (manifest.host_permissions) {
        expect(manifest.host_permissions).not.toContain('https://api.openai.com/*');
        expect(manifest.host_permissions).not.toContain('https://api.anthropic.com/*');
      }
    });

    test('manifest.json has correct content script files', () => {
      const manifestPath = path.join(srcDir, 'manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      if (manifest.content_scripts && manifest.content_scripts[0]) {
        const contentScriptFiles = manifest.content_scripts[0].js || [];
        expect(contentScriptFiles).toContain('extractors.js');
        expect(contentScriptFiles).toContain('content.js');
        expect(contentScriptFiles).not.toContain('ai-integration.js');
      }
    });
  });

  describe('Script Injection Validation', () => {
    test('popup.js does not inject ai-integration.js', () => {
      const popupPath = path.join(srcDir, 'popup.js');
      const content = fs.readFileSync(popupPath, 'utf8');
      
      // Check for script injection patterns
      const scriptInjectionPatterns = [
        /files:\s*\[[^\]]*ai-integration\.js[^\]]*\]/,
        /executeScript.*ai-integration\.js/,
        /chrome\.scripting\.executeScript.*ai-integration\.js/
      ];
      
      scriptInjectionPatterns.forEach(pattern => {
        expect(content).not.toMatch(pattern);
      });
    });

    test('persistent-window.js does not inject ai-integration.js', () => {
      const persistentPath = path.join(srcDir, 'persistent-window.js');
      const content = fs.readFileSync(persistentPath, 'utf8');
      
      // Check for script injection patterns
      const scriptInjectionPatterns = [
        /files:\s*\[[^\]]*ai-integration\.js[^\]]*\]/,
        /executeScript.*ai-integration\.js/,
        /chrome\.scripting\.executeScript.*ai-integration\.js/
      ];
      
      scriptInjectionPatterns.forEach(pattern => {
        expect(content).not.toMatch(pattern);
      });
    });
  });

  describe('HTML File Validation', () => {
    test('popup.html does not reference AI elements', () => {
      const popupPath = path.join(srcDir, 'popup.html');
      const content = fs.readFileSync(popupPath, 'utf8');
      
      const forbiddenElements = [
        'aiProvider',
        'openaiKey',
        'claudeKey',
        'saveSettings'
      ];
      
      forbiddenElements.forEach(element => {
        expect(content).not.toContain(`id="${element}"`);
      });
    });

    test('persistent-window.html does not reference AI elements', () => {
      const persistentPath = path.join(srcDir, 'persistent-window.html');
      const content = fs.readFileSync(persistentPath, 'utf8');
      
      const forbiddenElements = [
        'aiProviderSelect',
        'openaiKeyInput',
        'claudeKeyInput',
        'saveSettingsButton'
      ];
      
      forbiddenElements.forEach(element => {
        expect(content).not.toContain(`id="${element}"`);
      });
    });

    test('jobs-table.html does not have AI summary column', () => {
      const jobsTablePath = path.join(srcDir, 'jobs-table.html');
      const content = fs.readFileSync(jobsTablePath, 'utf8');
      
      expect(content).not.toContain('AI Summary');
      expect(content).not.toContain('ai-summary');
    });
  });

  describe('Import and Require Validation', () => {
    test('no files import or require ai-integration.js', () => {
      const jsFiles = [
        'popup.js',
        'persistent-window.js',
        'background.js',
        'content.js',
        'extractors.js',
        'file-storage.js',
        'jobs-table.js'
      ];

      jsFiles.forEach(file => {
        const filePath = path.join(srcDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        expect(content).not.toMatch(/import.*ai-integration/);
        expect(content).not.toMatch(/require.*ai-integration/);
        expect(content).not.toMatch(/from.*ai-integration/);
      });
    });
  });

  describe('Storage and Settings Validation', () => {
    test('background.js does not set AI-related default settings', () => {
      const backgroundPath = path.join(srcDir, 'background.js');
      const content = fs.readFileSync(backgroundPath, 'utf8');
      
      expect(content).not.toContain('openaiKey');
      expect(content).not.toContain('claudeKey');
    });

    test('popup.js and persistent-window.js do not load AI settings', () => {
      const popupPath = path.join(srcDir, 'popup.js');
      const persistentPath = path.join(srcDir, 'persistent-window.js');
      
      const popupContent = fs.readFileSync(popupPath, 'utf8');
      const persistentContent = fs.readFileSync(persistentPath, 'utf8');
      
      expect(popupContent).not.toContain('openaiKey');
      expect(popupContent).not.toContain('claudeKey');
      expect(persistentContent).not.toContain('openaiKey');
      expect(persistentContent).not.toContain('claudeKey');
    });
  });
});