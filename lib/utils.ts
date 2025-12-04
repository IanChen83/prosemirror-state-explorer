import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Default Schema Code for the input
export const DEFAULT_SCHEMA_CODE = `
// Available variables: Schema
// Return a new Schema instance

const ulDOM = ["ul", 0], olDOM = ["ol", 0], liDOM = ["li", 0];
const tableDOM = ["table", 0], theadDOM = ["thead", 0], tbodyDOM = ["tbody", 0], trDOM = ["tr", 0];

const nodes = {
  doc: {
    content: "block+"
  },
  paragraph: {
    content: "inline*",
    group: "block",
    parseDOM: [{tag: "p"}],
    toDOM() { return ["p", 0] }
  },
  blockquote: {
    content: "block+",
    group: "block",
    defining: true,
    parseDOM: [{tag: "blockquote"}],
    toDOM() { return ["blockquote", 0] }
  },
  heading: {
    attrs: {level: {default: 1}},
    content: "inline*",
    group: "block",
    defining: true,
    parseDOM: [{tag: "h1", attrs: {level: 1}},
               {tag: "h2", attrs: {level: 2}},
               {tag: "h3", attrs: {level: 3}}],
    toDOM(node) { return ["h" + node.attrs.level, 0] }
  },
  text: {
    group: "inline"
  },
  hard_break: {
    inline: true,
    group: "inline",
    selectable: false,
    parseDOM: [{tag: "br"}],
    toDOM() { return ["br"] }
  },
  bullet_list: {
    content: "list_item+",
    group: "block",
    parseDOM: [{ tag: "ul" }],
    toDOM() { return ulDOM }
  },
  ordered_list: {
    content: "list_item+",
    group: "block",
    attrs: {
        start: { default: 1, validate: "number" }
    },
    parseDOM: [{
        tag: "ol",
        getAttrs(dom) {
            return {
                start: dom.hasAttribute("start") ? parseInt(dom.getAttribute("start"), 10) : 1
            }
        }
    }],
    toDOM(node) {
        return node.attrs.start === 1
            ? olDOM
            : ["ol", { start: node.attrs.start }, 0]
    }
  },
  list_item: {
    content: "block*",
    parseDOM: [{ tag: "li" }],
    toDOM() { return liDOM }
  },
  table: {
    content: "table_header? table_body",
    group: "block",
    tableRole: "table",
    isolating: true,
    parseDOM: [{ tag: "table" }],
    toDOM() { return tableDOM }
  },
  table_header: {
    content: "table_row",
    parseDOM: [{ tag: "thead" }],
    toDOM() { return theadDOM }
  },
  table_body: {
    content: "table_row*",
    parseDOM: [{ tag: "tbody" }],
    toDOM() { return tbodyDOM }
  },
  table_row: {
    content: "table_cell+",
    tableRole: "row",
    parseDOM: [{ tag: "tr" }],
    toDOM() { return trDOM }
  },
  table_cell: {
    content: "paragraph",
    attrs: {
        align: { default: "left", validate: "string" }
    },
    tableRole: "cell",
    isolating: true,
    parseDOM: [
        { tag: "td", getAttrs: (dom) => ({ align: dom.style.textAlign || "left" }) },
        { tag: "th", getAttrs: (dom) => ({ align: dom.style.textAlign || "left" }) }
    ],
    toDOM(node) {
        const { align } = node.attrs
        const attrs = align !== "left" ? { style: "text-align: " + align } : {}
        return ["td", attrs, 0]
    }
  }
};

const marks = {
  strong: {
    parseDOM: [{tag: "strong"}, {tag: "b"}],
    toDOM() { return ["strong", 0] }
  },
  em: {
    parseDOM: [{tag: "i"}, {tag: "em"}],
    toDOM() { return ["em", 0] }
  }
};

return new Schema({ nodes, marks });
`.trim();
