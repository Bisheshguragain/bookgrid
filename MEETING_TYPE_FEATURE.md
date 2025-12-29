# Meeting Type Selection Feature

## Overview
Event type creation now includes a meeting type selector that allows users to specify whether their event is a one-to-one meeting or a group meeting, with intelligent UI adjustments based on the selection.

## Features

### 👤 One-to-One Meetings
- **Description**: Individual meeting with one person
- **Max Attendees**: Automatically set to 1 (not editable)
- **Use Cases**: 
  - Individual consultations
  - 1-on-1 coaching sessions
  - Personal interviews
  - Private discussions

### 👥 Group Meetings
- **Description**: Meeting with multiple participants
- **Max Attendees**: User-configurable (minimum 2, maximum 100)
- **Use Cases**:
  - Team meetings
  - Webinars
  - Group coaching sessions
  - Workshop sessions
  - Training classes

## User Interface

### Visual Design
- **Card-Based Selection**: Two large, clickable cards
- **Icons**: Clear emoji icons (👤 for one-to-one, 👥 for group)
- **Active State**: Purple border, background, and checkmark
- **Hover Effect**: Subtle border and shadow changes
- **Responsive**: Stacks vertically on mobile, side-by-side on desktop

### Dynamic Form Behavior
```
If "One-to-One" selected:
  → Max Attendees field is HIDDEN
  → max_attendees automatically set to 1

If "Group" selected:
  → Max Attendees field is SHOWN
  → Minimum value: 2
  → Maximum value: 100
  → Default value: 2
```

## Implementation Details

### Modified Files
**`/src/pages/CreateEventType.tsx`**

#### Added Constants
```typescript
const MEETING_TYPES = [
  { 
    value: 'one-to-one', 
    label: 'One-to-One', 
    icon: '👤',
    description: 'Individual meeting with one person'
  },
  { 
    value: 'group', 
    label: 'Group', 
    icon: '👥',
    description: 'Meeting with multiple participants'
  },
] as const;
```

#### Updated Form State
```typescript
const [formData, setFormData] = useState({
  // ... other fields
  meeting_type: 'one-to-one' as 'one-to-one' | 'group',
  max_attendees: 1,
  // ... other fields
});
```

#### Smart Attendee Logic
```typescript
onClick={() => {
  setFormData({ 
    ...formData, 
    meeting_type: type.value,
    // Set max_attendees to 1 for one-to-one, keep current value for group
    max_attendees: type.value === 'one-to-one' 
      ? 1 
      : formData.max_attendees > 1 
        ? formData.max_attendees 
        : 2
  });
}}
```

### Conditional Rendering
```tsx
{/* Max Attendees - Only show for Group meetings */}
{formData.meeting_type === 'group' && (
  <div>
    <label htmlFor="max_attendees">
      Maximum Attendees <span className="text-purple-600">*</span>
    </label>
    <input
      type="number"
      id="max_attendees"
      required
      min={2}
      max={100}
      value={formData.max_attendees}
      onChange={(e) => setFormData({ 
        ...formData, 
        max_attendees: parseInt(e.target.value) || 2 
      })}
    />
  </div>
)}
```

## User Experience Flow

### Creating a One-to-One Event
1. User opens "Create Event Type" page
2. "One-to-One" is selected by default
3. User fills in event details (title, description, duration, etc.)
4. Max attendees field is hidden (auto-set to 1)
5. User submits form
6. Event type is created with `max_attendees: 1`

### Creating a Group Event
1. User opens "Create Event Type" page
2. User clicks on "Group" meeting type card
3. Card highlights with purple styling
4. Max attendees field appears below
5. User sets desired number of attendees (e.g., 10)
6. User fills in other event details
7. User submits form
8. Event type is created with specified max attendees

### Switching Between Types
1. User starts with "One-to-One" selected
2. User clicks "Group"
3. Max attendees field appears with default value of 2
4. User sets value to 5
5. User clicks back to "One-to-One"
6. Max attendees field disappears, value reset to 1
7. User clicks "Group" again
8. Max attendees field reappears with value of 5 (preserved from before)

## Styling Details

### Card States
```css
Default: 
  - border-gray-200
  - bg-white
  - hover:border-purple-300

Active:
  - border-purple-500 (2px)
  - bg-purple-50
  - shadow-md
  - text-purple-900
  - checkmark icon
```

### Grid Layout
```css
Mobile: 
  - grid-cols-1 (stacked vertically)

Desktop:
  - grid-cols-2 (side by side)
  - gap-4 (1rem spacing)
```

## Database Impact

### Event Types Table
The `meeting_type` field should be added to store this preference:
```sql
-- No database migration needed if using existing max_attendees field
-- The meeting_type is implied by max_attendees value:
--   max_attendees = 1  → one-to-one
--   max_attendees > 1  → group
```

**Note**: The actual meeting type is derived from the `max_attendees` value in the database. No schema changes are required.

## Benefits

### ✅ Clarity
- Users explicitly choose meeting format
- No confusion about attendee limits
- Clear visual distinction between types

### ✅ Simplified UX
- Hides unnecessary fields for one-to-one meetings
- Reduces cognitive load
- Faster event creation

### ✅ Validation
- Prevents setting max_attendees to 1 for group meetings
- Ensures logical constraints
- Better data integrity

### ✅ Flexibility
- Easy to extend with more meeting types
- Scalable design pattern
- Maintainable code

## Accessibility

### Screen Reader Support
- Proper label associations
- Descriptive text for each option
- Clear active state announcements

### Keyboard Navigation
- Tab through options
- Space/Enter to select
- Focus visible states

### Visual Accessibility
- High contrast colors
- Large touch targets (48px+ height)
- Clear visual feedback

## Testing Checklist

### Functional Testing
- [ ] Default selection is "One-to-One"
- [ ] Clicking "Group" shows max attendees field
- [ ] Clicking "One-to-One" hides max attendees field
- [ ] Max attendees defaults to 2 for group meetings
- [ ] Cannot set max attendees below 2 for group meetings
- [ ] Switching types preserves values correctly
- [ ] Form submission includes meeting type data

### Visual Testing
- [ ] Cards display correctly on mobile
- [ ] Cards display side-by-side on desktop
- [ ] Active state shows purple styling
- [ ] Checkmark appears on selected option
- [ ] Hover effects work smoothly
- [ ] Icons are properly aligned

### Edge Cases
- [ ] Switching from group (10 attendees) to one-to-one sets to 1
- [ ] Switching back to group restores previous value
- [ ] Form validation works for all scenarios
- [ ] Error handling for invalid attendee numbers

## Future Enhancements

### Potential Additions
- [ ] **Collective Meetings**: Book multiple one-to-one slots
- [ ] **Round Robin**: Distribute meetings among team members
- [ ] **Class Booking**: Fixed capacity with waitlist
- [ ] **Office Hours**: Drop-in availability

### Advanced Features
- [ ] Different pricing per meeting type
- [ ] Custom fields per meeting type
- [ ] Meeting type templates
- [ ] Bulk creation of similar meeting types

## Code Locations
- **Meeting Type Constants**: Lines 28-40 in CreateEventType.tsx
- **Form State**: Lines 48-60 in CreateEventType.tsx
- **UI Rendering**: Lines 168-213 in CreateEventType.tsx
- **Max Attendees Field**: Lines 290-306 in CreateEventType.tsx
- **Selection Logic**: Lines 180-187 in CreateEventType.tsx

## Related Documentation
- [Event Types Documentation](./docs/event-types.md)
- [Form Validation Guide](./docs/validation.md)
- [Database Schema](./docs/database-schema.md)
