import { visit } from 'unist-util-visit';

const glossaryTerms = [
  { term: '悶蒸', slug: 'blooming', regex: /悶蒸/g },
  { term: 'Blooming', slug: 'blooming', regex: /\bBlooming\b/g },
  { term: '通道效應', slug: 'channeling', regex: /通道效應/g },
  { term: 'Channeling', slug: 'channeling', regex: /\bChanneling\b/gi },
  { term: '萃取率', slug: 'extraction-yield', regex: /萃取率/g },
  { term: 'Extraction Yield', slug: 'extraction-yield', regex: /\bExtraction Yield\b/gi },
  { term: '總溶解固體', slug: 'tds', regex: /總溶解固體/g },
  { term: 'TDS', slug: 'tds', regex: /\bTDS\b/g },
  { term: '刀盤', slug: 'burr-grinder', regex: /刀盤/g },
  { term: 'Burr Grinder', slug: 'burr-grinder', regex: /\bBurr Grinder\b/gi },
  { term: '擾動', slug: 'agitation', regex: /擾動/g },
  { term: 'Agitation', slug: 'agitation', regex: /\bAgitation\b/gi },
  { term: '旁流', slug: 'bypass', regex: /旁流/g },
  { term: 'Bypass', slug: 'bypass', regex: /\bBypass\b/gi },
  { term: '咖啡油脂', slug: 'crema', regex: /咖啡油脂/g },
  { term: 'Crema', slug: 'crema', regex: /\bCrema\b/gi },
  { term: '細粉', slug: 'fines', regex: /細粉/g },
  { term: 'Fines', slug: 'fines', regex: /\bFines\b/gi },
  { term: '梅納反應', slug: 'maillard-reaction', regex: /梅納反應/g },
  { term: 'Maillard Reaction', slug: 'maillard-reaction', regex: /\bMaillard Reaction\b/gi },
];

export function remarkGlossary() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      // Avoid replacing text inside links, headings, or html elements
      if (
        !parent ||
        parent.type === 'link' || 
        parent.type === 'heading' ||
        parent.type === 'html' ||
        parent.type === 'mdxJsxTextElement' // For Astro MDX components
      ) {
        return;
      }

      let newHtml = node.value;
      let hasMatch = false;

      for (const item of glossaryTerms) {
        // We do a simple replace. This is a basic implementation.
        // It converts the AST text node into an HTML node if a match is found.
        if (item.regex.test(newHtml)) {
          // Reset lastIndex for global regex
          item.regex.lastIndex = 0;
          const originalHtml = newHtml;
          newHtml = newHtml.replace(item.regex, `<a href="/glossary/${item.slug}" class="glossary-link">$&</a>`);
          if (originalHtml !== newHtml) {
            hasMatch = true;
          }
        }
      }

      if (hasMatch) {
        node.type = 'html';
        node.value = newHtml;
      }
    });
  };
}
