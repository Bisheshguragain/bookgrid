# Dashboard Upgrade CTA - Visual Guide

## 📐 Layout Preview

```
┌─────────────────────────────────────────────────────────────────┐
│                         DASHBOARD                                │
└─────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════╗
║  Welcome back, John! 👋                                        ║
║  Here's what's happening with your calendar today              ║
╚═══════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────┐
│  FREE PLAN BANNER (Blue gradient)                               │
├─────────────────────────────────────────────────────────────────┤
│  🆓 Free Plan                                                   │
│                                                                 │
│  📄 0/1 event types     📅 5/100 bookings this month           │
│                                                                 │
│  Upgrade to unlock more event types, analytics, and            │
│  advanced features!                                             │
│                                                                 │
│                                        [🚀 Upgrade Now]         │
└─────────────────────────────────────────────────────────────────┘

OR

┌─────────────────────────────────────────────────────────────────┐
│  PRO PLAN BANNER (Purple gradient)                              │
├─────────────────────────────────────────────────────────────────┤
│  ⭐ Pro Plan                                    [ACTIVE]        │
│                                                                 │
│  📄 3/10 event types    📅 45/1,000 bookings this month        │
│                                                                 │
│                               [⬆️ Upgrade to Business]         │
└─────────────────────────────────────────────────────────────────┘

OR

┌─────────────────────────────────────────────────────────────────┐
│  BUSINESS PLAN BANNER (Gold gradient)                           │
├─────────────────────────────────────────────────────────────────┤
│  💼 Business Plan                               [ACTIVE]        │
│                                                                 │
│  📄 5/∞ event types     📅 200/∞ bookings this month           │
│                                                                 │
│                                    [✓ Current Plan]             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  [New Booking Notification - if any]                           │
└─────────────────────────────────────────────────────────────────┘

┌────────────┬────────────┬────────────┐
│  Upcoming  │   Total    │   Event    │
│   Events   │   Events   │   Types    │
│     3      │     12     │     2      │
└────────────┴────────────┴────────────┘

[Rest of Dashboard Content...]
```

## 🎨 Detailed Banner Designs

### Free Plan Banner

```
╔═══════════════════════════════════════════════════════════════╗
║  Background: Light Blue → Indigo gradient                      ║
║  Border: 2px Blue (border-blue-200)                           ║
║  Padding: 24px all around                                      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║  ┌─ Header ──────────────────────────────────────────────┐   ║
║  │  🆓 Free Plan                                          │   ║
║  │  [21px font, bold, gray-900]                          │   ║
║  └────────────────────────────────────────────────────────┘   ║
║                                                                ║
║  ┌─ Usage Stats ─────────────────────────────────────────┐   ║
║  │  📄 0/1 event types    📅 5/100 bookings this month   │   ║
║  │  [14px font, gray-600, icons: 16px]                   │   ║
║  └────────────────────────────────────────────────────────┘   ║
║                                                                ║
║  ┌─ Message ─────────────────────────────────────────────┐   ║
║  │  Upgrade to unlock more event types, analytics,       │   ║
║  │  and advanced features!                               │   ║
║  │  [14px font, gray-600]                                │   ║
║  └────────────────────────────────────────────────────────┘   ║
║                                                                ║
║  ┌─ CTA Button ──────────────────────────────────────────┐   ║
║  │  🚀 Upgrade Now                                       │   ║
║  │  [Purple → Pink gradient, white text, bold]           │   ║
║  │  [Padding: 12px 24px, rounded-lg, shadow-md]          │   ║
║  │  [Hover: Darker gradient, shadow-lg]                  │   ║
║  └────────────────────────────────────────────────────────┘   ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

### Pro Plan Banner

```
╔═══════════════════════════════════════════════════════════════╗
║  Background: Light Purple → Pink gradient                      ║
║  Border: 2px Purple (border-purple-200)                       ║
║  Padding: 24px all around                                      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║  ┌─ Header ──────────────────────────────────────────────┐   ║
║  │  ⭐ Pro Plan                    [ACTIVE]              │   ║
║  │  [21px font, bold]              [Green badge, 12px]   │   ║
║  └────────────────────────────────────────────────────────┘   ║
║                                                                ║
║  ┌─ Usage Stats ─────────────────────────────────────────┐   ║
║  │  📄 3/10 event types    📅 45/1,000 bookings         │   ║
║  │  [14px font, gray-600, icons: 16px]                   │   ║
║  └────────────────────────────────────────────────────────┘   ║
║                                                                ║
║  ┌─ CTA Button ──────────────────────────────────────────┐   ║
║  │  ⬆️ Upgrade to Business                              │   ║
║  │  [Amber → Orange gradient, white text, bold]          │   ║
║  │  [Padding: 12px 24px, rounded-lg, shadow-md]          │   ║
║  │  [Hover: Darker gradient, shadow-lg]                  │   ║
║  └────────────────────────────────────────────────────────┘   ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

### Business Plan Banner

```
╔═══════════════════════════════════════════════════════════════╗
║  Background: Light Amber → Orange gradient                     ║
║  Border: 2px Amber (border-amber-200)                         ║
║  Padding: 24px all around                                      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║  ┌─ Header ──────────────────────────────────────────────┐   ║
║  │  💼 Business Plan               [ACTIVE]              │   ║
║  │  [21px font, bold]              [Green badge, 12px]   │   ║
║  └────────────────────────────────────────────────────────┘   ║
║                                                                ║
║  ┌─ Usage Stats ─────────────────────────────────────────┐   ║
║  │  📄 5/∞ event types     📅 200/∞ bookings            │   ║
║  │  [14px font, gray-600, icons: 16px]                   │   ║
║  └────────────────────────────────────────────────────────┘   ║
║                                                                ║
║  ┌─ CTA Button ──────────────────────────────────────────┐   ║
║  │  ✓ Current Plan                                       │   ║
║  │  [White bg, gray text, border-2 gray-200]             │   ║
║  │  [Padding: 12px 24px, rounded-lg]                     │   ║
║  │  [Hover: bg-gray-50]                                  │   ║
║  └────────────────────────────────────────────────────────┘   ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

## 📱 Mobile Layout (< 768px)

```
┌───────────────────────────────┐
│  FREE PLAN BANNER             │
├───────────────────────────────┤
│  🆓 Free Plan                 │
│                               │
│  📄 0/1 event types          │
│  📅 5/100 bookings           │
│                               │
│  Upgrade to unlock more       │
│  event types, analytics, and  │
│  advanced features!           │
│                               │
│  ┌─────────────────────────┐ │
│  │  🚀 Upgrade Now         │ │
│  │  [Full Width Button]    │ │
│  └─────────────────────────┘ │
└───────────────────────────────┘
```

## 🎭 Interactive States

### Hover States

#### Free Plan Button
```
Normal:  bg-gradient-to-r from-purple-600 to-pink-600
         shadow-md

Hover:   bg-gradient-to-r from-purple-700 to-pink-700
         shadow-lg
         [Slight scale increase]
```

#### Pro Plan Button
```
Normal:  bg-gradient-to-r from-amber-500 to-orange-500
         shadow-md

Hover:   bg-gradient-to-r from-amber-600 to-orange-600
         shadow-lg
         [Slight scale increase]
```

#### Business Plan Button
```
Normal:  bg-white border-2 border-gray-200

Hover:   bg-gray-50
         [Minimal change - current plan]
```

## 📊 Usage Display Logic

### Event Types Counter
```
Display:  [current]/[max]

Examples:
- Free:     "0/1"
- Pro:      "3/10"
- Business: "5/∞"
```

### Bookings Counter
```
Display:  [current]/[max] bookings this month

Examples:
- Free:     "5/100 bookings this month"
- Pro:      "45/1,000 bookings this month"
- Business: "200/∞ bookings this month"
```

## 🎯 Click Behavior

### All Upgrade Buttons
```
onClick → navigate('/app/pricing')

Flow:
1. User clicks button
2. Navigate to pricing page
3. See full plan comparison
4. Select plan and upgrade
5. Redirect back to dashboard
6. Banner updates with new plan
```

## 🌈 Color Palette

### Free Plan Colors
```css
Background:  from-blue-50 to-indigo-50
Border:      border-blue-200 (#BFDBFE)
Button BG:   from-purple-600 to-pink-600
Button Text: white
Text:        gray-900 (headings), gray-600 (body)
```

### Pro Plan Colors
```css
Background:  from-purple-50 to-pink-50
Border:      border-purple-200 (#E9D5FF)
Button BG:   from-amber-500 to-orange-500
Button Text: white
Badge:       bg-green-100, text-green-700
Text:        gray-900 (headings), gray-600 (body)
```

### Business Plan Colors
```css
Background:  from-amber-50 to-orange-50
Border:      border-amber-200 (#FDE68A)
Button BG:   white
Button Text: gray-700
Badge:       bg-green-100, text-green-700
Border:      border-2 border-gray-200
Text:        gray-900 (headings), gray-600 (body)
```

## 📏 Spacing & Sizing

### Banner Dimensions
```
Padding:     p-6 (24px all sides)
Border:      border-2 (2px)
Rounded:     rounded-xl (12px)
Shadow:      shadow-lg
```

### Button Dimensions
```
Padding:     px-6 py-3 (24px horizontal, 12px vertical)
Font:        font-semibold
Rounded:     rounded-lg (8px)
Shadow:      shadow-md (normal), shadow-lg (hover)
```

### Icon Sizes
```
Plan Icon:   text-xl (20px) in heading
SVG Icons:   w-4 h-4 (16px) in stats
```

### Typography
```
Plan Name:   text-xl (21px), font-bold
Stats:       text-sm (14px), text-gray-600
Message:     text-sm (14px), text-gray-600
Badge:       text-xs (12px), font-bold
```

## 🔄 Dynamic Content Examples

### New Free User (No Usage)
```
🆓 Free Plan
📄 0/1 event types    📅 0/100 bookings this month
Upgrade to unlock more event types, analytics, and advanced features!
[🚀 Upgrade Now]
```

### Active Free User (Near Limit)
```
🆓 Free Plan
📄 1/1 event types    📅 95/100 bookings this month
Upgrade to unlock more event types, analytics, and advanced features!
[🚀 Upgrade Now]
```

### New Pro User
```
⭐ Pro Plan [ACTIVE]
📄 0/10 event types    📅 0/1,000 bookings this month
[⬆️ Upgrade to Business]
```

### Active Business User
```
💼 Business Plan [ACTIVE]
📄 25/∞ event types    📅 1,500/∞ bookings this month
[✓ Current Plan]
```

---

**Status**: ✅ Implemented
**Design**: Consistent with BookGrid brand
**Responsive**: Mobile, tablet, desktop optimized
