# Onboarding Tour Documentation

## Overview

The GLINR Task Manager includes an interactive onboarding tour for first-time users, powered by [driver.js](https://driverjs.com/). The tour features a beautiful liquid glass design that matches the overall aesthetic of the application.

## Features

- ✅ **Automatic trigger** - Tour starts automatically for first-time users after 1.5 seconds
- ✅ **Progress tracking** - Shows "X of Y" progress through the tour
- ✅ **One-time experience** - Uses localStorage to track completion
- ✅ **Manual trigger** - Can be reset and replayed from Settings
- ✅ **Liquid glass styling** - Custom styles matching the macOS Sequoia Liquid Glass design
- ✅ **Keyboard navigation** - Support for ESC to close, arrows to navigate
- ✅ **Responsive** - Works on mobile and desktop

## Tour Steps

The tour guides users through 5 key areas:

1. **Welcome Screen** - Introduction to GLINR
2. **Sidebar Navigation** - Overview of main navigation menu
3. **Command Palette** - Quick actions with ⌘K shortcut
4. **Theme Toggle** - Dark/Light/Midnight theme preferences
5. **Completion** - Final message about creating tasks

## Implementation Details

### Component Location

- **Component**: `ui/src/components/shared/OnboardingTour.tsx`
- **Hook**: `useOnboardingTour()`
- **Storage Key**: `glinr-onboarding-completed`

### Tour Attributes

The following `data-tour` attributes are used to target elements:

| Attribute | Element | Location |
|-----------|---------|----------|
| `data-tour="sidebar-nav"` | Navigation menu | `RootLayout.tsx:101` |
| `data-tour="command-palette"` | Search button | `RootLayout.tsx:247` |
| `data-tour="theme-toggle"` | Theme toggle wrapper | `RootLayout.tsx:256` |

### Custom Styling

Custom liquid glass styles are defined in `ui/src/index.css` (lines 329-519):

- **Glass popover** - Frosted glass background with blur
- **Vibrant colors** - OKLCH color space for consistency
- **Smooth animations** - Cubic-bezier transitions
- **Theme support** - Separate styles for Light, Dark, and Midnight modes
- **Shadow system** - Multi-layer shadows for depth

## Usage

### For End Users

The tour will automatically start when a user visits the app for the first time. To replay the tour:

1. Go to Settings
2. Click "Replay Onboarding Tour" (or use Command Palette: ⌘K → "Start Tour")

### For Developers

#### Resetting the Tour

To reset the tour during development:

```typescript
// In browser console
localStorage.removeItem('glinr-onboarding-completed');
// Then refresh the page
```

Or use the hook:

```typescript
import { useOnboardingTour } from '@/components/shared/OnboardingTour';

function MyComponent() {
  const { resetTour, startTour } = useOnboardingTour();

  return (
    <button onClick={() => {
      resetTour();
      startTour();
    }}>
      Replay Tour
    </button>
  );
}
```

#### Adding New Tour Steps

To add new steps to the tour, edit `OnboardingTour.tsx`:

```typescript
const tourSteps: DriveStep[] = [
  // ... existing steps
  {
    element: '[data-tour="my-new-feature"]', // Target element
    popover: {
      title: 'New Feature',
      description: 'Description of the feature',
      side: 'bottom', // top, bottom, left, right
      align: 'center', // start, center, end
    },
  },
];
```

Then add the `data-tour` attribute to your target element:

```tsx
<div data-tour="my-new-feature">
  Your feature here
</div>
```

## Configuration

### Tour Options

The tour is configured with these driver.js options:

```typescript
{
  showProgress: true,          // Show "1 of 5" progress
  animate: true,               // Enable animations
  smoothScroll: true,          // Smooth scroll to elements
  allowClose: true,            // Allow ESC to close
  stagePadding: 12,            // Padding around highlighted element
  stageRadius: 20,             // Border radius (matches liquid design)
  nextBtnText: 'Next →',
  prevBtnText: '← Back',
  doneBtnText: 'Get Started',
  progressText: '{{current}} of {{total}}',
}
```

### Auto-start Delay

The tour auto-starts after 1500ms (1.5 seconds) for first-time users. To change this:

```typescript
// In OnboardingTour.tsx, line 97
const timer = setTimeout(() => {
  startTour();
}, 1500); // Change this value
```

## Testing

### Manual Testing Checklist

- [ ] Tour auto-starts for new users
- [ ] Progress indicator shows correctly
- [ ] All tour steps highlight the correct elements
- [ ] Navigation buttons work (Next, Back, Close)
- [ ] Tour completes and marks as done in localStorage
- [ ] Tour doesn't auto-start on subsequent visits
- [ ] Manual replay works from Settings
- [ ] Keyboard shortcuts work (ESC to close)
- [ ] Tour looks good in Light/Dark/Midnight themes
- [ ] Tour is responsive on mobile devices

### Browser Console Test

```javascript
// Clear storage and test auto-start
localStorage.clear();
location.reload();

// Check storage after completion
localStorage.getItem('glinr-onboarding-completed'); // Should be 'true'
```

## Troubleshooting

### Tour doesn't start automatically

1. Check browser console for errors
2. Verify `driver.js` is installed: `pnpm list driver.js`
3. Check if localStorage is enabled
4. Verify the component is rendered in App.tsx

### Element not highlighting correctly

1. Verify the `data-tour` attribute exists on the target element
2. Check if the element is visible when the tour step runs
3. Ensure the element isn't hidden behind other UI elements
4. Try adjusting `stagePadding` and `stageRadius` in tour options

### Styling issues

1. Verify `driver.js/dist/driver.css` is imported in `OnboardingTour.tsx`
2. Check custom styles in `index.css` (lines 329-519)
3. Ensure theme classes are applied correctly
4. Check browser DevTools for CSS conflicts

## Dependencies

- **driver.js**: `^1.4.0` - Tour library
- **React**: For component and hooks
- **localStorage**: For persistence

## Future Enhancements

Potential improvements for the onboarding tour:

- [ ] Add interactive elements within tour steps (e.g., "Try clicking this")
- [ ] Track which steps users skip/complete
- [ ] Add different tours for different user roles
- [ ] Video tutorials embedded in tour steps
- [ ] Analytics to track tour completion rates
- [ ] Conditional tours based on feature flags
- [ ] Multi-language support for tour content

## Related Files

| File | Purpose |
|------|---------|
| `ui/src/components/shared/OnboardingTour.tsx` | Main tour component |
| `ui/src/layouts/RootLayout.tsx` | Tour target elements |
| `ui/src/index.css` | Custom tour styles |
| `ui/src/App.tsx` | Tour initialization |
| `ui/package.json` | driver.js dependency |

## Resources

- [driver.js Documentation](https://driverjs.com/docs/getting-started)
- [driver.js Examples](https://driverjs.com/docs/examples)
- [GLINR Design System](./UI_GUIDELINES.md)
