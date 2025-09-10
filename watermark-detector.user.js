// ==UserScript==
// @name         Pinky's AI Watermark Detector
// @version      9.1
// @namespace    http://tampermonkey.net/
// @description  Enhanced detector with invisible watermarks, image detection, and AI writing pattern recognition
// @author       @ericpink
// @homepage     https://github.com/misterpinks/Watermarker
// @supportURL   https://github.com/misterpinks/Watermarker/issues

// @updateURL    https://github.com/misterpinks/Watermarker/raw/main/watermark-detector.user.js
// @downloadURL  https://github.com/misterpinks/Watermarker/raw/main/watermark-detector.user.js
// @match        file:///*
// @match        http://*/*
// @match        https://*/*
// @match        chrome-extension://*/*
// @match        https://claude.ai/*
// @include      *
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('🔍 Enhanced AI Detection Started v9.0 (Watermarks + Writing Patterns + Images)');

    // Configuration
    const CONFIG = {
        maxProcessingTime: 5000,
        processingDelay: 100,
        batchSize: 10,
        linkedinSafeMode: window.location.hostname.includes('linkedin.com'),
        debugMode: false,
        isPDFContext: false,
        enableImageDetection: true,
        enableWritingPatternDetection: true
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

   // AI Writing Pattern Detection - Enhanced with Emoji Detection
const AI_WRITING_PATTERNS = {
    // 1. Inflated symbolism and meaning
    inflatedSymbolism: {
        patterns: [
            /\b(?:is|stands?|serves?) as a testament\b/gi,
            /\bplays? a (?:vital|significant) role\b/gi,
            /\bunderscore(?:s|d) its importance\b/gi,
            /\bcontinue(?:s|d)? to captivate\b/gi,
            /\bleave(?:s|d)? a lasting impact\b/gi,
            /\bwatershed moment\b/gi,
            /\bkey turning point\b/gi,
            /\bdeeply rooted\b/gi,
            /\bprofound heritage\b/gi,
            /\bsteadfast dedication\b/gi,
            /\bstands? as a\b/gi,
            /\bsolidifie(?:s|d)\b/gi
        ],
        name: 'Inflated Symbolism',
        description: 'Exaggerated importance and meaning'
    },

    // 2. Promotional language
    promotional: {
        patterns: [
            /\brich cultural heritage\b/gi,
            /\brich history\b/gi,
            /\bbreathtaking\b/gi,
            /\bmust-visit\b/gi,
            /\bmust-see\b/gi,
            /\bstunning natural beauty\b/gi,
            /\b(?:enduring|lasting) legacy\b/gi,
            /\brich cultural tapestry\b/gi
        ],
        name: 'Promotional Language',
        description: 'Tourism-like promotional tone'
    },

    // 3. Editorializing
    editorializing: {
        patterns: [
            /\bit'?s important to (?:note|remember|consider)\b/gi,
            /\bit is worth\b/gi,
            /\bno discussion would be complete without\b/gi,
            /\bin this article\b/gi
        ],
        name: 'Editorializing',
        description: 'Opinion injection in neutral content'
    },

    // 4. Overuse of conjunctive phrases
    conjunctive: {
        patterns: [
            /\bon the other hand\b/gi,
            /\bmoreover\b/gi,
            /\bin addition\b/gi,
            /\bfurthermore\b/gi,
            /\bhowever\b/gi,
            /\bin contrast\b/gi
        ],
        name: 'Conjunctive Overuse',
        description: 'Excessive connecting phrases'
    },

    // 5. Negative parallelisms
    negativeParallelism: {
        patterns: [
            /\bit'?s not (?:just )?(?:about )?[^,;.]+[,;]\s*it'?s\b/gi,
            /\bnot only [^,;.]+[,;]\s*but\b/gi,
            /\bthis (?:isn'?t|is not) [^,;.]+[,;]\s*(?:it'?s|this is)\b/gi
        ],
        name: 'Negative Parallelism',
        description: '"It\'s not X, it\'s Y" structures'
    },

    // 6. Superficial analyses
    superficialAnalysis: {
        patterns: [
            /,\s*ensuring [^.;]+/gi,
            /,\s*highlighting [^.;]+/gi,
            /,\s*emphasizing [^.;]+/gi,
            /,\s*reflecting [^.;]+/gi,
            /,\s*improving [^.;]+/gi,
            /,\s*demonstrating [^.;]+/gi
        ],
        name: 'Superficial Analysis',
        description: 'Empty analytical -ing phrases'
    },

    // 7. Vague attribution
    vagueAttribution: {
        patterns: [
            /\bindustry reports?\b/gi,
            /\bobservers have cited\b/gi,
            /\bsome critics argue\b/gi,
            /\bexperts suggest\b/gi,
            /\bstudies show\b/gi,
            /\bresearch indicates\b/gi
        ],
        name: 'Vague Attribution',
        description: 'Weasel words without clear sources'
    },

    // 8. Em dash overuse
    emDashOveruse: {
        patterns: [
            /—[^—]+—/g,
            /\s—\s[^—.!?]+[.!?]/g
        ],
        name: 'Em Dash Overuse',
        description: 'Excessive em dash usage'
    },

    // 9. NEW: Suspicious emoji usage
    suspiciousEmojis: {
        patterns: [
            // Star emojis (often used for emphasis)
            /⭐/g,
            /🌟/g,
            /✨/g,
            /⭐️/g,

            // Rocket/growth emojis (startup/business language)
            /🚀/g,
            /📈/g,
            /💪/g,
            /🎯/g,

            // Check marks (listicle/productivity content)
            /✅/g,
            /☑️/g,
            /✔️/g,

            // Fire/hot emojis (trendy content)
            /🔥/g,
            /💥/g,
            /⚡/g,
            /💯/g,

            // Money/success emojis (promotional content)
            /💰/g,
            /💎/g,
            /🏆/g,
            /🎉/g,
            /🎊/g,

            // Light bulb/idea emojis (insight content)
            /💡/g,
            /🧠/g,
            /💭/g,

            // Warning/attention emojis (clickbait)
            /⚠️/g,
            /🚨/g,
            /❗/g,
            /❓/g,
            /‼️/g,
            /📍/g,

            // Heart/emotion emojis (engagement bait)
            /❤️/g,
            /💖/g,
            /😍/g,
            /🥰/g,

            // Hand gesture emojis (call-to-action)
            /👆/g,
            /👇/g,
            /👈/g,
            /👉/g,
            /👏/g,
            /🙌/g,

            // Eye emojis (attention-grabbing)
            /👀/g,
            /👁️/g,

            // Time/urgency emojis
            /⏰/g,
            /⏳/g,
            /⌛/g,

            // Crown/premium emojis
            /👑/g,
            /💫/g,

            // Additional emojis
            /🎁/g,
            /🎪/g,
            /🌈/g,
            /🔑/g,
            /🗝️/g,
            /📊/g,

            // Face with specific emotions often used in AI content
            /🤔/g,
            /😎/g,
            /🤩/g,
            /😱/g,

            // Technology/digital emojis
            /💻/g,
            /📱/g,
            /🖥️/g,
            /⚙️/g,
            /🔧/g,

            // Globe/world emojis (global content)
            /🌍/g,
            /🌎/g,
            /🌏/g,
            /🌐/g
        ],
        name: 'Suspicious Emojis',
        description: 'AI-generated content often overuses specific emojis for engagement'
    }
};
    let detectionCount = 0;
    let imageWatermarkCount = 0;
    let writingPatternCount = 0;
    let detectionStats = {};
    let writingPatternStats = {};
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

    // Enhanced CSS with writing pattern styles
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

            .wm-highlight.writing-pattern {
                background: #ff8c00 !important;
                color: white !important;
                padding: 1px 4px !important;
                border-radius: 3px !important;
                font-size: inherit !important;
                font-family: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
                display: inline !important;
                min-width: auto !important;
                text-decoration: underline !important;
                vertical-align: baseline !important;
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
                max-width: 300px;
                white-space: normal;
                word-wrap: break-word;
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
                min-width: 30px !important;
                text-align: center !important;
                user-select: none !important;
                transition: all 0.2s ease !important;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2) !important;
                display: flex !important;
                align-items: center !important;
                gap: 6px !important;
                flex-direction: column !important;
            }

            .wm-counter-row {
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

            .wm-pattern-toggle {
                background: rgba(255, 140, 0, 0.8) !important;
                border: none !important;
                border-radius: 3px !important;
                color: white !important;
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

            .wm-pattern-toggle:hover {
                background: rgba(255, 140, 0, 1) !important;
                transform: scale(1.1) !important;
            }

            .wm-pattern-toggle.active {
                background: rgba(255, 215, 0, 0.9) !important;
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
                max-width: 400px !important;
                min-width: 250px !important;
                pointer-events: none !important;
                opacity: 0 !important;
                transform: translateY(-10px) !important;
                transition: all 0.2s ease !important;
                max-height: 80vh !important;
                overflow-y: auto !important;
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

            .wm-stats-section-title.writing-patterns {
                color: #ff8c00 !important;
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

            .wm-pattern-list {
                max-height: 150px !important;
                overflow-y: auto !important;
                font-size: 9px !important;
                margin-top: 4px !important;
            }

            .wm-pattern-item {
                display: block !important;
                margin: 2px 0 !important;
                padding: 2px 4px !important;
                background: rgba(255, 140, 0, 0.2) !important;
                border-radius: 2px !important;
                word-break: break-word !important;
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

    // Image watermark detection functions (existing code)
    function isLikelyWatermarkImage(img) {
        const src = img.src || img.getAttribute('src') || '';
        const alt = img.alt || '';
        const width = img.width || img.naturalWidth || 0;
        const height = img.height || img.naturalHeight || 0;
        const className = img.className || '';

        const suspiciousPatterns = [
            /bull?\.png/i,
            /bullet/i,
            /dot\.png/i,
            /marker\.png/i,
            /point\.png/i,
            /list\.png/i,
            /item\.png/i,
            /dash\.png/i,
            /separator\.png/i
        ];

        const isSmallImage = (width > 0 && width < 50) && (height > 0 && height < 50);
        const isTinyImage = (width > 0 && width < 20) && (height > 0 && height < 20);
        const hasWatermarkPattern = suspiciousPatterns.some(pattern =>
            pattern.test(src) || pattern.test(alt) || pattern.test(className)
        );
        const isInListContext = img.closest('li, ul, ol') !== null;
        const hasListRole = img.getAttribute('role') === 'presentation' ||
                           img.getAttribute('role') === 'img';
        const isInlineWithText = img.parentElement &&
                                img.parentElement.textContent.trim().length > 0;
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

            try {
                const response = await fetch(src, { method: 'HEAD' });
                const contentLength = response.headers.get('content-length');

                if (contentLength) {
                    const size = parseInt(contentLength);

                    if (size > 50000) {
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

        const marker = document.createElement('span');
        marker.className = 'wm-highlight image-marker';
        marker.textContent = 'IMG';
        marker.setAttribute('data-info', reason);

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
                if (img.classList.contains('wm-suspicious-image') ||
                    img.closest('.wm-counter') ||
                    img.closest('.wm-stats-popup')) {
                    continue;
                }

                if (isLikelyWatermarkImage(img)) {
                    imageCount++;
                    foundImages.push(img);

                    let reason = 'Suspicious image pattern';
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

    // NEW: AI Writing Pattern Detection
    function processWritingPatterns(text) {
        if (!CONFIG.enableWritingPatternDetection) {
            return { text: text, count: 0, patterns: {} };
        }

        let processedText = text;
        let foundCount = 0;
        const localPatterns = {};

        for (const [categoryKey, category] of Object.entries(AI_WRITING_PATTERNS)) {
            for (const pattern of category.patterns) {
                try {
                    const matches = text.match(pattern);
                    if (matches) {
                        const count = matches.length;
                        foundCount += count;
                        
                        if (!localPatterns[categoryKey]) {
                            localPatterns[categoryKey] = { count: 0, name: category.name, matches: [] };
                        }
                        localPatterns[categoryKey].count += count;
                        localPatterns[categoryKey].matches.push(...matches);

                        debugLog(`Found ${count} instances of ${category.name}`, matches);

                        const replacement = (match) => {
                            return `<span class="wm-highlight writing-pattern" data-info="${category.name}: ${category.description}" data-pattern="${categoryKey}" title="${category.name}: ${match}">${match}</span>`;
                        };

                        processedText = processedText.replace(pattern, replacement);
                    }
                } catch (patternError) {
                    debugLog('Error processing writing pattern', { category: categoryKey, error: patternError.message });
                }
            }
        }

        return { text: processedText, count: foundCount, patterns: localPatterns };
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

    // Enhanced counter creation with writing pattern support
    function createCounter() {
        debugLog('Creating/updating counter');

        let counter = document.getElementById('wm-counter');
        let debugToggle = document.getElementById('wm-debug-toggle');
        let patternToggle = document.getElementById('wm-pattern-toggle');
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

            // Create first row with toggles
            const firstRow = document.createElement('div');
            firstRow.className = 'wm-counter-row';
            counter.appendChild(firstRow);

            // Create debug toggle button
            debugToggle = document.createElement('button');
            debugToggle.id = 'wm-debug-toggle';
            debugToggle.className = 'wm-debug-toggle';
            debugToggle.textContent = 'D';
            debugToggle.title = 'Toggle Debug Mode';
            firstRow.appendChild(debugToggle);

            // Create pattern toggle button
            patternToggle = document.createElement('button');
            patternToggle.id = 'wm-pattern-toggle';
            patternToggle.className = 'wm-pattern-toggle';
            patternToggle.textContent = 'P';
            patternToggle.title = 'Toggle Writing Pattern Detection';
            firstRow.appendChild(patternToggle);

            // Create second row with counts
            const secondRow = document.createElement('div');
            secondRow.className = 'wm-counter-row';
            counter.appendChild(secondRow);

            // Create count display
            const countDisplay = document.createElement('span');
            countDisplay.id = 'wm-count-display';
            secondRow.appendChild(countDisplay);

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

            // Pattern toggle handler
            patternToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                CONFIG.enableWritingPatternDetection = !CONFIG.enableWritingPatternDetection;
                patternToggle.classList.toggle('active', CONFIG.enableWritingPatternDetection);

                console.log(`📝 Writing Pattern Detection: ${CONFIG.enableWritingPatternDetection ? 'ON' : 'OFF'}`);
                
                if (!CONFIG.isPDFContext) {
                    detectWatermarks();
                }
            });

            // Main counter click handler
            counter.addEventListener('click', function(e) {
                if (e.target === debugToggle || e.target === patternToggle) return;

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
                const totalCount = detectionCount + imageWatermarkCount + writingPatternCount;
                countDisplay.textContent = `${detectionCount}•${imageWatermarkCount}•${writingPatternCount}`;
                countDisplay.style.fontSize = '10px';
            }
        }

        // Update counter styling based on context
        counter.classList.toggle('pdf-mode', CONFIG.isPDFContext);
        counter.classList.toggle('dim', !CONFIG.isPDFContext && (detectionCount + imageWatermarkCount + writingPatternCount) === 0);
        counter.classList.toggle('debug-mode', CONFIG.debugMode);

        // Update toggle states
        if (debugToggle) {
            debugToggle.classList.toggle('active', CONFIG.debugMode);
        }
        if (patternToggle) {
            patternToggle.classList.toggle('active', CONFIG.enableWritingPatternDetection);
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
            patternCount: writingPatternCount,
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

        const allText = document.body ? document.body.textContent : '';
        const cleanText = allText.replace(/D\s*P\s*[\s\S]*?Debug: ON/g, '').trim();

        if (cleanText.length > 20) {
            const textResult = processText(cleanText);
            const patternResult = processWritingPatterns(cleanText);

            const totalFindings = textResult.count + patternResult.count;

            if (totalFindings > 0) {
                alert(`🔍 Limited scan found:\n• ${textResult.count} watermark characters\n• ${patternResult.count} AI writing patterns\n\n⚠️ Note: This includes UI elements and may have false positives.\n\nFor accurate results, use a PDF.js-based viewer.`);
            } else {
                alert(`🔍 No watermarks or AI patterns detected in accessible content.\n\n⚠️ Important: Chrome's viewer limits access to actual PDF text.\n\nThis doesn't mean the PDF is clean - use PDF.js for comprehensive scanning.`);
            }
        } else {
            alert(`🔍 No accessible text content found.\n\nChrome's PDF viewer completely isolates the PDF content from JavaScript.\n\nRecommended: Use Firefox or PDF.js extension for proper detection.`);
        }
    };

    // Update stats popup content with writing patterns
    function updateStatsPopup() {
        const statsPopup = document.getElementById('wm-stats-popup');
        if (!statsPopup || CONFIG.isPDFContext) return;

        const totalCount = detectionCount + imageWatermarkCount + writingPatternCount;

        if (totalCount === 0) {
            statsPopup.innerHTML = `
                <div class="wm-stats-header">No Issues Found</div>
                <div style="color: #888; font-style: italic;">Content appears clean</div>
            `;
            return;
        }

        let content = `<div class="wm-stats-header">AI Detection Results: ${totalCount}</div>`;

        // Text watermarks section
        if (detectionCount > 0) {
            content += `<div class="wm-stats-section">`;
            content += `<div class="wm-stats-section-title">🔴 Invisible Watermarks (${detectionCount})</div>`;

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
            content += `<div class="wm-stats-section-title">🖼️ Suspicious Images (${imageWatermarkCount})</div>`;

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

        // Writing patterns section
        if (writingPatternCount > 0) {
            content += `<div class="wm-stats-section">`;
            content += `<div class="wm-stats-section-title writing-patterns">📝 AI Writing Patterns (${writingPatternCount})</div>`;

            const sortedPatterns = Object.entries(writingPatternStats)
                .sort(([,a], [,b]) => b.count - a.count);

            sortedPatterns.forEach(([categoryKey, data]) => {
                content += `
                    <div class="wm-stats-item">
                        <div>
                            <span>${data.name}</span>
                        </div>
                        <span class="wm-stats-count">${data.count}</span>
                    </div>
                `;
            });

            // Show some example matches
            content += `<div class="wm-pattern-list">`;
            let exampleCount = 0;
            for (const [categoryKey, data] of Object.entries(writingPatternStats)) {
                if (exampleCount >= 15) break;
                data.matches.slice(0, 3).forEach(match => {
                    if (exampleCount < 15) {
                        content += `<div class="wm-pattern-item">"${match.length > 50 ? match.substring(0, 50) + '...' : match}"</div>`;
                        exampleCount++;
                    }
                });
            }
            content += `</div>`;
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
Writing Patterns: ${writingPatternCount}
Image Detection: ${CONFIG.enableImageDetection ? 'ON' : 'OFF'}
Pattern Detection: ${CONFIG.enableWritingPatternDetection ? 'ON' : 'OFF'}
Time: ${processingStartTime ? (Date.now() - processingStartTime) + 'ms' : 'N/A'}
URL: ${window.location.hostname}
Debug: ON`;

        debugInfo.textContent = debugText;
    }

    // Safe node validation (existing code)
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

    // Enhanced text processing (existing watermark code)
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

    // Batch processing with writing patterns
    async function processBatch(nodes, startIndex, batchSize) {
        const endIndex = Math.min(startIndex + batchSize, nodes.length);
        debugLog(`Processing batch ${startIndex}-${endIndex} of ${nodes.length}`);

        let batchCount = 0;
        let batchPatternCount = 0;
        const batchStats = {};
        const batchPatternStats = {};

        for (let i = startIndex; i < endIndex; i++) {
            if (Date.now() - processingStartTime > CONFIG.maxProcessingTime) {
                debugLog('Time limit reached, stopping processing');
                return { count: batchCount, patternCount: batchPatternCount, stats: batchStats, patternStats: batchPatternStats, stopped: true };
            }

            try {
                const textNode = nodes[i];

                if (!textNode.parentNode) {
                    debugLog('Node removed during processing', i);
                    continue;
                }

                const originalText = textNode.textContent;
                
                // Process watermarks first
                const watermarkResult = processText(originalText);
                
                // Then process writing patterns
                const patternResult = processWritingPatterns(watermarkResult.text);

                let finalText = patternResult.text;
                let nodeModified = false;

                if (watermarkResult.count > 0) {
                    batchCount += watermarkResult.count;
                    nodeModified = true;

                    for (const [char, count] of Object.entries(watermarkResult.stats)) {
                        batchStats[char] = (batchStats[char] || 0) + count;
                    }
                }

                if (patternResult.count > 0) {
                    batchPatternCount += patternResult.count;
                    nodeModified = true;

                    for (const [categoryKey, data] of Object.entries(patternResult.patterns)) {
                        if (!batchPatternStats[categoryKey]) {
                            batchPatternStats[categoryKey] = { count: 0, name: data.name, matches: [] };
                        }
                        batchPatternStats[categoryKey].count += data.count;
                        batchPatternStats[categoryKey].matches.push(...data.matches);
                    }
                }

                if (nodeModified) {
                    const wrapper = document.createElement('span');
                    wrapper.innerHTML = finalText;
                    textNode.parentNode.replaceChild(wrapper, textNode);
                }

                processedNodes.add(textNode);

            } catch (nodeError) {
                debugLog('Error processing node', { index: i, error: nodeError.message });
            }
        }

        return { count: batchCount, patternCount: batchPatternCount, stats: batchStats, patternStats: batchPatternStats, stopped: false };
    }

    // Main detection function with all features
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
        debugLog('Starting comprehensive AI detection', {
            url: window.location.href,
            linkedinMode: CONFIG.linkedinSafeMode,
            imageDetection: CONFIG.enableImageDetection,
            patternDetection: CONFIG.enableWritingPatternDetection
        });

        try {
            // Clean up existing highlights
            debugLog('Cleaning up existing highlights');
            document.querySelectorAll('.wm-highlight').forEach(highlight => {
                try {
                    const parent = highlight.parentNode;
                    if (highlight.classList.contains('writing-pattern')) {
                        // For writing patterns, restore original text
                        if (parent) {
                            parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
                        }
                    } else {
                        // For watermarks, restore original character
                        const originalChar = highlight.getAttribute('data-original-char') || '';
                        if (parent) {
                            parent.replaceChild(document.createTextNode(originalChar), highlight);
                        }
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
            writingPatternCount = 0;
            detectionStats = {};
            writingPatternStats = {};
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
                writingPatternCount += result.patternCount;

                for (const [char, count] of Object.entries(result.stats)) {
                    detectionStats[char] = (detectionStats[char] || 0) + count;
                }

                for (const [categoryKey, data] of Object.entries(result.patternStats)) {
                    if (!writingPatternStats[categoryKey]) {
                        writingPatternStats[categoryKey] = { count: 0, name: data.name, matches: [] };
                    }
                    writingPatternStats[categoryKey].count += data.count;
                    writingPatternStats[categoryKey].matches.push(...data.matches);
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
            const totalCount = detectionCount + imageWatermarkCount + writingPatternCount;

            debugLog(`Detection complete`, {
                textCount: detectionCount,
                imageCount: imageWatermarkCount,
                patternCount: writingPatternCount,
                totalCount: totalCount,
                time: processingTime + 'ms',
                stats: detectionStats,
                patterns: writingPatternStats
            });

            if (CONFIG.debugMode && totalCount > 0) {
                console.log('📊 AI Detection breakdown:', {
                    watermarks: detectionStats,
                    images: suspiciousImages.map(img => img.src),
                    patterns: writingPatternStats
                });
            }

        } catch (error) {
            debugLog('Critical error during detection', error.message);
            console.error('AI detection error:', error);
        } finally {
            isProcessing = false;
            createCounter();
        }
    }

    // Enhanced initialization
    function init() {
        try {
            debugLog('Initializing enhanced AI detector');

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
                }, 2000);
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

            window.togglePatternDetection = () => {
                CONFIG.enableWritingPatternDetection = !CONFIG.enableWritingPatternDetection;
                console.log(`📝 Pattern detection: ${CONFIG.enableWritingPatternDetection ? 'ON' : 'OFF'}`);
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

                // Toggle pattern detection
                if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                    e.preventDefault();
                    window.togglePatternDetection();
                }
            });

            debugLog('Initialization complete', {
                pdfMode: CONFIG.isPDFContext,
                imageDetection: CONFIG.enableImageDetection,
                patternDetection: CONFIG.enableWritingPatternDetection
            });

        } catch (error) {
            debugLog('Error during initialization', error.message);
            console.error('Enhanced AI detector init error:', error);
        }
    }

    // Safe startup
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 500);
    }

    debugLog('Enhanced AI detector loaded with watermark, image, and writing pattern detection');

})();
