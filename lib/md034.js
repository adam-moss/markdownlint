// @ts-check

"use strict";

const { addErrorContext, bareUrlRe, withinAnyRange } = require("../helpers");
const { codeBlockAndSpanRanges, referenceLinkImageData } = require("./cache");

const htmlLinkRe = /<a(?:|\s[^>]+)>[^<>]*<\/a\s*>/ig;

module.exports = {
  "names": [ "MD034", "no-bare-urls" ],
  "description": "Bare URL used",
  "tags": [ "links", "url" ],
  "function": function MD034(params, onError) {
    const { lines } = params;
    const { definitionLineIndices } = referenceLinkImageData();
    const codeExclusions = codeBlockAndSpanRanges();
    for (const [ lineIndex, line ] of lines.entries()) {
      if (definitionLineIndices[0] === lineIndex) {
        definitionLineIndices.shift();
      } else {
        let match = null;
        const lineExclusions = [];
        while ((match = htmlLinkRe.exec(line)) !== null) {
          lineExclusions.push([ lineIndex, match.index, match[0].length ]);
        }
        while ((match = bareUrlRe.exec(line)) !== null) {
          const [ bareUrl ] = match;
          const matchIndex = match.index;
          const bareUrlLength = bareUrl.length;
          const leftLeftChar = line[matchIndex - 2];
          const leftChar = line[matchIndex - 1];
          const rightChar = line[matchIndex + bareUrlLength];
          // Allow ](... to avoid reporting Markdown links
          // Allow <...> to avoid reporting explicit links
          // Allow [...] to avoid conflicts with MD011/no-reversed-links
          // Allow "..." and '...' as a way of deliberately including a bare URL
          if (
            !((leftLeftChar === "]") && (leftChar === "(")) &&
            !((leftChar === "<") && (rightChar === ">")) &&
            !((leftChar === "[") && (rightChar === "]")) &&
            !((leftChar === "\"") && (rightChar === "\"")) &&
            !((leftChar === "'") && (rightChar === "'")) &&
            !withinAnyRange(
              lineExclusions, lineIndex, matchIndex, bareUrlLength
            ) &&
            !withinAnyRange(
              codeExclusions, lineIndex, matchIndex, bareUrlLength
            )
          ) {
            const range = [
              matchIndex + 1,
              bareUrlLength
            ];
            const fixInfo = {
              "editColumn": range[0],
              "deleteCount": range[1],
              "insertText": `<${bareUrl}>`
            };
            addErrorContext(
              onError,
              lineIndex + 1,
              bareUrl,
              null,
              null,
              range,
              fixInfo
            );
          }
        }
      }
    }
  }
};
