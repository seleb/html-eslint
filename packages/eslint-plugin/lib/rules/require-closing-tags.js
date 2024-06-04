/**
 * @typedef { import("../types").RuleModule } RuleModule
 * @typedef { import("../types").TagNode } TagNode
 */

const { RULE_CATEGORY, VOID_ELEMENTS } = require("../constants");

const VOID_ELEMENTS_SET = new Set(VOID_ELEMENTS);

const MESSAGE_IDS = {
  MISSING: "missing",
  MISSING_SELF: "missingSelf",
  UNEXPECTED: "unexpected",
};

/**
 * @type {RuleModule}
 */
module.exports = {
  meta: {
    type: "code",

    docs: {
      description: "Require closing tags.",
      category: RULE_CATEGORY.BEST_PRACTICE,
      recommended: true,
    },

    fixable: true,
    schema: [
      {
        type: "object",
        properties: {
          selfClosing: {
            enum: ["always", "never"],
          },
          allowSelfClosingCustom: {
            type: "boolean",
          },
          customPatterns: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      [MESSAGE_IDS.MISSING]: "Missing closing tag for {{tag}}.",
      [MESSAGE_IDS.MISSING_SELF]: "Missing self closing tag for {{tag}}",
      [MESSAGE_IDS.UNEXPECTED]: "Unexpected self closing tag for {{tag}}.",
    },
  },

  create(context) {
    /** @type {string[]} */
    const foreignContext = [];
    const preferSelfClose =
      context.options && context.options.length
        ? context.options[0].selfClosing === "always"
        : false;
    const allowSelfClosingCustom =
      context.options && context.options.length
        ? context.options[0].allowSelfClosingCustom === true
        : false;
    /** @type {string[]} */
    const customPatternsOption = (context.options &&
      context.options.length &&
      context.options[0].customPatterns) || ["-"];
    const customPatterns = customPatternsOption.map((i) => new RegExp(i));

    /**
     * @param {TagNode} node
     */
    function checkClosingTag(node) {
      if (!node.close) {
        context.report({
          node: node,
          data: {
            tag: node.name,
          },
          messageId: MESSAGE_IDS.MISSING,
        });
      }
    }

    /**
     * @param {TagNode} node
     * @param {boolean} shouldSelfClose
     * @param {boolean} fixable
     */
    function checkVoidElement(node, shouldSelfClose, fixable) {
      const hasSelfClose = node.openEnd.value === "/>";
      if (shouldSelfClose && !hasSelfClose) {
        context.report({
          node: node.openEnd,
          data: {
            tag: node.name,
          },
          messageId: MESSAGE_IDS.MISSING_SELF,
          fix(fixer) {
            if (!fixable) {
              return null;
            }
            return [
              fixer.replaceText(node.openEnd, " />"),
              fixer.remove(node.close),
            ];
          },
        });
      }
      if (!shouldSelfClose && hasSelfClose) {
        context.report({
          node: node.openEnd,
          data: {
            tag: node.name,
          },
          messageId: MESSAGE_IDS.UNEXPECTED,
          fix(fixer) {
            if (!fixable) {
              return null;
            }
            return fixer.replaceText(node.openEnd, ">");
          },
        });
      }
    }

    return {
      Tag(node) {
        const isVoidElement = VOID_ELEMENTS_SET.has(node.name);
        const isCustomElement = !!customPatterns.some((i) =>
          node.name.match(i)
        );
        const canSelfClose =
          isVoidElement ||
          foreignContext.length > 0 ||
          (isCustomElement && allowSelfClosingCustom && !node.children.length);
        if (node.selfClosing || canSelfClose) {
          checkVoidElement(node, preferSelfClose && canSelfClose, canSelfClose);
        } else if (node.openEnd.value !== "/>") {
          checkClosingTag(node);
        }
        if (["svg", "math"].includes(node.name)) foreignContext.push(node.name);
      },
      /**
       * @param {TagNode} node
       */
      "Tag:exit"(node) {
        if (node.name === foreignContext[foreignContext.length - 1]) {
          foreignContext.pop();
        }
      },
    };
  },
};
