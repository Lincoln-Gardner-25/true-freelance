/**
 * True Freelance App
 * Track freelance projects and calculate hourly rates
 */

const TrueFreelanceApp = (() => {
    // ================================
    // Private State
    // ================================

    let projects = [];
    let editingProjectId = null;
    let currentViewMonth = new Date(); // Track currently viewed month
    const STORAGE_KEY = 'trueFreelance_projects';

    // ================================
    // DOM Elements
    // ================================

    const elements = {
        // Buttons
        addProjectBtn: document.getElementById('addProjectBtn'),
        emptyStateBtn: document.getElementById('emptyStateBtn'),
        closeModalBtn: document.getElementById('closeModal'),
        cancelBtn: document.getElementById('cancelBtn'),
        saveBtn: document.getElementById('saveBtn'),
        prevMonth: document.getElementById('prevMonth'),
        nextMonth: document.getElementById('nextMonth'),

        // Containers
        emptyState: document.getElementById('emptyState'),
        projectsList: document.getElementById('projectsList'),
        modalOverlay: document.getElementById('modalOverlay'),
        projectsTab: document.getElementById('projectsTab'),
        monthlyTab: document.getElementById('monthlyTab'),
        monthlyProjectsList: document.getElementById('monthlyProjectsList'),
        monthlyEmpty: document.getElementById('monthlyEmpty'),

        // Form
        projectForm: document.getElementById('projectForm'),
        modalTitle: document.getElementById('modalTitle'),
        projectName: document.getElementById('projectName'),
        hoursWorked: document.getElementById('hoursWorked'),
        moneyReceived: document.getElementById('moneyReceived'),
        completionDate: document.getElementById('completionDate'),

        // Error messages
        nameError: document.getElementById('nameError'),
        hoursError: document.getElementById('hoursError'),
        moneyError: document.getElementById('moneyError'),
        dateError: document.getElementById('dateError'),

        // Monthly stats
        currentMonth: document.getElementById('currentMonth'),
        monthlyEarnings: document.getElementById('monthlyEarnings'),
        monthlyHours: document.getElementById('monthlyHours'),
        monthlyRate: document.getElementById('monthlyRate'),
        monthlyProjects: document.getElementById('monthlyProjects')
    };

    // ================================
    // Data Management Functions
    // ================================

    /**
     * Load projects from localStorage
     */
    function loadProjects() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                projects = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
            projects = [];
        }
    }

    /**
     * Save projects to localStorage
     */
    function saveProjects() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        } catch (error) {
            console.error('Error saving projects:', error);
            if (error.name === 'QuotaExceededError') {
                alert('Storage limit reached. Please delete some projects.');
            } else {
                alert('Unable to save data. Please try again.');
            }
        }
    }

    /**
     * Generate a unique ID for a project
     */
    function generateId() {
        return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Calculate hourly rate
     */
    function calculateHourlyRate(hours, money) {
        if (hours <= 0) return 0;
        return money / hours;
    }

    /**
     * Find a project by ID
     */
    function getProjectById(id) {
        return projects.find(project => project.id === id);
    }

    // ================================
    // CRUD Operations
    // ================================

    /**
     * Add a new project
     */
    function addProject(projectData) {
        const now = new Date().toISOString();
        const hourlyRate = calculateHourlyRate(projectData.hoursWorked, projectData.moneyReceived);

        const newProject = {
            id: generateId(),
            name: projectData.name.trim(),
            hoursWorked: parseFloat(projectData.hoursWorked),
            moneyReceived: parseFloat(projectData.moneyReceived),
            completionDate: projectData.completionDate,
            hourlyRate: hourlyRate,
            createdAt: now,
            updatedAt: now
        };

        projects.unshift(newProject); // Add to beginning of array
        saveProjects();
        return newProject;
    }

    /**
     * Update an existing project
     */
    function updateProject(id, projectData) {
        const projectIndex = projects.findIndex(p => p.id === id);
        if (projectIndex === -1) return null;

        const hourlyRate = calculateHourlyRate(projectData.hoursWorked, projectData.moneyReceived);

        projects[projectIndex] = {
            ...projects[projectIndex],
            name: projectData.name.trim(),
            hoursWorked: parseFloat(projectData.hoursWorked),
            moneyReceived: parseFloat(projectData.moneyReceived),
            completionDate: projectData.completionDate,
            hourlyRate: hourlyRate,
            updatedAt: new Date().toISOString()
        };

        saveProjects();
        return projects[projectIndex];
    }

    /**
     * Delete a project
     */
    function deleteProject(id) {
        const project = getProjectById(id);
        if (!project) return false;

        const confirmed = confirm(`Are you sure you want to delete "${project.name}"?`);
        if (!confirmed) return false;

        projects = projects.filter(p => p.id !== id);
        saveProjects();
        return true;
    }

    // ================================
    // Monthly Tracking Functions
    // ================================

    /**
     * Get projects for a specific month
     */
    function getProjectsForMonth(year, month) {
        return projects.filter(project => {
            if (!project.completionDate) return false;
            const projectDate = new Date(project.completionDate);
            return projectDate.getFullYear() === year && projectDate.getMonth() === month;
        });
    }

    /**
     * Calculate monthly statistics
     */
    function calculateMonthlyStats(monthProjects) {
        const totalEarnings = monthProjects.reduce((sum, p) => sum + p.moneyReceived, 0);
        const totalHours = monthProjects.reduce((sum, p) => sum + p.hoursWorked, 0);
        const avgRate = totalHours > 0 ? totalEarnings / totalHours : 0;
        const projectCount = monthProjects.length;

        return { totalEarnings, totalHours, avgRate, projectCount };
    }

    /**
     * Format date for display
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    /**
     * Get month name
     */
    function getMonthName(date) {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    /**
     * Change viewed month
     */
    function changeMonth(direction) {
        currentViewMonth = new Date(
            currentViewMonth.getFullYear(),
            currentViewMonth.getMonth() + direction,
            1
        );
        renderMonthlyView();
    }

    /**
     * Switch between tabs
     */
    function switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update tab content
        if (tabName === 'projects') {
            elements.projectsTab.classList.add('active');
            elements.monthlyTab.classList.remove('active');
        } else if (tabName === 'monthly') {
            elements.projectsTab.classList.remove('active');
            elements.monthlyTab.classList.add('active');
            renderMonthlyView();
        }
    }

    /**
     * Render monthly view
     */
    function renderMonthlyView() {
        const year = currentViewMonth.getFullYear();
        const month = currentViewMonth.getMonth();
        const monthProjects = getProjectsForMonth(year, month);
        const stats = calculateMonthlyStats(monthProjects);

        // Update month title
        elements.currentMonth.textContent = getMonthName(currentViewMonth);

        // Update stats
        elements.monthlyEarnings.textContent = formatCurrency(stats.totalEarnings);
        elements.monthlyHours.textContent = formatHours(stats.totalHours);
        elements.monthlyRate.textContent = formatCurrency(stats.avgRate) + '/hr';
        elements.monthlyProjects.textContent = stats.projectCount;

        // Render project list
        elements.monthlyProjectsList.innerHTML = '';

        if (monthProjects.length === 0) {
            elements.monthlyEmpty.classList.remove('hidden');
            elements.monthlyProjectsList.classList.add('hidden');
        } else {
            elements.monthlyEmpty.classList.add('hidden');
            elements.monthlyProjectsList.classList.remove('hidden');

            monthProjects.forEach(project => {
                const item = createMonthlyProjectItem(project);
                elements.monthlyProjectsList.appendChild(item);
            });
        }
    }

    /**
     * Create monthly project item
     */
    function createMonthlyProjectItem(project) {
        const item = document.createElement('div');
        item.className = 'monthly-project-item';

        item.innerHTML = `
            <div class="monthly-project-info">
                <div class="monthly-project-name">${escapeHtml(project.name)}</div>
                <div class="monthly-project-date">${formatDate(project.completionDate)}</div>
            </div>
            <div class="monthly-project-stats">
                <div class="monthly-project-stat">
                    <span class="monthly-project-stat-label">Hours</span>
                    <span class="monthly-project-stat-value">${formatHours(project.hoursWorked)}</span>
                </div>
                <div class="monthly-project-stat">
                    <span class="monthly-project-stat-label">Earned</span>
                    <span class="monthly-project-stat-value">${formatCurrency(project.moneyReceived)}</span>
                </div>
                <div class="monthly-project-stat">
                    <span class="monthly-project-stat-label">Rate</span>
                    <span class="monthly-project-stat-value">${formatCurrency(project.hourlyRate)}/hr</span>
                </div>
            </div>
        `;

        return item;
    }

    // ================================
    // UI Rendering Functions
    // ================================

    /**
     * Toggle empty state visibility
     */
    function toggleEmptyState() {
        if (projects.length === 0) {
            elements.emptyState.classList.remove('hidden');
            elements.projectsList.innerHTML = '';
        } else {
            elements.emptyState.classList.add('hidden');
        }
    }

    /**
     * Format currency
     */
    function formatCurrency(amount) {
        return `$${amount.toFixed(2)}`;
    }

    /**
     * Format hours
     */
    function formatHours(hours) {
        return hours.toFixed(2);
    }

    /**
     * Create a project card element
     */
    function createProjectCard(project) {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.dataset.id = project.id;

        card.innerHTML = `
            <div class="project-card-header">
                <h3 class="project-card-title">${escapeHtml(project.name)}</h3>
                <div class="project-card-actions">
                    <button class="btn btn-edit" data-action="edit" data-id="${project.id}">Edit</button>
                    <button class="btn btn-danger" data-action="delete" data-id="${project.id}">Delete</button>
                </div>
            </div>
            <div class="project-card-content">
                <div class="project-card-item">
                    <span class="project-card-label">Hours Worked:</span>
                    <span class="project-card-value">${formatHours(project.hoursWorked)}</span>
                </div>
                <div class="project-card-item">
                    <span class="project-card-label">Money Received:</span>
                    <span class="project-card-value">${formatCurrency(project.moneyReceived)}</span>
                </div>
                <div class="project-card-rate">
                    <span class="project-card-rate-label">Hourly Rate:</span>
                    <span class="project-card-rate-value">${formatCurrency(project.hourlyRate)}/hr</span>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Render all projects
     */
    function renderProjects() {
        elements.projectsList.innerHTML = '';

        if (projects.length === 0) {
            toggleEmptyState();
            return;
        }

        projects.forEach(project => {
            const card = createProjectCard(project);
            elements.projectsList.appendChild(card);
        });

        toggleEmptyState();
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ================================
    // Modal Functions
    // ================================

    /**
     * Open modal for adding or editing
     */
    function openModal(mode = 'add', projectId = null) {
        editingProjectId = projectId;

        // Reset form
        elements.projectForm.reset();
        clearErrors();

        if (mode === 'edit' && projectId) {
            const project = getProjectById(projectId);
            if (project) {
                elements.modalTitle.textContent = 'Edit Project';
                elements.projectName.value = project.name;
                elements.hoursWorked.value = project.hoursWorked;
                elements.moneyReceived.value = project.moneyReceived;
                elements.completionDate.value = project.completionDate || '';
            }
        } else {
            elements.modalTitle.textContent = 'Add Project';
            // Set default date to today
            const today = new Date().toISOString().split('T')[0];
            elements.completionDate.value = today;
        }

        elements.modalOverlay.classList.remove('hidden');
        elements.projectName.focus();

        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close modal
     */
    function closeModal() {
        elements.modalOverlay.classList.add('hidden');
        elements.projectForm.reset();
        clearErrors();
        editingProjectId = null;

        // Restore body scroll
        document.body.style.overflow = '';
    }

    /**
     * Clear all form errors
     */
    function clearErrors() {
        elements.nameError.textContent = '';
        elements.hoursError.textContent = '';
        elements.moneyError.textContent = '';
        elements.dateError.textContent = '';

        elements.projectName.classList.remove('error');
        elements.hoursWorked.classList.remove('error');
        elements.moneyReceived.classList.remove('error');
        elements.completionDate.classList.remove('error');
    }

    /**
     * Validate form inputs
     */
    function validateForm(data) {
        let isValid = true;
        clearErrors();

        // Validate project name
        if (!data.name || data.name.trim().length === 0) {
            elements.nameError.textContent = 'Project name is required';
            elements.projectName.classList.add('error');
            isValid = false;
        }

        // Validate hours
        if (!data.hoursWorked || parseFloat(data.hoursWorked) < 0) {
            elements.hoursError.textContent = 'Hours must be 0 or greater';
            elements.hoursWorked.classList.add('error');
            isValid = false;
        }

        // Validate money
        if (!data.moneyReceived || parseFloat(data.moneyReceived) < 0) {
            elements.moneyError.textContent = 'Money must be 0 or greater';
            elements.moneyReceived.classList.add('error');
            isValid = false;
        }

        // Validate date
        if (!data.completionDate) {
            elements.dateError.textContent = 'Completion date is required';
            elements.completionDate.classList.add('error');
            isValid = false;
        }

        return isValid;
    }

    // ================================
    // Event Handlers
    // ================================

    /**
     * Handle form submission
     */
    function handleFormSubmit(event) {
        event.preventDefault();

        const formData = {
            name: elements.projectName.value,
            hoursWorked: elements.hoursWorked.value,
            moneyReceived: elements.moneyReceived.value,
            completionDate: elements.completionDate.value
        };

        if (!validateForm(formData)) {
            return;
        }

        if (editingProjectId) {
            // Update existing project
            updateProject(editingProjectId, formData);
        } else {
            // Add new project
            addProject(formData);
        }

        closeModal();
        renderProjects();

        // Update monthly view if it's active
        if (!elements.monthlyTab.classList.contains('hidden')) {
            renderMonthlyView();
        }
    }

    /**
     * Handle card action clicks (Edit/Delete)
     */
    function handleCardAction(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const projectId = button.dataset.id;

        if (action === 'edit') {
            openModal('edit', projectId);
        } else if (action === 'delete') {
            if (deleteProject(projectId)) {
                renderProjects();
            }
        }
    }

    /**
     * Handle overlay click to close modal
     */
    function handleOverlayClick(event) {
        if (event.target === elements.modalOverlay) {
            closeModal();
        }
    }

    /**
     * Handle Escape key to close modal
     */
    function handleEscapeKey(event) {
        if (event.key === 'Escape' && !elements.modalOverlay.classList.contains('hidden')) {
            closeModal();
        }
    }

    // ================================
    // Event Listeners Setup
    // ================================

    function setupEventListeners() {
        // Add project buttons
        elements.addProjectBtn.addEventListener('click', () => openModal('add'));
        elements.emptyStateBtn.addEventListener('click', () => openModal('add'));

        // Modal controls
        elements.closeModalBtn.addEventListener('click', closeModal);
        elements.cancelBtn.addEventListener('click', closeModal);
        elements.modalOverlay.addEventListener('click', handleOverlayClick);

        // Form submission
        elements.projectForm.addEventListener('submit', handleFormSubmit);

        // Project card actions (using event delegation)
        elements.projectsList.addEventListener('click', handleCardAction);

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        // Month navigation
        elements.prevMonth.addEventListener('click', () => changeMonth(-1));
        elements.nextMonth.addEventListener('click', () => changeMonth(1));

        // Keyboard shortcuts
        document.addEventListener('keydown', handleEscapeKey);
    }

    // ================================
    // Initialization
    // ================================

    /**
     * Initialize the application
     */
    function init() {
        loadProjects();
        renderProjects();
        setupEventListeners();
        console.log('True Freelance App initialized');
    }

    // ================================
    // Public API
    // ================================

    return {
        init,
        // Expose some methods for debugging/testing
        addProject,
        updateProject,
        deleteProject,
        getProjects: () => [...projects]
    };
})();

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', TrueFreelanceApp.init);
