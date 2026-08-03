import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Run reports. Every file under src/content/runs/ is written by scripts/import-runs.mjs
 * from fantastic-dollop/outreach/results/ — never by hand. See README.md § Run reports.
 */
const runs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/runs' }),
  schema: z.object({
    /** The run's own start date, which is also the sort key. Kept as a string on purpose. */
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
    title: z.string().min(1),
    /** One line. Used on the home page cards and the /runs index. */
    summary: z.string().min(1),
    /**
     * What kind of run this was, which decides what it can support. A commissioned sweep
     * is checkable by an outsider and can carry a contested number; a local tool run is
     * demonstration material; a metadata scan is free and verifiable but goes stale fast.
     */
    kind: z.enum(['commissioned-sweep', 'local-tool-run', 'metadata-scan']),
    /** The route matrix, verbatim from the run's method table. Absent when it recorded none. */
    routes: z.string().optional(),
    /** Total spend, where the run recorded one. */
    spend: z.string().optional(),
    /** Path to the source of truth in fantastic-dollop. */
    sourceFile: z.string(),
  }),
});

export const collections = { runs };
