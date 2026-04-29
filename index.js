/**
 * @template {Record<string, ChildNode | Markup<any, any>>} T
 * @template {Record<string, Element>} U
 */
class Markup {
  #fragment;
  #slots;
  #refs;
  get slots() {
    return this.#slots;
  }
  get fragment() {
    return this.#fragment;
  }
  get refs() {
    return this.#refs;
  }
  /**
   * @param {DocumentFragment} fragment
   * @param {T} slots
   * @param {U} refs
   */
  constructor(fragment, slots, refs) {
    this.#fragment = fragment;
    this.#slots = slots;
    this.#refs = refs;
  }
}

/**
 * @template {string} T
 * @template {{ [K in keyof M]: Element }} [M=HTMLElementTagNameMap]
 * @template {string} [P=typeof Template.defaultSelectors.slotPrefix]
 * @template {string} [A=typeof Template.defaultSelectors.refAttr]
 */
export class Template {
  static #range = document.createRange();
  static defaultSelectors = /** @type {const} */ ({
    slotPrefix: "slot:",
    refAttr: "data-ref",
  });

  static #svgContext = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  static #mathMLContext = document.createElementNS(
    "http://www.w3.org/1998/Math/MathML",
    "math",
  );

  /**
   * @template {string} T
   * @template {string} [P="slot:"]
   * @template {string} [A="data-ref"]
   * @param {T} template
   * @param {{ slotPrefix?: P, refAttr?: A }} [selectors]
   */
  static svg(template, selectors) {
    return /** @type {Template<T, SVGElementTagNameMap, P, A>} */ (
      new Template(
        template,
        Template.#svgContext,
        /** @type {{ slotPrefix: P, refAttr: A }} */ ({
          ...Template.defaultSelectors,
          ...selectors,
        }),
      )
    );
  }

  /**
   * @template {string} T
   * @template {string} [P="slot:"]
   * @template {string} [A="data-ref"]
   * @param {T} template
   * @param {{ slotPrefix?: P, refAttr?: A }} [selectors]
   */
  static mathML(template, selectors) {
    return /** @type {Template<T, MathMLElementTagNameMap, P, A>} */ (
      new Template(
        template,
        Template.#mathMLContext,
        /** @type {{ slotPrefix: P, refAttr: A }} */ ({
          ...Template.defaultSelectors,
          ...selectors,
        }),
      )
    );
  }

  /**
   * @template {string} T
   * @template {string} [P=typeof Template.defaultSelectors.slotPrefix]
   * @template {string} [A=typeof Template.defaultSelectors.refAttr]
   * @param {T} template
   * @param {{ slotPrefix?: P, refAttr?: A }} [selectors]
   */
  static html(template, selectors) {
    return /** @type {Template<T, HTMLElementTagNameMap, P, A>} */ (
      new Template(
        template,
        document.documentElement,
        /** @type {{ slotPrefix: P, refAttr: A }} */ ({
          ...Template.defaultSelectors,
          ...selectors,
        }),
      )
    );
  }

  #fragment;
  #slotPrefix;
  #refAttr;
  /**
   * @param {T} template
   * @param {M[keyof M]} contextNode
   * @param {{ slotPrefix: P, refAttr: A }} selectors
   */
  constructor(template, contextNode, selectors) {
    Template.#range.selectNodeContents(contextNode);
    this.#fragment = Template.#range.createContextualFragment(template);
    this.#slotPrefix = selectors.slotPrefix;
    this.#refAttr = selectors.refAttr;
  }

  /**
   * Clones the underlying markup with element references and replaces slots.
   * @template {Record<ExtractSlots<T, P>, ChildNode | Markup<any, any>>} U
   * @param {ExtractSlots<T, P> extends never ? [] : [slotted: U]} args
   */
  bind(...args) {
    const slotted =
      /** @type {ExtractSlots<T, P> extends never ? Record<ExtractSlots<T, P>, ChildNode> : U} */ (
        args[0] ?? {}
      );

    const fragment = /** @type {DocumentFragment} */ (
      this.#fragment.cloneNode(true)
    );
    const nodeIter = document.createTreeWalker(
      fragment,
      NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_ELEMENT,
    );
    /** @type {Record<string, Element>} */
    const refs = {};
    /** @type {Array<{ slot: Comment, node: ChildNode | Markup<any, any> }>} */
    const replaceNodes = [];
    for (let n = nodeIter.nextNode(); n; n = nodeIter.nextNode()) {
      if (n instanceof Element) {
        const ref = n.getAttribute(this.#refAttr);
        if (ref != null) {
          refs[ref] = n;
        }
      } else if (n instanceof Comment) {
        const t = n.textContent;
        if (t.startsWith(this.#slotPrefix)) {
          const name = /** @type {keyof U} */ (
            t.slice(this.#slotPrefix.length)
          );
          replaceNodes.push({ node: slotted[name], slot: n });
        }
      }
    }
    for (const { node, slot } of replaceNodes) {
      slot.replaceWith(node instanceof Markup ? node.fragment : node);
    }
    return new Markup(
      fragment,
      slotted,
      /** @type {ExtractRefs<T, M, A>} */ (refs),
    );
  }
}

/**
 * @template {string} [P=typeof Template.defaultSelectors.slotPrefix]
 * @template {string} [A=typeof Template.defaultSelectors.refAttr]
 */
export class TemplateFactory {
  #selectors;
  /**
   * @param {{ slotPrefix?: P, refAttr?: A }} [options]
   */
  constructor(options) {
    this.#selectors = /** @type {{ slotPrefix: P, refAttr: A }} */ ({
      slotPrefix: options?.slotPrefix ?? Template.defaultSelectors.slotPrefix,
      refAttr: options?.refAttr ?? Template.defaultSelectors.refAttr,
    });
  }

  get slotPrefix() {
    return this.#selectors.slotPrefix;
  }
  get refAttr() {
    return this.#selectors.refAttr;
  }

  /**
   * @template {string} T
   * @param {T} template
   */
  html(template) {
    return /** @type {Template<T, HTMLElementTagNameMap, P, A>} */ (
      Template.html(template, this.#selectors)
    );
  }

  /**
   * @template {string} T
   * @param {T} template
   */
  svg(template) {
    return /** @type {Template<T, SVGElementTagNameMap, P, A>} */ (
      Template.svg(template, this.#selectors)
    );
  }

  /**
   * @template {string} T
   * @param {T} template
   */
  mathML(template) {
    return /** @type {Template<T, MathMLElementTagNameMap, P, A>} */ (
      Template.mathML(template, this.#selectors)
    );
  }
}

/**
 * @template {string} S
 * @template {string} [P="slot:"]
 * @typedef {S extends `${string}${MatchSlot<infer T, P>}${infer Rest}` ? T | ExtractSlots<Rest, P> : never} ExtractSlots
 */
/**
 * @template {string} T
 * @template {string} [P="slot:"]
 * @typedef {`<!--${P}${T}-->`} MatchSlot
 */
/**
 * @template {string} S
 * @typedef {StripComments<S> extends `${string}<${infer T}` ? (T extends `${infer Tag} ${string}` ? Tag : (T extends `${infer Tag}>${string}` ? Tag : never)) : never} ExtractTagName
 */
/**
 * @template {string} S
 * @typedef {S extends `${infer First}<!--${string}-->${infer Rest}` ? `${First}${StripComments<Rest>}` : S} StripComments
 */
/**
 * @template {string} S
 * @template {{ [K in keyof M & string]: Element }} [M=HTMLElementTagNameMap]
 * @template {string} [A="data-ref"]
 * @typedef {S extends `${string}<${infer TagAndAttr}>${infer Rest}` ?  (TagAndAttr extends MatchRefAndTag<infer T, infer Ref, A> ? { [K in Ref]: TagToElement<T, M> } & ExtractRefsHelper<Rest, M, A> : ExtractRefsHelper<Rest, M, A>) : {}} ExtractRefsHelper
 */
/**
 * @template {string} T
 * @template {string} R
 * @template {string} [A="data-ref"]
 * @typedef {`${string} ${A}="${R}"${string}` & `${T} ${string}`} MatchRefAndTag
 */
/**
 * @template {string} S
 * @template {{ [K in keyof M & string]: Element }} [M=HTMLElementTagNameMap]
 * @template {string} [A="data-ref"]
 * @typedef {ExtractRefsHelper<StripClosingTags<StripComments<S>>, M, A>} ExtractRefs
 */
/**
 * @template {string} K
 * @template {{ [K in keyof M & string]: Element }} [M=HTMLElementTagNameMap]
 * @typedef {K extends keyof M ? M[K] : Element} TagToElement
 */
/**
 * @template {string} S
 * @typedef {S extends `${infer First}</${string}>${infer Rest}` ? `${First}${StripClosingTags<Rest>}` : S } StripClosingTags
 */
