const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

const search1 = "chatSettings. = chatSettings. && chatSettings..trim()";
const replace1 = "chatSettings.bubbleStyle = chatSettings.customBubbleCSS && chatSettings.customBubbleCSS.trim()";

const search2 = "chatSettings. = compressedDataUrl;\n                    chatSettings. = compressedDataUrl;\n                    chatSettings. = 'image';";
const replace2 = "chatSettings.chatBackgroundImage = compressedDataUrl;\n                    chatSettings.chatBackgroundImageInput = compressedDataUrl;\n                    chatSettings.chatBackgroundStyle = 'image';";

code = code.split(search1).join(replace1);
code = code.split(search2).join(replace2);

// In case search2 doesn't match perfectly with whitespace, let's do regex replace for it:
code = code.replace(/chatSettings\. = compressedDataUrl;\s*chatSettings\. = compressedDataUrl;\s*chatSettings\. = 'image';/, "chatSettings.chatBackgroundImage = compressedDataUrl;\n                    chatSettings.chatBackgroundImageInput = compressedDataUrl;\n                    chatSettings.chatBackgroundStyle = 'image';");

fs.writeFileSync('script.js', code);
console.log("Done.");
