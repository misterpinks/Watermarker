# 🔍 Pinky's AI Watermark Detector

A quick and dirty Tampermonkey userscript that detects invisible watermarks and hidden characters on any webpage. Perfect for identifying AI-generated content watermarks, zero-width spaces, and other steganographic text markers.

![Version](https://img.shields.io/badge/version-8.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Tampermonkey](https://img.shields.io/badge/Tampermonkey-Compatible-orange)

## ✨ Features

- **🎯 Real-time Detection** - Instantly highlights invisible watermarks as you browse
- **📊 Detailed Statistics** - Hover over the counter for a breakdown of detected watermark types
- **🔧 LinkedIn Compatible** - Optimized to work smoothly with dynamic websites
- **⌨️ Keyboard Shortcuts** - Quick rescan with `Ctrl+Shift+W`
- **🎨 Visual Indicators** - Clear highlighting with tooltips showing character details
- **🔄 Auto-updates** - Automatic updates when new versions are released

## 🚀 Quick Install

### Option 1: Direct Install (Recommended)
1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. **[Click here to install the script](https://github.com/misterpinks/Watermarker/raw/refs/heads/main/Pinky's%20AI%20Watermark%20Detector-8.1.user.js)**
3. Click "Install" when Tampermonkey opens
4. You're done! The red counter will appear on websites with watermarks

### Option 2: Manual Install
1. Download the [latest script file](https://github.com/misterpinks/Watermarker/raw/refs/heads/main/Pinky's%20AI%20Watermark%20Detector-8.1.user.js)
2. Open Tampermonkey Dashboard
3. Click "Utilities" tab
4. Drag and drop the `.user.js` file into the import area

## 🎮 How to Use

### Basic Usage
- **Red Counter**: Appears in top-right corner when watermarks are detected
- **Click Counter**: Manually rescan the current page
- **Hover Counter**: View detailed statistics popup
- **Red "W" Markers**: Highlighted watermarks throughout the page
- **Hover Markers**: See specific character details

### Keyboard Shortcuts
- `Ctrl+Shift+W` - Force rescan current page

### What It Detects
The script identifies 25+ types of invisible characters commonly used for watermarking:

| Character | Unicode | Common Use |
|-----------|---------|------------|
| Zero Width Space | U+200B | AI text watermarks |
| Soft Hyphen | U+00AD | Content tracking |
| Word Joiner | U+2060 | Text fingerprinting |
| No-Break Space | U+00A0 | Layout manipulation |
| Variation Selectors | U+FE00+ | Font rendering tricks |
| And many more... | | Various steganographic uses |


### Main Interface
The red counter shows total watermarks found:
```
🔴 5  ← Click to rescan, hover for details
```

### Statistics Popup
Hover the counter to see detailed breakdown:
```
┌─────────────────────────────┐
│ Watermarks Detected: 5      │
├─────────────────────────────┤
│ U+200B Zero Width Space  3  │
│ U+00AD Soft Hyphen       2  │
└─────────────────────────────┘
```

### Page Highlighting
Watermarks appear as red "W" markers with tooltips:
```
This is normal text W followed by more text
                   ↑
            (Zero Width Space)
```

## 🛠️ Development

### Project Structure
```
Watermarker/
├── Pinky's AI Watermark Detector-8.2.user.js  # Main script
├── README.md                                   # This file
└── LICENSE                                     # MIT License
```

### Version History
- **v8.2** - Enhanced statistics, LinkedIn compatibility fixes
- **v8.1** - Original public release
- **v8.0** - Initial development version

### Contributing
1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

### Common Issues

**Q: The counter doesn't appear**
- Make sure Tampermonkey is enabled
- Check if the website has watermarks to detect
- Try refreshing the page

**Q: LinkedIn content not loading properly**
- The script includes LinkedIn-specific optimizations
- Try clicking the counter to manually rescan
- Disable other userscripts temporarily to test conflicts

**Q: Too many false positives**
- Some websites use legitimate invisible characters
- The script distinguishes between normal formatting and watermarks
- Check the statistics popup for character details

**Q: Performance issues**
- The script is optimized for minimal impact
- On very large pages, scanning may take a moment
- Use manual rescan (click counter) if needed

### Reporting Issues
Found a bug? Please [open an issue](https://github.com/misterpinks/Watermarker/issues) with:
- Browser and Tampermonkey version
- Website where the issue occurred
- Steps to reproduce
- Console error messages (if any)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the need to detect AI-generated content watermarks
- Built for the privacy-conscious community
- Optimized for real-world usage on popular websites

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/misterpinks/Watermarker/issues)
- **Discussions**: [GitHub Discussions](https://github.com/misterpinks/Watermarker/discussions)
- **Author**: [@ericpink](https://github.com/misterpinks)

---

**⭐ Star this repo if you find it useful!**

Made with ❤️ for the open web
