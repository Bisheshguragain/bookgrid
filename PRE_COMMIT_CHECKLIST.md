# Pre-Commit Checklist

Use this checklist before committing code changes.

## Code Quality

### TypeScript
- [ ] All files compile without errors
- [ ] No `any` types (unless justified)
- [ ] All imports are used
- [ ] All variables are defined before use
- [ ] No console.log in production code
- [ ] Proper error types in catch blocks

### Components
- [ ] Components have prop interfaces
- [ ] All props are documented
- [ ] Components are reusable
- [ ] No hardcoded strings (use constants)
- [ ] Proper className usage with cn utility
- [ ] Loading states handled
- [ ] Error states handled

### Forms
- [ ] Zod schemas defined
- [ ] Form validation working
- [ ] Error messages display
- [ ] Success feedback provided
- [ ] Loading state during submission
- [ ] Accessibility labels present

### Database
- [ ] All queries scoped to user_id
- [ ] RLS policies checked
- [ ] Error handling in queries
- [ ] No N+1 queries
- [ ] Proper type definitions used

## Styling

### Tailwind CSS
- [ ] Consistent spacing (p-4, m-2, gap-6)
- [ ] Proper color scheme (gray, primary)
- [ ] Responsive design (mobile first)
- [ ] No custom CSS in components
- [ ] Hover/focus states present
- [ ] Disabled states styled

### Responsive Design
- [ ] Mobile: 375px width
- [ ] Tablet: 768px width
- [ ] Desktop: 1200px width
- [ ] All layouts tested
- [ ] Touch targets 44px minimum

## Accessibility

- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Form labels present
- [ ] Color contrast sufficient
- [ ] Keyboard navigation works
- [ ] Focus indicators visible

## Testing

### Manual Testing
- [ ] Happy path works
- [ ] Error states tested
- [ ] Loading states visible
- [ ] Form validation works
- [ ] Timezone handling correct
- [ ] Mobile layout works

### Edge Cases
- [ ] Empty states handled
- [ ] Missing data handled
- [ ] Network errors handled
- [ ] Permission errors handled
- [ ] Timeout scenarios handled

## Documentation

### Code Comments
- [ ] Complex logic explained
- [ ] Non-obvious decisions commented
- [ ] TODO items documented
- [ ] Function purposes clear

### File Headers
- [ ] Component purpose stated
- [ ] Key features listed
- [ ] Related files referenced

## Security

- [ ] No sensitive data in code
- [ ] Environment variables used
- [ ] User input validated
- [ ] User data scoped correctly
- [ ] HTTPS used
- [ ] Tokens handled securely

## Performance

- [ ] No unnecessary re-renders
- [ ] Images optimized
- [ ] Bundle size checked
- [ ] Database queries efficient
- [ ] No console warnings
- [ ] Load times acceptable

## Git Hygiene

- [ ] Commit message clear
- [ ] Related commits grouped
- [ ] No debug code left
- [ ] No console.log statements
- [ ] Branch name descriptive
- [ ] No merge conflicts left

## File Organization

- [ ] File in correct folder
- [ ] Proper file naming
- [ ] Exports properly defined
- [ ] Imports use relative paths
- [ ] No circular dependencies

## Browser Testing

- [ ] Chrome latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Mobile Safari
- [ ] Chrome Mobile

## Checklist by Change Type

### New Component
- [ ] Component file created
- [ ] Props interface defined
- [ ] Default export used
- [ ] Storybook entry ready (future)
- [ ] Unit test ready (future)
- [ ] Usage documented
- [ ] Added to index if applicable

### New Page
- [ ] Page file created
- [ ] Route added to App.tsx
- [ ] Link added to navigation
- [ ] Page title set
- [ ] Loading state present
- [ ] Error state present
- [ ] Mobile layout tested

### New Database Query
- [ ] Properly typed
- [ ] User scoped
- [ ] Error handled
- [ ] Null checks present
- [ ] Performance considered
- [ ] RLS policy exists

### New Form
- [ ] Zod schema created
- [ ] Validation messages clear
- [ ] Submit button states
- [ ] Loading state visible
- [ ] Success/error feedback
- [ ] Accessible labels

### New API Integration
- [ ] Types defined
- [ ] Error handling
- [ ] Loading states
- [ ] Retry logic (if needed)
- [ ] Rate limiting considered
- [ ] Error messages user-friendly

### Documentation Update
- [ ] Clear and accurate
- [ ] Examples provided
- [ ] Links updated
- [ ] Format consistent
- [ ] Spell-checked
- [ ] Links work

## Pre-Push Review

### Code Quality
- [ ] Run linter: `npm run lint`
- [ ] TypeScript check: `npm run build` (test)
- [ ] No console errors/warnings
- [ ] All tests pass (when added)

### Browser Check
- [ ] Open dev server
- [ ] Test in Chrome DevTools mobile
- [ ] Check responsive design
- [ ] Verify loading states
- [ ] Check error scenarios

### Documentation
- [ ] README updated (if needed)
- [ ] Comments clear
- [ ] File organization logical
- [ ] Related files linked

## Final Checklist

Before clicking "Push":

- [ ] All above items checked
- [ ] Code compiles without errors
- [ ] No console warnings/errors
- [ ] Tested in browser (mobile + desktop)
- [ ] Commit message descriptive
- [ ] Related commits grouped
- [ ] No sensitive data exposed
- [ ] Performance acceptable

## Commit Message Format

```
type(scope): brief description

Longer description explaining:
- What changed
- Why it changed
- Any breaking changes
- Related issue numbers

Fixes #123
```

### Types
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Styling changes
- `refactor:` Code refactoring
- `perf:` Performance improvement
- `test:` Test additions
- `chore:` Build/tooling

## Related Checklists

- [DEVELOPMENT_CHECKLIST.md](./DEVELOPMENT_CHECKLIST.md) - Feature planning
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Setup guide
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Code patterns

---

**Last Updated**: December 27, 2025  
**Compliance**: Follow before each commit
