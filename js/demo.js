// Load saved settings on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, current path:', window.location.pathname);
    loadSavedBackground();
    loadSavedScript();
    loadCurrentScriptToTextarea();
    setupTabs();
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
const imageUpload = document.getElementById('imageUpload');
if (imageUpload) {
    imageUpload.addEventListener('change', function(event) {
        const file = event.target.files[0];
        const feedback = document.getElementById('imageFeedback');
        
        if (!file) return;
        
        // Check if the file is an image
        if (!file.type.match('image.*')) {
            if (feedback) {
                feedback.innerHTML = 'Please select an image file';
                feedback.className = 'feedback error';
            }
            return;
        }
        
        if (feedback) {
            feedback.innerHTML = 'Processing...';
            feedback.className = 'feedback';
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const imageUrl = e.target.result;
            
            // Apply the image background
            document.body.style.backgroundImage = `url(${imageUrl})`;
            
            // Save to localStorage with a unique key for this page
            const storageKey = getPageKey('backgroundImage');
            localStorage.setItem(storageKey, imageUrl);
            console.log('Saved background to:', storageKey);
            
            if (feedback) {
                feedback.innerHTML = 'Background updated successfully!';
                feedback.className = 'feedback success';
            }
        };
        
        reader.onerror = function() {
            if (feedback) {
                feedback.innerHTML = 'Failed to process the image';
                feedback.className = 'feedback error';
            }
        };
        
        reader.readAsDataURL(file);
    });
}

// Reset background to default
const resetBgBtn = document.getElementById('resetBgBtn');
if (resetBgBtn) {
    resetBgBtn.addEventListener('click', function() {
        const feedback = document.getElementById('imageFeedback');
        
        // Remove the background image from localStorage using the page-specific key
        const storageKey = getPageKey('backgroundImage');
        localStorage.removeItem(storageKey);
        console.log('Removed background from:', storageKey);
        
        // Reset the background to default (from CSS)
        document.body.style.backgroundImage = '';
        
        if (feedback) {
            feedback.innerHTML = 'Background reset to default';
            feedback.className = 'feedback success';
        }
    });
}

// Script update functionality
const updateScriptBtn = document.getElementById('updateScriptBtn');
const removeScriptBtn = document.getElementById('removeScriptBtn');
const scriptInput = document.getElementById('scriptInput');
const scriptFeedback = document.getElementById('scriptFeedback');

if (updateScriptBtn && removeScriptBtn && scriptInput && scriptFeedback) {
    // Load current script into textarea
    function loadCurrentScriptToTextarea() {
        const currentScript = document.getElementById('webchatScript');
        scriptInput.value = currentScript ? currentScript.outerHTML : '';
    }
    
    // Update script when button is clicked
    updateScriptBtn.addEventListener('click', function() {
        const newScriptHTML = scriptInput.value.trim();
        
        if (!newScriptHTML) {
            scriptFeedback.innerHTML = 'Please enter a valid script tag';
            scriptFeedback.className = 'feedback error';
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
            const scriptContainer = document.getElementById('scriptContainer');
            if (scriptContainer) {
                scriptContainer.appendChild(newScript);
            }
            
            // Save to localStorage with a unique key for this page
            const storageKey = getPageKey('webchatScript');
            localStorage.setItem(storageKey, newScriptHTML);
            console.log('Saved script to:', storageKey, newScriptHTML.substring(0, 50) + '...');
            
            // Update feedback
            scriptFeedback.innerHTML = 'Script updated successfully!';
            scriptFeedback.className = 'feedback success';
            
        } catch (error) {
            scriptFeedback.innerHTML = 'Failed to update script: ' + error.message;
            scriptFeedback.className = 'feedback error';
        }
    });
    
    // Remove script when button is clicked
    removeScriptBtn.addEventListener('click', function() {
        // Remove old script
        const oldScript = document.getElementById('webchatScript');
        if (oldScript) {
            oldScript.remove();
        }
        
        // Clear textarea
        scriptInput.value = '';
        
        // Remove from localStorage
        localStorage.removeItem(getPageKey('webchatScript'));
        
        // Update feedback
        scriptFeedback.innerHTML = 'Script removed successfully!';
        scriptFeedback.className = 'feedback success';
    });
} else {
    // Define loadCurrentScriptToTextarea as no-op if scriptInput not found
    function loadCurrentScriptToTextarea() {
        return;
    }
}

// Load saved background image from localStorage
function loadSavedBackground() {
    const storageKey = getPageKey('backgroundImage');
    const savedBackground = localStorage.getItem(storageKey);
    console.log('Loading background from:', storageKey, savedBackground ? 'Found' : 'Not found');
    
    if (savedBackground) {
        document.body.style.backgroundImage = `url(${savedBackground})`;
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
            const scriptContainer = document.getElementById('scriptContainer');
            if (scriptContainer) {
                scriptContainer.appendChild(newScript);
                console.log('Script applied successfully.');
            }
        }
    } else {
        console.log('No saved script found for this page, using default.');
    }
}

// New tab system for index page

const teamDemos = [
    { name: 'Corey Reed', path: 'DemoPages/corey-reed/' },
    { name: 'Matt Lambson', path: 'DemoPages/matt-lambson/' },
    { name: 'Nicole Dejidas', path: 'DemoPages/nicole-dejidas/' },
    { name: 'Prasad N', path: 'DemoPages/prasad-n/' },
    { name: 'Ryan Sam', path: 'DemoPages/ryan-sam/' },
    { name: 'Santiago Cortes', path: 'DemoPages/santiago-cortes/' }
];

const toolDemos = [
    { name: 'HALO Router Builder', path: 'DemoPages/router-builder/' }
];

function renderDemos(list) {
    const demoGrid = document.getElementById('demoGrid');
    if (!demoGrid) return;
    demoGrid.innerHTML = '';
    list.forEach(item => {
        const anchor = document.createElement('a');
        anchor.href = item.path;
        anchor.className = 'demo-card';
        anchor.textContent = item.name;
        demoGrid.appendChild(anchor);
    });
}

function setupTabs() {
    const tabTeam = document.getElementById('tab-team');
    const tabTools = document.getElementById('tab-tools');
    if (!tabTeam || !tabTools) return;

    function setActiveTab(which) {
        if (which === 'team') {
            tabTeam.classList.add('active');
            tabTeam.setAttribute('aria-selected', 'true');
            tabTeam.setAttribute('tabindex', '0');

            tabTools.classList.remove('active');
            tabTools.setAttribute('aria-selected', 'false');
            tabTools.setAttribute('tabindex', '-1');

            renderDemos(teamDemos);
        } else if (which === 'tools') {
            tabTools.classList.add('active');
            tabTools.setAttribute('aria-selected', 'true');
            tabTools.setAttribute('tabindex', '0');

            tabTeam.classList.remove('active');
            tabTeam.setAttribute('aria-selected', 'false');
            tabTeam.setAttribute('tabindex', '-1');

            renderDemos(toolDemos);
        }
    }

    function onClickTab(event) {
        if (event.currentTarget === tabTeam) {
            setActiveTab('team');
        } else if (event.currentTarget === tabTools) {
            setActiveTab('tools');
        }
    }

    function onKeyDownTab(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClickTab(event);
        }
    }

    tabTeam.addEventListener('click', onClickTab);
    tabTeam.addEventListener('keydown', onKeyDownTab);

    tabTools.addEventListener('click', onClickTab);
    tabTools.addEventListener('keydown', onKeyDownTab);

    setActiveTab('team');
}