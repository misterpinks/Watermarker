# 🔍 Pinky's AI Watermark Detector

A comprehensive Tampermonkey userscript that detects invisible watermarks, suspicious images, and AI writing patterns on any webpage. Perfect for identifying AI-generated content watermarks, zero-width spaces, steganographic text markers, and AI writing characteristics.

![Version](https://img.shields.io/badge/version-9.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tampermonkey](https://img.shields.io/badge/Tampermonkey-Compatible-orange)

## ✨ Features

### 🎯 Multi-Layer Detection
- **📝 Invisible Watermarks** - Detects 30+ types of hidden Unicode characters
- **🖼️ Suspicious Images** - Identifies potential watermark images and oversized files
- **✍️ AI Writing Patterns** - Recognizes common AI-generated text patterns
- **📄 PDF Support** - Specialized handling for PDF documents

### 🔧 Advanced Functionality
- **📊 Detailed Statistics** - Hover counter for comprehensive breakdown
- **🐛 Debug Mode** - Toggle debug information with 'D' button
- **⚡ Real-time Detection** - Instant highlighting as you browse
- **🔄 Auto-updates** - Automatic script updates from GitHub
- **⌨️ Keyboard Shortcuts** - Multiple hotkeys for quick access
- **🔗 LinkedIn Compatible** - Optimized for dynamic social media sites

### 🎨 Visual Interface
- **Three-Part Counter** - Shows watermarks•images•patterns (e.g., "5•2•8")
- **Color-Coded Highlights** - Red for watermarks, orange for AI patterns
- **Smart Tooltips** - Detailed information on hover
- **PDF Mode Interface** - Special UI for PDF document analysis

## 🚀 Quick Install

### Option 1: Direct Install (Recommended)
1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. **[Click here to install the script](https://github.com/misterpinks/Watermarker/raw/main/watermark-detector.user.js)**
3. Click "Install" when Tampermonkey opens
4. You're done! The counter will appear on websites with detected content

### Option 2: Manual Install
1. Download the [latest script file](https://github.com/misterpinks/Watermarker/raw/main/watermark-detector.user.js)
2. Open Tampermonkey Dashboard
3. Click "Utilities" tab
4. Drag and drop the `.user.js` file into the import area

### 📁 Local File Access (Optional)
To analyze local HTML/PDF files:
1. Go to `chrome://extensions/`
2. Find Tampermonkey → Click "Details"
3. Enable "Allow access to file URLs"
4. In Tampermonkey dashboard:
   - Go to Settings tab
   - Set "Config mode" to "Advanced"
   - Enable "Allow access to file URLs"
   - Click Save

## 🎮 How to Use

### Main Interface
The counter shows three detection types:
```
🔴 5•2•8  ← watermarks•images•patterns
   D P    ← Debug and Pattern toggles
```

### Interactive Controls
- **Click Main Counter**: Rescan page / Show PDF options
- **'D' Button**: Toggle debug mode (shows processing details)
- **'P' Button**: Toggle AI writing pattern detection
- **Hover Counter**: View detailed statistics popup

### Detection Categories

#### 📝 Invisible Watermarks (Red 'W' markers)
Detects 30 types of hidden characters:

| Character | Unicode | Name | Common Use |
|-----------|---------|------|------------|
| ​ | U+0000 | Null | Control character injection |
| ​ | U+001E | Record Separator | Data structure manipulation |
| ​ | U+001F | Unit Separator | Text boundary marking |
|   | U+00A0 | No-Break Space | Layout manipulation |
| ­ | U+00AD | Soft Hyphen | Content tracking |
| ​ | U+200B | Zero Width Space | AI text watermarks |
| ‌ | U+200C | Zero Width Non-Joiner | Script separation |
| ‍ | U+200D | Zero Width Joiner | Character combination |
| ‎ | U+200E | Left-to-Right Mark | Text direction control |
| ‏ | U+200F | Right-to-Left Mark | Text direction control |
| ‪ | U+202A | Left-to-Right Embedding | Directional formatting |
| ‫ | U+202B | Right-to-Left Embedding | Directional formatting |
| ‬ | U+202C | Pop Directional Formatting | Directional formatting |
| ‭ | U+202D | Left-to-Right Override | Text direction override |
| ‮ | U+202E | Right-to-Left Override | Text direction override |
|   | U+202F | Narrow No-Break Space | Precise spacing control |
| ⁠ | U+2060 | Word Joiner | Text fingerprinting |
| ⁡ | U+2061 | Function Application (Invisible) | Mathematical formatting |
| ⁢ | U+2062 | Invisible Times | Mathematical operators |
| ⁣ | U+2063 | Invisible Separator | Mathematical formatting |
| ⁤ | U+2064 | Invisible Plus | Mathematical operators |
| ⁦ | U+2066 | Left-to-Right Isolate | Text isolation |
| ⁧ | U+2067 | Right-to-Left Isolate | Text isolation |
| ⁨ | U+2068 | First Strong Isolate | Directional isolation |
| ⁩ | U+2069 | Pop Directional Isolate | Directional isolation |
| 　 | U+3000 | Ideographic Space | CJK text spacing |
| ︀ | U+FE00 | Variation Selector-1 | Font rendering tricks |
| – | U+2013 | En Dash | Punctuation substitution |
| — | U+2014 | Em Dash | Punctuation substitution |
| ﻿ | U+FEFF | Zero Width No-Break Space (BOM) | Byte order marking |

#### 🖼️ Suspicious Images (Orange border + 🖼️ icon)
Detects potentially watermarked images:
- Small images with suspicious filenames (bull.png, dot.png, marker.png)
- Tiny images in list contexts (likely bullet replacements)
- Unusually large file sizes for simple graphics
- Images with watermark-related metadata

#### ✍️ AI Writing Patterns (Orange underlines)
Identifies common AI-generated text characteristics:

**Inflated Symbolism**
- "stands as a testament"
- "plays a vital role"
- "continues to captivate"
- "watershed moment"

**Promotional Language**
- "rich cultural heritage"
- "breathtaking"
- "must-visit"
- "stunning natural beauty"

**Editorializing**
- "it's important to note"
- "no discussion would be complete without"
- "in this article"

**Conjunctive Overuse**
- Excessive use of "moreover", "furthermore", "however"

**Negative Parallelism**
- "It's not just X, it's Y" structures
- "Not only X, but Y" patterns

**Superficial Analysis**
- Empty analytical phrases ending in -ing
- "ensuring", "highlighting", "emphasizing"

**Vague Attribution**
- "industry reports", "experts suggest"
- "studies show" without specifics

**Em Dash Overuse**
- Excessive use of em dashes for emphasis

### Keyboard Shortcuts
- `Ctrl+Shift+W` - Force rescan current page
- `Ctrl+Shift+P` - PDF analysis (PDF mode only)
- `Ctrl+Shift+I` - Toggle image detection
- `Ctrl+Shift+T` - Toggle writing pattern detection

### 📄 PDF Mode
When viewing PDFs, the script switches to specialized mode:

**PDF Interface Features:**
- Orange pulsing counter indicating PDF mode
- Click counter for PDF-specific options
- Download button for offline analysis
- Limited scan option for accessible content

**PDF Analysis Limitations:**
- Chrome's PDF viewer blocks text access
- Recommendation to use Firefox or PDF.js
- Download PDF for comprehensive analysis

## 📊 Statistics Popup

Hover the counter to see detailed breakdown:
```
┌─────────────────────────────────┐
│ AI Detection Results: 15        │
├─────────────────────────────────┤
│ 🔴 Invisible Watermarks (5)     │
│ U+200B Zero Width Space     3   │
│ U+00AD Soft Hyphen          2   │
│                                 │
│ 🖼️ Suspicious Images (2)        │
│ 1. bullet.png (8×8)             │
│ 2. marker.svg (12×12)           │
│                                 │
│ 📝 AI Writing Patterns (8)      │
│ Inflated Symbolism         4    │
│ Promotional Language       2    │
│ Conjunctive Overuse        2    │
│                                 │
│ Recent matches:                 │
│ "stands as a testament"         │
│ "rich cultural heritage"        │
└─────────────────────────────────┘
```

## 🛠️ Development

### Project Structure
```
Watermarker/
├── watermark-detector.user.js    # Main script (v9.1)
├── README.md                      # This file
└── LICENSE                        # MIT License
```

### Configuration Options
The script includes several configurable options:
- `maxProcessingTime`: Maximum time for processing (5000ms)
- `batchSize`: Nodes processed per batch (10)
- `linkedinSafeMode`: Special handling for LinkedIn
- `enableImageDetection`: Toggle image watermark detection
- `enableWritingPatternDetection`: Toggle AI pattern detection

### Global Functions (for console testing)
- `testWatermarkDetection()` - Manual detection run
- `toggleWatermarkDebug()` - Toggle debug mode
- `toggleImageDetection()` - Toggle image detection
- `togglePatternDetection()` - Toggle pattern detection
- `downloadCurrentPDF()` - Download current PDF (PDF mode)
- `tryPDFAnalysis()` - Attempt limited PDF scan

### Version History
- **v9.1** - Enhanced AI writing pattern detection, improved PDF support
- **v9.0** - Added image detection and writing pattern analysis
- **v8.2** - Enhanced statistics, LinkedIn compatibility fixes
- **v8.1** - Original public release
- **v8.0** - Initial development version

## 🐛 Troubleshooting

### Common Issues

**Q: The counter shows "0•0•0" but I see content**
- Click the counter to manually rescan
- Toggle detection modes with 'D' and 'P' buttons
- Check if content is dynamically loaded

**Q: PDF mode shows orange counter but no detection**
- PDFs have limited text access in Chrome
- Use Firefox for better PDF.js support
- Download PDF and analyze with text editor

**Q: Too many AI pattern detections**
- Toggle pattern detection off with 'P' button
- Some legitimate text may trigger patterns
- Check statistics popup for specific pattern types

**Q: LinkedIn or dynamic sites not working**
- Script includes LinkedIn-specific optimizations
- Try manual rescan after page loads completely
- Disable other userscripts to test conflicts

**Q: Performance issues on large pages**
- Debug mode shows processing statistics
- Script processes in batches to minimize impact
- LinkedIn safe mode limits processing automatically

### Debug Information
Enable debug mode ('D' button) to see:
- Processing statistics
- Node counts and timing
- Configuration status
- Real-time detection events

### Reporting Issues
Found a bug? Please [open an issue](https://github.com/misterpinks/Watermarker/issues) with:
- Browser and Tampermonkey version
- Website where the issue occurred
- Debug mode information (if available)
- Steps to reproduce
- Console error messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need to detect AI-generated content
- Community feedback for writing pattern detection
- Built for privacy-conscious users and researchers
- Optimized for real-world usage across various websites

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/misterpinks/Watermarker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/misterpinks/Watermarker/discussions)
- **Author**: [@ericpink](https://github.com/misterpinks)

---

**⭐ Star this repo if you find it useful!**

*Detection capabilities: Invisible watermarks • Suspicious images • AI writing patterns • PDF analysis*

Made with ❤️ for digital transparency
