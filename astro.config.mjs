import { defineConfig } from 'astro/config';

/**
 * Wraps every markdown table in a horizontally scrollable container. The results tables
 * in the run reports run wide — nine columns in places — and without this the page body
 * itself scrolls sideways on a phone.
 */
function rehypeWrapTables() {
  const wrap = (node) => {
    if (!Array.isArray(node.children)) return;
    node.children = node.children.map((child) => {
      wrap(child);
      if (child.type === 'element' && child.tagName === 'table') {
        return {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-scroll'] },
          children: [child],
        };
      }
      return child;
    });
  };
  return (tree) => wrap(tree);
}

export default defineConfig({
  site: 'https://canaryone.ai',
  compressHTML: true,
  build: {
    inlineStylesheets: 'always',
  },
  markdown: {
    rehypePlugins: [rehypeWrapTables],
  },
});
