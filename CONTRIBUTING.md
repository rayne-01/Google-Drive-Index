# Contributing to Google Drive Index

Thank you for your interest in contributing! 🎉

## 🤝 How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/yourusername/google-drive-index/issues)
2. Create new issue with:
   - Clear title
   - Detailed description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details

### Suggesting Features

1. Check [discussions](https://github.com/yourusername/google-drive-index/discussions)
2. Create feature request with:
   - Clear use case
   - Proposed solution
   - Alternative approaches
   - Mockups (if applicable)

### Pull Requests

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run typecheck && npm run lint`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open Pull Request

## 📝 Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/google-drive-index.git
cd google-drive-index

# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Format code
npm run format
```

## 🏗️ Project Structure

```
src/
├── index.ts              # Worker entry point
├── config.ts             # Configuration
├── types/                # Type definitions
├── database/             # Database layer
├── setup/                # Setup wizard
├── utils/                # Utilities
├── services/             # Core services
├── router/               # Request routing
├── admin/                # Admin panel
└── templates/            # HTML templates
```

## 📋 Code Guidelines

### TypeScript

- Use strict TypeScript
- Define interfaces for all data structures
- Avoid `any` type unless necessary
- Document complex logic

### Naming Conventions

- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Interfaces: `PascalCase` (no `I` prefix)

### Code Style

```typescript
// Good
export async function getUserData(userId: string): Promise<UserData> {
  const data = await fetchUser(userId);
  return processUserData(data);
}

// Bad
export async function get_user_data(userId) {
  var data = await fetchUser(userId)
  return processUserData(data)
}
```

### Comments

```typescript
/**
 * Fetch user data from database
 * @param userId - User's unique identifier
 * @returns User data object
 */
export async function getUserData(userId: string): Promise<UserData> {
  // Implementation
}
```

## ✅ Before Submitting PR

- [ ] Code follows style guidelines
- [ ] TypeScript compiles without errors
- [ ] Linting passes
- [ ] Documentation updated
- [ ] Tests added (if applicable)
- [ ] Commit messages are clear
- [ ] PR description is detailed

## 🔍 Review Process

1. Maintainer reviews PR
2. Feedback provided (if needed)
3. Changes requested or approved
4. Merged to main branch
5. Deployed automatically via GitHub Actions

## 📚 Documentation

When adding features:
- Update README.md
- Add to relevant documentation files
- Include code examples
- Document configuration options

## 🐛 Debugging

```bash
# Stream worker logs
wrangler tail

# Local development with persistence
wrangler dev --local --persist

# Check TypeScript errors
npm run typecheck
```

## 🎯 Priority Areas

We're especially interested in:
- [ ] Bug fixes
- [ ] Performance improvements
- [ ] Documentation improvements
- [ ] Test coverage
- [ ] New backend support
- [ ] UI enhancements
- [ ] Mobile optimization

## 💬 Communication

- **GitHub Issues** - Bug reports
- **GitHub Discussions** - Questions
- **Pull Requests** - Code contributions
- **Telegram** - Quick chat

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

Thank you for making Google Drive Index better! 🎉
