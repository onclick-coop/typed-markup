import { bench, describe } from "vitest";
import { Template } from "./index.js";

describe("Fragment.bind", () => {
  const template = new Template();

  const refsOnly = template.html(
    `<div data-ref="a"><span data-ref="b"><em data-ref="c"></em></span></div>`,
  );

  const slotsOnly = template.html(
    `<div><!--slot:header--><!--slot:body--><!--slot:footer--></div>`,
  );

  const mixed = template.html(
    `<div data-ref="wrapper"><!--slot:header--><span data-ref="label"><!--slot:content--></span><!--slot:footer--></div>`,
  );

  const nestedInner = template.html(`<span data-ref="inner">nested</span>`);

  const nestedOuter = template.html(
    `<div data-ref="wrapper"><!--slot:child--></div>`,
  );

  const large = template.html(
    `<div data-ref="root">` +
    Array.from({ length: 50 }, (_, i) => `<p data-ref="p${i}"><!--slot:s${i}--></p>`).join("") +
    `</div>`,
  );

  bench("refs only (3 refs, 0 slots)", () => {
    refsOnly.bind();
  });

  bench("slots only (0 refs, 3 slots)", () => {
    slotsOnly.bind({
      header: document.createTextNode("h"),
      body: document.createTextNode("b"),
      footer: document.createTextNode("f"),
    });
  });

  bench("mixed (2 refs, 3 slots)", () => {
    mixed.bind({
      header: document.createTextNode("h"),
      content: document.createTextNode("c"),
      footer: document.createTextNode("f"),
    });
  });

  bench("nested Markup in slot", () => {
    const inner = nestedInner.bind();
    nestedOuter.bind({ child: inner });
  });

  bench("large template (50 refs, 50 slots)", () => {
    const slots = {};
    for (let i = 0; i < 50; i++) {
      slots[`s${i}`] = document.createTextNode(`text${i}`);
    }
    large.bind(slots);
  });
});
