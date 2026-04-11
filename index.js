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
 */
export class Template {
  static #range = document.createRange();
  static slotPrefix = /** @type {const} */ ("slot:");
  static refAttr = /** @type {const} */ ("data-ref");

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
   * @param {T} template
   */
  static svg(template) {
    return /** @type {Template<T, SVGElementTagNameMap>} */ (
      new Template(template, Template.#svgContext)
    );
  }

  /**
   * @template {string} T
   * @param {T} template
   */
  static mathML(template) {
    return /** @type {Template<T, MathMLElementTagNameMap>} */ (
      new Template(template, Template.#mathMLContext)
    );
  }

  /**
   * @template {string} T
   * @param {T} template
   */
  static html(template) {
    return new Template(template, document.documentElement);
  }

  #fragment;
  /**
   * @param {T} template
   * @param {M[keyof M]} contextNode
   */
  constructor(template, contextNode) {
    Template.#range.selectNodeContents(contextNode);
    this.#fragment = Template.#range.createContextualFragment(template);
  }

  /**
   * Clones the underlying markup with element references.
   * @template {Record<ExtractSlots<T>, ChildNode | Markup<any, any>>} U
   * @param {ExtractSlots<T> extends never ? [] : [slotted: U]} args
   */
  bind(...args) {
    const slotted =
      args[0] ?? /** @type {Record<ExtractSlots<T>, ChildNode>} */ ({});
    return this.#bindWith(
      /** @type {ExtractSlots<T> extends never ? Record<ExtractSlots<T>, ChildNode> : U} */ (
        slotted
      ),
    );
  }

  /**
   * Clones the underlying markup with element references and slots replaced.
   * @template {Record<ExtractSlots<T>, ChildNode | Markup<any, any>>} U
   * @param {U} slotted
   */
  #bindWith(slotted) {
    const fragment = /** @type {DocumentFragment} */ (
      this.#fragment.cloneNode(true)
    );
    const nodeIter = document.createNodeIterator(
      fragment,
      NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_ELEMENT,
    );
    /** @type {Record<string, Element>} */
    const refs = {};
    /** @type {Array<{ slot: Comment, node: ChildNode | Markup<any, any> }>} */
    const replaceNodes = [];
    for (let n = nodeIter.nextNode(); n; n = nodeIter.nextNode()) {
      if (n instanceof Element) {
        const ref = n.getAttribute(Template.refAttr);
        if (ref != null) {
          refs[ref] = n;
        }
      } else if (n instanceof Comment) {
        const t = n.textContent;
        if (t.startsWith(Template.slotPrefix)) {
          const name = /** @type {keyof U} */ (
            t.slice(Template.slotPrefix.length)
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
      /** @type {ExtractRefs<T, M>} */ (refs),
    );
  }
}

const a = Template.svg(/* html */ `<svg data-ref="s"><!--slot:t--></svg>`);
const b = Template.html(/* html */ `<a data-ref="x"><!--slot:svg--></a>`);
b.bind({ svg: a.bind({ t: new Text("abc") }) }).refs.x;

/**
 * @template {string} S
 * @typedef {S extends `${string}${MatchSlot<infer T>}${infer Rest}` ? T | ExtractSlots<Rest> : never} ExtractSlots
 */
/**
 * @template {string} T
 * @typedef {`<!--${typeof Template['slotPrefix']}${T}-->`} MatchSlot
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
 * @typedef {S extends `${string}<${infer TagAndAttr}>${infer Rest}` ?  (TagAndAttr extends MatchRefAndTag<infer T, infer Ref> ? { [K in Ref]: TagToElement<T, M> } & ExtractRefsHelper<Rest, M> : ExtractRefsHelper<Rest, M>) : {}} ExtractRefsHelper
 */
/**
 * @template {string} T
 * @template {string} R
 * @typedef {`${string} ${typeof Template['refAttr']}="${R}"${string}` & `${T} ${string}`} MatchRefAndTag
 */
/**
 * @template {string} S
 * @template {{ [K in keyof M & string]: Element }} [M=HTMLElementTagNameMap]
 * @typedef {ExtractRefsHelper<StripClosingTags<StripComments<S>>, M>} ExtractRefs
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
