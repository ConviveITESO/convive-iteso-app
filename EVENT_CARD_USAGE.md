# EventCard Mode Usage Guide

The `EventCard` component now supports three modes for different contexts:

## Modes

### 1. **Default (Feed)** - No mode prop
Shows only the event information without action buttons.

**Example:** `/app/feed/page.tsx`

```tsx
<EventsGrid 
  events={filteredEvents} 
  onEventClick={handleEventClick} 
/>
```

### 2. **Admin Mode** - `mode="admin"`
Shows 5 action buttons on the right:
- Edit (pencil icon)
- Delete (trash icon)
- Share (share icon)
- Notify (bell icon)
- View Stats (eye icon)

**Example:** `/app/manage-events/page.tsx` (to be implemented)

```tsx
<EventsGrid 
  events={filteredEvents} 
  onEventClick={handleEventClick}
  mode="admin"
  onEdit={handleEdit}
  onDelete={handleDelete}
  onShare={handleShare}
  onNotify={handleNotify}
  onViewStats={handleViewStats}
/>
```

### 3. **Subscription Mode** - `mode="subscription"`
Shows only an unsubscribe button (user minus icon).

**Example:** `/app/my-events/page.tsx`

```tsx
<EventsGrid 
  events={filteredEvents} 
  onEventClick={handleEventClick}
  mode="subscription"
  onUnsubscribe={handleUnsubscribe}
/>
```

## Implementation Details

- Action buttons use `ghost` variant and are `size-8` (32px)
- Icons are `size-4` (16px)
- Click events on action buttons stop propagation to prevent triggering the card's onClick
- All action handlers are optional and only render if provided

## Pages Implemented

- ✅ `/app/feed/page.tsx` - Default mode (no action buttons)
- ✅ `/app/my-events/page.tsx` - Subscription mode with tabs (Upcoming/Past/Created)
- ⏳ `/app/manage-events/page.tsx` - Admin mode (pending)
