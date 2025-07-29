#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Configuration
const EXTENSION_NAME = 'JobSearchManager';
const VERSION = '1.0.0';
const SOURCE_DIR = 'src';
const OUTPUT_DIR = 'output';

// Files to include in the package
const FILES_TO_INCLUDE = [
    'manifest.json',
    'popup.html',
    'popup.js',
    'content.js',
    'background.js',
    'extractors.js',
    'file-storage.js',
    'jobs-table.html',
    'jobs-table.js',
    'persistent-window.html',
    'persistent-window.js',
    'icons/icon16.png',
    'icons/icon32.png',
    'icons/icon48.png',
    'icons/icon128.png'
];

// Files to exclude
const FILES_TO_EXCLUDE = [
    'tests/',
    'node_modules/',
    'package.json',
    'package-lock.json',
    'README.md',
    'CHROME_WEB_STORE_PUBLISHING_GUIDE.md',
    'PRIVACY_POLICY.md',
    'USER_GUIDE.md',
    'QUICK_START.md',
    'TROUBLESHOOTING.md',
    'WEBSITE_COLOR_CODING.md',
    'BUTTON_FIX_SUMMARY.md',
    'COMMENT_SAVE_FEATURE.md',
    'INDEED_DETECTION_FIX.md',
    'JOB_FAMILY_FEATURE.md',
    'generate-icons.html',
    'test-*.html',
    '.gitignore',
    '.cursor/',
    'tmp/'
];

function createOutputDirectory() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
        console.log(`✅ Created output directory: ${OUTPUT_DIR}`);
    }
}

function validateManifest() {
    const manifestPath = path.join(SOURCE_DIR, 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
        throw new Error(`❌ Manifest file not found: ${manifestPath}`);
    }
    
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        // Check required fields
        const requiredFields = ['manifest_version', 'name', 'version', 'description'];
        for (const field of requiredFields) {
            if (!manifest[field]) {
                throw new Error(`❌ Missing required field in manifest: ${field}`);
            }
        }
        
        // Check manifest version
        if (manifest.manifest_version !== 3) {
            throw new Error('❌ Manifest version must be 3 for Chrome Web Store');
        }
        
        // Check permissions
        if (!manifest.permissions || !Array.isArray(manifest.permissions)) {
            throw new Error('❌ Permissions must be an array in manifest');
        }
        
        console.log('✅ Manifest validation passed');
        return manifest;
    } catch (error) {
        if (error.message.includes('❌')) {
            throw error;
        }
        throw new Error(`❌ Invalid JSON in manifest: ${error.message}`);
    }
}

function checkRequiredFiles() {
    const missingFiles = [];
    
    for (const file of FILES_TO_INCLUDE) {
        const filePath = path.join(SOURCE_DIR, file);
        if (!fs.existsSync(filePath)) {
            missingFiles.push(file);
        }
    }
    
    if (missingFiles.length > 0) {
        throw new Error(`❌ Missing required files: ${missingFiles.join(', ')}`);
    }
    
    console.log('✅ All required files found');
}

function createZipArchive() {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(OUTPUT_DIR, `${EXTENSION_NAME}-v${VERSION}.zip`);
        const output = fs.createWriteStream(outputPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });
        
        output.on('close', () => {
            const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
            console.log(`✅ Extension packaged successfully: ${outputPath}`);
            console.log(`📦 Package size: ${sizeInMB} MB`);
            resolve(outputPath);
        });
        
        archive.on('error', (err) => {
            reject(new Error(`❌ Archive error: ${err.message}`));
        });
        
        archive.pipe(output);
        
        // Add files to archive
        for (const file of FILES_TO_INCLUDE) {
            const filePath = path.join(SOURCE_DIR, file);
            const archivePath = file; // Keep the same path structure
            
            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: archivePath });
                console.log(`📁 Added: ${file}`);
            }
        }
        
        archive.finalize();
    });
}

function generatePublishingChecklist() {
    const checklistPath = path.join(OUTPUT_DIR, 'PUBLISHING_CHECKLIST.md');
    const checklist = `# Chrome Web Store Publishing Checklist

## ✅ Pre-Publishing Checklist

### Extension Package
- [x] Extension packaged successfully (${EXTENSION_NAME}-v${VERSION}.zip)
- [x] Manifest V3 compliant
- [x] All required files included
- [x] No unnecessary files included
- [x] Icons in all required sizes (16, 32, 48, 128px)

### Store Listing Requirements
- [ ] Create Google Developer account ($5 fee)
- [ ] Upload extension package
- [ ] Write compelling description
- [ ] Create screenshots (1280x800 or 640x400px)
- [ ] Choose appropriate category (Productivity)
- [ ] Set language (English)

### Legal Requirements
- [ ] Privacy Policy (see PRIVACY_POLICY.md)
- [ ] Terms of Service (optional but recommended)
- [ ] Content rating questionnaire completed

### Technical Requirements
- [ ] Extension works in Chrome Web Store preview
- [ ] All permissions justified
- [ ] No console errors
- [ ] All features functional

## 📋 Next Steps

1. **Set up Google Developer Account**:
   - Go to https://chrome.google.com/webstore/devconsole/
   - Pay $5 registration fee
   - Complete account setup

2. **Upload Extension**:
   - Click "Add new item"
   - Upload ${EXTENSION_NAME}-v${VERSION}.zip
   - Fill out all required fields

3. **Create Store Listing**:
   - Use description from README.md
   - Create screenshots showing:
     - Popup interface
     - Jobs table
     - Persistent window
     - Extension in action

4. **Submit for Review**:
   - Review all information
   - Submit for Google review
   - Wait 1-3 business days

## 📞 Support

If you encounter issues during publishing:
- Check Chrome Web Store policies
- Review rejection reasons carefully
- Make necessary changes and resubmit

## 📊 Post-Publishing

- Monitor user reviews and ratings
- Respond to user feedback
- Plan regular updates
- Track installation metrics

---
Generated on: ${new Date().toISOString()}
Extension Version: ${VERSION}
`;

    fs.writeFileSync(checklistPath, checklist);
    console.log(`✅ Publishing checklist created: ${checklistPath}`);
}

function main() {
    console.log('🚀 Starting Chrome extension packaging...\n');
    
    try {
        // Step 1: Create output directory
        createOutputDirectory();
        
        // Step 2: Validate manifest
        validateManifest();
        
        // Step 3: Check required files
        checkRequiredFiles();
        
        // Step 4: Create ZIP archive
        console.log('\n📦 Creating extension package...');
        createZipArchive().then((outputPath) => {
            // Step 5: Generate publishing checklist
            generatePublishingChecklist();
            
            console.log('\n🎉 Extension packaging completed successfully!');
            console.log('\n📋 Next steps:');
            console.log('1. Review the publishing checklist in output/PUBLISHING_CHECKLIST.md');
            console.log('2. Update the privacy policy with your contact information');
            console.log('3. Create screenshots for the Chrome Web Store');
            console.log('4. Set up your Google Developer account');
            console.log('5. Upload and submit for review');
            
        }).catch((error) => {
            console.error(`\n❌ Packaging failed: ${error.message}`);
            process.exit(1);
        });
        
    } catch (error) {
        console.error(`\n❌ Validation failed: ${error.message}`);
        process.exit(1);
    }
}

// Check if archiver is available
try {
    require.resolve('archiver');
} catch (error) {
    console.error('❌ Missing dependency: archiver');
    console.log('📦 Install it with: npm install archiver');
    process.exit(1);
}

// Run the packaging process
main();