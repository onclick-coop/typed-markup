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

/** @template {string} T */
export class Template {
  static #range = document.createRange();
  static slotPrefix = /** @type {const} */ ("slot:");

  #fragment;
  /**
   * @param {T} template
   */
  constructor(template) {
    this.#fragment = Template.#range.createContextualFragment(template);
  }

  /**
   * Clones the underlying markup with element references.
   * @this {ExtractSlots<T> extends never ? Template<T> : never}
   */
  bind() {
    return this.bindWith(
      /** @type {Record<ExtractSlots<T>, ChildNode>} */ ({}),
    );
  }

  /**
   * Clones the underlying markup with element references and slots replaced.
   * @template {Record<ExtractSlots<T>, ChildNode | Markup<any, any>>} U
   * @param {U} slotted
   */
  bindWith(slotted) {
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
        const ref = n.getAttribute("data-ref");
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
    return new Markup(fragment, slotted, /** @type {ExtractRefs<T>} */ (refs));
  }
}

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
 * @typedef {S extends `${string}<${infer TagAndAttr}>${infer Rest}` ?  (TagAndAttr extends MatchRefAndTag<infer T, infer Ref> ? { [K in Ref]: TagToElement<T> } & ExtractRefsHelper<Rest> : ExtractRefsHelper<Rest>) : {}} ExtractRefsHelper
 */
/**
 * @template {string} T
 * @template {string} R
 * @typedef {`${string} data-ref="${R}"${string}` & `${T} ${string}`} MatchRefAndTag
 */
/**
 * @template {string} S
 * @typedef {ExtractRefsHelper<StripClosingTags<StripComments<S>>>} ExtractRefs
 */
/**
 * @template {string} K
 * @typedef {K extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[K] : (K extends keyof SVGElementTagNameMap ? SVGElementTagNameMap[K] : (K extends keyof MathMLElementTagNameMap ? MathMLElementTagNameMap[K] : HTMLElement))} TagToElement
 */
/**
 * @template {string} S
 * @typedef {S extends `${infer First}</${string}>${infer Rest}` ? `${First}${StripClosingTags<Rest>}` : S } StripClosingTags
 */
