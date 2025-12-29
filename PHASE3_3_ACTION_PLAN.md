# Phase 3.3 Action Plan - Reminders System Complete Integration

**Status**: Starting Phase 3.3  
**Priority**: HIGH - Automated reminders are critical for user retention  
**Time Estimate**: 3-4 hours  
**Target Date**: December 27-28, 2025  

---

## Overview

The reminders page exists but needs:
1. Real-time updates via Supabase
2. Email integration (already done, needs connection)
3. Job scheduler for automatic sends
4. UI enhancements and history display
5. Manual send and edit capabilities

---

## Current State

**File**: `src/pages/Reminders.tsx`  
**Status**: Exists but minimal functionality  
**Lines**: ~50  
**Features**: None (placeholder only)

---

## Phase 3.3 Breakdown

### Task 1: Reminders Page UI Enhancement (1 hour)

**File**: `src/pages/Reminders.tsx`

**Current State**: Empty placeholder

**New Features to Add**:

1. **Reminder List View**
   - Table/card layout showing:
     - Event name
     - Guest email
     - Scheduled send time
     - Status (pending, sent, failed)
     - Days before event
   - Pagination or infinite scroll
   - Search/filter by event

2. **Create Reminder**
   - Modal/form to create new reminders
   - Fields:
     - Event type selector (dropdown)
     - Days before event (1-7)
     - Time of day to send
     - Custom message (optional)
   - Save button (stores in DB)

3. **Edit Reminder**
   - Click row to edit
   - Update days, time, message
   - Save changes
   - Cancel button

4. **Delete Reminder**
   - Confirmation modal
   - Soft delete (marks inactive, not removed)

5. **Reminder History**
   - View sent reminders log
   - Timestamp of send
   - Status (delivered, bounced)
   - Recipient email
   - Open rate (if available)

6. **Statistics**
   - Total reminders configured
   - Reminders sent this month
   - Success rate %
   - Failed sends

**UI Layout**:
```
┌─ Reminders ──────────────────────────────────────────┐
│                                                      │
│  [+ Create Reminder]  [Filter v]  [Search...]      │
│                                                      │
│  ┌─ Event Type ─┬─ Days ─┬─ Time ─┬─ Status ─┬─ ──┐ │
│  │ Consultation │  1     │ 10:00  │ Active   │ ✎ ✗│ │
│  │ Coffee Chat  │  2     │ 09:00  │ Active   │ ✎ ✗│ │
│  └─────────────┴────────┴────────┴──────────┴────┘ │
│                                                      │
│  ┌─ Statistics ─────────────────────────────────┐  │
│  │ Total: 24  │  Sent: 142  │  Success: 98%    │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Code Structure**:
```typescript
export function Reminders() {
  // State
  const [reminders, setReminders] = useState<ReminderRule[]>([]);
  const [history, setHistory] = useState<ReminderLog[]>([]);
  const [stats, setStats] = useState({...});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Hooks
  const { user } = useAuthStore();
  const { reminders: realtimeReminders } = useRealtimeReminders({...});
  
  // Load data
  useEffect(() => { loadReminders(); }, [user]);
  
  // Handlers
  const createReminder = async (data) => {...};
  const updateReminder = async (id, data) => {...};
  const deleteReminder = async (id) => {...};
  const sendReminderNow = async (id) => {...};
  
  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Stats Cards */}
      {/* Reminders Table */}
      {/* Create Modal */}
      {/* History Section */}
    </div>
  );
}
```

---

### Task 2: Real-time Hook for Reminders (30 minutes)

**New File**: `src/hooks/useRealtimeReminders.ts`

**Features**:
- Subscribe to reminders table (user's reminders)
- Subscribe to reminders_log table (history)
- Track INSERT/UPDATE/DELETE events
- Return reminders, history, stats
- Auto-refresh on changes

**Implementation**:
```typescript
interface UseRealtimeRemindersReturn {
  reminders: ReminderRule[];
  history: ReminderLog[];
  stats: ReminderStats;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useRealtimeReminders({
  userId,
  enabled = true,
}: UseRealtimeRemindersOptions): UseRealtimeRemindersReturn {
  // Similar to useRealtimeBookings
  // Subscribe to reminders + reminders_log
  // Handle real-time updates
}
```

---

### Task 3: Reminders Database Schema Updates (30 minutes)

**New/Updated Tables**:

1. **reminders_rules** (if not exists)
   ```sql
   CREATE TABLE reminders_rules (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users_profile(id),
     event_type_id UUID REFERENCES event_types(id),
     days_before INT DEFAULT 1,
     send_time TIME DEFAULT '09:00:00',
     custom_message TEXT,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     UNIQUE(user_id, event_type_id, days_before)
   );
   ```

2. **reminders_log** (if not exists)
   ```sql
   CREATE TABLE reminders_log (
     id UUID PRIMARY KEY,
     reminder_rule_id UUID REFERENCES reminders_rules(id),
     booking_id UUID REFERENCES bookings(id),
     recipient_email VARCHAR(255),
     scheduled_time TIMESTAMP,
     sent_time TIMESTAMP,
     status VARCHAR(50), -- pending, sent, bounced, failed
     error_message TEXT,
     open_count INT DEFAULT 0,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

**RLS Policies**:
- Users can only see/edit their own reminders
- Users can only see their own reminder logs

---

### Task 4: Email Integration Connection (30 minutes)

**File**: `src/services/emailService.ts` (already exists)

**New Function to Add**:
```typescript
export async function sendScheduledReminder(
  booking: Booking,
  reminderRule: ReminderRule,
  emailService: EmailService
): Promise<void> {
  // Format event date/time
  // Send email using sendReminderEmail()
  // Log in reminders_log table
  // Handle errors
}
```

**Integration**:
- Create job scheduler (Supabase cron or external job queue)
- Run reminders check every 30 minutes
- Find bookings matching reminder rules
- Send emails via Resend
- Log results

---

### Task 5: Job Scheduler Implementation (1 hour)

**Options**:
1. **Supabase Cron** (if available)
2. **External Job Queue** (Bull, Agenda)
3. **Netlify Functions** (serverless)
4. **Background Service** (Node.js)

**Recommended**: External job queue (Bull) for reliability

**Implementation**:
```typescript
// src/services/reminderScheduler.ts
import Bull from 'bull';

const reminderQueue = new Bull('reminders', {
  redis: REDIS_URL,
});

reminderQueue.process(async (job) => {
  // Process scheduled reminders
  // Find matching bookings
  // Send emails
  // Update logs
});

// Run every 30 minutes
reminderQueue.add({}, {
  repeat: { cron: '*/30 * * * *' },
});
```

---

### Task 6: Manual Reminder Send (15 minutes)

**Feature**: "Send Now" button on reminder row

**Functionality**:
```typescript
async function sendReminderNow(reminderId: string) {
  // Load reminder rule
  // Find upcoming booking
  // Send email immediately
  // Log action
  // Show success/error toast
}
```

**Button**: Add to each reminder row
- Click → loads event selector
- User selects which booking to remind
- Confirmation → sends email
- Success message shows

---

### Task 7: Documentation (30 minutes)

**Files to Create**:
1. `PHASE3_3_REMINDERS_GUIDE.md` - Implementation guide
2. Update `DOCUMENTATION_INDEX.md`
3. Update `STATUS_SNAPSHOT.md`

---

## Implementation Order

1. ✅ **Task 4** - Add email function (10 min) - extends existing service
2. ✅ **Task 3** - Database schema (20 min) - independent
3. **Task 2** - Real-time hook (30 min) - depends on DB
4. **Task 1** - UI page (60 min) - uses hook + DB
5. **Task 5** - Job scheduler (60 min) - integrates email service
6. **Task 6** - Manual send (15 min) - extends Task 1
7. **Task 7** - Documentation (30 min) - covers all

**Parallel Work**: Tasks 2, 3, 4 can be done in parallel

---

## Testing Plan

### Unit Tests
- Email sending function
- Database schema migrations
- Hook data transformations

### Integration Tests
- Hook + component integration
- Email + database logging
- Job scheduler reliability

### Manual Tests
- Create reminder rule
- Verify email sent
- Check database logs
- Test real-time updates
- Test edge cases (multiple reminders, failures)

### Load Tests
- 1000 reminders per user
- 10,000 scheduled sends per hour
- Concurrent email sends

---

## Success Criteria

✅ Reminder rules can be created/edited/deleted  
✅ Reminders automatically sent at scheduled time  
✅ Email deliverability > 95%  
✅ Real-time updates on reminder table  
✅ Complete reminder history and logs  
✅ Manual send functionality works  
✅ Error handling and retry logic  
✅ Zero data loss on failures  
✅ Mobile responsive UI  
✅ Full TypeScript type safety  

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Email service fails | High | Add retry logic + fallback queue |
| Job scheduler crashes | High | Health checks + auto-restart |
| DB schema conflicts | Medium | Backup before migration |
| Real-time connection drops | Low | Fallback to polling |
| High volume sends | Medium | Rate limiting + batch processing |

---

## Related Existing Code

**Email Service**: `src/services/emailService.ts` (7 email types ready)  
**Database Types**: `src/lib/database.types.ts` (includes reminders types)  
**Real-time Hook**: `src/hooks/useRealtimeBookings.ts` (template to follow)  
**Example Page**: `src/pages/Dashboard.tsx` (similar UI pattern)

---

## Estimated Completion

**Best Case**: 2.5 hours (all tasks complete)  
**Realistic**: 3.5 hours (includes debugging)  
**With Testing**: 4 hours (thorough testing)  

**Target**: Complete Phase 3.3 by end of December 27-28

---

## Deliverables

1. ✅ Complete Reminders.tsx page
2. ✅ useRealtimeReminders hook
3. ✅ Database schema + migrations
4. ✅ Email integration
5. ✅ Job scheduler implementation
6. ✅ Manual send functionality
7. ✅ Documentation
8. ✅ All tests passing
9. ✅ Zero TypeScript errors
10. ✅ Production-ready code

---

## Next Phase (Phase 4)

After Phase 3.3 completion:
- Advanced features (calendar sync, payments, waiting list)
- Testing suite (Vitest, Cypress)
- Performance optimization
- Deployment & DevOps
- Final polish & documentation

