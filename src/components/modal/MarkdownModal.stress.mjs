import React from 'react';
import { renderToString } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import fs from 'node:fs';

function renderMd(markdown) {
  return renderToString(
    React.createElement(
      ReactMarkdown,
      { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeHighlight] },
      markdown
    )
  );
}

const testCases = [
  {
    name: '1. Production Markdown File (pong-architecture.md)',
    input: fs.readFileSync('src/data/pong-architecture.md', 'utf8'),
    check: (html) =>
      html.includes('<table') &&
      html.includes('<pre><code') &&
      html.includes('URhythmStoreSubsystem') &&
      html.includes('hljs-keyword') &&
      html.includes('hljs-title'),
  },
  {
    name: '2. Untagged ASCII Art Diagrams',
    input: '```\n+---------------------+\n| Box A  -->  Box B   |\n+---------------------+\n```',
    check: (html) => html.includes('<pre><code>') && html.includes('Box A  --&gt;  Box B'),
  },
  {
    name: '3. Unknown language code block fallback',
    input: '```unreal_blueprint_nonexistent\nBranch(Condition = True) -> SpawnActor(Ball);\n```',
    check: (html) => html.includes('Branch(Condition = True) -&gt; SpawnActor(Ball);'),
  },
  {
    name: '4. Complex C++ templates, pointers, and angle brackets',
    input: '```cpp\n#include <vector>\n#include <memory>\ntemplate<typename T>\nclass Foo : public TSharedFromThis<Foo<T>> {\npublic:\n    TArray<TSharedPtr<FJsonObject>>* Tracks;\n    void Bar() {\n        if (x < y && y > z) {\n            FMath::Lerp<float>(0.0f, 1.0f, Alpha);\n        }\n    }\n};\n```',
    check: (html) => html.includes('hljs-keyword') && html.includes('&lt;') && html.includes('&gt;'),
  },
  {
    name: '5. GFM Table with mixed alignment, inline code, and pipe escaping',
    input: `
| Left | Center | Right |
| :--- | :---: | ---: |
| Normal | **Bold** | *Italic* |
| Empty cell | | Value |
| Pipe in code: \`a \\| b\` | Escaped \\| pipe | End |
`,
    check: (html) =>
      html.includes('<table>') &&
      html.includes('<th style="text-align:left">Left</th>') &&
      html.includes('<th style="text-align:center">Center</th>') &&
      html.includes('<td style="text-align:left">Normal</td>'),
  },
  {
    name: '6. Deeply nested blockquotes and list structures',
    input: `
> Level 1
>> Level 2
>>> Level 3
>>>> Level 4

- List item 1
  - List item 2
    - List item 3
      - List item 4
        - List item 5
`,
    check: (html) =>
      (html.match(/<blockquote>/g) || []).length === 4 &&
      (html.match(/<ul>/g) || []).length === 5,
  },
  {
    name: '7. HTML Tag Escaping / Injection Safety',
    input: `
<script>alert("xss")</script>
<img src="x" onerror="alert(1)" />
<iframe src="javascript:alert(1)"></iframe>
`,
    check: (html) =>
      !html.includes('<script>') &&
      !html.includes('<img') &&
      !html.includes('<iframe') &&
      html.includes('&lt;script&gt;') &&
      html.includes('&lt;img'),
  },
  {
    name: '8. Math equations with LaTeX dollar notation ($ and $$)',
    input: `
Inline formula: $\\alpha(t) = \\frac{\\text{CurrentBeat} - \\text{SpawnBeat}}{\\text{TargetBeat} - \\text{SpawnBeat}}$

Display formula:
$$\\vec{P}(t) = (1 - \\alpha(t))\\vec{P}_{\\text{start}} + \\alpha(t)\\vec{P}_{\\text{target}}$$
`,
    check: (html) =>
      html.includes('Inline formula:') &&
      html.includes('Display formula:') &&
      html.includes('\\alpha(t)') &&
      html.includes('\\vec{P}(t)'),
  },
  {
    name: '9. High volume line stress test (100,000 characters)',
    input: 'Z'.repeat(100000),
    check: (html) => html.length >= 100000 && html.includes('ZZZZ'),
  },
  {
    name: '10. Extreme recursion markdown nesting stress',
    input: '**__~~'.repeat(50) + 'EXTREME_NESTING' + '~~__**'.repeat(50),
    check: (html) => html.includes('EXTREME_NESTING'),
  },
];

console.log('--- STARTING ADVERSARIAL MARKDOWN STRESS SUITE ---');
let passed = 0;
for (const tc of testCases) {
  const startTime = performance.now();
  try {
    const html = renderMd(tc.input);
    const duration = (performance.now() - startTime).toFixed(2);
    const ok = tc.check(html);
    if (ok) {
      console.log(`[PASS] (${duration}ms) ${tc.name}`);
      passed++;
    } else {
      console.error(`[FAIL - Assertion] (${duration}ms) ${tc.name}`);
      console.error(`Output snippet: ${html.slice(0, 200)}...`);
    }
  } catch (err) {
    const duration = (performance.now() - startTime).toFixed(2);
    console.error(`[CRASH] (${duration}ms) ${tc.name}`, err);
  }
}

console.log(`\nVerdict: ${passed} / ${testCases.length} tests passed.`);
if (passed !== testCases.length) {
  process.exit(1);
}
