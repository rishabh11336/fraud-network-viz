# FraudNet

An interactive graph of signup-abuse clusters — accounts that look like they belong to the same person, or the same ring.

**Live:** [fraud-network-viz.vercel.app](https://fraud-network-viz.vercel.app)

This started as a data-science take-home. The brief was unsupervised entity linkage: you get ~15,000 unlabeled signups, no list of bad actors, and a hard rule that you must not flag a legitimate customer. I linked the accounts in a notebook, then built this app so you can actually *see* the clusters instead of scrolling a CSV.

## What’s live

The production site is on Vercel. Open it, you get two screens:

- **Overview** — the finding in one line, a funnel from 15,008 signups to 251 clusters, and three cases to open first.
- **Story** — an eight-step walkthrough of the method, told with small identity networks (not the 15k-row table). Collision hubs, the Gmail disguise ring, the address gate, the Cabrera case, and a split we refused to merge.
- **Explorer** — opens on the largest ring, not the hairball. The right panel is a cluster brief; click a node for account edges.

Current run on the deployed build:

| | |
|---|---|
| Signups in the source file | 15,008 |
| Clusters (suspected actors) | 251 |
| Accounts that linked to someone else | 587 |
| CERTAIN / HIGH / MEDIUM | 204 / 44 / 3 |

Most clusters hang off a Gmail alias. Device hash, name, and card (BIN + last 4) pick up the rest. Singletons stay out of the graph on purpose — they didn’t share a strong enough identity with anyone else.

## The problem, in one paragraph

Signup abuse is someone spinning up extra accounts to hit new-customer promos, referral bonuses, or return fraud. The snapshot has names, emails, phones, addresses, IPs, device hashes, payment details, and user agents — all messy, the way real signup data is. Gmail dots and `+tags` hide the same inbox. Phones show up in three formats. Some IPs are iCloud Private Relay, which hundreds of unrelated people share. Device hashes are missing on most rows. A shared last-4 on a Visa BIN is interesting; a shared BIN alone is not.

So you cannot treat “two rows match on a field” as “same person.” Some matches are almost proof. Some are noise.

## How the linkage works

The notebook in `v2/linkage.ipynb` does the actual matching. The app just renders its output.

1. **Normalize** every field into an identity key (emails collapse aliases, phones go to 10 digits, ZIPs to 5, and so on).
2. **Group** accounts that share a key.
3. **Fuzzy-match addresses** inside a ZIP, but only when the house number and unit are the same and the street name is a typo. `APT 18` never merges with `APT 11`.
4. **Weight** each shared key from the data itself: Fellegi–Sunter `log2(m/u)`. A signal the *same* people reuse, and strangers almost never collide on, gets a high weight. A value shared by 2,000 accounts gets penalized as infrastructure.
5. **Gate** the pairs. Email, device, and phone can link two accounts on their own. Card, address, name, and IP+user-agent need a second medium signal (or a high one). IP or user-agent alone never links anyone.
6. **Union-find** those edges into clusters.

Weights rank confidence. Tiers decide whether a pair is allowed to exist at all. That’s how a rare shared name — statistically loud, still only a name — cannot merge two strangers by itself.

Outputs land in `v2/output/` (`clusters.csv`, `edges.csv`, `findings.md`). The site reads copies of those CSVs from `public/data/`.

## What’s in this repo

```
app/            Overview page, explorer, and /api/data
components/     Graph canvas (D3), cluster list, detail panel
lib/            CSV parse + graph shape
public/data/    The CSVs the live site serves
v2/             Notebook, brief, relay ranges, and generated findings
```

Stack is Next.js 16, React 19, D3, and PapaParse. No backend database — the graph is static JSON built from those two CSVs.

## Run it locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

To regenerate clusters, run `v2/linkage.ipynb` end to end and copy the new CSVs into `public/data/` if you want the UI to pick them up.

## Deploy

Production is already up at [fraud-network-viz.vercel.app](https://fraud-network-viz.vercel.app). The GitHub repo is connected to Vercel, so a push to `main` ships a new production build.
