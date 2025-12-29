# 📊 Visual Guide - Free Tier & Subscription System

## 🎨 Plan Comparison Visual

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BOOKGRID PRICING PLANS                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────┬──────────────────────────┐
│       FREE           │      PRO ⭐          │      BUSINESS            │
│      £0/month        │    £12/month         │      £24/month           │
├──────────────────────┼──────────────────────┼──────────────────────────┤
│                      │                      │                          │
│ ✅ 1 event type      │ ✅ 10 event types    │ ✅ Unlimited events      │
│ ✅ Basic avail       │ ✅ Advanced avail    │ ✅ Advanced avail        │
│ ✅ Email reminders   │ ✅ Email reminders   │ ✅ Email reminders       │
│ ✅ Public link       │ ✅ Public link       │ ✅ Public link           │
│ ✅ 100 bookings/mo   │ ✅ Analytics         │ ✅ Analytics++           │
│ ❌ Analytics         │ ✅ Integrations      │ ✅ Integrations          │
│ ❌ Integrations      │ ✅ Custom branding   │ ✅ Custom branding       │
│ ❌ Custom branding   │ ✅ API access        │ ✅ Priority support      │
│ ❌ API access        │ ✅ 1,000 bookings/mo │ ✅ Unlimited bookings    │
│                      │                      │ ✅ API access            │
│  [Get Started]       │  [Upgrade Now]       │  [Upgrade Now]           │
│                      │                      │                          │
└──────────────────────┴──────────────────────┴──────────────────────────┘
```

---

## 🚦 User Journey - Free Tier

### Creating First Event Type ✅

```
User Opens "Create Event Type"
         │
         ▼
  ┌──────────────────┐
  │ Check User Plan  │
  │  Plan: FREE      │
  │  Current: 0/1    │
  └────────┬─────────┘
           │
           ▼
    ✅ CAN CREATE!
           │
           ▼
  ┌──────────────────┐
  │  Create Event    │
  │  Type Form       │
  │  [Save]          │
  └────────┬─────────┘
           │
           ▼
    Event Type Created ✅
```

### Hitting Event Type Limit ❌

```
User Tries to Create 2nd Event Type
         │
         ▼
  ┌──────────────────┐
  │ Check User Plan  │
  │  Plan: FREE      │
  │  Current: 1/1    │
  └────────┬─────────┘
           │
           ▼
    ❌ LIMIT REACHED!
           │
           ▼
  ┌──────────────────────────────────┐
  │     ⚡ Upgrade to Continue       │
  │                                  │
  │  You've reached the limit for    │
  │  event types on the Free plan.   │
  │                                  │
  │  ┌────────────────────────────┐  │
  │  │  Current Limit:    1       │  │
  │  └────────────────────────────┘  │
  │                                  │
  │  Upgrade to Pro and get:         │
  │  ✅ Up to 10 event types         │
  │  ✅ Advanced availability        │
  │  ✅ Analytics dashboard          │
  │  ✅ 1,000 bookings/month         │
  │                                  │
  │  [View Pricing Plans]            │
  │  [Maybe Later]                   │
  └──────────────────────────────────┘
```

---

## 📈 Booking Limit Flow

### Monthly Booking Cycle

```
Month Start (January 1)
         │
         ▼
  ┌──────────────────┐
  │ Reset Counter    │
  │ Bookings: 0/100  │
  └────────┬─────────┘
           │
           ▼
    User Creates Bookings
           │
           ├─ Booking #1  → Count: 1/100  ✅
           ├─ Booking #2  → Count: 2/100  ✅
           ├─ Booking #50 → Count: 50/100 ✅
           ├─ Booking #99 → Count: 99/100 ✅ (Warning!)
           ├─ Booking #100 → Count: 100/100 ✅ (Last one!)
           └─ Booking #101 → ❌ BLOCKED!
                    │
                    ▼
           ┌──────────────────────┐
           │  Limit Reached! 🚫   │
           │                      │
           │  You've used all     │
           │  100 bookings this   │
           │  month.              │
           │                      │
           │  Options:            │
           │  • Wait until Feb 1  │
           │  • Upgrade to Pro    │
           │                      │
           │  [Upgrade Now]       │
           └──────────────────────┘

Next Month (February 1)
         │
         ▼
  ┌──────────────────┐
  │ Auto Reset! 🔄   │
  │ Bookings: 0/100  │
  └────────┬─────────┘
           │
           ▼
    Can Book Again! ✅
```

---

## 🎯 Upgrade Process Flow

```
User Hits Limit
         │
         ▼
  [Upgrade Prompt Appears]
         │
         ▼
  Click "View Pricing Plans"
         │
         ▼
┌────────────────────────────────┐
│      PRICING PAGE 💳            │
│                                │
│  [Monthly] / [Yearly]          │
│  Toggle (Save 17%!)            │
│                                │
│  ┌──────┐  ┌──────┐  ┌──────┐ │
│  │ FREE │  │ PRO ⭐│  │ BUS  │ │
│  └──────┘  └──────┘  └──────┘ │
│                                │
│  Current Plan: Free            │
│  Usage: 1/1 event types        │
└────────────────────────────────┘
         │
         ▼
  Click "Upgrade Now" on Pro
         │
         ▼
  ┌──────────────────┐
  │  Processing...   │
  │     ⏳           │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────────────┐
  │  ✅ Success!             │
  │                          │
  │  Subscription upgraded   │
  │  to Pro!                 │
  │                          │
  │  New Limits:             │
  │  • 10 event types        │
  │  • 1,000 bookings/month  │
  │  • All Pro features ✨   │
  └────────┬─────────────────┘
           │
           ▼
    Can Create More! ✅
```

---

## 📊 Database State Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   SUBSCRIPTION_PLANS                        │
├──────────┬──────────────┬─────────┬───────────┬────────────┤
│ name     │ display_name │ price_m │ max_event │ max_book   │
├──────────┼──────────────┼─────────┼───────────┼────────────┤
│ free     │ Free         │ £0      │ 1         │ 100        │
│ pro      │ Pro          │ £12     │ 10        │ 1,000      │
│ business │ Business     │ £24     │ -1 (∞)    │ -1 (∞)     │
└──────────┴──────────────┴─────────┴───────────┴────────────┘
                              ▲
                              │
                              │ References
                              │
┌─────────────────────────────────────────────────────────────┐
│                      USERS_PROFILE                          │
├─────────┬────────────────┬──────────┬──────────────────────┤
│ user_id │ subscription_  │ bookings │ last_booking_reset   │
│         │ plan           │ _month   │                      │
├─────────┼────────────────┼──────────┼──────────────────────┤
│ user1   │ free           │ 15       │ 2025-12-01 00:00:00  │
│ user2   │ pro            │ 234      │ 2025-12-01 00:00:00  │
│ user3   │ business       │ 567      │ 2025-12-01 00:00:00  │
└─────────┴────────────────┴──────────┴──────────────────────┘
                              │
                              │ Checks Against
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     EVENT_TYPES                             │
├─────────┬────────────┬──────────────────────────────────────┤
│ user_id │ is_active  │ COUNT(*)                             │
├─────────┼────────────┼──────────────────────────────────────┤
│ user1   │ true       │ 1  ← At limit for FREE               │
│ user2   │ true       │ 5  ← Under limit for PRO (10)        │
│ user3   │ true       │ 25 ← Unlimited for BUSINESS          │
└─────────┴────────────┴──────────────────────────────────────┘
```

---

## 🔄 Rate Limiting Logic

### Event Type Creation

```
┌─────────────────────────────────────────────┐
│  User Clicks "Create Event Type"           │
└───────────────┬─────────────────────────────┘
                │
                ▼
    ┌────────────────────────────┐
    │ Call: canCreateEventType() │
    └────────────┬───────────────┘
                 │
                 ├─► Get user's subscription plan
                 │   (FREE/PRO/BUSINESS)
                 │
                 ├─► Count user's active event types
                 │   (SELECT COUNT(*) WHERE user_id = ...)
                 │
                 ├─► Get plan's max_event_types limit
                 │   (1 for FREE, 10 for PRO, -1 for BUSINESS)
                 │
                 └─► Compare: current < limit?
                         │
                         ├─ YES (0 < 1) ─► ✅ ALLOWED
                         │                   │
                         │                   └─► Create Event Type
                         │
                         └─ NO (1 >= 1) ─► ❌ BLOCKED
                                             │
                                             └─► Show Upgrade Prompt
```

### Booking Creation

```
┌─────────────────────────────────────────────┐
│  User Attempts to Create Booking           │
└───────────────┬─────────────────────────────┘
                │
                ▼
    ┌────────────────────────────┐
    │ Call: canCreateBooking()   │
    └────────────┬───────────────┘
                 │
                 ├─► Check if month changed
                 │   (compare last_booking_reset)
                 │   │
                 │   └─ If new month:
                 │       • Reset bookings_this_month = 0
                 │       • Update last_booking_reset
                 │
                 ├─► Get bookings_this_month count
                 │   (Current usage this month)
                 │
                 ├─► Get plan's max_bookings_per_month
                 │   (100 for FREE, 1000 for PRO, -1 for BUSINESS)
                 │
                 └─► Compare: current < limit?
                         │
                         ├─ YES (99 < 100) ─► ✅ ALLOWED
                         │                      │
                         │                      ├─► Create Booking
                         │                      │
                         │                      └─► Increment Counter
                         │                           (bookings_this_month + 1)
                         │
                         └─ NO (100 >= 100) ─► ❌ BLOCKED
                                                │
                                                └─► Show Upgrade Message
```

---

## 🎨 UI Component Hierarchy

```
App
 │
 ├─ Pricing Page (/app/pricing)
 │   │
 │   ├─ Header
 │   │   └─ "Choose Your Plan"
 │   │
 │   ├─ Billing Toggle
 │   │   ├─ [Monthly] Button
 │   │   └─ [Yearly] Button (Save 17%!)
 │   │
 │   ├─ Current Plan Banner
 │   │   └─ "Current Plan: Free • 1/1 event types • 15/100 bookings"
 │   │
 │   └─ Plan Cards Container
 │       │
 │       ├─ Free Card
 │       │   ├─ Title: "Free"
 │       │   ├─ Price: "£0/month"
 │       │   ├─ Features List (with checkmarks)
 │       │   └─ [Get Started Free] Button
 │       │
 │       ├─ Pro Card ⭐ (Popular Badge)
 │       │   ├─ Title: "Pro"
 │       │   ├─ Price: "£12/month"
 │       │   ├─ Savings: "Save 17% with yearly"
 │       │   ├─ Features List (with checkmarks)
 │       │   └─ [Upgrade Now] Button
 │       │
 │       └─ Business Card
 │           ├─ Title: "Business"
 │           ├─ Price: "£24/month"
 │           ├─ Savings: "Save 17% with yearly"
 │           ├─ Features List (with checkmarks)
 │           └─ [Upgrade Now] Button
 │
 └─ Create Event Type Page
     │
     ├─ Upgrade Prompt Modal (if limit hit)
     │   ├─ ⚡ Icon
     │   ├─ "Upgrade to Continue"
     │   ├─ Current Limit Display
     │   ├─ Benefits List
     │   ├─ [View Pricing Plans] Button
     │   └─ [Maybe Later] Button
     │
     ├─ Limit Reached Banner (if at limit)
     │   ├─ ⚠️  Icon
     │   ├─ "Limit Reached"
     │   ├─ Usage Display (1 / 1)
     │   └─ [Upgrade Now] Button
     │
     └─ Event Type Form
         └─ [Save] Button
              │
              └─ Triggers limit check
```

---

## 📱 Responsive Design

### Desktop View (≥768px)

```
┌─────────────────────────────────────────────────────────────┐
│                     PRICING PAGE                            │
├─────────────────────────────────────────────────────────────┤
│                    Choose Your Plan                         │
│              [Monthly] / [Yearly] Toggle                    │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     FREE     │  │   PRO ⭐     │  │   BUSINESS    │     │
│  │              │  │              │  │              │     │
│  │    £0/mo     │  │   £12/mo     │  │   £24/mo     │     │
│  │              │  │              │  │              │     │
│  │ ✅ Feature1  │  │ ✅ Feature1  │  │ ✅ Feature1  │     │
│  │ ✅ Feature2  │  │ ✅ Feature2  │  │ ✅ Feature2  │     │
│  │ ❌ Feature3  │  │ ✅ Feature3  │  │ ✅ Feature3  │     │
│  │              │  │              │  │              │     │
│  │ [Get Started]│  │[Upgrade Now] │  │[Upgrade Now] │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Mobile View (<768px)

```
┌────────────────────┐
│   PRICING PAGE     │
├────────────────────┤
│  Choose Your Plan  │
│  [Monthly]/[Yearly]│
│                    │
│ ┌────────────────┐ │
│ │     FREE       │ │
│ │   £0/month     │ │
│ │  ✅ Features   │ │
│ │ [Get Started]  │ │
│ └────────────────┘ │
│                    │
│ ┌────────────────┐ │
│ │   PRO ⭐       │ │
│ │   £12/month    │ │
│ │  ✅ Features   │ │
│ │ [Upgrade Now]  │ │
│ └────────────────┘ │
│                    │
│ ┌────────────────┐ │
│ │   BUSINESS     │ │
│ │   £24/month    │ │
│ │  ✅ Features   │ │
│ │ [Upgrade Now]  │ │
│ └────────────────┘ │
└────────────────────┘
```

---

## 🎯 Status Indicators

### User Dashboard

```
┌──────────────────────────────────────┐
│  Your Plan: FREE ⭐                  │
├──────────────────────────────────────┤
│  Event Types                         │
│  ████████████████████████ 1/1  100%  │
│  (At limit - Upgrade for more)       │
│                                      │
│  Bookings This Month                 │
│  ████░░░░░░░░░░░░░░░░  15/100  15%   │
│  (85 bookings remaining)             │
│                                      │
│  [Upgrade to Pro →]                  │
└──────────────────────────────────────┘
```

---

*Visual Guide Complete - All Diagrams Optimized for Understanding*  
*Created: December 28, 2025*
