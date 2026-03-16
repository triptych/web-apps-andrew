/**
 * Lightweight Markdown → HTML parser.
 * Supports: headings, bold, italic, code (inline + fenced), blockquotes,
 * ordered/unordered lists, horizontal rules, tables, links, images, paragraphs.
 * No external dependencies.
 *
 * @param {string} md - Raw markdown string
 * @returns {string} HTML string
 */
export function parseMarkdown(md) {
  if (!md) return '';

  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.match(/^```/)) {
      const lang = line.slice(3).trim();
      const langAttr = lang ? ` class="language-${escHtml(lang)}"` : '';
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].match(/^```/)) {
        codeLines.push(escHtml(lines[i]));
        i++;
      }
      out.push(`<pre><code${langAttr}>${codeLines.join('\n')}</code></pre>`);
      i++;
      continue;
    }

    // Headings (allow empty heading, e.g. bare "#")
    const headingMatch = line.match(/^(#{1,6})(?:\s+(.+))?$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      out.push(`<h${level}>${inline(headingMatch[2] || '')}</h${level}>`);
      i++; continue;
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}\s*$/)) {
      out.push('<hr>');
      i++; continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const bqLines = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        bqLines.push(lines[i].slice(2));
        i++;
      }
      out.push(`<blockquote>${parseMarkdown(bqLines.join('\n'))}</blockquote>`);
      continue;
    }

    // Unordered list
    if (line.match(/^[-*+]\s/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^[-*+]\s/)) {
        items.push(`<li>${inline(lines[i].slice(2))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\.\s/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(`<li>${inline(lines[i].replace(/^\d+\.\s/, ''))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Table
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].match(/^[\s|:-]+$/)) {
      const headers = parseTableRow(line);
      i += 2; // skip separator
      const rows = [];
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${headers.map(h => `<th>${inline(h)}</th>`).join('')}</tr></thead>`;
      const tbody = rows.length
        ? `<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`
        : '';
      out.push(`<table>${thead}${tbody}</table>`);
      continue;
    }

    // Empty line → paragraph break
    if (line.trim() === '') {
      i++; continue;
    }

    // Paragraph
    const paraLines = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^(#{1,6}[\s#]|```|> |[-*+]\s|\d+\.\s|[-*_]{3,}\s*$)/)) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      out.push(`<p>${inline(paraLines.join(' '))}</p>`);
    } else {
      // Safety: ensure i always advances to prevent infinite loop
      i++;
    }
  }

  return out.join('\n');
}

/** Parse a table row string into cell strings */
function parseTableRow(row) {
  return row.split('|').slice(1, -1).map(c => c.trim());
}

/** Process inline markdown: bold, italic, code, links, images */
function inline(text) {
  return text
    // Images before links
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) =>
      `<img src="${escHtml(src)}" alt="${escHtml(alt)}" loading="lazy">`)
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) =>
      `<a href="${escHtml(href)}" target="_blank" rel="noopener noreferrer">${escHtml(label)}</a>`)
    // Inline code (before bold/italic to avoid processing inside backticks)
    .replace(/`([^`]+)`/g, (_, code) => `<code>${escHtml(code)}</code>`)
    // Bold+italic
    .replace(/\*{3}(.+?)\*{3}/g, '<strong><em>$1</em></strong>')
    // Bold
    .replace(/\*{2}(.+?)\*{2}/g, '<strong>$1</strong>')
    .replace(/_{2}(.+?)_{2}/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // Strikethrough
    .replace(/~~(.+?)~~/g, '<del>$1</del>');
}

/** Escape HTML special characters */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
