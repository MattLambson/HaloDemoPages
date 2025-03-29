// Load saved settings on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, current path:', window.location.pathname);
    loadSavedBackground();
    loadSavedWebsiteBackground();
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
        
        // Remove any existing website background
        const websiteContainer = document.getElementById('websiteBackground');
        websiteContainer.style.display = 'none';
        websiteContainer.innerHTML = '';
        localStorage.removeItem(getPageKey('websiteBackground'));
        
        // Apply the image background
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

// Website background handling
document.getElementById('loadWebsiteBtn').addEventListener('click', function() {
    const websiteUrl = document.getElementById('websiteUrl').value.trim();
    const feedback = document.getElementById('websiteFeedback');
    
    if (!websiteUrl) {
        feedback.innerHTML = 'Please enter a valid URL';
        feedback.className = 'feedback error';
        return;
    }
    
    // Basic URL validation
    if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
        feedback.innerHTML = 'URL must start with http:// or https://';
        feedback.className = 'feedback error';
        return;
    }
    
    feedback.innerHTML = 'Loading website...';
    feedback.className = 'feedback';
    
    try {
        // Remove any existing image background
        document.body.style.backgroundImage = '';
        localStorage.removeItem(getPageKey('backgroundImage'));
        
        // Set up iframe
        const websiteContainer = document.getElementById('websiteBackground');
        websiteContainer.innerHTML = `<iframe src="${websiteUrl}" sandbox="allow-same-origin allow-scripts"></iframe>`;
        websiteContainer.style.display = 'block';
        
        // Save to localStorage
        localStorage.setItem(getPageKey('websiteBackground'), websiteUrl);
        
        feedback.innerHTML = 'Website background loaded!';
        feedback.className = 'feedback success';
    } catch (error) {
        feedback.innerHTML = 'Error loading website: ' + error.message;
        feedback.className = 'feedback error';
    }
});

// Remove website background
document.getElementById('removeWebsiteBtn').addEventListener('click', function() {
    const feedback = document.getElementById('websiteFeedback');
    
    // Remove website background
    const websiteContainer = document.getElementById('websiteBackground');
    websiteContainer.style.display = 'none';
    websiteContainer.innerHTML = '';
    
    // Remove from localStorage
    localStorage.removeItem(getPageKey('websiteBackground'));
    
    feedback.innerHTML = 'Website background removed';
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
        
        // Save to localStorage with a unique key for this page
        const storageKey = getPageKey('webchatScript');
        localStorage.setItem(storageKey, newScriptHTML);
        console.log('Saved script to:', storageKey, newScriptHTML.substring(0, 50) + '...');
        
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
    const storageKey = getPageKey('backgroundImage');
    const savedBackground = localStorage.getItem(storageKey);
    console.log('Loading background from:', storageKey, savedBackground ? 'Found' : 'Not found');
    
    if (savedBackground) {
        document.body.style.backgroundImage = `url(${savedBackground})`;
    }
}

// Load saved website background
function loadSavedWebsiteBackground() {
    const savedWebsite = localStorage.getItem(getPageKey('websiteBackground'));
    if (savedWebsite) {
        console.log('Loading website background:', savedWebsite);
        
        // Set up iframe
        const websiteContainer = document.getElementById('websiteBackground');
        websiteContainer.innerHTML = `<iframe src="${savedWebsite}" sandbox="allow-same-origin allow-scripts"></iframe>`;
        websiteContainer.style.display = 'block';
        
        // Clear any image background as website takes precedence
        document.body.style.backgroundImage = '';
    }
}

// Load saved script from localStorage
function loadSavedScript() {
    const storageKey = getPageKey('webchatScript');
    const savedScript = localStorage.getItem(storageKey);
    console.log('Loading script from:', storageKey, savedScript ? 'Found' : 'Not found');
    
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
            console.log('Script applied successfully.');
        }
    } else {
        console.log('No saved script found for this page, using default.');
    }
}

// Close modal if clicked outside of content
window.onclick = function(event) {
    if (event.target === scriptModal) {
        scriptModal.style.display = 'none';
    }
};