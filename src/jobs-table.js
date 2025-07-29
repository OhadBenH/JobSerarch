class JobsTable {
    constructor() {
        this.jobs = [];
        this.filteredJobs = [];
        this.currentFilters = {
            search: '',
            jobFamily: '',
            website: ''
        };
        
        this.initializeElements();
        this.bindEvents();
        this.loadJobs();
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.jobFamilyFilter = document.getElementById('jobFamilyFilter');
        this.websiteFilter = document.getElementById('websiteFilter');
        this.totalJobsSpan = document.getElementById('totalJobs');
        this.showingJobsSpan = document.getElementById('showingJobs');
        this.lastUpdatedSpan = document.getElementById('lastUpdated');
        this.jobsTable = document.getElementById('jobsTable');
        this.jobsTableBody = document.getElementById('jobsTableBody');
        this.loadingDiv = document.getElementById('loading');
        this.noJobsDiv = document.getElementById('noJobs');
        this.errorDiv = document.getElementById('error');
        this.errorMessageSpan = document.getElementById('errorMessage');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.clearBtn = document.getElementById('clearBtn');
    }

    bindEvents() {
        this.searchInput.addEventListener('input', () => this.handleSearch());
        this.jobFamilyFilter.addEventListener('change', () => this.handleFilter());
        this.websiteFilter.addEventListener('change', () => this.handleFilter());
        this.refreshBtn.addEventListener('click', () => this.loadJobs());
        this.exportBtn.addEventListener('click', () => this.exportToCSV());
        this.clearBtn.addEventListener('click', () => this.clearAllJobs());
    }

    async loadJobs() {
        try {
            this.showLoading(true);
            this.hideError();
            this.hideNoJobs();

            // Load jobs from storage
            const fileStorage = new FileStorageService();
            await fileStorage.loadSettings();
            
            if (!fileStorage.storedData || fileStorage.storedData.length === 0) {
                this.showNoJobs();
                return;
            }

            this.jobs = fileStorage.storedData;
            this.applyFilters();
            this.updateStats();
            this.renderTable();
            this.showTable();

        } catch (error) {
            console.error('Error loading jobs:', error);
            this.showError('Failed to load jobs: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    handleSearch() {
        this.currentFilters.search = this.searchInput.value.toLowerCase();
        this.applyFilters();
        this.updateStats();
        this.renderTable();
    }

    handleFilter() {
        this.currentFilters.jobFamily = this.jobFamilyFilter.value;
        this.currentFilters.website = this.websiteFilter.value;
        this.applyFilters();
        this.updateStats();
        this.renderTable();
    }

    applyFilters() {
        this.filteredJobs = this.jobs.filter(job => {
            // Search filter
            if (this.currentFilters.search) {
                const searchText = `${job.companyName || ''} ${job.jobRole || ''} ${job.jobDescription || ''}`.toLowerCase();
                if (!searchText.includes(this.currentFilters.search)) {
                    return false;
                }
            }

            // Job family filter
            if (this.currentFilters.jobFamily && job.jobFamily !== this.currentFilters.jobFamily) {
                return false;
            }

            // Website filter
            if (this.currentFilters.website && job.websiteType !== this.currentFilters.website) {
                return false;
            }

            return true;
        });
    }

    updateStats() {
        this.totalJobsSpan.textContent = this.jobs.length;
        this.showingJobsSpan.textContent = this.filteredJobs.length;
        
        if (this.jobs.length > 0) {
            const latestJob = this.jobs.reduce((latest, job) => {
                return new Date(job.extractedAt) > new Date(latest.extractedAt) ? job : latest;
            });
            this.lastUpdatedSpan.textContent = new Date(latestJob.extractedAt).toLocaleString();
        } else {
            this.lastUpdatedSpan.textContent = '-';
        }
    }

    renderTable() {
        this.jobsTableBody.innerHTML = '';

        this.filteredJobs.forEach(job => {
            const row = document.createElement('tr');
            
            // Company
            const companyCell = document.createElement('td');
            companyCell.className = 'company-name';
            companyCell.textContent = job.companyName || 'N/A';

            // Job Role
            const roleCell = document.createElement('td');
            roleCell.className = 'job-role';
            roleCell.textContent = job.jobRole || 'N/A';

            // Job Family
            const familyCell = document.createElement('td');
            const familySpan = document.createElement('span');
            familySpan.className = `job-family ${this.getJobFamilyClass(job.jobFamily)}`;
            familySpan.textContent = job.jobFamily || 'N/A';
            familyCell.appendChild(familySpan);

            // Website
            const websiteCell = document.createElement('td');
            const websiteSpan = document.createElement('span');
            websiteSpan.className = 'website-type';
            websiteSpan.textContent = job.websiteType || 'N/A';
            websiteCell.appendChild(websiteSpan);

            // Job Description
            const descCell = document.createElement('td');
            const descText = job.jobDescription || 'N/A';
            const shortDesc = descText.length > 100 ? descText.substring(0, 100) + '...' : descText;
            
            const descSpan = document.createElement('span');
            descSpan.className = 'job-description';
            descSpan.textContent = shortDesc;
            descCell.appendChild(descSpan);

            if (descText.length > 100) {
                const expandBtn = document.createElement('button');
                expandBtn.className = 'expand-btn';
                expandBtn.textContent = 'Show more';
                expandBtn.onclick = () => this.toggleDescription(descSpan, descText, expandBtn);
                descCell.appendChild(document.createElement('br'));
                descCell.appendChild(expandBtn);
            }

            // Comments
            const commentsCell = document.createElement('td');
            commentsCell.className = 'comments-cell';
            commentsCell.innerHTML = `
                <textarea class="comment-input" placeholder="Add notes..." data-url="${job.url}">${job.comments || ''}</textarea>
            `;
            
            // Auto-save functionality
            let saveTimeout;
            commentsCell.querySelector('.comment-input').addEventListener('input', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    this.saveComment(job.url, commentsCell.querySelector('.comment-input').value);
                }, 1000); // Save after 1 second of inactivity
            });
            
            // Recruiter
            const recruiterCell = document.createElement('td');
            recruiterCell.textContent = job.recruiterName || 'N/A';
            
            // Days Since Published
            const daysCell = document.createElement('td');
            daysCell.textContent = job.jobFreshness ? `${job.jobFreshness} days` : 'N/A';
            
            // Extracted Date
            const savedCell = document.createElement('td');
            savedCell.className = 'extracted-date';
            savedCell.textContent = new Date(job.extractedAt).toLocaleDateString();
            
            row.appendChild(companyCell);
            row.appendChild(roleCell);
            row.appendChild(familyCell);
            row.appendChild(websiteCell);
            row.appendChild(descCell);
            row.appendChild(commentsCell);
            row.appendChild(recruiterCell);
            row.appendChild(daysCell);
            row.appendChild(savedCell);

            this.jobsTableBody.appendChild(row);
        });
    }

    getJobFamilyClass(jobFamily) {
        if (!jobFamily) return 'other';
        
        const family = jobFamily.toLowerCase();
        if (family.includes('mechanical')) return 'mechanical';
        if (family.includes('system')) return 'system';
        if (family.includes('project')) return 'project';
        return 'other';
    }

    toggleDescription(descSpan, fullText, btn) {
        if (descSpan.classList.contains('expanded')) {
            descSpan.textContent = fullText.length > 100 ? fullText.substring(0, 100) + '...' : fullText;
            descSpan.classList.remove('expanded');
            btn.textContent = 'Show more';
        } else {
            descSpan.textContent = fullText;
            descSpan.classList.add('expanded');
            btn.textContent = 'Show less';
        }
    }

    async exportToCSV() {
        try {
            if (this.filteredJobs.length === 0) {
                alert('No jobs to export.');
                return;
            }

            // Create CSV headers
            const headers = [
                'Company Name',
                'Job Role', 
                'Job Family',
                'Website Type',
                'Job Description',
                'Comments',
                'Recruiter Name',
                'Days Since Published',
                'Saved At',
                'URL'
            ];

            // Create CSV content from filtered jobs
            const csvContent = [
                headers.join(','),
                ...this.filteredJobs.map(job => [
                    this.escapeCSV(job.companyName || ''),
                    this.escapeCSV(job.jobRole || ''),
                    this.escapeCSV(job.jobFamily || ''),
                    this.escapeCSV(job.websiteType || ''),
                    this.escapeCSV(job.jobDescription || ''),
                    this.escapeCSV(job.comments || ''),
                    this.escapeCSV(job.recruiterName || ''),
                    this.escapeCSV(job.jobFreshness ? `${job.jobFreshness} days` : ''),
                    this.escapeCSV(job.extractedAt ? new Date(job.extractedAt).toLocaleDateString() : ''),
                    this.escapeCSV(job.url || '')
                ].join(','))
            ].join('\n');
            
            // Trigger download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `job_search_data_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert(`Exported ${this.filteredJobs.length} jobs to CSV successfully!`);
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            alert('Failed to export CSV: ' + error.message);
        }
    }

    escapeCSV(text) {
        if (!text) return '';
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escaped = text.replace(/"/g, '""');
        if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
            return `"${escaped}"`;
        }
        return escaped;
    }

    async clearAllJobs() {
        const confirmed = window.confirm(
            'Are you sure you want to clear all saved jobs? This action cannot be undone.'
        );

        if (!confirmed) {
            return;
        }

        try {
            const fileStorage = new FileStorageService();
            const result = await fileStorage.clearStorage();

            if (result.success) {
                this.jobs = [];
                this.filteredJobs = [];
                this.applyFilters();
                this.updateStats();
                this.renderTable();
                this.showNoJobs();
                alert('All jobs have been cleared successfully.');
            } else {
                alert('Failed to clear jobs: ' + result.errors.join(', '));
            }
        } catch (error) {
            console.error('Error clearing jobs:', error);
            alert('Failed to clear jobs: ' + error.message);
        }
    }

    showLoading(show) {
        this.loadingDiv.style.display = show ? 'block' : 'none';
    }

    showTable() {
        this.jobsTable.style.display = 'table';
    }

    hideTable() {
        this.jobsTable.style.display = 'none';
    }

    showNoJobs() {
        this.noJobsDiv.style.display = 'block';
        this.hideTable();
    }

    hideNoJobs() {
        this.noJobsDiv.style.display = 'none';
    }

    showError(message) {
        this.errorMessageSpan.textContent = message;
        this.errorDiv.style.display = 'block';
        this.hideTable();
        this.hideNoJobs();
    }

    hideError() {
        this.errorDiv.style.display = 'none';
    }

    async saveComment(jobUrl, comment) {
        try {
            // Find the job in the current data
            const jobIndex = this.jobs.findIndex(job => job.url === jobUrl);
            if (jobIndex !== -1) {
                // Update the job data
                this.jobs[jobIndex].comments = comment;
                
                // Save to Chrome storage
                await chrome.storage.local.set({ jobData: this.jobs });
                
                // Update filtered jobs if this job is currently visible
                const filteredIndex = this.filteredJobs.findIndex(job => job.url === jobUrl);
                if (filteredIndex !== -1) {
                    this.filteredJobs[filteredIndex].comments = comment;
                }
                
                console.log('Comment saved for job:', jobUrl);
            }
        } catch (error) {
            console.error('Error saving comment:', error);
        }
    }
}

// Initialize the jobs table when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new JobsTable();
}); 