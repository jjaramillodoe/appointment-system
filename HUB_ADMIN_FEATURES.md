# Hub-Based Admin System

## Overview
The system now supports hub-based admin access with super-admin capabilities. Regular admins can only see and manage data for their assigned hub, while super-admins can see everything across all hubs.

## Features

### 1. Admin Types
- **Super Admin**: Can see and manage all hubs and system-wide settings
- **Hub Admin**: Can only see and manage data for their assigned hub (e.g., "Manhattan Hub")

### 2. User Model Updates
- Added `isSuperAdmin` field (boolean)
- Added `assignedHub` field (ObjectId reference to Hub)
- Existing `isAdmin` field remains for backward compatibility

### 3. API Routes Updated
All admin API routes now filter by hub for regular admins:
- `/api/admin/appointments` - Only shows appointments for assigned hub
- `/api/admin/users` - Only shows users whose closestHub matches assigned hub
- `/api/admin/analytics` - Only shows analytics for assigned hub
- `/api/admin/settings` - Accessible to all admins
- `/api/admin/cache` - Accessible to all admins

### 4. Admin Dashboard
- Shows admin type badge (Super Admin or Hub Admin)
- Displays assigned hub name for hub admins
- All data is automatically filtered based on admin permissions

## Usage

### Creating a Super Admin
```bash
npm run admin:create <email> <password> super
```

Example:
```bash
npm run admin:create jjaramillo7@schools.nyc.gov Welcome12345! super
```

### Creating a Hub Admin
```bash
npm run admin:create <email> <password> false "Hub Name"
```

Example:
```bash
npm run admin:create admin@example.com Welcome12345! false "Manhattan Hub"
```

### Available Hubs
To see available hubs, check your MongoDB `hubs` collection or use:
```bash
# In MongoDB shell
db.hubs.find({ isActive: true })
```

## Permission System

### Helper Functions (`lib/adminPermissions.ts`)
- `verifyAdminToken(token)` - Verifies JWT and extracts admin info
- `isAdmin(user)` - Checks if user is admin or super-admin
- `isSuperAdmin(user)` - Checks if user is super-admin
- `getHubFilter(user)` - Returns MongoDB filter for hub-based queries
- `canAccessHub(user, hubId)` - Checks if admin can access specific hub

### How It Works
1. User logs in → JWT token includes `isSuperAdmin` and `assignedHub`
2. Admin makes API request → Token is verified
3. If super-admin → No filter applied (sees everything)
4. If hub-admin → Filter applied to show only assigned hub data

## Database Schema

### User Model
```typescript
{
  isAdmin: Boolean,        // Legacy field, kept for compatibility
  isSuperAdmin: Boolean,  // New: true for super-admins
  assignedHub: ObjectId,  // New: Hub ID for hub-based admins
}
```

## Migration Notes

- Existing admins with `isAdmin: true` will continue to work
- To convert existing admin to super-admin:
  ```javascript
  db.users.updateOne(
    { email: "admin@example.com" },
    { $set: { isSuperAdmin: true } }
  )
  ```
- To assign hub to existing admin:
  ```javascript
  const hub = db.hubs.findOne({ name: "Manhattan Hub" });
  db.users.updateOne(
    { email: "admin@example.com" },
    { $set: { assignedHub: hub._id } }
  )
  ```

## Security

- Super-admins can access all hubs
- Hub-admins are restricted to their assigned hub only
- API routes automatically enforce hub filtering
- Frontend displays appropriate badges and restrictions
