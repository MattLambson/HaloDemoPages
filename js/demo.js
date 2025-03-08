// Load saved settings on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, current path:', window.location.pathname);
    loadSavedBackground();
    loadSavedScript();
});

// Menu toggle function
function toggleMenu() {
    document.querySelector('.side-menu').classList.toggle('open');
}

// Get a unique storage key for the current page
function getPageKey(baseKey) {
    // Extract the page path (e.g., '/DemoPages/matt-lambson/')
    const pagePath = window.location.pathname;
    // Create a unique key by combining the base key and path
    const pageSpecificKey = baseKey + '-' + pagePath.replace(/\//g, '-');
    console.log(`Creating key for ${baseKey}: ${pageSpecificKey}`);
    return pageSpecificKey;
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
        
        // Save to localStorage with a unique key for this page
        const storageKey = getPageKey('backgroundImage');
        localStorage.setItem(storageKey, imageUrl);
        console.log('Saved background to:', storageKey);
        
        feedback.innerHTML = 'Background updated successfully!';
        feedback.className = 'feedback success';
    };
    
    reader.onerror = function() {
        feedback.innerHTML = 'Failed to process the image';
        feedback.className = 'feedback error';
    };
    
    reader.readAsDataURL(file);
});

// Reset background to default
document.getElementById('resetBgBtn').addEventListener('click', function() {
    const feedback = document.getElementById('imageFeedback');
    
    // Remove the background image from localStorage using the page-specific key
    const storageKey = getPageKey('backgroundImage');
    localStorage.removeItem(storageKey);
    console.log('Removed background from:', storageKey);
    
    // Reset the background to default (from CSS)
    document.body.style.backgroundImage = '';
    
    feedback.innerHTML = 'Background reset to default';
    feedback.className = 'feedback success';
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
    // Check if there's any script in the container
    const scriptContainer = document.getElementById('scriptContainer');
    const currentScript = scriptContainer.querySelector('script');
    
    if (currentScript) {
        // If there's an existing script, show it in the textarea
        scriptInput.value = currentScript.outerHTML;
    } else {
        // If no script exists, provide a template or clear the input
        scriptInput.value = '<!-- Paste your webchat script here -->';
    }
    
    scriptModal.style.display = 'flex';
});

// Hide modal when cancel is clicked
cancelScriptBtn.addEventListener('click', function() {
    scriptModal.style.display = 'none';
});

// Save new script when save is clicked - UPDATED
saveScriptBtn.addEventListener('click', function() {
    const newScriptHTML = scriptInput.value.trim();
    
    if (!newScriptHTML) {
        alert('Please enter a valid script tag');
        return;
    }
    
    try {
        // Extract the script information
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = newScriptHTML;
        const scriptElement = tempContainer.querySelector('script');
        
        if (!scriptElement) {
            throw new Error('Invalid script tag');
        }
        
        // Extract the src and onload attributes
        const scriptSrc = scriptElement.getAttribute('src');
        const onloadContent = scriptElement.getAttribute('onload');
        
        if (!scriptSrc) {
            throw new Error('Script must have a src attribute');
        }
        
        // Remove any existing scripts and clear any previous instances
        const scriptContainer = document.getElementById('scriptContainer');
        scriptContainer.innerHTML = '';
        
        // Attempt to clean up any existing webchat instances
        if (window.cmwc) {
            try {
                // Reset the webchat object if possible
                window.cmwc = undefined;
            } catch (e) {
                console.warn("Could not reset webchat instance:", e);
            }
        }
        
        // Save to localStorage
        const storageKey = getPageKey('webchatScript');
        localStorage.setItem(storageKey, newScriptHTML);
        console.log('Saved script to localStorage:', newScriptHTML);
        
        // Create a new script element programmatically
        const newScript = document.createElement('script');
        newScript.type = scriptElement.type || 'module';
        if (scriptElement.crossOrigin) newScript.crossOrigin = scriptElement.crossOrigin;
        newScript.src = scriptSrc;
        
        // Handle the onload attribute properly
        if (onloadContent) {
            console.log('Setting onload handler with content:', onloadContent);
            newScript.onload = function() {
                console.log('Script loaded, executing onload');
                
                // Add a small delay to ensure the script is fully processed
                setTimeout(function() {
                    try {
                        // Execute the onload content by creating and calling a function
                        // This is safer than using eval directly
                        new Function(onloadContent)();
                        console.log('Webchat initialization completed');
                    } catch (e) {
                        console.error('Error executing onload content:', e);
                        scriptFeedback.innerHTML = 'Error initializing webchat: ' + e.message;
                        scriptFeedback.className = 'feedback error';
                    }
                }, 300);
            };
        }
        
        // Append the script to the container
        scriptContainer.appendChild(newScript);
        console.log('Script element added to DOM');
        
        // Update feedback and close modal
        scriptFeedback.innerHTML = 'Webchat script added successfully!';
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
    const storageKey = getPageKey('backgroundImage');
    const savedBackground = localStorage.getItem(storageKey);
    console.log('Loading background from:', storageKey, savedBackground ? 'Found' : 'Not found');
    
    if (savedBackground) {
        document.body.style.backgroundImage = `url(${savedBackground})`;
    }
}

// Load saved script from localStorage - UPDATED
function loadSavedScript() {
    const storageKey = getPageKey('webchatScript');
    const savedScript = localStorage.getItem(storageKey);
    console.log('Loading script from:', storageKey, savedScript ? 'Found' : 'Not found');
    
    if (savedScript) {
        try {
            // Extract the script information
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = savedScript;
            const scriptElement = tempContainer.querySelector('script');
            
            if (!scriptElement) {
                throw new Error('Invalid script tag in saved data');
            }
            
            // Extract the src and onload attributes
            const scriptSrc = scriptElement.getAttribute('src');
            const onloadContent = scriptElement.getAttribute('onload');
            
            if (!scriptSrc) {
                throw new Error('Script must have a src attribute');
            }
            
            // Clear the script container
            const scriptContainer = document.getElementById('scriptContainer');
            scriptContainer.innerHTML = '';
            
            // Create a new script element programmatically
            const newScript = document.createElement('script');
            newScript.type = scriptElement.type || 'module';
            if (scriptElement.crossOrigin) newScript.crossOrigin = scriptElement.crossOrigin;
            newScript.src = scriptSrc;
            
            // Handle the onload attribute properly
            if (onloadContent) {
                console.log('Setting onload handler with content:', onloadContent);
                newScript.onload = function() {
                    console.log('Script loaded, executing onload');
                    
                    // Add a small delay to ensure the script is fully processed
                    setTimeout(function() {
                        try {
                            // Execute the onload content
                            new Function(onloadContent)();
                            console.log('Webchat initialization completed');
                        } catch (e) {
                            console.error('Error executing onload content:', e);
                            scriptFeedback.innerHTML = 'Error initializing webchat: ' + e.message;
                            scriptFeedback.className = 'feedback error';
                        }
                    }, 300);
                };
            }
            
            // Append the script to the container
            scriptContainer.appendChild(newScript);
            console.log('Script applied successfully.');
            
            // Update UI to show a script is active
            scriptFeedback.innerHTML = 'Webchat script is active';
            scriptFeedback.className = 'feedback success';
        } catch (error) {
            console.error('Error loading saved script:', error);
            scriptFeedback.innerHTML = 'Error loading webchat script: ' + error.message;
            scriptFeedback.className = 'feedback error';
        }
    } else {
        console.log('No saved script found for this page.');
        
        // Update UI to show that no script is installed
        scriptFeedback.innerHTML = 'No webchat script installed. Use "Update Web Chat Script" to add one.';
        scriptFeedback.className = 'feedback info';
    }
}

// Close modal if clicked outside of content
window.onclick = function(event) {
    if (event.target === scriptModal) {
        scriptModal.style.display = 'none';
    }
};

// Add a remove script button handler
document.getElementById('removeScriptBtn').addEventListener('click', function() {
    // Attempt to clean up any existing webchat instances
    if (window.cmwc) {
        try {
            // Reset the webchat object if possible
            window.cmwc = undefined;
        } catch (e) {
            console.warn("Could not reset webchat instance:", e);
        }
    }
    
    // Clear the script container
    const scriptContainer = document.getElementById('scriptContainer');
    scriptContainer.innerHTML = '';
    
    // Remove from localStorage
    const storageKey = getPageKey('webchatScript');
    localStorage.removeItem(storageKey);
    
    // Update feedback
    scriptFeedback.innerHTML = 'Webchat script removed successfully';
    scriptFeedback.className = 'feedback success';
});