/**
 * True Freelance App
 * Track freelance projects and calculate hourly rates
 * Powered by Supabase
 */

const TrueFreelanceApp = (() => {
    // ================================
    // Private State
    // ================================

    let projects = [];
    let editingProjectId = null;
    let currentViewMonth = new Date();

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
        logoutBtn: document.getElementById('logoutBtn'),

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
     * Load projects from Supabase
     */
    async function loadProjects() {
        try {
            const { data, error } = await window.supabaseClient
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            projects = data.map(p => ({
                id: p.id,
                name: p.name,
                hoursWorked: parseFloat(p.hours_worked),
                moneyReceived: parseFloat(p.money_received),
                completionDate: p.completion_date,
                hourlyRate: parseFloat(p.hourly_rate),
                createdAt: p.created_at,
                updatedAt: p.updated_at
            }));
        } catch (error) {
            console.error('Error loading projects:', error);
            projects = [];
        }
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
    async function addProject(projectData) {
        try {
            const { data, error } = await window.supabaseClient
                .from('projects')
                .insert([{
                    user_id: window.currentUser.id,
                    name: projectData.name.trim(),
                    hours_worked: parseFloat(projectData.hoursWorked),
                    money_received: parseFloat(projectData.moneyReceived),
                    completion_date: projectData.completionDate
                }])
                .select()
                .single();

            if (error) throw error;

            const newProject = {
                id: data.id,
                name: data.name,
                hoursWorked: parseFloat(data.hours_worked),
                moneyReceived: parseFloat(data.money_received),
                completionDate: data.completion_date,
                hourlyRate: parseFloat(data.hourly_rate),
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };

            projects.unshift(newProject);
            return newProject;
        } catch (error) {
            console.error('Error adding project:', error);
            alert('Failed to add project. Please try again.');
            return null;
        }
    }

    /**
     * Update an existing project
     */
    async function updateProject(id, projectData) {
        try {
            const { data, error } = await window.supabaseClient
                .from('projects')
                .update({
                    name: projectData.name.trim(),
                    hours_worked: parseFloat(projectData.hoursWorked),
                    money_received: parseFloat(projectData.moneyReceived),
                    completion_date: projectData.completionDate,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const projectIndex = projects.findIndex(p => p.id === id);
            if (projectIndex !== -1) {
                projects[projectIndex] = {
                    id: data.id,
                    name: data.name,
                    hoursWorked: parseFloat(data.hours_worked),
                    moneyReceived: parseFloat(data.money_received),
                    completionDate: data.completion_date,
                    hourlyRate: parseFloat(data.hourly_rate),
                    createdAt: data.created_at,
                    updatedAt: data.updated_at
                };
            }

            return projects[projectIndex];
        } catch (error) {
            console.error('Error updating project:', error);
            alert('Failed to update project. Please try again.');
            return null;
        }
    }

    /**
     * Delete a project
     */
    async function deleteProject(id) {
        const project = getProjectById(id);
        if (!project) return false;

        const confirmed = confirm(`Are you sure you want to delete "${project.name}"?`);
        if (!confirmed) return false;

        try {
            const { error } = await window.supabaseClient
                .from('projects')
                .delete()
                .eq('id', id);

            if (error) throw error;

            projects = projects.filter(p => p.id !== id);
            return true;
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Failed to delete project. Please try again.');
            return false;
        }
    }

    // ================================
    // Auth Functions
    // ================================

    /**
     * Logout user
     */
    async function logout() {
        try {
            await window.supabaseClient.auth.signOut();
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Error logging out:', error);
        }
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
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

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

        elements.currentMonth.textContent = getMonthName(currentViewMonth);

        elements.monthlyEarnings.textContent = formatCurrency(stats.totalEarnings);
        elements.monthlyHours.textContent = formatHours(stats.totalHours);
        elements.monthlyRate.textContent = formatCurrency(stats.avgRate) + '/hr';
        elements.monthlyProjects.textContent = stats.projectCount;

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
            const today = new Date().toISOString().split('T')[0];
            elements.completionDate.value = today;
        }

        elements.modalOverlay.classList.remove('hidden');
        elements.projectName.focus();

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

        if (!data.name || data.name.trim().length === 0) {
            elements.nameError.textContent = 'Project name is required';
            elements.projectName.classList.add('error');
            isValid = false;
        }

        if (!data.hoursWorked || parseFloat(data.hoursWorked) < 0) {
            elements.hoursError.textContent = 'Hours must be 0 or greater';
            elements.hoursWorked.classList.add('error');
            isValid = false;
        }

        if (!data.moneyReceived || parseFloat(data.moneyReceived) < 0) {
            elements.moneyError.textContent = 'Money must be 0 or greater';
            elements.moneyReceived.classList.add('error');
            isValid = false;
        }

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
    async function handleFormSubmit(event) {
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

        // Disable save button during operation
        elements.saveBtn.disabled = true;
        elements.saveBtn.textContent = 'Saving...';

        let success;
        if (editingProjectId) {
            success = await updateProject(editingProjectId, formData);
        } else {
            success = await addProject(formData);
        }

        elements.saveBtn.disabled = false;
        elements.saveBtn.textContent = 'Save Project';

        if (success) {
            closeModal();
            renderProjects();

            if (!elements.monthlyTab.classList.contains('hidden')) {
                renderMonthlyView();
            }
        }
    }

    /**
     * Handle card action clicks (Edit/Delete)
     */
    async function handleCardAction(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const projectId = button.dataset.id;

        if (action === 'edit') {
            openModal('edit', projectId);
        } else if (action === 'delete') {
            if (await deleteProject(projectId)) {
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
        elements.addProjectBtn.addEventListener('click', () => openModal('add'));
        elements.emptyStateBtn.addEventListener('click', () => openModal('add'));

        elements.closeModalBtn.addEventListener('click', closeModal);
        elements.cancelBtn.addEventListener('click', closeModal);
        elements.modalOverlay.addEventListener('click', handleOverlayClick);

        elements.projectForm.addEventListener('submit', handleFormSubmit);

        elements.projectsList.addEventListener('click', handleCardAction);

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        elements.prevMonth.addEventListener('click', () => changeMonth(-1));
        elements.nextMonth.addEventListener('click', () => changeMonth(1));

        // Logout button
        if (elements.logoutBtn) {
            elements.logoutBtn.addEventListener('click', logout);
        }

        document.addEventListener('keydown', handleEscapeKey);
    }

    // ================================
    // Initialization
    // ================================

    /**
     * Initialize the application
     */
    async function init() {
        await loadProjects();
        renderProjects();
        setupEventListeners();
        console.log('True Freelance App initialized with Supabase');
    }

    // ================================
    // Public API
    // ================================

    return {
        init,
        addProject,
        updateProject,
        deleteProject,
        getProjects: () => [...projects]
    };
})();

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', TrueFreelanceApp.init);
