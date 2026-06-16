// cspell:disable
const colorProps = new Set([
  "color",
  "bgcolor",
  "backgroundColor",
  "borderColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "fill",
  "stroke",
  "outlineColor",
]);

const allowedLiteralValues = new Set(["transparent", "inherit", "currentcolor", "none", "initial"]);

function checkValue(node, context) {
  if (!node) return;

  if (node.type === "Literal" && typeof node.value === "string") {
    if (!allowedLiteralValues.has(node.value.toLowerCase())) {
      context.report({
        node,
        messageId: "noHardcodedColor",
      });
    }
  } else if (node.type === "TemplateLiteral") {
    context.report({
      node,
      messageId: "noHardcodedColor",
    });
  } else if (node.type === "ConditionalExpression") {
    checkValue(node.consequent, context);
    checkValue(node.alternate, context);
  } else if (node.type === "LogicalExpression") {
    checkValue(node.left, context);
    checkValue(node.right, context);
  }
}

const noHardcodedColorsRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Forbid usage of hardcoded colors or string-based palette access in props and sx/style objects. Use theme.palette instead.",
    },
    messages: {
      noHardcodedColor:
        "Avoid using string literals for colors. Use the theme callback pattern instead (e.g., sx={(theme) => ({ color: theme.palette.primary.main })}).",
    },
    schema: [], // no options
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name?.type === "JSXIdentifier" && colorProps.has(node.name.name)) {
          if (node.value) {
            if (node.value.type === "Literal") {
              checkValue(node.value, context);
            } else if (node.value.type === "JSXExpressionContainer") {
              checkValue(node.value.expression, context);
            }
          }
        }
      },
      Property(node) {
        const key = node.key;
        let keyName;
        if (key.type === "Identifier") {
          keyName = key.name;
        } else if (key.type === "Literal" && typeof key.value === "string") {
          keyName = key.value;
        }

        if (keyName && colorProps.has(keyName)) {
          checkValue(node.value, context);
        }
      },
    };
  },
};

export default noHardcodedColorsRule;
