const fs = require('fs');
let code = fs.readFileSync('script.js', 'utf8');

// Fix specific occurrences
code = code.replace('chatSettings. = Date.now();', 'chatSettings.lastUserActiveAt = Date.now();'); // first one is in onSendOrCall
code = code.replace('chatSettings. = Date.now();', 'chatSettings.messageTimeNow = Date.now();'); // second one is in message time interval

const replacements = [
    ['if (soulLinkActiveChatType.value === \'character\' && chatSettings.) return;', 'if (soulLinkActiveChatType.value === \'character\' && chatSettings.userBlockedRole) return;'],
    ['if (!chatSettings.) return;', 'if (!chatSettings.activeMessageEnabled) return;'],
    ['const baseDelay = Math.max(1, Number(chatSettings.) || 8) * 1000;', 'const baseDelay = Math.max(1, Number(chatSettings.activeReplyDelaySec) || 8) * 1000;'],
    ['if (!Array.isArray(chatSettings.)) chatSettings. = [];', 'if (!Array.isArray(chatSettings.chatSummaryBoard)) chatSettings.chatSummaryBoard = [];'],
    ['chatSettings..unshift(item);', 'chatSettings.chatSummaryBoard.unshift(item);'],
    ['if (!chatSettings. && !force) return null;', 'if (!chatSettings.chatSummaryEnabled && !force) return null;'],
    ['if (chatSettings.) return null;', 'if (chatSettings.chatSummaryGenerating) return null;'],
    ['if (!force && newChunk.length < Math.max(1, Number(chatSettings.) || 1)) return null;', 'if (!force && newChunk.length < Math.max(1, Number(chatSettings.chatSummaryEveryN) || 1)) return null;'],
    ['chatSettings. = true;', 'chatSettings.chatSummaryGenerating = true;'],
    ['chatSettings. = false;', 'chatSettings.chatSummaryGenerating = false;'],
    ['if (chatSettings.) {', 'if (chatSettings.activeMessageEnabled) {'],
    ['if (chatSettings. === \'female\') return \'她\';', 'if (chatSettings.userPronoun === \'female\') return \'她\';'],
    ['if (chatSettings. === \'male\') return \'他\';', 'if (chatSettings.userPronoun === \'male\') return \'他\';'],
    ['if (chatSettings. === \'nonbinary\') return \'TA\';', 'if (chatSettings.userPronoun === \'nonbinary\') return \'TA\';'],
    ['pronoun: chatSettings.,', 'pronoun: chatSettings.userPronoun,'],
    ['identity: chatSettings. || \'\',', 'identity: chatSettings.userIdentity || \'\','],
    ['relation: chatSettings. || \'\'', 'relation: chatSettings.userRelation || \'\''],
    ['if (chatSettings. && !messageTimeIntervalId) {', 'if (chatSettings.timeSenseEnabled && !messageTimeIntervalId) {'],
    ['} else if (!chatSettings. && messageTimeIntervalId) {', '} else if (!chatSettings.timeSenseEnabled && messageTimeIntervalId) {']
];

for (const [search, replace] of replacements) {
    code = code.split(search).join(replace);
}

fs.writeFileSync('script.js', code);
console.log("Done.");
