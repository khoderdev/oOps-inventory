# Migrating from Raw SQL to Prisma ORM

This guide explains how to migrate from the current raw SQL approach to Prisma
ORM for better type safety and developer experience.

## Why Migrate to Prisma?

### ✅ **Benefits of Prisma:**

- **Type Safety**: Auto-generated types for all database operations
- **IntelliSense**: Full autocomplete in your IDE
- **Database Migrations**: Automatic schema management
- **Query Builder**: Intuitive API for complex queries
- **Relationship Handling**: Easy joins and nested queries
- **Performance**: Optimized query generation
- **Database Agnostic**: Easy to switch databases later

### 📊 **Code Comparison:**

**Raw SQL (Current):**

```javascript
// Complex query with joins and manual SQL
const result = await query(
  `
  SELECT u.*, COUNT(se.id) as stock_entries_count
  FROM users u
  LEFT JOIN stock_entries se ON u.id = se.created_by
  WHERE u.is_active = $1 AND u.role = $2
  GROUP BY u.id
  ORDER BY u.created_at DESC
  LIMIT $3 OFFSET $4
`,
  [true, "admin", 10, 0]
);
```

**Prisma (ORM):**

```javascript
// Type-safe, readable query with relationships
const users = await prisma.user.findMany({
  where: {
    is_active: true,
    role: "ADMIN"
  },
  include: {
    _count: {
      select: { stock_entries: true }
    }
  },
  orderBy: { created_at: "desc" },
  take: 10,
  skip: 0
});
```

## Migration Steps

### 1. Install Prisma Dependencies

```bash
npm install @prisma/client prisma --save
```

### 2. Initialize Prisma

```bash
npx prisma init
```

### 3. Configure Environment Variables

Update your `.env` file:

```env
# Add this line for Prisma
DATABASE_URL="postgresql://username:password@localhost:5432/inventory_db"

# Keep existing variables for backward compatibility
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=username
DB_PASSWORD=password
```

### 4. Set Up Prisma Schema

The schema is already created in `prisma/schema.prisma` with:

- User model with proper relationships
- Enums for roles
- Indexes for performance
- Future models for inventory system

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Create and Run Migration

```bash
# Create migration from schema
npx prisma migrate dev --name init

# Or push schema directly (development only)
npx prisma db push
```

### 7. Update Application Code

#### Replace Database Import:

```javascript
// OLD: Raw SQL approach
import { query } from "../config/database.js";

// NEW: Prisma approach
import prisma from "../config/prisma.js";
```

#### Replace Model Usage:

```javascript
// OLD: Raw SQL model
import { User } from "../models/User.js";

// NEW: Prisma model
import { UserPrisma } from "../models/UserPrisma.js";
```

#### Update Service Layer:

```javascript
// OLD: Manual SQL with error handling
export const getUserById = async id => {
  try {
    const user = await User.findById(id);
    if (user) {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  } catch (error) {
    logger.error("Error getting user by ID:", error);
    throw new Error("Failed to retrieve user");
  }
};

// NEW: Type-safe Prisma operations
export const getUserById = async id => {
  try {
    const user = await UserPrisma.findById(id);
    if (user) {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  } catch (error) {
    logger.error("Error getting user by ID:", error);
    throw new Error("Failed to retrieve user");
  }
};
```

## Gradual Migration Strategy

You can migrate gradually without breaking existing functionality:

### Phase 1: Keep Both Systems

```javascript
// Use environment variable to switch between systems
const USE_PRISMA = process.env.USE_PRISMA === "true";

export const getUserById = async id => {
  if (USE_PRISMA) {
    return await UserPrisma.findById(id);
  } else {
    return await User.findById(id);
  }
};
```

### Phase 2: Migrate by Feature

1. Start with user management (already implemented)
2. Add inventory models to Prisma
3. Migrate stock management
4. Migrate reporting features

### Phase 3: Remove Raw SQL

Once all features are migrated and tested:

1. Remove raw SQL models
2. Remove database.js configuration
3. Clean up environment variables

## Advanced Prisma Features

### 1. Complex Queries with Relations

```javascript
// Get user with their recent stock entries and categories
const userWithData = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    stock_entries: {
      take: 10,
      orderBy: { created_at: "desc" },
      include: {
        raw_material: {
          include: {
            category: true
          }
        }
      }
    }
  }
});
```

### 2. Transactions

```javascript
// Atomic operations
const result = await prisma.$transaction([
  prisma.user.create({ data: userData }),
  prisma.stockEntry.create({ data: stockData })
]);
```

### 3. Raw Queries When Needed

```javascript
// Still use raw SQL for complex analytics
const result = await prisma.$queryRaw`
  SELECT DATE_TRUNC('month', created_at) as month,
         COUNT(*) as user_count
  FROM users
  WHERE created_at >= NOW() - INTERVAL '1 year'
  GROUP BY month
  ORDER BY month DESC
`;
```

### 4. Database Introspection

```bash
# Generate Prisma schema from existing database
npx prisma db pull
```

## Performance Considerations

### 1. Query Optimization

```javascript
// Use select to limit returned fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    first_name: true,
    last_name: true
  }
});

// Use cursor-based pagination for large datasets
const users = await prisma.user.findMany({
  take: 10,
  cursor: { id: lastUserId },
  orderBy: { id: "asc" }
});
```

### 2. Connection Pooling

Prisma automatically handles connection pooling, but you can configure it:

```javascript
// In schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pooling is handled automatically
}
```

## Testing with Prisma

```javascript
// Mock Prisma for testing
import { jest } from "@jest/globals";

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  }
};

jest.mock("../config/prisma.js", () => ({
  default: () => mockPrisma
}));
```

## Useful Prisma Commands

```bash
# View your data in a GUI
npx prisma studio

# Reset database and apply migrations
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy

# Generate Prisma client after schema changes
npx prisma generate

# Format Prisma schema
npx prisma format
```

## Migration Checklist

- [ ] Install Prisma dependencies
- [ ] Create Prisma schema
- [ ] Set up DATABASE_URL environment variable
- [ ] Run initial migration
- [ ] Create Prisma-based models
- [ ] Update service layer to use Prisma
- [ ] Test all functionality
- [ ] Update documentation
- [ ] Remove raw SQL code (final step)

## Conclusion

Migrating to Prisma provides significant benefits in terms of type safety,
developer experience, and maintainability. The migration can be done gradually,
ensuring no disruption to your existing functionality.

Start with the user management system (already implemented) and gradually
migrate other features as you build them out.
