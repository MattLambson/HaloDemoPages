CM.com Demo Gallery
<p align="center">
<img src="img/cm-logo.svg" alt="CM.com Logo" width="200">
</p>

A branded collection of webchat demo pages for the CM.com team. This repository hosts a central gallery page linking to individual demo environments where team members can customize their backgrounds and webchat script implementations.

📋 Overview

This project provides an easy way for team members to:
Access their personal demo environments from a centralized hub
Customize background images for demos
Update webchat script tags with customer-specific implementations
Create consistent and visually appealing demo experiences

✨ Features

Main Gallery
Branded Design: Implements CM.com's official color palette and design language
Search Functionality: Filter demos by team member name

Responsive Layout: Works seamlessly on desktop and mobile devices

Visual Cards: Clean, modern interface for accessing demo environments
Individual Demo Pages

Background Customization: Upload and persist custom background images

Script Management: Update webchat script tags without coding knowledge

Client-Side Storage: Saves settings to browser's localStorage

User-Friendly Controls: Simple side menu for all customization options

🏗️ Project Structure
/
├── index.html                      # Main gallery/landing page
├── css/
│   └── style.css                   # Shared styles for demo pages
├── js/
│   └── demo.js                     # Shared script for demo pages
├── img/
│   ├── cm-logo.svg                 # CM.com logo
│   └── default-bg.jpg              # Default background image
├── DemoPages/
│   ├── adrian-vargas/
│   │   └── index.html              # Adrian's demo page
│   ├── corey-reed/
│   │   └── index.html              # Corey's demo page
│   └── ... (other team members)

For New Team Members
To add a new team member:
    Create a folder in DemoPages/ with their name (kebab-case format)
    Copy the demo page template into this folder as index.html
    Update the name in the page title
    Add the new team member to the demos array in the main index.html

📖 User Guide

Using the Gallery
    Visit the main URL for your GitHub Pages site
    Browse the available demo cards or use the search box to filter by name
    Click on any card to navigate to that team member's demo page

Using a Demo Page
Changing Background Image
    Click the menu toggle (☰) button in the top-left corner
    Under "Background Settings", click the "Choose Image" button
    Select an image file from your device (PNG, JPG, or GIF)
    The background will update immediately and be saved for future visits

Updating Webchat Script
    Click the menu toggle (☰) button in the top-left corner
    Under "Script Settings", click the "Update Web Chat Script" button
    In the modal window, paste the new script tag
    Click "Save Changes"
    The script will update immediately and be saved for future visits

🔧 Technical Details

Browser Storage: Settings are stored in localStorage (5-10MB limit per domain)
No Server Dependencies: Pure client-side implementation
Compatibility: Works in all modern browsers
Brand Colors:
    Purple 100: #6610F2
    Blue 100: #007FFF
    Cyan 100: #04E4F4
    Black 140: #101E1E
    Orange 100: #FFA400

🛠️ Maintenance

To modify the gallery page design, edit index.html
To update shared demo page functionality, edit js/demo.js
To update demo page styling, edit css/style.css

📝 Notes

Background images are stored in each user's browser and are not shared between users
Each demo page has its own localStorage, so settings won't interfere between team members
Large background images may approach localStorage limits (typically 5-10MB)

👥 Team

Adrian Vargas
Corey Reed
David White
Evan Manning
Josh Intagliata
Matt Lambson
Michael Ogorek
Ronnie Jones
Ryan Sherman
Santiago Cortes

Reach out to Matt Lambson if you need any further assistance.