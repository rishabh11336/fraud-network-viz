export type NodeKind =
  | "account"
  | "email"
  | "device"
  | "ip"
  | "card"
  | "address"
  | "ua"
  | "name";

export type LinkTone = "high" | "medium" | "weak" | "rejected";

export interface SceneNode {
  id: string;
  kind: NodeKind;
  label: string;
  sub?: string;
  dim?: boolean;
  group?: "left" | "right" | "center";
}

export interface SceneLink {
  source: string;
  target: string;
  label?: string;
  tone: LinkTone;
}

export interface Scene {
  id: string;
  kicker: string;
  title: string;
  lede: string;
  body: string[];
  takeaway: string;
  graphCaption: string;
  nodes: SceneNode[];
  links: SceneLink[];
  explorerHref?: string;
  explorerLabel?: string;
}

/**
 * A walkthrough told the way the notebook is told:
 * collision hubs → disguise → address gate → computed weights →
 * one worked cluster → what we refused to merge → the funnel.
 *
 * Networks are identity graphs (accounts around a shared key), not a CSV.
 * Topologies and names come from the notebook; the 15,008-row table stays offstage.
 */
export const SCENES: Scene[] = [
  {
    id: "question",
    kicker: "The brief",
    title: "Fifteen thousand signups. No labels.",
    lede: "A merchant suspects signup abuse — extra accounts for promos, referrals, or returns. Nobody marked a villain. We have to find people, not “fraud,” and we are not allowed to harm a legitimate customer.",
    body: [
      "The notebook does not start with a model. It starts with a constraint: precision first. A missed ring is cheaper than freezing a real shopper.",
      "Each dot here is an account. They have names, emails, phones, addresses, IPs, devices, cards. All messy. None of the dots are tagged. The question is simply: which of these share one real-world actor?",
    ],
    takeaway: "The product of this work is a cluster you can defend, not a score you cannot explain.",
    graphCaption: "Unlabeled accounts. No edges yet — a shared field is not automatically a shared person.",
    nodes: [
      { id: "a1", kind: "account", label: "A", dim: true },
      { id: "a2", kind: "account", label: "B" },
      { id: "a3", kind: "account", label: "C", dim: true },
      { id: "a4", kind: "account", label: "D" },
      { id: "a5", kind: "account", label: "E", dim: true },
      { id: "a6", kind: "account", label: "F" },
      { id: "a7", kind: "account", label: "G", dim: true },
      { id: "a8", kind: "account", label: "H" },
      { id: "a9", kind: "account", label: "I", dim: true },
      { id: "a10", kind: "account", label: "J" },
      { id: "a11", kind: "account", label: "K", dim: true },
      { id: "a12", kind: "account", label: "L", dim: true },
    ],
    links: [],
  },
  {
    id: "hubs",
    kicker: "Coverage is not trust",
    title: "A shared value can mean “one person” or “Chrome.”",
    lede: "The notebook’s first chart is not fill rate. Fill rate is a trap: device hash is missing on most rows and is still one of the strongest links. The number that matters is the collision hub — when this value is shared, by how many accounts?",
    body: [
      "A device shared by three accounts is almost certainly one pocket. An IP shared by forty-six is an office, a café, or iCloud Private Relay. A user-agent shared by two thousand is the string “Chrome.”",
      "So we never treat every match as equal. Small hub: trustworthy. Big hub: infrastructure. Low-tier signals (IP alone, user-agent alone) are not allowed to draw an edge.",
    ],
    takeaway: "Sparse can still be strong. Common is usually junk.",
    graphCaption: "Same picture, three meanings. Left: one device, three accounts. Right: one IP, a crowd. Bottom: a user-agent that half the internet shares.",
    nodes: [
      { id: "dev", kind: "device", label: "one device", sub: "hub = 3", group: "left" },
      { id: "d1", kind: "account", label: "Tammy", group: "left" },
      { id: "d2", kind: "account", label: "Roger", group: "left" },
      { id: "d3", kind: "account", label: "Michael", group: "left" },
      { id: "ip", kind: "ip", label: "one IP", sub: "hub = 46", group: "right" },
      { id: "i1", kind: "account", label: "·", dim: true, group: "right" },
      { id: "i2", kind: "account", label: "·", dim: true, group: "right" },
      { id: "i3", kind: "account", label: "·", dim: true, group: "right" },
      { id: "i4", kind: "account", label: "·", dim: true, group: "right" },
      { id: "i5", kind: "account", label: "·", dim: true, group: "right" },
      { id: "i6", kind: "account", label: "·", dim: true, group: "right" },
      { id: "i7", kind: "account", label: "·", dim: true, group: "right" },
      { id: "i8", kind: "account", label: "·", dim: true, group: "right" },
    ],
    links: [
      { source: "d1", target: "dev", tone: "high", label: "device" },
      { source: "d2", target: "dev", tone: "high", label: "device" },
      { source: "d3", target: "dev", tone: "high", label: "device" },
      { source: "i1", target: "ip", tone: "weak" },
      { source: "i2", target: "ip", tone: "weak" },
      { source: "i3", target: "ip", tone: "weak" },
      { source: "i4", target: "ip", tone: "weak" },
      { source: "i5", target: "ip", tone: "weak" },
      { source: "i6", target: "ip", tone: "weak" },
      { source: "i7", target: "ip", tone: "weak" },
      { source: "i8", target: "ip", tone: "weak" },
    ],
  },
  {
    id: "disguise",
    kicker: "Normalization",
    title: "Nine spellings. One inbox. One person.",
    lede: "Gmail ignores dots and plus-tags. A coordinated actor will use that. The notebook treats those variants as a disguise ring — and those rings are the only ground truth we have, because this data is unlabeled.",
    body: [
      "On this snapshot, 204 inboxes hide 473 accounts that way. The busiest is jamiejackson@gmail.com: nine signups, names that shuffle between Marcus Webb and M. Webb, plus-tags like +promo and +shop.",
      "We collapse the aliases to one identity key before matching. After that, a shared inbox is a High signal. It may link a pair on its own. That is why CERTAIN in this run almost always means “email alias.”",
    ],
    takeaway: "The graph is not nine emails. It is one person standing behind nine doors.",
    graphCaption: "C00052 as an identity graph — accounts around the inbox they actually share. You do not need the CSV to see the ring.",
    explorerHref: "/explorer?cluster=C00052",
    explorerLabel: "Open this ring in Explorer",
    nodes: [
      { id: "inbox", kind: "email", label: "jamiejackson@gmail.com", sub: "one inbox" },
      { id: "e1", kind: "account", label: "+new" },
      { id: "e2", kind: "account", label: "jamie.jackson" },
      { id: "e3", kind: "account", label: "+promo" },
      { id: "e4", kind: "account", label: "plain" },
      { id: "e5", kind: "account", label: "+shop" },
      { id: "e6", kind: "account", label: "+52" },
      { id: "e7", kind: "account", label: "dots+shop" },
      { id: "e8", kind: "account", label: "+offers" },
      { id: "e9", kind: "account", label: "jamie.jacks.on" },
    ],
    links: [
      { source: "e1", target: "inbox", tone: "high" },
      { source: "e2", target: "inbox", tone: "high" },
      { source: "e3", target: "inbox", tone: "high" },
      { source: "e4", target: "inbox", tone: "high" },
      { source: "e5", target: "inbox", tone: "high" },
      { source: "e6", target: "inbox", tone: "high" },
      { source: "e7", target: "inbox", tone: "high" },
      { source: "e8", target: "inbox", tone: "high" },
      { source: "e9", target: "inbox", tone: "high" },
    ],
  },
  {
    id: "address",
    kicker: "Fuzzy match, hard stop",
    title: "Keep the typo. Never merge two apartments.",
    lede: "Exact address keys miss ANDEESON vs ANDERSON. Fuzzy matching would also merge APT 18 with APT 11 if we were careless — two legitimate neighbors, one false actor. The notebook only accepts a fuzzy hit inside a ZIP when the house number and unit tokens already match.",
    body: [
      "Address is Medium. It never links a pair alone. It is allowed to corroborate a device or a card. That is the false-positive cost made into a rule.",
      "Left: the Cabrera house — same number, same ZIP, street name off by a few letters. Kept. Right: same street, different unit. Refused.",
    ],
    takeaway: "Fuzzy is for typos. Units are identity. Neighbors are not a ring.",
    graphCaption: "Left edge exists (typo). Right edge is dashed (different unit) — the graph we do not draw.",
    nodes: [
      { id: "house", kind: "address", label: "803 Anderson Dr", sub: "typo kept", group: "left" },
      { id: "t1", kind: "account", label: "Tammy", group: "left" },
      { id: "t2", kind: "account", label: "Roger", group: "left" },
      { id: "apt18", kind: "address", label: "Spencer Dr APT 18", group: "right" },
      { id: "apt11", kind: "address", label: "Spencer Dr APT 11", group: "right" },
      { id: "n1", kind: "account", label: "Neighbor A", dim: true, group: "right" },
      { id: "n2", kind: "account", label: "Neighbor B", dim: true, group: "right" },
    ],
    links: [
      { source: "t1", target: "house", tone: "medium", label: "same house #" },
      { source: "t2", target: "house", tone: "medium", label: "ANDEESON" },
      { source: "n1", target: "apt18", tone: "weak" },
      { source: "n2", target: "apt11", tone: "weak" },
      { source: "n1", target: "n2", tone: "rejected", label: "not merged" },
    ],
  },
  {
    id: "gate",
    kicker: "Computed weights",
    title: "The data sets the volume. The gate decides who may speak.",
    lede: "We do not hand-tune points. For each signal we ask: how often do known-same people (the disguise rings) share it (m), and how often would strangers collide by luck (u)? Weight is log2(m/u).",
    body: [
      "Card example from the run: same-person pairs who both added a card reused that card about 17% of the time. Strangers, about 0.01%. That is roughly 1,600× more — a loud weight.",
      "Name is even louder, because people reuse their name. If weight were the only rule, a rare “John Smith” would glue strangers. So name is capped Medium: it cannot link a pair alone. High signals (email, device, phone) can. Medium needs a second Medium, or a High. IP and user-agent never link by themselves.",
    ],
    takeaway: "Weights rank confidence. Tiers decide whether the edge is allowed to exist.",
    graphCaption: "Three pairs, three verdicts. Email links alone. Device + address corroborate. Name alone is refused.",
    nodes: [
      { id: "em", kind: "email", label: "inbox", group: "left" },
      { id: "p1", kind: "account", label: "Alias A", group: "left" },
      { id: "p2", kind: "account", label: "Alias B", group: "left" },
      { id: "dv", kind: "device", label: "device", group: "center" },
      { id: "ad", kind: "address", label: "address", group: "center" },
      { id: "p3", kind: "account", label: "Tammy", group: "center" },
      { id: "p4", kind: "account", label: "Roger", group: "center" },
      { id: "nm", kind: "name", label: "John Smith", group: "right" },
      { id: "p5", kind: "account", label: "Stranger A", dim: true, group: "right" },
      { id: "p6", kind: "account", label: "Stranger B", dim: true, group: "right" },
    ],
    links: [
      { source: "p1", target: "em", tone: "high", label: "High · links" },
      { source: "p2", target: "em", tone: "high" },
      { source: "p3", target: "dv", tone: "high", label: "High" },
      { source: "p4", target: "dv", tone: "high" },
      { source: "p3", target: "ad", tone: "medium", label: "Medium" },
      { source: "p4", target: "ad", tone: "medium" },
      { source: "p5", target: "nm", tone: "rejected", label: "name only" },
      { source: "p6", target: "nm", tone: "rejected" },
    ],
  },
  {
    id: "cabrera",
    kicker: "Worked example",
    title: "Three Cabreras. Three emails. One pocket.",
    lede: "This is section 6 of the notebook, drawn as a network instead of a table. Tammy, Roger, and Michael do not share an inbox. If we only matched email, they would look like three customers.",
    body: [
      "They share one device. That is High — it may link them on its own. They also sit at 803 Anderson Drive, once typed ANDEESON. Address is Medium, so it only corroborates. Together the pair-weight is 8.4 + 8.07 = 16.47, above the gate.",
      "Phones differ. Two of them never added a card. The story is not “everything matches.” The story is “the things that should identify a person match, and the noisy fields do not have to.”",
    ],
    takeaway: "C00205 is HIGH, not CERTAIN: no email alias, but a device plus a kept typo. That is a case you can walk a merchant through.",
    graphCaption: "Accounts around the keys that actually bound them — device and house — not around their three different emails.",
    explorerHref: "/explorer?cluster=C00205",
    explorerLabel: "Open the Cabrera cluster",
    nodes: [
      { id: "cdev", kind: "device", label: "shared device" },
      { id: "caddr", kind: "address", label: "803 Anderson Dr", sub: "ANDEESON / Anderson" },
      { id: "ct", kind: "account", label: "Tammy", sub: "gmail" },
      { id: "cr", kind: "account", label: "Roger", sub: "gmail + card" },
      { id: "cm", kind: "account", label: "Michael", sub: "outlook" },
    ],
    links: [
      { source: "ct", target: "cdev", tone: "high", label: "device 8.4" },
      { source: "cr", target: "cdev", tone: "high" },
      { source: "cm", target: "cdev", tone: "high" },
      { source: "ct", target: "caddr", tone: "medium", label: "addr 8.07" },
      { source: "cr", target: "caddr", tone: "medium" },
      { source: "cm", target: "caddr", tone: "medium" },
    ],
  },
  {
    id: "split",
    kicker: "Precision over recall",
    title: "Same card. Same street. Two actors.",
    lede: "A good linkage system is visible in what it does not draw. Card 453245 ending 5529 appears at 8089 Gonzalez Ave twice. A greedy matcher would make one ring. We made two.",
    body: [
      "Left cluster: STE 25, one device. Right cluster: SUITE 25, a different device. The unit tokens are not identical, so the fuzzy-address rule does not fire. Card is Medium. Medium plus a refused address is not a second Medium. The gate stays closed.",
      "That is the merchant conversation: we would rather miss a coordinated pair than merge two households because they shop with the same issuer pattern on the same block.",
    ],
    takeaway: "The dashed line is the product. C00235 and C00236 stay apart on purpose.",
    graphCaption: "Two small networks and a card they both touch. No solid edge between the groups.",
    explorerHref: "/explorer?cluster=C00235",
    explorerLabel: "Open C00235, then peek at C00236",
    nodes: [
      { id: "card", kind: "card", label: "453245 · 5529", sub: "Medium · not enough", group: "center" },
      { id: "devA", kind: "device", label: "device A", group: "left" },
      { id: "ste", kind: "address", label: "Gonzalez STE 25", group: "left" },
      { id: "l1", kind: "account", label: "Acct", group: "left" },
      { id: "l2", kind: "account", label: "Acct", group: "left" },
      { id: "devB", kind: "device", label: "device B", group: "right" },
      { id: "suite", kind: "address", label: "Gonzalez SUITE 25", group: "right" },
      { id: "r1", kind: "account", label: "Acct", group: "right" },
      { id: "r2", kind: "account", label: "Acct", group: "right" },
    ],
    links: [
      { source: "l1", target: "devA", tone: "high" },
      { source: "l2", target: "devA", tone: "high" },
      { source: "l1", target: "ste", tone: "medium" },
      { source: "l2", target: "ste", tone: "medium" },
      { source: "r1", target: "devB", tone: "high" },
      { source: "r2", target: "devB", tone: "high" },
      { source: "r1", target: "suite", tone: "medium" },
      { source: "r2", target: "suite", tone: "medium" },
      { source: "l1", target: "card", tone: "rejected", label: "same card" },
      { source: "r1", target: "card", tone: "rejected", label: "not merged" },
    ],
  },
  {
    id: "funnel",
    kicker: "What remains",
    title: "15,008 in. 587 linked. Everyone else stays a customer.",
    lede: "Normalization keeps every account. The gate is where people leave. 3,032 pairs looked like they might share a key. 470 pairs cleared High-or-two-Medium. Union-find turned those edges into 251 clusters. 14,421 accounts never got an edge — and that is a success.",
    body: [
      "204 clusters are CERTAIN (an alias inbox). 44 are HIGH (device or phone did the work). 3 are MEDIUM. Most actors only ran two accounts. The long tail — nine on one Gmail, the Cabrera device, the Gonzalez split — is where the story lives.",
      "The Explorer is the notebook’s last section: click a cluster, read the keys, hover an edge. You already know how to read that graph, because you have been looking at the same shape for seven screens.",
    ],
    takeaway: "A singleton is not a miss. It is a person we did not have the right to join with anyone else.",
    graphCaption: "A handful of clusters in color. The gray field is the 14,421 we left alone.",
    explorerHref: "/explorer?cluster=C00052",
    explorerLabel: "Continue in the Explorer",
    nodes: [
      { id: "femail", kind: "email", label: "alias rings", sub: "204 CERTAIN", group: "left" },
      { id: "fa1", kind: "account", label: "·", group: "left" },
      { id: "fa2", kind: "account", label: "·", group: "left" },
      { id: "fa3", kind: "account", label: "·", group: "left" },
      { id: "fdev", kind: "device", label: "device rings", sub: "44 HIGH", group: "center" },
      { id: "fb1", kind: "account", label: "·", group: "center" },
      { id: "fb2", kind: "account", label: "·", group: "center" },
      { id: "s1", kind: "account", label: "·", dim: true, group: "right" },
      { id: "s2", kind: "account", label: "·", dim: true, group: "right" },
      { id: "s3", kind: "account", label: "·", dim: true, group: "right" },
      { id: "s4", kind: "account", label: "·", dim: true, group: "right" },
      { id: "s5", kind: "account", label: "·", dim: true, group: "right" },
      { id: "s6", kind: "account", label: "·", dim: true, group: "right" },
      { id: "s7", kind: "account", label: "·", dim: true, group: "right" },
      { id: "s8", kind: "account", label: "·", dim: true, group: "right" },
    ],
    links: [
      { source: "fa1", target: "femail", tone: "high" },
      { source: "fa2", target: "femail", tone: "high" },
      { source: "fa3", target: "femail", tone: "high" },
      { source: "fb1", target: "fdev", tone: "high" },
      { source: "fb2", target: "fdev", tone: "high" },
    ],
  },
];
