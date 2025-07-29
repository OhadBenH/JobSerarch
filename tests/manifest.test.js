const fs = require('fs');
const path = require('path');

describe('Manifest.json Validation', () => {
  let manifest;

  beforeAll(() => {
    const manifestPath = path.join(__dirname, '../src/manifest.json');
    if (fs.existsSync(manifestPath)) {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }
  });

  test('manifest.json has required fields', () => {
    expect(manifest).toBeDefined();
    expect(manifest.name).toBeDefined();
    expect(manifest.version).toBeDefined();
    expect(manifest.permissions).toBeDefined();
    expect(manifest.content_scripts).toBeDefined();
  });

  test('manifest.json has correct structure', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(typeof manifest.name).toBe('string');
    expect(typeof manifest.version).toBe('string');
    expect(Array.isArray(manifest.permissions)).toBe(true);
    expect(Array.isArray(manifest.content_scripts)).toBe(true);
  });

  test('manifest.json has required permissions', () => {
    const requiredPermissions = [
      'activeTab',
      'storage',
      'scripting'
    ];
    
    requiredPermissions.forEach(permission => {
      expect(manifest.permissions).toContain(permission);
    });
  });

  test('manifest.json has content scripts configuration', () => {
    expect(manifest.content_scripts[0]).toBeDefined();
    expect(manifest.content_scripts[0].matches).toBeDefined();
    expect(Array.isArray(manifest.content_scripts[0].matches)).toBe(true);
    expect(manifest.content_scripts[0].js).toBeDefined();
    expect(Array.isArray(manifest.content_scripts[0].js)).toBe(true);
  });

  test('manifest.json includes job site patterns', () => {
    const jobSitePatterns = [
      '*://*.linkedin.com/*',
      '*://*.indeed.com/*',
      '*://*.glassdoor.com/*'
    ];
    
    jobSitePatterns.forEach(pattern => {
      expect(manifest.content_scripts[0].matches).toContain(pattern);
    });
  });

  test('manifest.json has action configuration', () => {
    expect(manifest.action).toBeDefined();
    expect(manifest.action.default_title).toBeDefined();
    // Note: default_popup is not used since we handle clicks via background script
  });
}); 