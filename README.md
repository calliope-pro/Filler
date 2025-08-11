# 📁 Fillr

**Client-side dummy file generator with exact byte size control**

Fillr is a browser-based dummy file generation service that creates files of exactly the specified byte count. Perfect for development, testing, and performance analysis.

[🌐 **Live Demo**](https://filler.netlify.app) | [🐛 **Report Issues**](https://github.com/calliope-pro/Filler/issues) | [🤝 **Contributing**](./CONTRIBUTING.md)

---

## ✨ Features

- 🎯 **Exact Size**: Generate files with precisely specified byte counts
- 🌍 **Multi-language**: Japanese/English interface with automatic detection
- 🔒 **Privacy-first**: All processing happens in your browser, no server uploads
- ⚡ **Fast**: Memory-efficient chunked generation handles large files quickly
- 📱 **Cross-platform**: Works on desktop and mobile browsers
- 🎨 **Multiple Formats**: TXT, CSV, PNG, PDF, MP3, MP4

## 🚀 Quick Start

### Online Use
Visit [filler.netlify.app](https://filler.netlify.app/) and start generating files immediately.

### Local Development
```bash
# Clone the repository
git clone https://github.com/calliope-pro/Filler.git
cd Filler

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📋 Supported File Formats

| Format | Description | Implementation |
|--------|-------------|----------------|
| **TXT** | Plain text files | Zero-filled or ASCII patterns |
| **CSV** | Spreadsheet data | Generated with headers and sample data |
| **PNG** | Image files | 1×1 transparent image with size adjustment |
| **PDF** | Document files | Minimal PDF with comment padding |
| **MP3** | Audio files | Silent audio with ID3 tags |
| **MP4** | Video files | 1×1 black screen video |

## 🛠 Technical Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Internationalization**: react-i18next
- **File Generation**: Custom implementations with format-specific structures
- **Build**: Vite with optimizations

## 🌐 Browser Support

- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

*Note: Uses modern Web APIs including Blob, URL.createObjectURL, and Crypto (optional)*

## 📖 How It Works

1. **Size Parsing**: Converts user input (1MB, 512KB, etc.) to exact byte counts
2. **Format Generation**: Creates format-specific file structures
3. **Memory Management**: Uses chunked generation for large files to prevent memory issues
4. **Download**: Generates Blob URLs for instant download

### File Size Limits

- **Recommended**: Up to 1GB per file
- **Maximum**: 10GiB (browser memory dependent)
- **Mobile**: Lower limits recommended due to device constraints

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature`
3. **Commit** your changes: `git commit -m 'Add some feature'`
4. **Push** to the branch: `git push origin feature/your-feature`
5. **Submit** a Pull Request

### Areas for Contribution

- 🎨 UI/UX improvements
- 🌍 Additional language translations
- 📁 New file format support
- ⚡ Performance optimizations
- 🧪 Test coverage expansion
- 📖 Documentation improvements

## 🐛 Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/calliope-pro/Filler/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/calliope-pro/Filler/discussions)
- **Questions**: [GitHub Discussions Q&A](https://github.com/calliope-pro/Filler/discussions/categories/q-a)

## 📄 License

Copyright 2025-present, calliope-pro (https://github.com/calliope-pro)

This project is licensed under the **Apache License 2.0** - see the [LICENSE](./LICENSE) file for details.

### License Summary

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ✅ Patent use
- ❗ License and copyright notice required
- ❗ State changes if modified

## 🙏 Acknowledgments

- Built with modern web technologies and accessibility in mind
- Inspired by the need for exact-size test files in development workflows
- Thanks to all contributors and users who help improve Fillr

---

**Made with ❤️ by [calliope-pro](https://github.com/calliope-pro)**

*Star ⭐ this repo if you find it useful!*