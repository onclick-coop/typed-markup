// Type-only tests for TS-syntax consumers — checked by `npm run typecheck`
// (jsconfig.test.json), not collected by vitest. These cover cases that JSDoc
// test files cannot express, e.g. explicit type arguments on a call.
import { Template, template } from "./index.js";

// Zero-arg construction infers the default selectors exactly.
const t1 = new Template();
const t1p: "slot:" = t1.slotPrefix;
const t1a: "data-ref" = t1.refAttr;

// Partial override: the overridden selector infers, the other defaults.
const t2 = new Template({ slotPrefix: "$:" });
const t2p: "$:" = t2.slotPrefix;
const t2a: "data-ref" = t2.refAttr;

// Inference flows through to slots/refs.
const m2 = t2
  .html(`<div data-ref="box"><!--$:content--></div>`)
  .bind({ content: new Text("hi") });
const box2: HTMLDivElement = m2.refs.box;

// @ts-expect-error — explicit non-default type args without runtime selectors
new Template<"a:", "data-b">();

// @ts-expect-error — deviating refAttr type arg still requires refAttr at runtime
new Template<"slot:", "data-b">({ slotPrefix: "slot:" });

// Honest explicit parameterization is allowed.
const t3 = new Template<"a:", "data-b">({ slotPrefix: "a:", refAttr: "data-b" });
const t3p: "a:" = t3.slotPrefix;

// The shared default instance carries exact literal types.
const tp: "slot:" = template.slotPrefix;
const ta: "data-ref" = template.refAttr;

export { t1p, t1a, t2p, t2a, box2, t3p, tp, ta };
