# Take-Home Assignment: Signup Abuse — Entity Linkage

**Role:** Data Analyst / Data Scientist
**Suggested effort:** 6 hours
**Deadline:** 2 calendar days from receipt
**AI tools:** Permitted. You will discuss your work in a follow-up interview, so make sure you fully understand and can defend every decision in your submission.

---

## Background

You are a data scientist at a fraud prevention company. One of our merchants suspects **signup abuse**: a single actor (or a coordinated ring) creating multiple accounts to exploit new-customer promotions, referral bonuses, or to distribute return abuse across identities.

You receive a snapshot of recent signups. **There are no labels.** Nobody has told you which accounts are abusive, how many actors exist, or whether abuse exists at all.

Your job is to link accounts that plausibly belong to the same real-world actor, and to do so in a way you could defend to a merchant whose legitimate customers must not be harmed.

## Data provided

**`signups.csv`** (~15,000 rows) — one row per account:

| Column | Notes |
|---|---|
| `account_id` | Unique per account |
| `signup_ts` | UTC timestamp |
| `full_name` | Free text as entered |
| `email` | As entered |
| `phone` | May be missing or formatted inconsistently |
| `addr_line1`, `addr_line2` | Free text |
| `city`, `state`, `zip` | ZIP may be 5-digit or ZIP+4 |
| `ip_address` | IPv4 at signup |
| `payment_bin` | First 6 digits of card, if a card was added |
| `card_last4` | Last 4 digits, if a card was added |
| `device_hash` | Coarse device identifier; present on ~40% of rows |
| `user_agent` | Browser user agent string |

**`icloud_relay_ranges.csv`** — published egress IP ranges for iCloud Private Relay and similar consumer relay services. Provided as reference data; whether and how you use it is up to you.

## Deliverables

1. **Cluster output** — a CSV mapping `account_id → cluster_id` for every account you believe shares an actor with at least one other account. Singletons may be omitted.
2. **Ranked findings** — your top clusters ranked by confidence, with a short narrative for each: which signals link the accounts, and why you believe them.
3. **Code** — reproducible; any language/stack. We should be able to rerun it.
4. You have to present your methodolgy and findings. It can be done via notebook or presentation (upto you).


## Practical notes

- Assume US addresses and US phone formats.
- The data is synthetic but its pathologies are modeled on real-world signup data. Treat oddities as intentional until proven otherwise.
- If you make assumptions (e.g., about what a shared value implies), state them explicitly in the writeup.

Good luck — we're more interested in how you think than in a perfect answer.
