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
- 🎨 **Multiple Formats**: TXT, CSV, PNG, PDF, MP3, MP4, JSON
- 🔄 **Dynamic Algorithm Display**: Shows generation method based on selected format
- 🚀 **Streaming Downloads**: Memory-efficient streaming with WebWorker for large files
- ✅ **Real-time Validation**: Inline error messages with form validation style

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

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📋 Supported File Formats

| Format | Description | Implementation |
|--------|-------------|----------------|
| **TXT** | Plain text files | Random text generation with printable characters |
| **CSV** | Spreadsheet data | Generated with headers (ID, Name, Email, Phone, Address, City, Country) and dummy data |
| **PNG** | Image files | 1×1 transparent image with comment chunks for size adjustment |
| **PDF** | Document files | Minimal PDF with comment lines for padding |
| **MP3** | Audio files | Silent audio with ID3 metadata and padding |
| **MP4** | Video files | 1×1 black screen video with metadata adjustment |
| **JSON** | Data files | Structured JSON data with users, products, and orders |

### Dynamic Algorithm Display
The UI dynamically shows the generation method based on the selected format:
- **TXT**: "Generates a text file filled with random characters"
- **CSV**: "Generates CSV file with dummy data"
- **PNG**: "Creates a 1x1 transparent image and adjusts size with comment chunks"
- And more...

## 🛠 Technical Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Internationalization**: react-i18next with automatic language detection
- **File Generation**: WebWorker-based streaming generation with StreamSaver.js
- **Error Handling**: React Error Boundaries with inline validation messages
- **Icons**: Lucide React
- **Download**: StreamSaver.js for large file streaming downloads

## 🌐 Browser Support

- Chrome/Chromium 80+
- Firefox 75+
- Safari 13+
- Edge 80+

*Note: Uses modern Web APIs including Blob, URL.createObjectURL, and Crypto for random generation*

## 📖 How It Works

1. **Size Parsing**: Converts user input (1MB, 512KB, etc.) to exact byte counts with real-time validation
2. **Format Selection**: Dynamic algorithm description updates based on selected format
3. **WebWorker Generation**: Uses dedicated Web Workers for non-blocking file generation
4. **Streaming Download**: StreamSaver.js enables memory-efficient downloads of large files
5. **Error Handling**: Inline validation with form-style error messages

### File Size Limits

- **Maximum**: 10 TiB (10,995,116,277,760 bytes)
- **Recommended**: Up to 1 GB per file for optimal performance
- **Mobile**: Lower limits recommended due to device constraints
- **Real-time Validation**: Immediate feedback for invalid sizes

### UI Features

- **GitHub Integration**: GitHub icon in header for easy repository access
- **Language Selection**: Simple language switcher without flag icons
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support

## 🧪 File Generation Algorithms

### TXT Files
- Generates random printable ASCII characters (0x20-0x7E range)
- Exact byte count guaranteed
- Readable text content for testing

### CSV Files
- Header: `ID,Name,Email,Phone,Address,City,Country`
- Data rows: `1,User0001,user1@example.com,555-0001,1 Main Street,City1,USA`
- Alternating countries (USA/Canada)
- Partial rows for exact size matching

### PNG Files
- Base: 1x1 transparent PNG image
- Size adjustment: tEXt comment chunks with CRC calculation
- Valid PNG format maintained

### PDF Files
- Minimal PDF structure
- Size adjustment: Comment lines starting with `%`
- Compatible with standard PDF readers

### Audio/Video Files
- MP3: Silent audio with configurable duration and metadata
- MP4: 1x1 black screen video with minimal encoding

### JSON Files
- Structured data with users, products, and orders
- Valid JSON format with nested objects and arrays
- Size adjustment through repeated data entries

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature`
3. **Commit** your changes: `git commit -m 'Add some feature'`
4. **Push** to the branch: `git push origin feature/your-feature`
5. **Submit** a Pull Request

### Development Setup

```bash
# Install dependencies
npm install

# Run type checking
npm run type-check

# Run linting
npm run lint

# Start development server with hot reload
npm run dev
```

### Areas for Contribution

- 🎨 UI/UX improvements
- 🌍 Additional language translations
- 📁 New file format support (JPEG, GIF, etc.)
- ⚡ Performance optimizations
- 🧪 Test coverage expansion
- 📖 Documentation improvements
- 🔧 Better error handling

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
- TypeScript implementation for better developer experience

---

**Made with ❤️ by [calliope-pro](https://github.com/calliope-pro)**

*Star ⭐ this repo if you find it useful!*