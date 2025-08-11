# Contributing to Fillr

Thank you for your interest in contributing to Fillr! We welcome contributions from everyone, whether you're fixing a bug, adding a feature, improving documentation, or suggesting enhancements.

## 🎯 Ways to Contribute

### 🐛 Bug Reports
- Use the [GitHub Issues](https://github.com/calliope-pro/Filler/issues) to report bugs
- Include steps to reproduce, expected behavior, and actual behavior
- Add browser version, operating system, and file sizes when relevant

### ✨ Feature Requests
- Open a [GitHub Discussion](https://github.com/calliope-pro/Filler/discussions) first to discuss new features
- Explain the use case and benefits
- Consider implementation complexity and maintainability

### 🔧 Code Contributions
- Bug fixes
- New file format support
- UI/UX improvements
- Performance optimizations
- Test coverage improvements

### 📖 Documentation
- README improvements
- Code comments
- API documentation
- Tutorial content

### 🌍 Translations
- Add new language support
- Improve existing translations
- Update i18n files in `src/i18n/locales/`

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git
- Modern web browser for testing

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR-USERNAME/Filler.git
   cd Filler
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:5173`

4. **Build for Production**
   ```bash
   npm run build
   ```

### Project Structure

```
src/
├── components/          # React components
│   ├── SizeInput.jsx   # File size input component
│   ├── FormatSelector.jsx
│   ├── ProgressBar.jsx
│   └── LanguageSelector.jsx
├── utils/              # Core utilities
│   ├── fileGenerator.js     # Main file generation logic
│   ├── sizeParser.js        # Size parsing utilities
│   ├── downloadHandler.js   # Download management
│   ├── pngGenerator.js      # PNG format implementation
│   ├── mp3Generator.js      # MP3 format implementation
│   ├── mp4Generator.js      # MP4 format implementation
│   ├── pdfGenerator.js      # PDF format implementation
│   ├── csvGenerator.js      # CSV format implementation
│   └── rawFileGenerator.js  # TXT/raw format implementation
├── i18n/               # Internationalization
│   ├── index.js
│   └── locales/
│       ├── en.json     # English translations
│       └── ja.json     # Japanese translations
├── App.jsx             # Main application component
└── main.jsx           # Entry point
```

## 📝 Development Guidelines

### Code Style
- Use **JavaScript (not TypeScript)** for consistency
- Follow existing code formatting
- Use **camelCase** for variables and functions
- Use **PascalCase** for React components
- Add meaningful comments for complex logic

### React Best Practices
- Use functional components with hooks
- Implement proper error boundaries
- Use `useCallback` and `useMemo` for performance
- Follow the existing component structure

### File Generation Rules
- **Exact byte count**: Generated files must match the specified size exactly
- **Format compliance**: Files must be valid and openable in standard software
- **Memory efficiency**: Use chunked generation for large files
- **Deterministic output**: Avoid random data generation

### Testing
- Test with various file sizes (small: 1KB, medium: 1MB, large: 100MB+)
- Verify file format compatibility with standard viewers/players
- Test on multiple browsers (Chrome, Firefox, Safari)
- Check memory usage with large files

### Performance Considerations
- Avoid blocking the UI thread
- Use Web Workers for heavy computations (if needed)
- Implement proper progress reporting
- Handle memory constraints gracefully

## 🔄 Pull Request Process

### Before Submitting
1. **Create a feature branch**: `git checkout -b feature/your-feature-name`
2. **Make your changes** following the guidelines above
3. **Test thoroughly** with various file sizes and formats
4. **Update documentation** if needed
5. **Commit with clear messages**: `git commit -m "Add: feature description"`

### PR Requirements
- ✅ Clear description of changes
- ✅ Reference related issues/discussions
- ✅ Manual testing completed
- ✅ No breaking changes (or clearly documented)
- ✅ Follows existing code style

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Other: ___

## Testing
- [ ] Tested with small files (< 1MB)
- [ ] Tested with large files (> 10MB)
- [ ] Tested on multiple browsers
- [ ] File format compatibility verified

## Related Issues
Closes #123
```

### Review Process
1. **Maintainer review**: Code quality, functionality, performance
2. **Testing**: Automated and manual testing
3. **Discussion**: Address feedback and suggestions
4. **Approval**: Once ready, PR will be merged

## 📋 Specific Contribution Areas

### 🎨 UI/UX Improvements
- Responsive design enhancements
- Accessibility improvements (ARIA labels, keyboard navigation)
- Dark/light theme support
- Better error messaging
- Mobile experience optimization

### 📁 New File Formats
When adding new formats:
1. Create generator in `src/utils/[format]Generator.js`
2. Export a function: `export function generate[FORMAT](targetSize)`
3. Add to `src/utils/fileGenerator.js`
4. Add format option to `src/components/FormatSelector.jsx`
5. Add translations to i18n files
6. Update README documentation

### 🌍 Internationalization
1. Add language files in `src/i18n/locales/[lang].json`
2. Update `src/i18n/index.js` to include new language
3. Add language option to `LanguageSelector.jsx`
4. Update `index.html` SEO meta tags
5. Test language switching functionality

### ⚡ Performance Optimizations
- Memory usage improvements
- Faster file generation algorithms
- Better progress reporting
- Chunked processing enhancements

## 🚫 What We Don't Accept

- **Random data generation**: Security and reproducibility concerns
- **Server-side processing**: Client-side only architecture
- **Complex dependencies**: Keep bundle size reasonable
- **Breaking changes** without discussion
- **Proprietary formats** requiring licenses

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: General questions, ideas, help
- **Pull Request Comments**: Implementation discussions

### Response Times
- **Issues**: Typically within 2-3 days
- **Pull Requests**: Within 1 week for initial review
- **Discussions**: Community-driven, faster responses

### Maintainer Notes
- We prioritize **quality** over speed
- **Security** and **privacy** are paramount
- **User experience** drives decisions
- **Open source values** guide the project

## 🎉 Recognition

Contributors are recognized in:
- GitHub contributor graphs
- Release notes for significant contributions
- README acknowledgments for major features

---

Thank you for contributing to Fillr! Every contribution, no matter how small, helps make this tool better for developers worldwide. 🙏

**Happy coding!** 🚀