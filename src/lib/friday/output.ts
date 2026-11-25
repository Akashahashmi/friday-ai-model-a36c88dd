import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

// Only known performance cues are removed. Brackets in code, links, and math stay intact.
const cues = /\[(?:thoughtful|excited|dramatic pause|pause|short pause|long pause|laughs?|laughing|sighs?|whispers?|whispering|cheerful|serious|sad|happy|calm|speaking softly)\](?!\()/gi;
const protectedCode = /(`{3,}[^\n]*\n[\s\S]*?(?:`{3,}|$)|~{3,}[^\n]*\n[\s\S]*?(?:~{3,}|$)|`+[^\`\n]*`+)/g;

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

function audioTagForCue(cue: string): string {
  const normalized = cue.toLowerCase().replace(/[\[\]]/g, "").trim();
  if (normalized === "cheerful" || normalized === "excited" || normalized === "happy") return "<excited>";
  if (normalized === "laugh" || normalized === "laughs" || normalized === "laughing") return "<laugh>";
  if (normalized === "sigh" || normalized === "sighs") return "<sigh>";
  if (normalized === "whisper" || normalized === "whispers" || normalized === "whispering" || normalized === "speaking softly") return "<whispers>";
  if (normalized === "pause" || normalized === "short pause" || normalized === "long pause" || normalized === "dramatic pause") return "<pauses>";
  return "";
}

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
  // Convert one explicit performance cue into Gnani Timbre v3.0's supported audio-tag syntax.
  // Ignore cues inside code blocks and inline code.
  let audioTag = "";
  const withoutCues = original.split(protectedCode).map((part, i) => {
    if (i % 2) return part;
    return part.replace(cues, (cue) => {
      if (!audioTag) audioTag = audioTagForCue(cue);
      return "";
    });
  }).join("");
  const tree = parser.parse(formatAssistantText(withoutCues)) as TextNode;
  const spoken = readNode(tree).replace(/\s+/g, " ").trim();
  return spoken && audioTag ? `${audioTag} ${spoken}` : spoken;
}
