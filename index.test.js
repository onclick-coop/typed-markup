// @ts-check
import { describe, it, expect } from "vitest";
import { Template, Fragment, template } from "./index.js";

describe("Fragment.bind", () => {
  it("collects refs from elements with data-ref", () => {
    const fragment = new Template().html(`<div data-ref="box"></div>`);
    const markup = fragment.bind();

    expect(fragment).toBeInstanceOf(Fragment);
    expect(markup.refs.box).toBeInstanceOf(HTMLDivElement);
  });

  it("skips elements without data-ref", () => {
    const fragment = new Template().html(`<div><span></span></div>`);
    const markup = fragment.bind();

    expect(Object.keys(markup.refs)).toHaveLength(0);
  });

  it("replaces slot comments with provided ChildNodes", () => {
    const fragment = new Template().html(
      `<div data-ref="box"><!--slot:content--></div>`,
    );
    const markup = fragment.bind({ content: new Text("hello") });

    expect(markup.refs.box.textContent).toBe("hello");
    expect(markup.slots.content.textContent).toBe("hello");
  });

  it("ignores comments that are not slots", () => {
    const fragment = new Template().html(
      `<div data-ref="box"><!-- regular comment --></div>`,
    );
    const markup = fragment.bind();

    expect(markup.refs.box.childNodes).toHaveLength(1);
    expect(markup.refs.box.firstChild).toBeInstanceOf(Comment);
  });

  it("unwraps Markup instances to their root when slotting", () => {
    const template = new Template();
    const inner = template.html(`<span>nested</span>`);
    const outer = template.html(`<div data-ref="box"><!--slot:child--></div>`);

    const innerMarkup = inner.bind();
    const outerMarkup = outer.bind({ child: innerMarkup });

    expect(outerMarkup.refs.box.querySelector("span")?.textContent).toBe(
      "nested",
    );
  });

  it("inserts plain ChildNodes directly when slotting", () => {
    const fragment = new Template().html(
      `<div data-ref="box"><!--slot:item--></div>`,
    );
    const node = document.createElement("em");
    const markup = fragment.bind({ item: node });

    expect(markup.refs.box.firstChild).toBe(node);
  });

  it("defaults to empty slots when bind is called with no arguments", () => {
    const fragment = new Template().html(`<div data-ref="box"></div>`);
    const markup = fragment.bind();

    expect(markup.refs.box).toBeInstanceOf(HTMLDivElement);
    expect(markup.root).toBeInstanceOf(DocumentFragment);
  });
});

describe("Template / configurable prefix+attr", () => {
  it("template with custom slot prefix infers slot names and binds them", () => {
    const template = new Template({ slotPrefix: "$:" });
    const f = template.html(`<div data-ref="box"><!--$:content--></div>`);
    const m = f.bind({ content: new Text("hi") });

    /** @type {HTMLDivElement} */
    const box = m.refs.box;
    expect(box).toBeInstanceOf(HTMLDivElement);
    expect(box.textContent).toBe("hi");
  });

  it("template with custom ref attr infers ref names from that attribute", () => {
    const template = new Template({ refAttr: "data-id" });
    const f = template.html(`<section data-id="myName"></section>`);
    const m = f.bind();

    /** @type {HTMLElement} */
    const el = m.refs.myName;
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.tagName).toBe("SECTION");
  });

  it("template with both custom prefix and custom ref attr works together", () => {
    const template = new Template({ slotPrefix: "s:", refAttr: "data-id" });
    const f = template.html(`<div data-id="box"><!--s:content--></div>`);
    const m = f.bind({ content: new Text("hello") });

    /** @type {HTMLDivElement} */
    const box = m.refs.box;
    expect(box.textContent).toBe("hello");
  });

  it("svg accepts explicit prefix and attr and threads M through", () => {
    const f = new Template({ slotPrefix: "s:", refAttr: "data-id" }).svg(
      `<circle data-id="dot"></circle>`,
    );
    const m = f.bind();

    /** @type {SVGCircleElement} */
    const dot = m.refs.dot;
    expect(dot).toBeInstanceOf(SVGCircleElement);
  });

  it("Template accepts a partial selectors override", () => {
    // Only slotPrefix overridden; refAttr falls back to "data-ref"
    const f = new Template({ slotPrefix: "$:" }).html(
      `<div data-ref="box"><!--$:content--></div>`,
    );
    const m = f.bind({ content: new Text("hi") });

    /** @type {HTMLDivElement} */
    const box = m.refs.box;
    expect(box.textContent).toBe("hi");

    // And the other direction — only refAttr overridden
    const f2 = new Template({ refAttr: "data-id" }).html(
      `<section data-id="bar"><!--slot:inner--></section>`,
    );
    const m2 = f2.bind({ inner: new Text("yo") });

    /** @type {HTMLElement} */
    const bar = m2.refs.bar;
    expect(bar.textContent).toBe("yo");
  });

  it("template with no options falls back to the static defaults", () => {
    const template = new Template();
    const f = template.html(`<div data-ref="box"><!--slot:content--></div>`);
    const m = f.bind({ content: new Text("ok") });

    /** @type {HTMLDivElement} */
    const box = m.refs.box;
    expect(box.textContent).toBe("ok");
    expect(template.slotPrefix).toBe("slot:");
    expect(template.refAttr).toBe("data-ref");
  });

  it("exported `template` instance uses the default selectors", () => {
    /** @type {"slot:"} */
    const sp = template.slotPrefix;
    /** @type {"data-ref"} */
    const ra = template.refAttr;
    expect(sp).toBe("slot:");
    expect(ra).toBe("data-ref");

    const m = template
      .html(`<div data-ref="box"><!--slot:content--></div>`)
      .bind({ content: new Text("hi") });

    /** @type {HTMLDivElement} */
    const box = m.refs.box;
    expect(box.textContent).toBe("hi");

    () => {
      // @ts-expect-error — "other" was never declared as a ref
      m.refs.other;
    };
  });

  it("Template.defaultSelectors exposes the default literals", () => {
    /** @type {"slot:"} */
    const sp = Template.defaultSelectors.slotPrefix;
    /** @type {"data-ref"} */
    const ra = Template.defaultSelectors.refAttr;
    expect(sp).toBe("slot:");
    expect(ra).toBe("data-ref");
  });

  it("rejects unknown slot names at the type level", () => {
    const template = new Template({ slotPrefix: "s:" });
    const f = template.html(`<div><!--s:foo--></div>`);

    const m = f.bind({ foo: new Text("y") });
    expect(m.root).toBeInstanceOf(DocumentFragment);

    // Type-only assertion — function is defined but never invoked
    () => {
      // @ts-expect-error — "bar" is not a declared slot; only "foo" is
      f.bind({ bar: new Text("x") });
    };
  });

  it("rejects unknown ref names at the type level", () => {
    const template = new Template({ refAttr: "data-id" });
    const f = template.html(`<div data-id="box"></div>`);
    const m = f.bind();

    /** @type {HTMLDivElement} */
    const box = m.refs.box;
    expect(box).toBeInstanceOf(HTMLDivElement);

    () => {
      // @ts-expect-error — "other" was never declared as a ref
      m.refs.other;
    };
  });

  it("nests Markup instances produced by the same template", () => {
    const template = new Template({ slotPrefix: "$:", refAttr: "data-id" });
    const inner = template.html(`<span data-id="label">nested</span>`).bind();
    const outer = template
      .html(`<div data-id="box"><!--$:child--></div>`)
      .bind({ child: inner });

    /** @type {HTMLDivElement} */
    const box = outer.refs.box;
    /** @type {HTMLSpanElement} */
    const span1 = inner.refs.label;
    /** @type {HTMLSpanElement} */
    const span2 = outer.slots.child.refs.label;

    expect(span1).toBeInstanceOf(HTMLSpanElement);
    expect(span2).toBeInstanceOf(HTMLSpanElement);
    expect(span1).toBe(span2);
    expect(box.querySelector("span")?.textContent).toBe("nested");
  });

  it("custom slot prefix ignores comments using the default 'slot:' prefix", () => {
    const template = new Template({ slotPrefix: "x:" });
    const f = template.html(`<div data-ref="box"><!--slot:ignored--></div>`);
    const m = f.bind();

    /** @type {HTMLDivElement} */
    const box = m.refs.box;
    expect(box.childNodes).toHaveLength(1);
    expect(m.slots).not.toHaveProperty("ignored");
    expect(box.firstChild).toBeInstanceOf(Comment);
  });
});
