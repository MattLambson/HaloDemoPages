// Load saved settings on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSavedBackground();
    loadSavedScript();
});

// Menu toggle function
function toggleMenu() {
    document.querySelector('.side-menu').classList.toggle('open');
}

// Background image handling
document.getElementById('imageUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    const feedback = document.getElementById('imageFeedback');
    
    if (!file) return;
    
    // Check if the file is an image
    if (!file.type.match('image.*')) {
        feedback.innerHTML = 'Please select an image file';
        feedback.className = 'feedback error';
        return;
    }
    
    feedback.innerHTML = 'Processing...';
    feedback.className = 'feedback';
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const imageUrl = e.target.result;
        document.body.style.backgroundImage = `url(${imageUrl})`;
        
        // Save to localStorage
        localStorage.setItem('backgroundImage', imageUrl);
        
        feedback.innerHTML = 'Background updated successfully!';
        feedback.className = 'feedback success';
    };
    
    reader.onerror = function() {
        feedback.innerHTML = 'Failed to process the image';
        feedback.className = 'feedback error';
    };
    
    reader.readAsDataURL(file);
});

// Script update functionality
const updateScriptBtn = document.getElementById('updateScriptBtn');
const scriptModal = document.getElementById('scriptModal');
const scriptInput = document.getElementById('scriptInput');
const saveScriptBtn = document.getElementById('saveScriptBtn');
const cancelScriptBtn = document.getElementById('cancelScriptBtn');
const scriptFeedback = document.getElementById('scriptFeedback');

// Show modal when button is clicked
updateScriptBtn.addEventListener('click', function() {
    const currentScript = document.getElementById('webchatScript');
    scriptInput.value = currentScript ? currentScript.outerHTML : '';
    scriptModal.style.display = 'flex';
});

// Hide modal when cancel is clicked
cancelScriptBtn.addEventListener('click', function() {
    scriptModal.style.display = 'none';
});

// Save new script when save is clicked
saveScriptBtn.addEventListener('click', function() {
    const newScriptHTML = scriptInput.value.trim();
    
    if (!newScriptHTML) {
        alert('Please enter a valid script tag');
        return;
    }
    
    try {
        // Create a temporary container to parse the HTML
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = newScriptHTML;
        
        // Get the script element
        const scriptElement = tempContainer.querySelector('script');
        
        if (!scriptElement) {
            throw new Error('Invalid script tag');
        }
        
        // Remove old script
        const oldScript = document.getElementById('webchatScript');
        if (oldScript) {
            oldScript.remove();
        }
        
        // Create new script element
        const newScript = document.createElement('script');
        newScript.id = 'webchatScript';
        
        // Copy attributes from the parsed script
        Array.from(scriptElement.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
        });
        
        // Set content if any
        if (scriptElement.innerHTML) {
            newScript.innerHTML = scriptElement.innerHTML;
        }
        
        // Append to the container
        document.getElementById('scriptContainer').appendChild(newScript);
        
        // Save to localStorage
        localStorage.setItem('webchatScript', newScriptHTML);
        
        // Update feedback and close modal
        scriptFeedback.innerHTML = 'Script updated successfully!';
        scriptFeedback.className = 'feedback success';
        scriptModal.style.display = 'none';
        
    } catch (error) {
        scriptFeedback.innerHTML = 'Failed to update script: ' + error.message;
        scriptFeedback.className = 'feedback error';
        scriptModal.style.display = 'none';
    }
});

// Load saved background image from localStorage
function loadSavedBackground() {
    const savedBackground = localStorage.getItem('backgroundImage');
    if (savedBackground) {
        document.body.style.backgroundImage = `url(${savedBackground})`;
    }
}

// Load saved script from localStorage
function loadSavedScript() {
    const savedScript = localStorage.getItem('webchatScript');
    if (savedScript) {
        // Remove old script
        const oldScript = document.getElementById('webchatScript');
        if (oldScript) {
            oldScript.remove();
        }
        
        // Create a temporary container to parse the HTML
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = savedScript;
        
        // Get the script element
        const scriptElement = tempContainer.querySelector('script');
        
        if (scriptElement) {
            // Create new script element
            const newScript = document.createElement('script');
            newScript.id = 'webchatScript';
            
            // Copy attributes
            Array.from(scriptElement.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            
            // Set content if any
            if (scriptElement.innerHTML) {
                newScript.innerHTML = scriptElement.innerHTML;
            }
            
            // Append to the container
            document.getElementById('scriptContainer').appendChild(newScript);
        }
    }
}

// Close modal if clicked outside of content
window.onclick = function(event) {
    if (event.target === scriptModal) {
        scriptModal.style.display = 'none';
    }
};