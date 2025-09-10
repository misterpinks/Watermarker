// ==UserScript==
// @name         Pinky's AI Watermark Detector - Enhanced with Image Detection
// @namespace    http://tampermonkey.net/
// @version      8.4
// @description  Enhanced watermark detector with image detection, detailed stats, LinkedIn compatibility, and debug toggle
// @author       @ericpink
// @homepage     https://github.com/misterpinks/Watermarker
// @supportURL   https://github.com/misterpinks/Watermarker/issues
// @updateURL    https://github.com/misterpinks/Watermarker/raw/main/Pinky's%20AI%20Watermark%20Detector-8.4.user.js
// @downloadURL  https://github.com/misterpinks/Watermarker/raw/main/Pinky's%20AI%20Watermark%20Detector-8.4.user.js
// @match        file:///*
// @match        *://*/*
// @match        chrome-extension://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('🔍 Enhanced Watermark Detector Started v8.4 (with Image Detection)');

    // Configuration
    const CONFIG = {
        maxProcessingTime: 5000,
        processingDelay: 100,
        batchSize: 10,
        linkedinSafeMode: window.location.hostname.includes('linkedin.com'),
        debugMode: false,
        isPDFContext: false,
        enableImageDetection: true
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
        '\u00A0': 'Non-Breaking Space',
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
    let imageWatermarkCount = 0;
    let detectionStats = {};
    let suspiciousImages = [];
    let processedNodes = new WeakSet();
    let isProcessing = false;
    let processingStartTime = 0;

    // PDF Detection Functions
    function detectPDFContext() {
        const isPDF = window.location.href.toLowerCase().includes('.pdf') ||
                      document.querySelector('embed[type="application/pdf"]') ||
                      document.querySelector('object[type="application/pdf"]') ||
                      document.querySelector('iframe[src*=".pdf"]') ||
                      document.title.toLowerCase().includes('.pdf');

        if (isPDF) {
            CONFIG.isPDFContext = true;
            debugLog('PDF context detected');
            return true;
        }
        return false;
    }

    function extractFileName(url) {
        try {
            const parts = url.split('/');
            const fileName = parts[parts.length - 1];
            return decodeURIComponent(fileName) || 'document.pdf';
        } catch (e) {
            return 'document.pdf';
        }
    }

    // Enhanced CSS with PDF-specific styles and image detection
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

            .wm-highlight.image-marker {
                background: #ff8c00 !important;
                color: white !important;
                font-size: 8px !important;
                padding: 1px 2px !important;
                margin-left: 2px !important;
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

            .wm-suspicious-image {
                border: 2px solid #ff8c00 !important;
                box-shadow: 0 0 8px rgba(255, 140, 0, 0.5) !important;
                position: relative !important;
            }

            .wm-suspicious-image::before {
                content: "🖼️";
                position: absolute !important;
                top: -8px !important;
                right: -8px !important;
                background: #ff8c00 !important;
                color: white !important;
                border-radius: 50% !important;
                width: 16px !important;
                height: 16px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 8px !important;
                z-index: 1000 !important;
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

            .wm-counter.pdf-mode {
                background: rgba(255, 140, 0, 0.8) !important;
                border: 1px solid rgba(255, 140, 0, 0.9) !important;
                animation: pdf-pulse 2s ease-in-out infinite !important;
            }

            @keyframes pdf-pulse {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 1; }
            }

            .wm-counter:hover {
                background: rgba(255, 0, 0, 0.9) !important;
                opacity: 1 !important;
                transform: scale(1.05) !important;
            }

            .wm-counter.pdf-mode:hover {
                background: rgba(255, 140, 0, 1) !important;
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
                max-width: 350px !important;
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

            .wm-stats-popup.pdf-mode {
                background: rgba(255, 140, 0, 0.95) !important;
                border: 1px solid rgba(255, 140, 0, 0.3) !important;
                pointer-events: auto !important;
            }

            .wm-stats-header {
                font-weight: bold !important;
                margin-bottom: 8px !important;
                color: #ff6b6b !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
                padding-bottom: 4px !important;
            }

            .wm-stats-header.pdf-mode {
                color: #fff3cd !important;
            }

            .wm-stats-section {
                margin: 8px 0 !important;
                padding: 4px 0 !important;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
            }

            .wm-stats-section:last-child {
                border-bottom: none !important;
            }

            .wm-stats-section-title {
                font-weight: bold !important;
                color: #ffa500 !important;
                font-size: 10px !important;
                margin-bottom: 4px !important;
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

            .wm-image-list {
                max-height: 150px !important;
                overflow-y: auto !important;
                font-size: 9px !important;
                margin-top: 4px !important;
            }

            .wm-image-item {
                display: block !important;
                margin: 2px 0 !important;
                padding: 2px 4px !important;
                background: rgba(255, 255, 255, 0.1) !important;
                border-radius: 2px !important;
                word-break: break-all !important;
            }

            .wm-pdf-button {
                background: rgba(255, 255, 255, 0.9) !important;
                border: none !important;
                padding: 6px 12px !important;
                border-radius: 4px !important;
                cursor: pointer !important;
                font-size: 10px !important;
                font-weight: bold !important;
                color: #333 !important;
                margin: 4px 4px 4px 0 !important;
                transition: all 0.2s ease !important;
                display: inline-block !important;
            }

            .wm-pdf-button:hover {
                background: rgba(255, 255, 255, 1) !important;
                transform: scale(1.05) !important;
            }

            .wm-pdf-button.secondary {
                background: rgba(255, 255, 255, 0.2) !important;
                border: 1px solid rgba(255, 255, 255, 0.3) !important;
                color: white !important;
            }

            .wm-pdf-button.secondary:hover {
                background: rgba(255, 255, 255, 0.3) !important;
            }

            .wm-pdf-instructions {
                margin: 8px 0 !important;
                font-size: 10px !important;
                line-height: 1.4 !important;
                color: rgba(255, 255, 255, 0.9) !important;
            }

            .wm-pdf-tip {
                margin-top: 10px !important;
                padding-top: 8px !important;
                border-top: 1px solid rgba(255, 255, 255, 0.2) !important;
                font-size: 9px !important;
                color: rgba(255, 255, 255, 0.7) !important;
                font-style: italic !important;
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

    // Image watermark detection functions
    function isLikelyWatermarkImage(img) {
        const src = img.src || img.getAttribute('src') || '';
        const alt = img.alt || '';
        const width = img.width || img.naturalWidth || 0;
        const height = img.height || img.naturalHeight || 0;
        const className = img.className || '';

        // Suspicious filename patterns
        const suspiciousPatterns = [
            /bull?\.png/i,           // Like Qantas "bull.png"
            /bullet/i,
            /dot\.png/i,
            /marker\.png/i,
            /point\.png/i,
            /list\.png/i,
            /item\.png/i,
            /dash\.png/i,
            /separator\.png/i
        ];

        // Size-based detection (bullets are typically small)
        const isSmallImage = (width > 0 && width < 50) && (height > 0 && height < 50);
        
        // Very tiny images (likely decorative/functional)
        const isTinyImage = (width > 0 && width < 20) && (height > 0 && height < 20);

        // Pattern matching
        const hasWatermarkPattern = suspiciousPatterns.some(pattern => 
            pattern.test(src) || pattern.test(alt) || pattern.test(className)
        );

        // Context-based detection
        const isInListContext = img.closest('li, ul, ol') !== null;
        const hasListRole = img.getAttribute('role') === 'presentation' || 
                           img.getAttribute('role') === 'img';
        
        // Check if image is used as bullet replacement
        const isInlineWithText = img.parentElement && 
                                img.parentElement.textContent.trim().length > 0;

        // Check for CSS that suggests bullet usage
        const computedStyle = window.getComputedStyle(img);
        const isFloated = computedStyle.float !== 'none';
        const isPositioned = computedStyle.position === 'absolute' || 
                            computedStyle.position === 'relative';

        return (
            (isTinyImage && hasWatermarkPattern) ||
            (isSmallImage && isInListContext) ||
            (hasWatermarkPattern && (hasListRole || isInlineWithText)) ||
            (isTinyImage && isInListContext) ||
            (isTinyImage && (isFloated || isPositioned))
        );
    }

    async function analyzeImageMetadata(img) {
        try {
            const src = img.src;
            if (!src || src.startsWith('data:')) return null;

            // Try to get file size via fetch
            try {
                const response = await fetch(src, { method: 'HEAD' });
                const contentLength = response.headers.get('content-length');
                
                if (contentLength) {
                    const size = parseInt(contentLength);
                    
                    // Flag unusually large files for simple graphics
                    if (size > 50000) { // 50KB+ for a small graphic is suspicious
                        debugLog(`Large file detected: ${src} (${(size/1024).toFixed(1)}KB)`);
                        return {
                            suspiciousSize: true,
                            size: size,
                            reason: `Unusually large: ${(size/1024).toFixed(1)}KB`
                        };
                    }
                }
            } catch (fetchError) {
                debugLog('Could not fetch image metadata', fetchError.message);
            }

        } catch (error) {
            debugLog('Error analyzing image metadata', error.message);
        }
        
        return null;
    }

    function highlightSuspiciousImage(img, reason = 'Suspicious image detected') {
        img.classList.add('wm-suspicious-image');
        
        const originalTitle = img.title || '';
        img.title = `${reason} - ${img.src}${originalTitle ? ` | ${originalTitle}` : ''}`;
        
        // Add a marker element
        const marker = document.createElement('span');
        marker.className = 'wm-highlight image-marker';
        marker.textContent = 'IMG';
        marker.setAttribute('data-info', reason);
        
        // Insert marker after the image
        if (img.parentNode) {
            img.parentNode.insertBefore(marker, img.nextSibling);
        }
        
        debugLog('Image highlighted', { src: img.src, reason });
    }

    async function detectImageWatermarks() {
        if (!CONFIG.enableImageDetection) {
            debugLog('Image detection disabled');
            return { count: 0, images: [] };
        }

        debugLog('Starting image watermark detection');
        
        const images = document.querySelectorAll('img, svg use[href*=".png"], svg use[href*=".svg"]');
        let imageCount = 0;
        const foundImages = [];
        
        for (const img of images) {
            try {
                // Skip our own elements
                if (img.classList.contains('wm-suspicious-image') ||
                    img.closest('.wm-counter') ||
                    img.closest('.wm-stats-popup')) {
                    continue;
                }

                if (isLikelyWatermarkImage(img)) {
                    imageCount++;
                    foundImages.push(img);
                    
                    let reason = 'Suspicious image pattern';
                    
                    // Analyze metadata for additional context
                    const metadata = await analyzeImageMetadata(img);
                    if (metadata && metadata.suspiciousSize) {
                        reason = metadata.reason;
                    }
                    
                    highlightSuspiciousImage(img, reason);
                    
                    debugLog('Suspicious image found', {
                        src: img.src,
                        alt: img.alt,
                        size: `${img.width}x${img.height}`,
                        reason
                    });
                }
            } catch (error) {
                debugLog('Error analyzing image', error.message);
            }
        }
        
        debugLog(`Image detection complete: ${imageCount} suspicious images found`);
        return { count: imageCount, images: foundImages };
    }

    // PDF-specific popup creation
    function createPDFPopup() {
        const fileName = extractFileName(window.location.href);

        return `
            <div class="wm-stats-header pdf-mode">
                📄 PDF Detected: ${fileName}
            </div>
            <div class="wm-pdf-instructions">
                Chrome's PDF viewer limits watermark detection. For comprehensive analysis:
            </div>
            <div>
                <button class="wm-pdf-button" onclick="window.downloadCurrentPDF()">
                    📥 Download PDF
                </button>
                <button class="wm-pdf-button secondary" onclick="window.tryPDFAnalysis()">
                    🔍 Limited Scan
                </button>
            </div>
            <div class="wm-pdf-instructions">
                <strong>Alternative options:</strong><br>
                • Use Firefox (has PDF.js built-in)<br>
                • Install PDF.js extension for Chrome<br>
                • Open with: <code>mozilla.github.io/pdf.js</code>
            </div>
            <div class="wm-pdf-tip">
                💡 PDF.js-based viewers expose text layers for full watermark detection
            </div>
        `;
    }

    // Enhanced counter creation with PDF support
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
            counter.title = CONFIG.isPDFContext ?
                'PDF Mode - Click for options • Limited detection capability' :
                'Click to rescan • Hover for details';
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
                if (e.target === debugToggle) return;

                e.stopPropagation();

                if (CONFIG.isPDFContext) {
                    debugLog('PDF counter clicked - showing options');
                    showPDFPopup();
                } else {
                    debugLog('Manual rescan triggered');
                    detectWatermarks();
                }
            });

            // Hover handlers for stats popup (only for non-PDF mode)
            if (!CONFIG.isPDFContext) {
                let hoverTimeout;
                counter.addEventListener('mouseenter', function() {
                    if (!CONFIG.debugMode) {
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
        }

        // Update counter display and appearance
        const countDisplay = document.getElementById('wm-count-display');
        if (countDisplay) {
            if (CONFIG.isPDFContext) {
                countDisplay.textContent = 'PDF';
                countDisplay.style.fontSize = '9px';
            } else {
                const totalCount = detectionCount + imageWatermarkCount;
                countDisplay.textContent = totalCount.toString();
                countDisplay.style.fontSize = '12px';
            }
        }

        // Update counter styling based on context
        counter.classList.toggle('pdf-mode', CONFIG.isPDFContext);
        counter.classList.toggle('dim', !CONFIG.isPDFContext && (detectionCount + imageWatermarkCount) === 0);
        counter.classList.toggle('debug-mode', CONFIG.debugMode);

        // Update debug toggle state
        if (debugToggle) {
            debugToggle.classList.toggle('active', CONFIG.debugMode);
        }

        // Update debug info if in debug mode
        if (CONFIG.debugMode) {
            updateDebugInfo();
            debugInfo.classList.add('show');
        } else {
            debugInfo.classList.remove('show');
        }

        debugLog('Counter updated', {
            textCount: detectionCount,
            imageCount: imageWatermarkCount,
            debugMode: CONFIG.debugMode,
            pdfMode: CONFIG.isPDFContext
        });
    }

    // Show PDF options popup
    function showPDFPopup() {
        const statsPopup = document.getElementById('wm-stats-popup');
        if (!statsPopup) return;

        statsPopup.className = 'wm-stats-popup pdf-mode show';
        statsPopup.innerHTML = createPDFPopup();

        // Auto-hide after 15 seconds
        setTimeout(() => {
            if (statsPopup.classList.contains('pdf-mode')) {
                statsPopup.classList.remove('show');
            }
        }, 15000);
    }

    // PDF utility functions (exposed globally)
    window.downloadCurrentPDF = function() {
        const url = window.location.href;
        const fileName = extractFileName(url);

        try {
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            debugLog('PDF download initiated');

            setTimeout(() => {
                alert(`📥 Download initiated!\n\nNext steps for watermark analysis:\n1. Open downloaded PDF in a text editor\n2. Use a PDF.js-based viewer\n3. Try Firefox for built-in PDF.js support\n\nLook for invisible Unicode characters in the text.`);
            }, 1000);
        } catch (error) {
            alert('Download failed. Try right-clicking and "Save as..."');
            debugLog('Download error', error.message);
        }
    };

    window.tryPDFAnalysis = function() {
        debugLog('Attempting limited PDF analysis');

        // Try to extract any accessible text from the page
        const allText = document.body ? document.body.textContent : '';
        const cleanText = allText.replace(/D0\s*No Watermarks Found[\s\S]*?Debug: ON/g, '').trim();

        if (cleanText.length > 20) {
            const result = processText(cleanText);

            if (result.count > 0) {
                alert(`🔍 Limited scan found ${result.count} potential watermark characters!\n\n⚠️ Note: This includes UI elements and may have false positives.\n\nFor accurate results, use a PDF.js-based viewer.`);
            } else {
                alert(`🔍 No watermarks detected in accessible content.\n\n⚠️ Important: Chrome's viewer limits access to actual PDF text.\n\nThis doesn't mean the PDF is clean - use PDF.js for comprehensive scanning.`);
            }
        } else {
            alert(`🔍 No accessible text content found.\n\nChrome's PDF viewer completely isolates the PDF content from JavaScript.\n\nRecommended: Use Firefox or PDF.js extension for proper detection.`);
        }
    };

    // Update stats popup content with image detection
    function updateStatsPopup() {
        const statsPopup = document.getElementById('wm-stats-popup');
        if (!statsPopup || CONFIG.isPDFContext) return;

        const totalCount = detectionCount + imageWatermarkCount;

        if (totalCount === 0) {
            statsPopup.innerHTML = `
                <div class="wm-stats-header">No Watermarks Found</div>
                <div style="color: #888; font-style: italic;">Page appears clean</div>
            `;
            return;
        }

        let content = `<div class="wm-stats-header">Watermarks Detected: ${totalCount}</div>`;

        // Text watermarks section
        if (detectionCount > 0) {
            content += `<div class="wm-stats-section">`;
            content += `<div class="wm-stats-section-title">📝 Text Watermarks (${detectionCount})</div>`;

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
            content += `</div>`;
        }

        // Image watermarks section
        if (imageWatermarkCount > 0) {
            content += `<div class="wm-stats-section">`;
            content += `<div class="wm-stats-section-title">🖼️ Image Watermarks (${imageWatermarkCount})</div>`;
            
            if (suspiciousImages.length > 0) {
                content += `<div class="wm-image-list">`;
                suspiciousImages.slice(0, 10).forEach((img, index) => {
                    const src = img.src || 'Unknown source';
                    const fileName = src.split('/').pop() || src;
                    const size = img.width && img.height ? ` (${img.width}×${img.height})` : '';
                    content += `<div class="wm-image-item">${index + 1}. ${fileName}${size}</div>`;
                });
                
                if (suspiciousImages.length > 10) {
                    content += `<div class="wm-image-item">... and ${suspiciousImages.length - 10} more</div>`;
                }
                content += `</div>`;
            }
            content += `</div>`;
        }

        statsPopup.innerHTML = content;
    }

    // Update debug info panel
    function updateDebugInfo() {
        const debugInfo = document.getElementById('wm-debug-info');
        if (!debugInfo || !CONFIG.debugMode) return;

        const debugText = `Context: ${CONFIG.isPDFContext ? 'PDF' : 'HTML'}
LinkedIn Safe: ${CONFIG.linkedinSafeMode}
Processing: ${isProcessing}
Nodes Processed: ${processedNodes.size || 0}
Text Watermarks: ${detectionCount}
Image Watermarks: ${imageWatermarkCount}
Image Detection: ${CONFIG.enableImageDetection ? 'ON' : 'OFF'}
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

            if (processedNodes.has(node)) {
                debugLog('Node already processed');
                return false;
            }

            if (!node.textContent || node.textContent.trim().length === 0) {
                debugLog('Skipping empty node');
                return false;
            }

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

    // Enhanced text processing
    function processText(text) {
        try {
            let processedText = text;
            let foundCount = 0;
            const localStats = {};

            for (const [char, name] of Object.entries(watermarkChars)) {
                try {
                    let regex;

                    switch (char) {
                        case '\u00A0':
                        case '\u202F':
                        case '\u3000':
                        case '\uFEFF':
                            regex = new RegExp('[' + char + ']', 'g');
                            break;
                        default:
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

                    for (const [char, count] of Object.entries(result.stats)) {
                        batchStats[char] = (batchStats[char] || 0) + count;
                    }

                    const wrapper = document.createElement('span');
                    wrapper.innerHTML = result.text;
                    textNode.parentNode.replaceChild(wrapper, textNode);
                }

                processedNodes.add(textNode);

            } catch (nodeError) {
                debugLog('Error processing node', { index: i, error: nodeError.message });
            }
        }

        return { count: batchCount, stats: batchStats, stopped: false };
    }

    // Main detection function with image support
    async function detectWatermarks() {
        if (isProcessing) {
            debugLog('Detection already in progress, skipping');
            return;
        }

        // Skip detection in PDF context
        if (CONFIG.isPDFContext) {
            debugLog('Skipping detection in PDF context');
            return;
        }

        isProcessing = true;
        processingStartTime = Date.now();
        debugLog('Starting watermark detection', {
            url: window.location.href,
            linkedinMode: CONFIG.linkedinSafeMode,
            imageDetection: CONFIG.enableImageDetection
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

            // Clean up image highlights
            document.querySelectorAll('.wm-suspicious-image').forEach(img => {
                img.classList.remove('wm-suspicious-image');
                img.title = img.title.replace(/Suspicious image detected.*?\s*\|\s*/, '');
            });

            document.querySelectorAll('.image-marker').forEach(marker => {
                if (marker.parentNode) {
                    marker.parentNode.removeChild(marker);
                }
            });

            // Reset counters
            detectionCount = 0;
            imageWatermarkCount = 0;
            detectionStats = {};
            suspiciousImages = [];
            processedNodes = new WeakSet();

            // Run image detection first
            if (CONFIG.enableImageDetection) {
                debugLog('Starting image watermark detection');
                const imageResults = await detectImageWatermarks();
                imageWatermarkCount = imageResults.count;
                suspiciousImages = imageResults.images;
                debugLog(`Image detection complete: ${imageWatermarkCount} found`);
            }

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

                for (const [char, count] of Object.entries(result.stats)) {
                    detectionStats[char] = (detectionStats[char] || 0) + count;
                }

                if (result.stopped) {
                    debugLog('Processing stopped due to time limit');
                    break;
                }

                currentIndex += CONFIG.batchSize;

                if (CONFIG.linkedinSafeMode && currentIndex < textNodes.length) {
                    debugLog('Waiting between batches...');
                    await new Promise(resolve => setTimeout(resolve, CONFIG.processingDelay));
                }

                createCounter();
            }

            const processingTime = Date.now() - processingStartTime;
            const totalCount = detectionCount + imageWatermarkCount;
            
            debugLog(`Detection complete`, {
                textCount: detectionCount,
                imageCount: imageWatermarkCount,
                totalCount: totalCount,
                time: processingTime + 'ms',
                stats: detectionStats
            });

            if (CONFIG.debugMode && totalCount > 0) {
                console.log('📊 Watermark breakdown:', {
                    text: detectionStats,
                    images: suspiciousImages.map(img => img.src)
                });
            }

        } catch (error) {
            debugLog('Critical error during detection', error.message);
            console.error('Watermark detection error:', error);
        } finally {
            isProcessing = false;
            createCounter();
        }
    }

    // Enhanced initialization with PDF support
    function init() {
        try {
            debugLog('Initializing watermark detector');

            // Check for PDF context first
            if (detectPDFContext()) {
                console.log('📄 PDF detected - Limited detection mode active');
                debugLog('PDF context detected, switching to PDF mode');
            }

            addStyles();

            // Create counter immediately for PDF context
            if (CONFIG.isPDFContext) {
                createCounter();
                setTimeout(() => {
                    showPDFPopup();
                }, 2000); // Show PDF guidance after 2 seconds
            } else {
                // Normal HTML detection
                const initDelay = CONFIG.linkedinSafeMode ? 3000 : 1000;
                debugLog(`Scheduling initial detection in ${initDelay}ms`);

                setTimeout(() => {
                    debugLog('Running initial detection');
                    detectWatermarks();
                }, initDelay);
            }

            // Global functions for testing
            window.testWatermarkDetection = detectWatermarks;
            window.toggleWatermarkDebug = () => {
                const debugToggle = document.getElementById('wm-debug-toggle');
                if (debugToggle) debugToggle.click();
            };
            
            window.toggleImageDetection = () => {
                CONFIG.enableImageDetection = !CONFIG.enableImageDetection;
                console.log(`🖼️ Image detection: ${CONFIG.enableImageDetection ? 'ON' : 'OFF'}`);
                if (!CONFIG.isPDFContext) {
                    detectWatermarks();
                }
            };

            // Keyboard shortcuts
            document.addEventListener('keydown', function(e) {
                if (e.ctrlKey && e.shiftKey && e.key === 'W') {
                    e.preventDefault();
                    debugLog('Keyboard shortcut triggered');

                    if (CONFIG.isPDFContext) {
                        showPDFPopup();
                    } else {
                        detectWatermarks();
                    }
                }

                // Debug shortcut for PDFs
                if (e.ctrlKey && e.shiftKey && e.key === 'P' && CONFIG.isPDFContext) {
                    e.preventDefault();
                    debugLog('PDF analysis shortcut triggered');
                    window.tryPDFAnalysis();
                }

                // Toggle image detection
                if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                    e.preventDefault();
                    window.toggleImageDetection();
                }
            });

            debugLog('Initialization complete', { 
                pdfMode: CONFIG.isPDFContext,
                imageDetection: CONFIG.enableImageDetection
            });

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

    debugLog('Enhanced watermark detector loaded with image detection support');

})();
