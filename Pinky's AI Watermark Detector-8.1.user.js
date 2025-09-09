// ==UserScript==
// @name         Pinky's AI Watermark Detector - Enhanced
// @namespace    http://tampermonkey.net/
// @version      8.2
// @description  Enhanced watermark detector with detailed stats and LinkedIn compatibility
// @author       @ericpink
// @homepage     https://github.com/misterpinks/Watermarker
// @supportURL   https://github.com/misterpinks/Watermarker/issues
// @updateURL    https://github.com/misterpinks/Watermarker/raw/main/Pinky's%20AI%20Watermark%20Detector-8.2.user.js
// @downloadURL  https://github.com/misterpinks/Watermarker/raw/main/Pinky's%20AI%20Watermark%20Detector-8.2.user.js
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('🔍 Enhanced Watermark Detector Started');

    const watermarkChars = {
        '\u0000': 'Null',
        '\u001E': 'Record Separator',
        '\u001F': 'Unit Separator',
        '\u00A0': 'No-Break Space',
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
        '\u202F': 'Narrow No-Break Space',
        '\u2060': 'Word Joiner',
        '\u2061': 'Function Application (Invisible)',
        '\u2062': 'Invisible Times',
        '\u2063': 'Invisible Separator',
        '\u2064': 'Invisible Plus',
        '\u2066': 'Left-to-Right Isolate',
        '\u2067': 'Right-to-Left Isolate',
        '\u2068': 'First Strong Isolate',
        '\u2069': 'Pop Directional Isolate',
        '\u3000': 'Ideographic Space',
        '\uFE00': 'Variation Selector-1',
        '\u2013': 'En Dash',
        '\u2014': 'Em Dash',
        '\uFEFF': 'Zero Width No-Break Space (BOM)'
    };

    let detectionCount = 0;
    let detectionStats = {};
    let processedNodes = new WeakSet();
    let isProcessing = false;

    // Add enhanced CSS
    function addStyles() {
        const styleId = 'minimal-watermark-css';
        if (document.getElementById(styleId)) return;

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
            }

            .wm-counter:hover {
                background: rgba(255, 0, 0, 0.9) !important;
                opacity: 1 !important;
                transform: scale(1.05) !important;
            }

            .wm-counter.dim {
                opacity: 0.5 !important;
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
        `;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Create enhanced counter with stats popup
    function createCounter() {
        let counter = document.getElementById('wm-counter');
        let statsPopup = document.getElementById('wm-stats-popup');
        
        if (!counter) {
            counter = document.createElement('div');
            counter.id = 'wm-counter';
            counter.className = 'wm-counter';
            counter.title = 'Click to rescan • Hover for details';
            document.body.appendChild(counter);

            // Create stats popup
            statsPopup = document.createElement('div');
            statsPopup.id = 'wm-stats-popup';
            statsPopup.className = 'wm-stats-popup';
            document.body.appendChild(statsPopup);

            // Click handler
            counter.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('🔄 Re-scanning...');
                detectWatermarks();
                const msg = detectionCount > 0 ?
                    `Found ${detectionCount} watermarks` :
                    'No watermarks found';
                setTimeout(() => alert(msg), 100);
            });

            // Hover handlers for stats popup
            let hoverTimeout;
            counter.addEventListener('mouseenter', function() {
                clearTimeout(hoverTimeout);
                hoverTimeout = setTimeout(() => {
                    updateStatsPopup();
                    statsPopup.classList.add('show');
                }, 300);
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
        counter.textContent = detectionCount.toString();

        if (detectionCount === 0) {
            counter.classList.add('dim');
        } else {
            counter.classList.remove('dim');
        }
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

    // Process text and highlight watermarks
    function processText(text) {
        let processedText = text;
        let foundCount = 0;
        const localStats = {};

        for (const [char, name] of Object.entries(watermarkChars)) {
            const regex = new RegExp(char, 'g');
            const matches = text.match(regex);

            if (matches) {
                const count = matches.length;
                foundCount += count;
                localStats[char] = count;
                
                const unicodeCode = 'U+' + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
                const replacement = `<span class="wm-highlight" data-info="${name} (${unicodeCode})" data-original-char="${char}" title="${name} (${unicodeCode})">W</span>`;
                processedText = processedText.replace(regex, replacement);
            }
        }

        return { text: processedText, count: foundCount, stats: localStats };
    }

    // Safer node processing for LinkedIn compatibility
    function isValidTextNode(node) {
        if (!node || !node.parentElement) return false;
        
        const parent = node.parentElement;
        const tagName = parent.tagName;
        
        // Skip script, style, and our own elements
        if (tagName === 'SCRIPT' || tagName === 'STYLE') return false;
        if (parent.classList && (
            parent.classList.contains('wm-highlight') ||
            parent.classList.contains('wm-counter') ||
            parent.classList.contains('wm-stats-popup')
        )) return false;

        // Skip if already processed
        if (processedNodes.has(node)) return false;

        // Skip very dynamic elements that might cause issues
        if (parent.classList && (
            parent.classList.contains('feed-update') ||
            parent.classList.contains('infinite-scroll') ||
            parent.classList.contains('lazy-load')
        )) return false;

        // Only process nodes with actual content
        if (!node.textContent || node.textContent.trim().length === 0) return false;

        return true;
    }

    // Main detection function with improved error handling
    function detectWatermarks() {
        if (isProcessing) {
            console.log('🔄 Detection already in progress, skipping...');
            return;
        }

        isProcessing = true;
        console.log('🔍 Starting detection...');

        try {
            // Clean up existing highlights and restore original characters
            document.querySelectorAll('.wm-highlight').forEach(highlight => {
                try {
                    const parent = highlight.parentNode;
                    const originalChar = highlight.getAttribute('data-original-char') || '';
                    if (parent) {
                        parent.replaceChild(document.createTextNode(originalChar), highlight);
                    }
                } catch (e) {
                    console.warn('Error cleaning highlight:', e);
                }
            });

            // Reset counters
            detectionCount = 0;
            detectionStats = {};
            processedNodes = new WeakSet();

            // Normalize after cleanup
            try {
                document.body.normalize();
            } catch (e) {
                console.warn('Error normalizing document:', e);
            }

            // Get text nodes with better error handling
            const textNodes = [];
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        try {
                            return isValidTextNode(node) ? 
                                NodeFilter.FILTER_ACCEPT : 
                                NodeFilter.FILTER_REJECT;
                        } catch (e) {
                            return NodeFilter.FILTER_REJECT;
                        }
                    }
                }
            );

            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }

            console.log(`📄 Processing ${textNodes.length} text nodes...`);

            // Process nodes with error handling
            let processedCount = 0;
            textNodes.forEach((textNode, index) => {
                try {
                    if (!textNode.parentNode) return; // Node might have been removed

                    const originalText = textNode.textContent;
                    const result = processText(originalText);

                    if (result.count > 0) {
                        detectionCount += result.count;
                        
                        // Update global stats
                        for (const [char, count] of Object.entries(result.stats)) {
                            detectionStats[char] = (detectionStats[char] || 0) + count;
                        }

                        // Replace node with highlighted version
                        const wrapper = document.createElement('span');
                        wrapper.innerHTML = result.text;
                        textNode.parentNode.replaceChild(wrapper, textNode);
                        processedCount++;
                    }

                    // Mark as processed
                    processedNodes.add(textNode);

                } catch (e) {
                    console.warn(`Error processing node ${index}:`, e);
                }
            });

            console.log(`✅ Found ${detectionCount} watermarks in ${processedCount} nodes`);
            if (detectionCount > 0) {
                console.log('📊 Detection breakdown:', detectionStats);
            }

        } catch (e) {
            console.error('❌ Error during detection:', e);
        } finally {
            isProcessing = false;
            createCounter();
        }
    }

    // Debounced detection for dynamic content
    let detectionTimeout;
    function debouncedDetection() {
        clearTimeout(detectionTimeout);
        detectionTimeout = setTimeout(() => {
            if (!isProcessing) {
                detectWatermarks();
            }
        }, 1000);
    }

    // Initialize with better LinkedIn compatibility
    function init() {
        addStyles();
        
        // Initial detection with delay for dynamic content
        setTimeout(detectWatermarks, 1000);

        // Global function for manual testing
        window.testWatermarkDetection = detectWatermarks;

        // Keyboard shortcut
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key === 'W') {
                e.preventDefault();
                detectWatermarks();
            }
        });

        // Optional: Watch for dynamic content changes (disabled by default for LinkedIn)
        // Uncomment if needed, but may cause performance issues
        /*
        const observer = new MutationObserver((mutations) => {
            let shouldRedetect = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    shouldRedetect = true;
                }
            });
            if (shouldRedetect) {
                debouncedDetection();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        */
    }

    // Better initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }

    console.log('🚀 Enhanced Watermark Detector Ready');

})();
