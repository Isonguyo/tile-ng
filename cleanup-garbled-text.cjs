const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "src");
const replacements = [
  ["â€¦", "..."],
  ["â€”", " - "],
  ["â€“", "-"],
  ["â€¢ ", "- "],
  ["â€¢", "-"],
  ["Â·", " | "],
  ["Â¦", "|"],
  ["â€™", "'"],
  ["â€œ", '"'],
  ["â€", '"'],
  ["â‚¦", "NGN "],
  ["dÃ©cor", "decor"],
  ["âš ", "Warning:"],
  ["âœ…", "New:"],
  ["âœ”", ""],
  ["â­", ""],
  ["1ï¸âƒ£", "1."],
  ["2ï¸âƒ£", "2."],
  ["3ï¸âƒ£", "3."],
];

let changedFiles = 0;
let replacementCount = 0;

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      visit(filePath);
      continue;
    }
    if (!/\.(tsx?|jsx?|css|html|json)$/.test(entry.name)) continue;

    const before = fs.readFileSync(filePath, "utf8");
    let after = before;
    for (const [source, replacement] of replacements) {
      const count = after.split(source).length - 1;
      replacementCount += count;
      after = after.split(source).join(replacement);
    }
    after = after.replace(/ðŸ[^\s<>{}"]{1,8}/g, "");
    if (after !== before) {
      fs.writeFileSync(filePath, after, "utf8");
      changedFiles += 1;
    }
  }
}

visit(root);
process.stdout.write(JSON.stringify({ changedFiles, replacementCount }));
