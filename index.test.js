import { describe, it, expect } from "vitest";
import { Template } from "./index.js";

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
    const template = Template.html(`<div data-ref="box"><!--slot:content--></div>`);
    const markup = template.bind({ content: document.createTextNode("hello") });

    expect(markup.refs.box.textContent).toBe("hello");
  });

  it("ignores comments that are not slots", () => {
    const template = Template.html(`<div data-ref="box"><!-- regular comment --></div>`);
    const markup = template.bind();

    expect(markup.refs.box.childNodes).toHaveLength(1);
    expect(markup.refs.box.firstChild).toBeInstanceOf(Comment);
  });

  it("unwraps Markup instances to their fragment when slotting", () => {
    const inner = Template.html(`<span>nested</span>`);
    const outer = Template.html(`<div data-ref="box"><!--slot:child--></div>`);

    const innerMarkup = inner.bind();
    const outerMarkup = outer.bind({ child: innerMarkup });

    expect(outerMarkup.refs.box.querySelector("span")?.textContent).toBe("nested");
  });

  it("inserts plain ChildNodes directly when slotting", () => {
    const template = Template.html(`<div data-ref="box"><!--slot:item--></div>`);
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
