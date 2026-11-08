import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

// Only known performance cues are removed. Brackets in code, links, and math stay intact.
const cues = /\[(?:thoughtful|excited|dramatic pause|pause|short pause|long pause|laughs?|laughing|sighs?|whispers?|whispering|cheerful|serious|sad|happy|calm|speaking softly)\](?!\()/gi;
const protectedCode = /(`{3,}[^\n]*\n[\s\S]*?(?:`{3,}|$)|~{3,}[^\n]*\n[\s\S]*?(?:~{3,}|$)|`+[^`\n]*`+)/g;

export function formatAssistantText(original: string): string {
  return original.split(protectedCode).map((part, i) => i % 2 ? part : part
    .replace(cues, "")
    .replace(/[\uFFFD\u200B\uFEFF]/g, "")
    .replace(/([!?])\1{2,}/g, "$1")
    .replace(/^[ \t]*[★☆✦✧]{2,}[ \t]*$/gm, "")
  ).join("").trim();
}

type TextNode = { type: string; value?: string; url?: string; children?: TextNode[]; ordered?: boolean };
const parser = unified().use(remarkParse).use(remarkGfm);

function spokenSymbols(text: string): string {
  return text
    .replace(/\$(\d+(?:\.\d+)?)/g, "$1 dollars")
    .replace(/(\d+(?:\.\d+)?)%/g, "$1 percent")
    .replace(/&/g, " and ")
    .replace(/²/g, " squared ").replace(/³/g, " cubed ")
    .replace(/([\w)]+)\^\{?(-?\d+)\}?/g, "$1 to the power of $2")
    .replace(/√\s*(\w+)/g, "square root of $1")
    .replace(/(\d+)\s*\/\s*(\d+)/g, "$1 divided by $2")
    .replace(/≤/g, " less than or equal to ").replace(/≥/g, " greater than or equal to ")
    .replace(/≠/g, " not equal to ").replace(/≈/g, " approximately equals ")
    .replace(/([\w)²³])\s*\+\s*(?=[\w(])/g, "$1 plus ")
    .replace(/([\w)])\s*[-−]\s+(?=[\w(])/g, "$1 minus ")
    .replace(/[×÷]/g, (symbol) => symbol === "×" ? " times " : " divided by ")
    .replace(/([\w)])\s*\*\s*(?=[\w(])/g, "$1 times ")
    .replace(/=/g, " equals ");
}

function speakText(text: string): string {
  // Keep URL/email spelling intact instead of interpreting their punctuation as math.
  return text.split(/(https?:\/\/[^\s]+|[\w.+-]+@[\w.-]+\.[a-z]{2,})/gi)
    .map((part, i) => i % 2 ? part : spokenSymbols(part)).join("");
}

function readNode(node: TextNode): string {
  if (node.type === "text") return speakText(node.value ?? "");
  if (node.type === "inlineCode" || node.type === "code") return ` ${node.type === "code" ? "Code: " : ""}${node.value ?? ""} `;
  if (node.type === "image") return "";
  if (node.type === "html") return (node.value ?? "").replace(/<[^>]*>/g, "");
  if (node.type === "break" || node.type === "thematicBreak") return " ";
  const children = (node.children ?? []).map(readNode).join("");
  if (node.type === "link") return children || node.url || "";
  return /^(paragraph|heading|listItem|tableRow|blockquote)$/.test(node.type) ? `${children}\n` : children;
}

export function toSpeechText(original: string): string {
  const tree = parser.parse(formatAssistantText(original)) as TextNode;
  return readNode(tree).replace(/\s+/g, " ").trim();
}