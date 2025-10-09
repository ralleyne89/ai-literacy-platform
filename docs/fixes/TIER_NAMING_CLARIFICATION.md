# Subscription Tier Naming Clarification

## Current Tier Names

The application uses **two different naming conventions** for subscription tiers:

### Payment/Billing System (Stripe)
- `free` - Free tier
- `premium` - Paid tier ($49/month)
- `enterprise` - Enterprise tier ($99/month)

### Certification/Access Control System
- `free` - Free tier
- `professional` - Paid tier (maps to premium)
- `enterprise` - Enterprise tier
- `affiliate` - Special tier (same access as professional)

## Tier Mapping

The certification system has a `TIER_RANK` that maps tiers to access levels:

```python
TIER_RANK = {
    'free': 0,
    'professional': 1,
    'enterprise': 2,
    'affiliate': 1,  # Same access as professional
}
```

## How It Works

When a user upgrades via Stripe:
1. They select "Premium" or "Enterprise" plan
2. Stripe webhook updates `subscription_tier` to "premium" or "enterprise"
3. Certification system checks access using `_has_tier_access()`
4. The function normalizes tier names and compares ranks

## Access Control Logic

The `_has_tier_access()` function in `backend/routes/certification.py`:

```python
def _has_tier_access(user_tier: str, required_tier: str) -> bool:
    user_rank = TIER_RANK.get(user_tier, 0)
    required_rank = TIER_RANK.get(required_tier, 0)
    return user_rank >= required_rank
```

## Potential Issue

**Problem:** Users who upgrade to "premium" via Stripe will have `subscription_tier = "premium"`, but the certification system expects "professional".

**Impact:** Premium users may not be able to access premium certifications because:
- Their tier is "premium" (rank not in TIER_RANK, defaults to 0)
- Required tier is "professional" (rank 1)
- Access check fails: 0 >= 1 = False

## Recommended Fix

Add "premium" to the TIER_RANK mapping:

```python
TIER_RANK = {
    'free': 0,
    'premium': 1,        # Add this
    'professional': 1,   # Keep for backward compatibility
    'enterprise': 2,
    'affiliate': 1,
}
```

This ensures that users with either "premium" or "professional" tier get the same access level.

## Alternative Solutions

### Option 1: Normalize tier names in webhook (NOT RECOMMENDED)
- Change webhook to set `subscription_tier = "professional"` instead of "premium"
- Inconsistent with plan names shown to users

### Option 2: Update all references to use "premium" (BREAKING CHANGE)
- Change all "professional" references to "premium"
- Would require updating:
  - Certification types
  - Training modules
  - Existing database records
  - Documentation

### Option 3: Add tier mapping (RECOMMENDED - IMPLEMENTED BELOW)
- Add "premium" to TIER_RANK
- Minimal code change
- Backward compatible
- Consistent with user-facing plan names

## Implementation

The fix has been applied to `backend/routes/certification.py` to add "premium" to the tier rank mapping.

