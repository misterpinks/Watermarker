// ==UserScript==
// @name         Pinky's AI Watermark Detector - Enhanced
// @namespace    http://tampermonkey.net/
// @version      8.3
// @description  Enhanced watermark detector with detailed stats, LinkedIn compatibility, and debug toggle
// @author       @ericpink
// @homepage     https://github.com/misterpinks/Watermarker
// @supportURL   https://github.com/misterpinks/Watermarker/issues
// @updateURL    https://github.com/misterpinks/Watermarker/raw/main/Pinky's%20AI%20Watermark%20Detector-8.3.user.js
// @downloadURL  https://github.com/misterpinks/Watermarker/raw/main/Pinky's%20AI%20Watermark%20Detector-8.3.user.js
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('🔍 Enhanced Watermark Detector Started v8.3');

    // Configuration
    const CONFIG = {
        maxProcessingTime: 5000,
        processingDelay: 100,
        batchSize: 10,
        linkedinSafeMode: window.location.hostname.includes('linkedin.com'),
        debugMode: false // Default off, toggleable via UI
    };

    function debugLog(message, data = null) {
        if (CONFIG.debugMode) {
            console.log(`🔍 DEBUG: ${message}`, data || '');
        }
    }

    // Updated watermark character list with proper escape sequences
    const watermarkChars = {
        '\u0000': 'Null',
        '\u001E': 'Record Separator', 
        '\u001F': 'Unit Separator',
        '\u00A0': 'Non-Breaking Space',  // Fixed - was showing as regular space
        '\u00AD': 'Soft Hyphen',
        '\u200B': 'Zero Width Space',
        '\u200C': 'Zero Width Non-Joiner',
        '\u200D': 'Zero Width Joiner', 
        '\u200E': 'Left-to-Right Mark',
        '\u200F': 'Right-to-Left Mark',
        '\u202A': 'Left-to-Right Embedding',
        '\u202B': 'Right-to-Left Embedding',
        '\u202C': 'Pop Directional Formatting',
        '\u202D': 'Left-to-Right Override',
        '\u202E': 'Right-to-Left Override',
        '\u202F': 'Narrow No-Break Space',  // Fixed detection
        '\u2060': 'Word Joiner',
        '\u2061': 'Function Application (Invisible)',
        '\u2062': 'Invisible Times',
        '\u2063': 'Invisible Separator',
        '\u2064': 'Invisible Plus',
        '\u2066': 'Left-to-Right Isolate',
        '\u2067': 'Right-to-Left Isolate',
        '\u2068': 'First Strong Isolate',
        '\u2069': 'Pop Directional Isolate',
        '\u3000': 'Ideographic Space',      // Fixed detection
        '\uFE00': 'Variation Selector-1',
        '\u2013': 'En Dash',
        '\u2014': 'Em Dash',
        '\uFEFF': 'Zero Width No-Break Space (BOM)'  // Fixed detection
    };

    let detectionCount = 0;
    let detectionStats = {};
    let processedNodes = new WeakSet();
    let isProcessing = false;
    let processingStartTime = 0;

    // Enhanced CSS with debug toggle button
    function addStyles() {
        const styleId = 'watermark-detector-css';
        if (document.getElementById(styleId)) return;

        debugLog('Adding CSS styles');

        const css = `
            .wm-highlight {
                background: #ff3030 !important;
                color: white !important;
                padding: 1px 3px !important;
                border-radius: 2px !important;
                font-size: 10px !important;
                font-weight: bold !important;
                display: inline-block !important;
                min-width: 8px !important;
                text-align: center !important;
                position: relative !important;
                cursor: help !important;
            }

            .wm-highlight:hover::after {
                content: attr(data-info);
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                background: #333;
                color: white;
                padding: 4px 6px;
                border-radius: 3px;
                font-size: 11px;
                white-space: nowrap;
                z-index: 10000;
                pointer-events: none;
                margin-bottom: 2px;
            }

            .wm-counter {
                position: fixed !important;
                top: 10px !important;
                right: 10px !important;
                background: rgba(255, 0, 0, 0.7) !important;
                color: white !important;
                padding: 8px 12px !important;
                border-radius: 6px !important;
                font-family: Arial, sans-serif !important;
                font-size: 12px !important;
                font-weight: bold !important;
                z-index: 10000 !important;
                cursor: pointer !important;
                border: 1px solid rgba(255, 0, 0, 0.9) !important;
                min-width: 20px !important;
                text-align: center !important;
                user-select: none !important;
                transition: all 0.2s ease !important;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important;
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
            }

            .wm-counter:hover {
                background: rgba(255, 0, 0, 0.9) !important;
                opacity: 1 !important;
                transform: scale(1.05) !important;
            }

            .wm-counter.dim {
                opacity: 0.5 !important;
            }

            .wm-counter.debug-mode {
                border: 2px solid #00ff00 !important;
                box-shadow: 0 0 8px rgba(0,255,0,0.3) !important;
            }

            .wm-debug-toggle {
                background: rgba(0, 255, 0, 0.8) !important;
                border: none !important;
                border-radius: 3px !important;
                color: black !important;
                font-size: 8px !important;
                font-weight: bold !important;
                padding: 2px 4px !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                min-width: 15px !important;
                height: 15px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }

            .wm-debug-toggle:hover {
                background: rgba(0, 255, 0, 1) !important;
                transform: scale(1.1) !important;
            }

            .wm-debug-toggle.active {
                background: rgba(255, 255, 0, 0.9) !important;
                color: black !important;
            }

            .wm-stats-popup {
                position: fixed !important;
                top: 50px !important;
                right: 10px !important;
                background: rgba(40, 40, 40, 0.95) !important;
                color: white !important;
                padding: 12px !important;
                border-radius: 6px !important;
                font-family: Arial, sans-serif !important;
                font-size: 11px !important;
                z-index: 10001 !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
                border: 1px solid rgba(255, 255, 255, 0.2) !important;
                max-width: 300px !important;
                min-width: 200px !important;
                pointer-events: none !important;
                opacity: 0 !important;
                transform: translateY(-10px) !important;
                transition: all 0.2s ease !important;
            }

            .wm-stats-popup.show {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }

            .wm-stats-header {
                font-weight: bold !important;
                margin-bottom: 8px !important;
                color: #ff6b6b !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
                padding-bottom: 4px !important;
            }

            .wm-stats-item {
                display: flex !important;
                justify-content: space-between !important;
                margin: 4px 0 !important;
                padding: 2px 0 !important;
            }

            .wm-stats-char {
                font-family: monospace !important;
                background: rgba(255, 255, 255, 0.1) !important;
                padding: 1px 4px !important;
                border-radius: 2px !important;
                margin-right: 8px !important;
            }

            .wm-stats-count {
                color: #ffeb3b !important;
                font-weight: bold !important;
            }

            .wm-debug-info {
                position: fixed !important;
                top: 50px !important;
                right: 10px !important;
                background: rgba(0, 0, 0, 0.9) !important;
                color: #00ff00 !important;
                padding: 8px !important;
                border-radius: 4px !important;
                font-family: monospace !important;
                font-size: 10px !important;
                z-index: 9999 !important;
                max-width: 300px !important;
                white-space: pre-wrap !important;
                opacity: 0 !important;
                transform: translateY(-10px) !important;
                transition: all 0.2s ease !important;
            }

            .wm-debug-info.show {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        `;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
        
        debugLog('CSS styles added successfully');
    }

    // Create enhanced counter with debug toggle
    function createCounter() {
        debugLog('Creating/updating counter');

        let counter = document.getElementById('wm-counter');
        let debugToggle = document.getElementById('wm-debug-toggle');
        let statsPopup = document.getElementById('wm-stats-popup');
        let debugInfo = document.getElementById('wm-debug-info');
        
        if (!counter) {
            counter = document.createElement('div');
            counter.id = 'wm-counter';
            counter.className = 'wm-counter';
            counter.title = 'Click to rescan • Hover for details';
            document.body.appendChild(counter);

            // Create debug toggle button
            debugToggle = document.createElement('button');
            debugToggle.id = 'wm-debug-toggle';
            debugToggle.className = 'wm-debug-toggle';
            debugToggle.textContent = 'D';
            debugToggle.title = 'Toggle Debug Mode';
            counter.appendChild(debugToggle);

            // Create count display
            const countDisplay = document.createElement('span');
            countDisplay.id = 'wm-count-display';
            counter.appendChild(countDisplay);

            // Create stats popup
            statsPopup = document.createElement('div');
            statsPopup.id = 'wm-stats-popup';
            statsPopup.className = 'wm-stats-popup';
            document.body.appendChild(statsPopup);

            // Create debug info panel
            debugInfo = document.createElement('div');
            debugInfo.id = 'wm-debug-info';
            debugInfo.className = 'wm-debug-info';
            document.body.appendChild(debugInfo);

            // Debug toggle handler
            debugToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                CONFIG.debugMode = !CONFIG.debugMode;
                debugToggle.classList.toggle('active', CONFIG.debugMode);
                counter.classList.toggle('debug-mode', CONFIG.debugMode);
                
                if (CONFIG.debugMode) {
                    console.log('🔍 DEBUG MODE ENABLED');
                    debugLog('Debug mode activated');
                    updateDebugInfo();
                    debugInfo.classList.add('show');
                } else {
                    console.log('🔍 DEBUG MODE DISABLED');
                    debugInfo.classList.remove('show');
                }
            });

            // Main counter click handler
            counter.addEventListener('click', function(e) {
                if (e.target === debugToggle) return; // Don't trigger if clicking debug button
                
                e.stopPropagation();
                debugLog('Manual rescan triggered');
                detectWatermarks();
            });

            // Hover handlers for stats popup
            let hoverTimeout;
            counter.addEventListener('mouseenter', function() {
                if (!CONFIG.debugMode) { // Only show stats popup when not in debug mode
                    clearTimeout(hoverTimeout);
                    hoverTimeout = setTimeout(() => {
                        updateStatsPopup();
                        statsPopup.classList.add('show');
                    }, 300);
                }
            });

            counter.addEventListener('mouseleave', function() {
                clearTimeout(hoverTimeout);
                hoverTimeout = setTimeout(() => {
                    statsPopup.classList.remove('show');
                }, 100);
            });

            // Keep popup visible when hovering over it
            statsPopup.addEventListener('mouseenter', function() {
                clearTimeout(hoverTimeout);
                statsPopup.classList.add('show');
            });

            statsPopup.addEventListener('mouseleave', function() {
                hoverTimeout = setTimeout(() => {
                    statsPopup.classList.remove('show');
                }, 200);
            });
        }

        // Update counter display
        const countDisplay = document.getElementById('wm-count-display');
        if (countDisplay) {
            countDisplay.textContent = detectionCount.toString();
        }

        // Update debug toggle state
        if (debugToggle) {
            debugToggle.classList.toggle('active', CONFIG.debugMode);
        }

        // Update counter appearance
        counter.classList.toggle('dim', detectionCount === 0);
        counter.classList.toggle('debug-mode', CONFIG.debugMode);

        // Update debug info if in debug mode
        if (CONFIG.debugMode) {
            updateDebugInfo();
            debugInfo.classList.add('show');
        } else {
            debugInfo.classList.remove('show');
        }

        debugLog('Counter updated', { count: detectionCount, debugMode: CONFIG.debugMode });
    }

    // Update stats popup content
    function updateStatsPopup() {
        const statsPopup = document.getElementById('wm-stats-popup');
        if (!statsPopup) return;

        if (detectionCount === 0) {
            statsPopup.innerHTML = `
                <div class="wm-stats-header">No Watermarks Found</div>
                <div style="color: #888; font-style: italic;">Page appears clean</div>
            `;
            return;
        }

        let content = `<div class="wm-stats-header">Watermarks Detected: ${detectionCount}</div>`;
        
        // Sort by count (descending)
        const sortedStats = Object.entries(detectionStats)
            .sort(([,a], [,b]) => b - a);

        sortedStats.forEach(([char, count]) => {
            const name = watermarkChars[char] || 'Unknown';
            const unicodeCode = 'U+' + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
            
            content += `
                <div class="wm-stats-item">
                    <div>
                        <span class="wm-stats-char">${unicodeCode}</span>
                        <span>${name}</span>
                    </div>
                    <span class="wm-stats-count">${count}</span>
                </div>
            `;
        });

        statsPopup.innerHTML = content;
    }

    // Update debug info panel
    function updateDebugInfo() {
        const debugInfo = document.getElementById('wm-debug-info');
        if (!debugInfo || !CONFIG.debugMode) return;

        const debugText = `LinkedIn Safe: ${CONFIG.linkedinSafeMode}
Processing: ${isProcessing}
Nodes Processed: ${processedNodes.size || 0}
Time: ${processingStartTime ? (Date.now() - processingStartTime) + 'ms' : 'N/A'}
URL: ${window.location.hostname}
Debug: ON`;

        debugInfo.textContent = debugText;
    }

    // Safe node validation
    function isValidTextNode(node) {
        try {
            if (!node || !node.parentElement) {
                debugLog('Invalid node: no parent element');
                return false;
            }
            
            const parent = node.parentElement;
            const tagName = parent.tagName;
            
            // Skip our own elements and scripts/styles
            if (tagName === 'SCRIPT' || tagName === 'STYLE') {
                debugLog('Skipping script/style node');
                return false;
            }

            if (parent.classList && (
                parent.classList.contains('wm-highlight') ||
                parent.classList.contains('wm-counter') ||
                parent.classList.contains('wm-stats-popup') ||
                parent.classList.contains('wm-debug-info')
            )) {
                debugLog('Skipping our own elements');
                return false;
            }

            // LinkedIn-specific safety checks
            if (CONFIG.linkedinSafeMode) {
                if (parent.classList && (
                    parent.classList.contains('feed-shared-update-v2') ||
                    parent.classList.contains('scaffold-layout') ||
                    parent.classList.contains('ember-view') ||
                    parent.classList.contains('artdeco-') ||
                    parent.className.includes('linkedin') ||
                    parent.className.includes('voyager') ||
                    parent.className.includes('lazy-load') ||
                    parent.className.includes('infinite-scroll')
                )) {
                    debugLog('Skipping LinkedIn dynamic element', parent.className);
                    return false;
                }

                if (parent.hasAttribute('data-test-id') ||
                    parent.hasAttribute('data-automation-id') ||
                    parent.hasAttribute('data-finite-scroll-hotkey-item')) {
                    debugLog('Skipping LinkedIn attributed element');
                    return false;
                }
            }

            // Skip if already processed
            if (processedNodes.has(node)) {
                debugLog('Node already processed');
                return false;
            }

            // Only process nodes with actual content
            if (!node.textContent || node.textContent.trim().length === 0) {
                debugLog('Skipping empty node');
                return false;
            }

            // Skip very large text nodes
            if (node.textContent.length > 10000) {
                debugLog('Skipping large text node', node.textContent.length);
                return false;
            }

            return true;

        } catch (error) {
            debugLog('Error in isValidTextNode', error.message);
            return false;
        }
    }

    // Enhanced text processing with better character detection
    function processText(text) {
        try {
            let processedText = text;
            let foundCount = 0;
            const localStats = {};

            // Process each watermark character
            for (const [char, name] of Object.entries(watermarkChars)) {
                try {
                    // Create more robust regex patterns
                    let regex;
                    
                    // Special handling for problematic characters
                    switch (char) {
                        case '\u00A0': // Non-breaking space
                        case '\u202F': // Narrow no-break space  
                        case '\u3000': // Ideographic space
                        case '\uFEFF': // BOM
                            // Use explicit character matching for these
                            regex = new RegExp('[' + char + ']', 'g');
                            break;
                        default:
                            // Standard regex for other characters
                            regex = new RegExp(char, 'g');
                            break;
                    }
                    
                    const matches = text.match(regex);

                    if (matches) {
                        const count = matches.length;
                        foundCount += count;
                        localStats[char] = count;
                        
                        debugLog(`Found ${count} instances of ${name} (${char.charCodeAt(0).toString(16)})`);
                        
                        const unicodeCode = 'U+' + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
                        const replacement = `<span class="wm-highlight" data-info="${name} (${unicodeCode})" data-original-char="${char}" title="${name} (${unicodeCode})">W</span>`;
                        processedText = processedText.replace(regex, replacement);
                    }
                } catch (charError) {
                    debugLog('Error processing character', { char, error: charError.message });
                }
            }

            return { text: processedText, count: foundCount, stats: localStats };

        } catch (error) {
            debugLog('Error in processText', error.message);
            return { text: text, count: 0, stats: {} };
        }
    }

    // Batch processing
    async function processBatch(nodes, startIndex, batchSize) {
        const endIndex = Math.min(startIndex + batchSize, nodes.length);
        debugLog(`Processing batch ${startIndex}-${endIndex} of ${nodes.length}`);

        let batchCount = 0;
        const batchStats = {};

        for (let i = startIndex; i < endIndex; i++) {
            // Check time limit
            if (Date.now() - processingStartTime > CONFIG.maxProcessingTime) {
                debugLog('Time limit reached, stopping processing');
                return { count: batchCount, stats: batchStats, stopped: true };
            }

            try {
                const textNode = nodes[i];
                
                if (!textNode.parentNode) {
                    debugLog('Node removed during processing', i);
                    continue;
                }

                const originalText = textNode.textContent;
                const result = processText(originalText);

                if (result.count > 0) {
                    batchCount += result.count;
                    
                    // Update batch stats
                    for (const [char, count] of Object.entries(result.stats)) {
                        batchStats[char] = (batchStats[char] || 0) + count;
                    }

                    // Replace node with highlighted version
                    const wrapper = document.createElement('span');
                    wrapper.innerHTML = result.text;
                    textNode.parentNode.replaceChild(wrapper, textNode);
                }

                // Mark as processed
                processedNodes.add(textNode);

            } catch (nodeError) {
                debugLog('Error processing node', { index: i, error: nodeError.message });
            }
        }

        return { count: batchCount, stats: batchStats, stopped: false };
    }

    // Main detection function
    async function detectWatermarks() {
        if (isProcessing) {
            debugLog('Detection already in progress, skipping');
            return;
        }

        isProcessing = true;
        processingStartTime = Date.now();
        debugLog('Starting watermark detection', { 
            url: window.location.href, 
            linkedinMode: CONFIG.linkedinSafeMode 
        });

        try {
            // Clean up existing highlights
            debugLog('Cleaning up existing highlights');
            document.querySelectorAll('.wm-highlight').forEach(highlight => {
                try {
                    const parent = highlight.parentNode;
                    const originalChar = highlight.getAttribute('data-original-char') || '';
                    if (parent) {
                        parent.replaceChild(document.createTextNode(originalChar), highlight);
                    }
                } catch (cleanupError) {
                    debugLog('Error during cleanup', cleanupError.message);
                }
            });

            // Reset counters
            detectionCount = 0;
            detectionStats = {};
            processedNodes = new WeakSet();

            // Normalize document
            try {
                document.body.normalize();
            } catch (e) {
                debugLog('Error normalizing document', e.message);
            }

            // Get text nodes
            debugLog('Finding text nodes');
            const textNodes = [];
            
            try {
                const walker = document.createTreeWalker(
                    document.body,
                    NodeFilter.SHOW_TEXT,
                    {
                        acceptNode: function(node) {
                            try {
                                return isValidTextNode(node) ? 
                                    NodeFilter.FILTER_ACCEPT : 
                                    NodeFilter.FILTER_REJECT;
                            } catch (walkerError) {
                                debugLog('Error in walker acceptNode', walkerError.message);
                                return NodeFilter.FILTER_REJECT;
                            }
                        }
                    }
                );

                let node;
                while (node = walker.nextNode()) {
                    textNodes.push(node);
                    
                    // Safety limit for LinkedIn
                    if (CONFIG.linkedinSafeMode && textNodes.length > 1000) {
                        debugLog('Reached LinkedIn safety limit for text nodes');
                        break;
                    }
                }
            } catch (walkerError) {
                debugLog('Error creating walker', walkerError.message);
                return;
            }

            debugLog(`Found ${textNodes.length} text nodes to process`);

            // Process in batches
            let currentIndex = 0;
            while (currentIndex < textNodes.length) {
                const result = await processBatch(textNodes, currentIndex, CONFIG.batchSize);
                
                detectionCount += result.count;
                
                // Update global stats
                for (const [char, count] of Object.entries(result.stats)) {
                    detectionStats[char] = (detectionStats[char] || 0) + count;
                }

                if (result.stopped) {
                    debugLog('Processing stopped due to time limit');
                    break;
                }

                currentIndex += CONFIG.batchSize;

                // Add delay between batches for LinkedIn
                if (CONFIG.linkedinSafeMode && currentIndex < textNodes.length) {
                    debugLog('Waiting between batches...');
                    await new Promise(resolve => setTimeout(resolve, CONFIG.processingDelay));
                }

                // Update UI during processing
                createCounter();
            }

            const processingTime = Date.now() - processingStartTime;
            debugLog(`Detection complete`, { 
                count: detectionCount, 
                time: processingTime + 'ms',
                stats: detectionStats 
            });

            if (CONFIG.debugMode && detectionCount > 0) {
                console.log('📊 Watermark breakdown:', detectionStats);
            }

        } catch (error) {
            debugLog('Critical error during detection', error.message);
            console.error('Watermark detection error:', error);
        } finally {
            isProcessing = false;
            createCounter();
        }
    }

    // Initialize
    function init() {
        try {
            debugLog('Initializing watermark detector');
            
            addStyles();
            
            // Longer delay for LinkedIn
            const initDelay = CONFIG.linkedinSafeMode ? 3000 : 1000;
            debugLog(`Scheduling initial detection in ${initDelay}ms`);
            
            setTimeout(() => {
                debugLog('Running initial detection');
                detectWatermarks();
            }, initDelay);

            // Global functions for testing
            window.testWatermarkDetection = detectWatermarks;
            window.toggleWatermarkDebug = () => {
                const debugToggle = document.getElementById('wm-debug-toggle');
                if (debugToggle) debugToggle.click();
            };

            // Keyboard shortcut
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.shiftKey && e.key === 'W') {
                    e.preventDefault();
                    debugLog('Keyboard shortcut triggered');
                    detectWatermarks();
                }
            });

            debugLog('Initialization complete');

        } catch (error) {
            debugLog('Error during initialization', error.message);
            console.error('Watermark detector init error:', error);
        }
    }

    // Safe startup
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 500);
    }

    debugLog('Enhanced watermark detector loaded');

})();
