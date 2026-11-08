/** New adapters observe prices only until a reviewed deployment enables updates. */
const text = (value) => value.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
const hold = (evidence, status = 'ambiguous') => ({ status, evidence, observationOnly: true, extractorVersion: 'provider-subscriptions-v1' });
const found = (entry, amount, evidence) => ({ ...hold(evidence), status: amount === entry.price.amount ? 'exact-match' : 'changed-price', amount });

export function extractMimo(body, entry) {
  if (entry.price.currency !== 'USD' || !['month', 'year'].includes(entry.price.period)) return hold('Expected USD monthly or annual billing', 'unsupported');
  const tier = /(?:^|-)(lite|standard|pro|max)$/.exec(entry.id)?.[1];
  if (!tier) return hold('Unknown individual tier', 'unsupported');
  const individual = body.split(/## Pricing and Quotas for Individual Edition/i)[1]?.split(/## Pricing and Quotas for Team Edition/i)[0];
  const title = entry.price.period === 'month' ? 'Monthly Plan' : 'Annual Package';
  const section = individual?.split(new RegExp(`#### ${title}`, 'i'))[1]?.split(/\n#### /)[0];
  const tables = [...(section ?? '').matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)];
  if (tables.length !== 1) return hold('Expected one individual billing-period table');
  const rows = [...tables[0][1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(row => [...row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(cell => text(cell[1])));
  const columns = (rows[0] ?? []).map((name, index) => name.toLowerCase() === tier ? index : -1).filter(index => index >= 0);
  const prices = rows.filter(row => row[0] === 'Pricing');
  if (columns.length !== 1 || prices.length !== 1) return hold('Tier or pricing row is ambiguous');
  const cell = prices[0][columns[0]] ?? '';
  const unit = entry.price.period === 'month' ? 'month' : 'year';
  const matches = [...cell.matchAll(new RegExp(`(?:\\$|USD\\s+)([\\d,]+(?:\\.\\d+)?)\\s*\\/\\s*${unit}\\b`, 'gi'))];
  if (matches.length !== 1) return hold('Expected one explicit USD amount with billing period');
  return found(entry, Number(matches[0][1].replace(/,/g, '')), `Individual ${tier}; USD/${unit}; ${cell}`);
}

export function extractCommandCode(body, entry) {
  if (entry.price.currency !== 'USD' || entry.price.period !== 'month') return hold('Expected monthly USD billing', 'unsupported');
  const names = { 'command-code-go': 'Go', 'command-code-goat': 'GOAT', 'command-code-pro': 'Pro', 'command-code-max-10x': 'Max 10×', 'command-code-max-20x': 'Max 20×', 'command-code-provider': 'Provider' };
  const name = names[entry.id];
  if (!name) return hold('Unknown Command Code plan', 'unsupported');
  const blocks = [...body.matchAll(/<h[23]\b[^>]*>([\s\S]*?)<\/h[23]>([\s\S]*?)(?=<h[23]\b|$)/gi)].filter(match => text(match[1]).replace(/\.$/, '').replace(/^Provider\. The API plan$/, 'Provider') === name).map(match => text(match[2]));
  const candidates = [];
  for (const block of blocks) {
    if (/introductory|first month|limited.time|promotion/i.test(block)) continue;
    const matches = [...block.matchAll(/\$\s*([\d,]+(?:\.\d+)?)\s*\/\s*month\b/gi)];
    if (matches.length === 1) candidates.push({ amount: Number(matches[0][1].replace(/,/g, '')), block });
  }
  if (candidates.length !== 1) return hold('Expected one named plan and monthly USD price; generic Max headings cannot identify a variant');
  return found(entry, candidates[0].amount, `${name}; USD/month; processing fee excluded; ${candidates[0].block}`.slice(0, 600));
}

export function extractNewProvider(body, entry) {
  const url = new URL(entry.sourceUrl);
  if (url.hostname === 'mimo.mi.com' && url.pathname === '/static/docs/price/token-plan.md') return extractMimo(body, entry);
  if (url.hostname === 'commandcode.ai' && url.pathname === '/pricing') return extractCommandCode(body, entry);
  if (['z.ai', 'zcode.z.ai'].includes(url.hostname)) return hold('GLM paired prices require explicit billing-period confirmation');
  return null;
}
