// @ts-check
import { describe, it, expect } from "vitest";
import { Template, TemplateFactory } from "./index.js";

describe("Template.bind", () => {
  it("collects refs from elements with data-ref", () => {
    const template = Template.html(`<div data-ref="box"></div>`);
    const markup = template.bind();

    expect(markup.refs.box).toBeInstanceOf(HTMLDivElement);
  });

  it("skips elements without data-ref", () => {
    const template = Template.html(`<div><span></span></div>`);
    const markup = template.bind();

    expect(Object.keys(markup.refs)).toHaveLength(0);
  });

  it("replaces slot comments with provided ChildNodes", () => {
    const template = Template.html(
      `<div data-ref="box"><!--slot:content--></div>`,
    );
    const markup = template.bind({ content: new Text("hello") });

    expect(markup.refs.box.textContent).toBe("hello");
    expect(markup.slots.content.textContent).toBe("hello");
  });

  it("ignores comments that are not slots", () => {
    const template = Template.html(
      `<div data-ref="box"><!-- regular comment --></div>`,
    );
    const markup = template.bind();

    expect(markup.refs.box.childNodes).toHaveLength(1);
    expect(markup.refs.box.firstChild).toBeInstanceOf(Comment);
  });

  it("unwraps Markup instances to their fragment when slotting", () => {
    const inner = Template.html(`<span>nested</span>`);
    const outer = Template.html(`<div data-ref="box"><!--slot:child--></div>`);

    const innerMarkup = inner.bind();
    const outerMarkup = outer.bind({ child: innerMarkup });

    expect(outerMarkup.refs.box.querySelector("span")?.textContent).toBe(
      "nested",
    );
  });

  it("inserts plain ChildNodes directly when slotting", () => {
    const template = Template.html(
      `<div data-ref="box"><!--slot:item--></div>`,
    );
    const node = document.createElement("em");
    const markup = template.bind({ item: node });

    expect(markup.refs.box.firstChild).toBe(node);
  });

  it("defaults to empty slots when bind is called with no arguments", () => {
    const template = Template.html(`<div data-ref="box"></div>`);
    const markup = template.bind();

    expect(markup.refs.box).toBeInstanceOf(HTMLDivElement);
    expect(markup.fragment).toBeInstanceOf(DocumentFragment);
  });
});

describe("TemplateFactory / configurable prefix+attr", () => {
  it("factory with custom slot prefix infers slot names and binds them", () => {
    const tf = new TemplateFactory({ slotPrefix: "$:" });
    const t = tf.html(`<div data-ref="box"><!--$:content--></div>`);
    const m = t.bind({ content: new Text("hi") });

    /** @type {HTMLDivElement} */
    const box = m.refs.box;
    expect(box).toBeInstanceOf(HTMLDivElement);
    expect(box.textContent).toBe("hi");
  });

  it("factory with custom ref attr infers ref names from that attribute", () => {
    const tf = new TemplateFactory({ refAttr: "data-id" });
    const t = tf.html(`<section data-id="myName"></section>`);
    const m = t.bind();

    /** @type {HTMLElement} */
    const el = m.refs.myName;
    expect(el).toBeInstanceOf(HTMLElement);
    expect(el.tagName).toBe("SECTION");
  });

  it("factory with both custom prefix and custom ref attr works together", () => {
    const tf = new TemplateFactory({ slotPrefix: "s:", refAttr: "data-id" });
    const t = tf.html(`<div data-id="box"><!--s:content--></div>`);
    const m = t.bind({ content: new Text("hello") });

    /** @type {HTMLDivElement} */
    const box = m.refs.box;
    expect(box.textContent).toBe("hello");
  });

  it("Template.svg accepts explicit prefix and attr and threads M through", () => {
    const t = Template.svg(`<circle data-id="dot"></circle>`, {
      slotPrefix: "s:",
      refAttr: "data-id",
    });
    const m = t.bind();

    /** @type {SVGCircleElement} */
    const dot = m.refs.dot;
    expect(dot).toBeInstanceOf(SVGCircleElement);
  });

  it("Template.html accepts a partial selectors override", () => {
    // Only slotPrefix overridden; refAttr falls back to "data-ref"
    const t = Template.html(`<div data-ref="box"><!--$:content--></div>`, {
      slotPrefix: "$:",
    });
    const m = t.bind({ content: new Text("hi") });

    /** @type {HTMLDivElement} */
    const box = m.refs.box;
    expect(box.textContent).toBe("hi");

    // And the other direction — only refAttr overridden
    const t2 = Template.html(
      `<section data-id="bar"><!--slot:inner--></section>`,
      { refAttr: "data-id" },
    );
    const m2 = t2.bind({ inner: new Text("yo") });

    /** @type {HTMLElement} */
    const bar = m2.refs.bar;
    expect(bar.textContent).toBe("yo");
  });

  it("factory with no options falls back to the static defaults", () => {
    const tf = new TemplateFactory();
    const t = tf.html(`<div data-ref="box"><!--slot:content--></div>`);
    const m = t.bind({ content: new Text("ok") });

    /** @type {HTMLDivElement} */
    const box = m.refs.box;
    expect(box.textContent).toBe("ok");
    expect(tf.slotPrefix).toBe("slot:");
    expect(tf.refAttr).toBe("data-ref");
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
    const tf = new TemplateFactory({ slotPrefix: "s:" });
    const t = tf.html(`<div><!--s:foo--></div>`);

    const m = t.bind({ foo: new Text("y") });
    expect(m.fragment).toBeInstanceOf(DocumentFragment);

    // Type-only assertion — function is defined but never invoked
    () => {
      // @ts-expect-error — "bar" is not a declared slot; only "foo" is
      t.bind({ bar: new Text("x") });
    };
  });

  it("rejects unknown ref names at the type level", () => {
    const tf = new TemplateFactory({ refAttr: "data-id" });
    const t = tf.html(`<div data-id="box"></div>`);
    const m = t.bind();

    /** @type {HTMLDivElement} */
    const box = m.refs.box;
    expect(box).toBeInstanceOf(HTMLDivElement);

    () => {
      // @ts-expect-error — "other" was never declared as a ref
      m.refs.other;
    };
  });

  it("nests Markup instances produced by the same factory", () => {
    const tf = new TemplateFactory({ slotPrefix: "$:", refAttr: "data-id" });
    const inner = tf.html(`<span data-id="label">nested</span>`).bind();
    const outer = tf
      .html(`<div data-id="box"><!--$:child--></div>`)
      .bind({ child: inner });

    /** @type {HTMLDivElement} */
    const box = outer.refs.box;
    expect(box.querySelector("span")?.textContent).toBe("nested");
  });

  it("custom slot prefix ignores comments using the default 'slot:' prefix", () => {
    const tf = new TemplateFactory({ slotPrefix: "x:" });
    const t = tf.html(`<div data-ref="box"><!--slot:ignored--></div>`);
    const m = t.bind();

    /** @type {HTMLDivElement} */
    const box = m.refs.box;
    expect(box.childNodes).toHaveLength(1);
    expect(m.slots).not.toHaveProperty("ignored");
    expect(box.firstChild).toBeInstanceOf(Comment);
  });
});
