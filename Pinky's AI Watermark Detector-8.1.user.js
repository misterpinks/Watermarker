// ==UserScript==
// @name         Pinky's AI Watermark Detector
// @namespace    http://tampermonkey.net/
// @version      8.1
// @description  Minimal watermark detector with transparent counter - Fixed
// @author       @ericpink
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('🔍 Minimal Watermark Detector Started');

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

    // Add minimal CSS
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
                padding: 4px 8px !important;
                border-radius: 3px !important;
                font-family: Arial, sans-serif !important;
                font-size: 12px !important;
                font-weight: bold !important;
                z-index: 10000 !important;
                cursor: pointer !important;
                border: 1px solid rgba(255, 0, 0, 0.9) !important;
                min-width: 20px !important;
                text-align: center !important;
                user-select: none !important;
                transition: opacity 0.2s ease !important;
            }

            .wm-counter:hover {
                background: rgba(255, 0, 0, 0.9) !important;
                opacity: 1 !important;
            }

            .wm-counter.dim {
                opacity: 0.5 !important;
            }
        `;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Create minimal counter
    function createCounter() {
        let counter = document.getElementById('wm-counter');
        if (!counter) {
            counter = document.createElement('div');
            counter.id = 'wm-counter';
            counter.className = 'wm-counter';
            document.body.appendChild(counter);

            counter.addEventListener('click', function() {
                console.log('🔄 Re-scanning...');
                detectWatermarks();
                const msg = detectionCount > 0 ?
                    `Found ${detectionCount} watermarks` :
                    'No watermarks found';
                setTimeout(() => alert(msg), 100);
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

    // Process text and highlight watermarks
    function processText(text) {
        let processedText = text;
        let foundCount = 0;

        for (const [char, name] of Object.entries(watermarkChars)) {
            const regex = new RegExp(char, 'g');
            const matches = text.match(regex);

            if (matches) {
                foundCount += matches.length;
                const unicodeCode = 'U+' + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
               // const replacement = `<span class="wm-highlight" data-info="${name} (${unicodeCode})" data-original-char="${char}">W</span>`;
                const replacement = `<span class="wm-highlight" data-info="${name} (${unicodeCode})" data-original-char="${char}" title="${name} (${unicodeCode})">W</span>`;
                processedText = processedText.replace(regex, replacement);
            }
        }

        return { text: processedText, count: foundCount };
    }

    // Main detection function
    function detectWatermarks() {
        console.log('🔍 Starting detection...');

        // Clean up existing highlights first - RESTORE original characters
        document.querySelectorAll('.wm-highlight').forEach(highlight => {
            const parent = highlight.parentNode;
            const originalChar = highlight.getAttribute('data-original-char') || '';
            parent.replaceChild(document.createTextNode(originalChar), highlight);
        });
        document.body.normalize();

        detectionCount = 0;

        // Get text nodes
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;

                    const tagName = parent.tagName;
                    if (tagName === 'SCRIPT' || tagName === 'STYLE') {
                        return NodeFilter.FILTER_REJECT;
                    }

                    if (parent.classList && (
                        parent.classList.contains('wm-highlight') ||
                        parent.classList.contains('wm-counter')
                    )) {
                        return NodeFilter.FILTER_REJECT;
                    }

                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        // Process nodes
        textNodes.forEach(textNode => {
            const originalText = textNode.textContent;
            const result = processText(originalText);

            if (result.count > 0) {
                detectionCount += result.count;
                const wrapper = document.createElement('span');
                wrapper.innerHTML = result.text;
                textNode.parentNode.replaceChild(wrapper, textNode);
            }
        });

        console.log(`✅ Found ${detectionCount} watermarks`);
        createCounter();
    }

    // Initialize
    function init() {
        addStyles();
        setTimeout(detectWatermarks, 500);

        window.testWatermarkDetection = detectWatermarks;

        // Keyboard shortcut
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key === 'W') {
                e.preventDefault();
                detectWatermarks();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('🚀 Minimal Watermark Detector Ready');

})();