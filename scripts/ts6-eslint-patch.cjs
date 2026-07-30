/* eslint-disable */
const Module = require("node:module");
const origRequire = Module.prototype.require;

Module.prototype.require = function (id) {
  if (id === "typescript") {
    return origRequire.call(this, "@typescript/typescript6");
  }
  return origRequire.call(this, id);
};
