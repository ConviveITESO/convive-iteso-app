# Database Seeding

This directory contains database seeding scripts for the ConviveITESO application.

## Available Scripts

### Development Seeding: `db:seed`

```bash
cd apps/api
pnpm db:seed
```

**What it does:**
- ⚠️ **DELETES ALL DATA** and resets the database
- Creates 20 test users (`user0@iteso.mx` to `user19@iteso.mx`)
- Creates an admin user (`admin@iteso.mx`)
- Seeds 10 badges
- Seeds 11 categories
- Seeds 9 locations
- Creates 20 events with random data
- Creates subscriptions, comments, and ratings

**Use case:** Development and testing environment

---

### Production Seeding: `db:seed:prod`

```bash
cd apps/api
pnpm db:seed:prod
```

**What it does:**
- ✅ **SAFE**: Does NOT delete existing data
- Creates/updates admin user (`admin@iteso.mx`) if not exists
- Seeds 20 production categories:
  - Art, Culture, Sports, Entertainment, Science, Technology, Health, Business
  - Environment, Social, Education, Community Service, Workshops, Conferences
  - Networking, Music, Theater, Film, Literature, Philosophy
- Seeds 27 production locations:
  - Buildings A through V (ITESO campus buildings)
  - Library, Auditoriums, Cultural Center, Sports Complex
  - Student Center, Chapel, Cafeteria, Plaza, Garden
- Skips items that already exist (idempotent operation)

**Use case:** Production environment initial setup or adding new categories/locations

---

## Example Output

### Production Seeding

```bash
Starting production seeding...
This will NOT delete existing data
Creating admin user: admin@iteso.mx
Seeding categories...
Categories: 20 inserted, 0 skipped (already exist)
Seeding locations...
Locations: 27 inserted, 0 skipped (already exist)

✅ Production seeding completed successfully!
```

If run again:
```bash
Starting production seeding...
This will NOT delete existing data
Seeding categories...
Categories: 0 inserted, 20 skipped (already exist)
Seeding locations...
Locations: 0 inserted, 27 skipped (already exist)

✅ Production seeding completed successfully!
```

---

## Production Deployment

To seed the production database after deployment:

### Option 1: Via Migrations Instance (Recommended)

```bash
# SSH into the migrations instance
ssh -i mac_pepe.pem ec2-user@<MIGRATIONS_HOST>

# Run the production seeding
cd /opt/convive-iteso-app
sudo -u convive bash -c 'source /opt/convive/.env && pnpm --filter api db:seed:prod'
```

### Option 2: Via Local Machine

```bash
# Set the production DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:5432/convivedb"

# Run the production seeding
cd apps/api
pnpm db:seed:prod
```

---

## Notes

- The production seeding script is **idempotent** - running it multiple times is safe
- Categories are stored in lowercase for consistency
- All created items are marked with `status: "active"`
- The admin user is created with email `admin@iteso.mx`
- Category names can be customized in `src/database/seed-prod.ts`
- Location names can be customized in `src/database/seed-prod.ts`
