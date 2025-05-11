document.addEventListener('DOMContentLoaded', function() {
    // Initialize empty table
    initializeEmptyTable();
    
    // Event listeners for buttons
    document.getElementById('newContact').addEventListener('click', function() {
        showContactForm();
    });
    
    document.getElementById('pullInData').addEventListener('click', function() {
        pullInData();
    });
    
    document.getElementById('clearAll').addEventListener('click', function() {
        clearAllContacts();
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('contactModal');
        if (event.target === modal) {
            closeModal();
        }
    });
});
// Function to initialize an empty table
function initializeEmptyTable() {
    const tbody = document.getElementById('contactsList');
    tbody.innerHTML = '';
    
    // Add placeholder message
    const placeholderRow = document.createElement('tr');
    placeholderRow.innerHTML = `
        <td colspan="6" class="empty-table-message">
            No contacts loaded. Click "Pull in Data" to load contact data.
        </td>
    `;
    tbody.appendChild(placeholderRow);
}
// Function to fetch data from the API
function pullInData() {
    const button = document.getElementById('pullInData');
    
    // Set loading state
    button.disabled = true;
    button.innerHTML = 'Loading...';
    
    // Use the provided API endpoint
    const apiUrl = 'https://dummyjson.com/c/9737-cfe9-42d6-9517';
    
    // Make the GET request
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Store the data globally for later reference
            window.crmData = data;
            
            // Populate the table with the received data
            populateTableWithData(data);
            
            // Reset button state
            button.disabled = false;
            button.innerHTML = 'Pull in Data';
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('Error pulling in data. Please try again.');
            
            // Reset button state
            button.disabled = false;
            button.innerHTML = 'Pull in Data';
        });
}
// Function to populate the table with data received from API
function populateTableWithData(data) {
    const tbody = document.getElementById('contactsList');
    tbody.innerHTML = '';
    
    // Check if data is an array or if it has a specific structure
    const contacts = Array.isArray(data) ? data : data.contacts || data.users || data.items || [];
    
    if (contacts.length === 0) {
        // Handle case of no data returned
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="6" class="empty-table-message">
                No contacts found. Try again later or add contacts manually.
            </td>
        `;
        tbody.appendChild(emptyRow);
        return;
    }
    
    // Populate table with data
    contacts.forEach(contact => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${contact.firstName || ''} ${contact.lastName || ''}</td>
            <td>${contact.email || ''}</td>
            <td>${contact.phone || ''}</td>
            <td>${contact.company || 'N/A'}</td>
            <td>${contact.incomeRange || 'N/A'}</td>
            <td>${contact.hotlistType || 'N/A'}</td>
        `;
        
        row.addEventListener('click', function() {
            showContactDetails(contact);
        });
        
        tbody.appendChild(row);
    });
}
// Function to clear all contacts from the table
function clearAllContacts() {
    if (confirm('Are you sure you want to clear all contacts? This cannot be undone.')) {
        // Clear the global data
        window.crmData = null;
        
        // Reset the table to empty state
        initializeEmptyTable();
        
        alert('All contacts have been cleared from the CRM.');
    }
}
// Show contact details modal
function showContactDetails(contact) {
    const modal = document.getElementById('contactModal');
    const modalContent = modal.querySelector('.modal-content');
    
    // Create HTML for all fields in the contact
    let fieldsHtml = '';
    
    // Build the fields HTML dynamically based on the available data
    const fields = Object.keys(contact);
    const fieldsToDisplay = fields.filter(field => field !== 'id'); // Exclude id field if present
    
    fieldsToDisplay.forEach(field => {
        // Format the field name for display (e.g., "firstName" -> "First Name")
        const fieldLabel = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        
        // Format the field value based on its type
        let fieldValue = contact[field];
        if (typeof fieldValue === 'boolean') {
            fieldValue = fieldValue ? 'Yes' : 'No';
        } else if (fieldValue === null || fieldValue === undefined) {
            fieldValue = 'N/A';
        }
        
        fieldsHtml += `
        <div class="contact-field">
            <div class="field-label">${fieldLabel}</div>
            <div class="field-value">${fieldValue}</div>
        </div>
        `;
    });
    
    // Complete modal HTML
    modalContent.innerHTML = `
        <div class="contact-details">
            <h2>Customer Data</h2>
            
            <div class="contact-details-grid">
                ${fieldsHtml}
            </div>
            
            <div class="contact-actions">
                <button class="btn primary" id="editContact">Edit</button>
                <button class="btn primary" id="transferToCDP">Transfer to CDP</button>
                <button class="btn" id="deleteContact">Delete</button>
                <button class="btn" id="closeModal">Close</button>
            </div>
        </div>
    `;
    
    // Add event listeners
    modalContent.querySelector('#closeModal').addEventListener('click', closeModal);
    modalContent.querySelector('#editContact').addEventListener('click', function() {
        showContactForm(contact);
    });
    modalContent.querySelector('#deleteContact').addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this contact?')) {
            deleteContact(contact);
            closeModal();
        }
    });
    
    // Transfer to CDP button implementation with improved handling of 201 responses
    modalContent.querySelector('#transferToCDP').addEventListener('click', function() {
        this.disabled = true;
        this.innerHTML = 'Transferring...';
        
        const cdpData = [{
            "Email Address": contact.email || "",
            "First Name": contact.firstName || "",
            "Last Name": contact.lastName || "",
            "Mobile Phone": contact.phone || "",
            "Company": contact.company || "",
            "Income Range": contact.incomeRange || "",
            "Hotlist Type": contact.hotlistType || ""
        }];
        
        const cdpUrl = 'https://api.cdp.cm.com/events/v1.0/tenants/8f950379-3749-403b-ad36-290f83329124/events/c2027aac-4127-4420-8345-b00b483b34c1';
        
        fetch(cdpUrl, {
            method: 'POST',
            headers: {
                'X-CM-PRODUCTTOKEN': 'b3168fd2-6675-4d59-946a-bfe7fbe582d6',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cdpData)
        })
        .then(response => {
            console.log('CDP Response Status:', response.status);
            
            // Explicitly accept 200 and 201 status codes
            if (response.status === 200 || response.status === 201) {
                // Success - check for content
                return response.text().then(text => {
                    if (!text || text.trim() === '') {
                        // Empty response is fine for 201 Created
                        return { success: true, message: "Data successfully sent to CDP" };
                    }
                    
                    try {
                        // Try to parse as JSON if there's content
                        return JSON.parse(text);
                    } catch (e) {
                        // Not JSON, but still a success
                        return { success: true, rawResponse: text };
                    }
                });
            } else {
                // Handle error responses
                return response.text().then(text => {
                    throw new Error(`CDP transfer failed: ${response.status} ${text || response.statusText}`);
                });
            }
        })
        .then(data => {
            console.log('CDP Success Response:', data);
            alert(`Contact ${contact.firstName} ${contact.lastName} successfully transferred to CDP!`);
        })
        .catch(error => {
            console.error('CDP Transfer Error:', error);
            alert(`Error transferring to CDP: ${error.message}`);
        })
        .finally(() => {
            // Reset button state
            this.disabled = false;
            this.innerHTML = 'Transfer to CDP';
        });
    });
    
    // Show the modal
    modal.style.display = 'block';
}
// Close the modal
function closeModal() {
    document.getElementById('contactModal').style.display = 'none';
}
// Function to delete a contact
function deleteContact(contact) {
    // If we have stored data
    if (window.crmData) {
        // Find the index of the contact in the data array
        const contacts = Array.isArray(window.crmData) ? window.crmData : 
                         window.crmData.contacts || window.crmData.users || window.crmData.items || [];
        
        const index = contacts.findIndex(c => c === contact || c.id === contact.id);
        
        if (index !== -1) {
            // Remove the contact from the array
            contacts.splice(index, 1);
            
            // Refresh the table
            populateTableWithData(window.crmData);
            
            alert('Contact deleted successfully');
        }
    }
}
// Show form to create or edit a contact
function showContactForm(contact = null) {
    const modal = document.getElementById('contactModal');
    const modalContent = modal.querySelector('.modal-content');
    const isEdit = contact !== null;
    
    // Create a form with dynamic fields based on the contact data
    let formHtml = `
        <div class="contact-form">
            <h2>${isEdit ? 'Edit Contact' : 'New Contact'}</h2>
            <form id="contactForm">
    `;
    
    // If we're editing, generate form fields for each property in the contact
    if (isEdit) {
        const fields = Object.keys(contact);
        
        fields.forEach(field => {
            // Skip id field if present
            if (field === 'id') return;
            
            // Format the field name for display
            const fieldLabel = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            
            // Determine the input type based on the field value
            let inputType = 'text';
            let fieldValue = contact[field];
            let inputHtml = '';
            
            if (typeof fieldValue === 'boolean') {
                // Boolean field - use select
                inputHtml = `
                    <select id="${field}">
                        <option value="true" ${fieldValue ? 'selected' : ''}>Yes</option>
                        <option value="false" ${!fieldValue ? 'selected' : ''}>No</option>
                    </select>
                `;
            } else if (typeof fieldValue === 'number') {
                // Number field
                inputType = 'number';
                inputHtml = `<input type="${inputType}" id="${field}" value="${fieldValue || ''}">`;
            } else if (field.includes('date') || field.includes('Date')) {
                // Date field
                inputType = 'date';
                // Format date value if needed
                inputHtml = `<input type="${inputType}" id="${field}" value="${fieldValue || ''}">`;
            } else if (field.includes('email')) {
                // Email field
                inputType = 'email';
                inputHtml = `<input type="${inputType}" id="${field}" value="${fieldValue || ''}">`;
            } else if (field.includes('phone')) {
                // Phone field
                inputType = 'tel';
                inputHtml = `<input type="${inputType}" id="${field}" value="${fieldValue || ''}">`;
            } else if (field === 'incomeRange') {
                // Income range - use select
                inputHtml = `
                    <select id="${field}">
                        <option value="" ${!fieldValue ? 'selected' : ''}>Select Income Range</option>
                        <option value="$0-$50k" ${fieldValue === '$0-$50k' ? 'selected' : ''}>$0-$50k</option>
                        <option value="$50k-$100k" ${fieldValue === '$50k-$100k' ? 'selected' : ''}>$50k-$100k</option>
                        <option value="$100k-$150k" ${fieldValue === '$100k-$150k' ? 'selected' : ''}>$100k-$150k</option>
                        <option value="$150k+" ${fieldValue === '$150k+' ? 'selected' : ''}>$150k+</option>
                    </select>
                `;
            } else if (field === 'hotlistType') {
                // Hotlist type - use select
                inputHtml = `
                    <select id="${field}">
                        <option value="" ${!fieldValue ? 'selected' : ''}>None</option>
                        <option value="VIP" ${fieldValue === 'VIP' ? 'selected' : ''}>VIP</option>
                        <option value="High Value" ${fieldValue === 'High Value' ? 'selected' : ''}>High Value</option>
                        <option value="Returning" ${fieldValue === 'Returning' ? 'selected' : ''}>Returning</option>
                        <option value="Potential" ${fieldValue === 'Potential' ? 'selected' : ''}>Potential</option>
                    </select>
                `;
            } else {
                // Default text field
                inputHtml = `<input type="${inputType}" id="${field}" value="${fieldValue || ''}">`;
            }
            
            // Add the form group
            formHtml += `
                <div class="form-group">
                    <label for="${field}">${fieldLabel}</label>
                    ${inputHtml}
                </div>
            `;
        });
    } else {
        // For new contacts, just provide the new set of fields
        formHtml += `
            <div class="form-group">
                <label for="firstName">First Name</label>
                <input type="text" id="firstName" required>
            </div>
            
            <div class="form-group">
                <label for="lastName">Last Name</label>
                <input type="text" id="lastName" required>
            </div>
            
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" required>
            </div>
            
            <div class="form-group">
                <label for="phone">Phone</label>
                <input type="tel" id="phone">
            </div>
            
            <div class="form-group">
                <label for="company">Company</label>
                <input type="text" id="company">
            </div>
            
            <div class="form-group">
                <label for="incomeRange">Income Range</label>
                <select id="incomeRange">
                    <option value="">Select Income Range</option>
                    <option value="$0-$50k">$0-$50k</option>
                    <option value="$50k-$100k">$50k-$100k</option>
                    <option value="$100k-$150k">$100k-$150k</option>
                    <option value="$150k+">$150k+</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="hotlistType">Hotlist Type</label>
                <select id="hotlistType">
                    <option value="">None</option>
                    <option value="VIP">VIP</option>
                    <option value="High Value">High Value</option>
                    <option value="Returning">Returning</option>
                    <option value="Potential">Potential</option>
                </select>
            </div>
        `;
    }
    
    // Form actions
    formHtml += `
                <div class="form-actions">
                    <button type="submit" class="btn primary">${isEdit ? 'Update' : 'Save'}</button>
                    <button type="button" class="btn" id="cancelForm">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    modalContent.innerHTML = formHtml;
    
    // Add event listeners
    modalContent.querySelector('#cancelForm').addEventListener('click', closeModal);
    modalContent.querySelector('#contactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Gather form data
        const formData = {};
        
        // If we're editing, get all the fields from the form
        if (isEdit) {
            const fields = Object.keys(contact);
            
            fields.forEach(field => {
                if (field === 'id') {
                    // Preserve the id
                    formData[field] = contact[field];
                } else {
                    const input = document.getElementById(field);
                    if (input) {
                        // Process the value based on the original type
                        if (typeof contact[field] === 'boolean') {
                            formData[field] = input.value === 'true';
                        } else if (typeof contact[field] === 'number') {
                            formData[field] = parseInt(input.value) || 0;
                        } else {
                            formData[field] = input.value;
                        }
                    }
                }
            });
        } else {
            // For new contacts, get the fields we defined
            formData.id = Date.now(); // Generate a unique ID
            formData.firstName = document.getElementById('firstName').value;
            formData.lastName = document.getElementById('lastName').value;
            formData.email = document.getElementById('email').value;
            formData.phone = document.getElementById('phone').value;
            formData.company = document.getElementById('company').value;
            formData.incomeRange = document.getElementById('incomeRange').value;
            formData.hotlistType = document.getElementById('hotlistType').value;
        }
        
        if (isEdit) {
            updateContact(formData);
        } else {
            addContact(formData);
        }
        
        closeModal();
    });
    
    // Show the modal
    modal.style.display = 'block';
}
// Add a new contact
function addContact(contact) {
    // Initialize crmData if not exists
    if (!window.crmData) {
        window.crmData = [];
    }
    
    // Add to the data array
    if (Array.isArray(window.crmData)) {
        window.crmData.push(contact);
    } else {
        // If crmData has a specific structure, add to the appropriate array
        const contacts = window.crmData.contacts || window.crmData.users || window.crmData.items;
        if (Array.isArray(contacts)) {
            contacts.push(contact);
        } else {
            // If we can't find the right array, create a new one
            window.crmData.contacts = [contact];
        }
    }
    
    // Refresh the table
    populateTableWithData(window.crmData);
    
    alert('Contact added successfully!');
}
// Update an existing contact
function updateContact(updatedContact) {
    // Find and update the contact in the data
    if (window.crmData) {
        const contacts = Array.isArray(window.crmData) ? window.crmData : 
                         window.crmData.contacts || window.crmData.users || window.crmData.items || [];
        
        const index = contacts.findIndex(c => c.id === updatedContact.id);
        
        if (index !== -1) {
            contacts[index] = updatedContact;
            
            // Refresh the table
            populateTableWithData(window.crmData);
            
            alert('Contact updated successfully!');
        }
    }
}