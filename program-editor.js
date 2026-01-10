// Program Editor - Inline editing for Program section
document.addEventListener('DOMContentLoaded', () => {
    let isEditMode = false;
    let programData = [];
    let editingItem = null;

    // Initialize program editor
    async function initProgramEditor() {
        // Load program data from Firebase or content.js
        await loadProgramData();
        renderProgram();
        setupEventListeners();
    }

    // Load program data
    async function loadProgramData() {
        // Try Firebase first
        if (typeof syncManager !== 'undefined' && syncManager.isFirebaseAvailable && syncManager.isAuthenticated) {
            const data = await syncManager.loadData('program');
            if (data && Array.isArray(data)) {
                programData = data;
                return;
            }
        }

        // Fallback to content.js
        if (typeof websiteContent !== 'undefined' && websiteContent.program) {
            programData = [
                { id: 'arrival', ...websiteContent.program.arrival },
                { id: 'day1', ...websiteContent.program.day1 },
                { id: 'day2', ...websiteContent.program.day2 },
                { id: 'day3', ...websiteContent.program.day3 }
            ];
        }
    }

    // Save program data
    async function saveProgramData() {
        if (typeof syncManager !== 'undefined' && syncManager.isFirebaseAvailable && syncManager.isAuthenticated) {
            await syncManager.saveData('program', programData);
        } else {
            // Fallback to localStorage
            localStorage.setItem('alps_program', JSON.stringify(programData));
        }
    }

    // Render program
    function renderProgram() {
        const timeline = document.getElementById('program-timeline');
        if (!timeline) return;

        timeline.innerHTML = '';

        programData.forEach((day, index) => {
            const dayElement = createDayElement(day, index);
            timeline.appendChild(dayElement);
        });
    }

    // Create day element
    function createDayElement(day, index) {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.setAttribute('data-program-id', day.id || `day${index}`);
        div.setAttribute('data-program-index', index);

        const itemsHtml = day.items ? day.items.map(item => `<li>${item}</li>`).join('') : '';

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                <div class="timeline-date" data-editable="date" contenteditable="false">${day.date || ''}</div>
                <div class="program-actions" style="display: ${isEditMode ? 'flex' : 'none'}; gap: 0.5rem;">
                    <button class="program-edit-btn" style="background: none; border: none; color: var(--accent); cursor: pointer; padding: 0.25rem 0.5rem; font-size: 0.8rem;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="program-delete-btn" style="background: none; border: none; color: #FF4F40; cursor: pointer; padding: 0.25rem 0.5rem; font-size: 0.8rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <h3 data-editable="title" contenteditable="false">${day.title || ''}</h3>
            <p class="text-secondary" data-editable="description" contenteditable="false">${day.description || ''}</p>
            <ul class="timeline-sub" data-editable="items">${itemsHtml}</ul>
        `;

        // Setup event listeners for this day
        setupDayEventListeners(div, index);

        return div;
    }

    // Setup event listeners for a day element
    function setupDayEventListeners(dayElement, index) {
        // Edit button
        const editBtn = dayElement.querySelector('.program-edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => toggleEditDay(dayElement, index));
        }

        // Delete button
        const deleteBtn = dayElement.querySelector('.program-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deleteDay(index));
        }

        // Make fields editable when in edit mode
        if (isEditMode) {
            const editableFields = dayElement.querySelectorAll('[data-editable]');
            editableFields.forEach(field => {
                if (field.tagName === 'UL') {
                    // Special handling for items list
                    field.addEventListener('blur', () => saveDayItems(index, field));
                } else {
                    field.addEventListener('blur', () => saveDayField(index, field));
                }
            });
        }
    }

    // Toggle edit mode for a day
    function toggleEditDay(dayElement, index) {
        if (editingItem === index) {
            // Save and exit edit mode
            saveDayData(index, dayElement);
            dayElement.classList.remove('editing');
            editingItem = null;
        } else {
            // Enter edit mode
            if (editingItem !== null) {
                const prevElement = document.querySelector(`[data-program-index="${editingItem}"]`);
                if (prevElement) {
                    saveDayData(editingItem, prevElement);
                    prevElement.classList.remove('editing');
                }
            }
            dayElement.classList.add('editing');
            makeEditable(dayElement);
            editingItem = index;
        }
    }

    // Make fields editable
    function makeEditable(dayElement) {
        const fields = dayElement.querySelectorAll('[data-editable]');
        fields.forEach(field => {
            if (field.tagName === 'UL') {
                // Make list items editable
                const items = field.querySelectorAll('li');
                items.forEach((li, i) => {
                    li.contentEditable = 'true';
                    li.style.outline = '1px dashed rgba(255, 79, 64, 0.5)';
                    li.style.padding = '0.25rem';
                    li.style.marginBottom = '0.25rem';
                });
                // Add "Add item" button
                if (!field.querySelector('.add-item-btn')) {
                    const addBtn = document.createElement('button');
                    addBtn.className = 'add-item-btn';
                    addBtn.innerHTML = '<i class="fas fa-plus"></i> Tilføj punkt';
                    addBtn.style.cssText = 'margin-top: 0.5rem; padding: 0.5rem; background: rgba(255, 79, 64, 0.2); border: 1px solid var(--accent); border-radius: 4px; color: var(--accent); cursor: pointer; font-size: 0.8rem;';
                    addBtn.addEventListener('click', () => {
                        const newLi = document.createElement('li');
                        newLi.contentEditable = 'true';
                        newLi.textContent = 'Nyt punkt';
                        newLi.style.outline = '1px dashed rgba(255, 79, 64, 0.5)';
                        newLi.style.padding = '0.25rem';
                        newLi.style.marginBottom = '0.25rem';
                        field.insertBefore(newLi, addBtn);
                        newLi.focus();
                    });
                    field.appendChild(addBtn);
                }
            } else {
                field.contentEditable = 'true';
            }
        });
    }

    // Save day data
    function saveDayData(index, dayElement) {
        const date = dayElement.querySelector('[data-editable="date"]').textContent.trim();
        const title = dayElement.querySelector('[data-editable="title"]').textContent.trim();
        const description = dayElement.querySelector('[data-editable="description"]').textContent.trim();
        const itemsList = dayElement.querySelector('[data-editable="items"]');
        const items = Array.from(itemsList.querySelectorAll('li:not(.add-item-btn)')).map(li => li.textContent.trim()).filter(item => item);

        programData[index] = {
            ...programData[index],
            date,
            title,
            description,
            items
        };

        saveProgramData();
    }

    // Save day field
    function saveDayField(index, field) {
        const fieldType = field.getAttribute('data-editable');
        programData[index][fieldType] = field.textContent.trim();
        saveProgramData();
    }

    // Save day items
    function saveDayItems(index, itemsList) {
        const items = Array.from(itemsList.querySelectorAll('li:not(.add-item-btn)')).map(li => li.textContent.trim()).filter(item => item);
        programData[index].items = items;
        saveProgramData();
    }

    // Delete day
    function deleteDay(index) {
        if (confirm('Er du sikker på, at du vil slette denne dag?')) {
            programData.splice(index, 1);
            saveProgramData();
            renderProgram();
        }
    }

    // Add new day
    function addNewDay() {
        const newDay = {
            id: `day${Date.now()}`,
            date: 'Ny dato',
            title: 'Ny dag',
            description: 'Beskrivelse',
            items: ['Nyt punkt']
        };
        programData.push(newDay);
        saveProgramData();
        renderProgram();
        // Auto-edit the new day
        setTimeout(() => {
            const newElement = document.querySelector(`[data-program-id="${newDay.id}"]`);
            if (newElement) {
                toggleEditDay(newElement, programData.length - 1);
            }
        }, 100);
    }

    // Toggle edit mode
    function toggleEditMode() {
        isEditMode = !isEditMode;
        const btn = document.getElementById('program-edit-toggle');
        const addContainer = document.getElementById('program-add-day-container');
        const actions = document.querySelectorAll('.program-actions');

        if (isEditMode) {
            btn.innerHTML = '<i class="fas fa-save"></i> Gem';
            btn.classList.remove('btn-secondary');
            btn.classList.add('btn-primary');
            if (addContainer) addContainer.style.display = 'block';
            actions.forEach(action => action.style.display = 'flex');
        } else {
            btn.innerHTML = '<i class="fas fa-edit"></i> Rediger';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
            if (addContainer) addContainer.style.display = 'none';
            actions.forEach(action => action.style.display = 'none');
            // Save all and exit edit mode for all items
            document.querySelectorAll('.timeline-item.editing').forEach(item => {
                const index = parseInt(item.getAttribute('data-program-index'));
                saveDayData(index, item);
                item.classList.remove('editing');
            });
            editingItem = null;
            renderProgram(); // Re-render to remove edit mode styling
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        const editToggle = document.getElementById('program-edit-toggle');
        const addDayBtn = document.getElementById('program-add-day');

        if (editToggle) {
            editToggle.addEventListener('click', toggleEditMode);
        }

        if (addDayBtn) {
            addDayBtn.addEventListener('click', addNewDay);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProgramEditor);
    } else {
        // Wait a bit for syncManager to initialize
        setTimeout(initProgramEditor, 500);
    }
});

