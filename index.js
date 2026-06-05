/**
 * @template {Record<string, ChildNode | Markup<any, any>>} T
 * @template {Record<string, Element>} U
 */
class Markup {
  #root;
  #slots;
  #refs;
  get slots() {
    return this.#slots;
  }
  get root() {
    return this.#root;
  }
  get refs() {
    return this.#refs;
  }
  /**
   * @param {DocumentFragment} root
   * @param {T} slots
   * @param {U} refs
   */
  constructor(root, slots, refs) {
    this.#root = root;
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
export class Fragment {
  static #range = document.createRange();

  #fragment;
  #slotPrefix;
  #refAttr;
  /**
   * @param {T} template
   * @param {M[keyof M]} contextNode
   * @param {CompleteTemplateSelectors<P, A>} selectors
   */
  constructor(template, contextNode, selectors) {
    Fragment.#range.selectNodeContents(contextNode);
    this.#fragment = Fragment.#range.createContextualFragment(template);
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
      slot.replaceWith(node instanceof Markup ? node.root : node);
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
export class Template {
  static defaultSelectors =
    /** @satisfies {CompleteTemplateSelectors<string, string>} **/ (
      /** @type {const} */ ({
        slotPrefix: "slot:",
        refAttr: "data-ref",
      })
    );

  static #svgContext = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  static #mathMLContext = document.createElementNS(
    "http://www.w3.org/1998/Math/MathML",
    "math",
  );

  #selectors;
  /**
   * The selectors argument is only omittable while P and A match the
   * defaults; a deviating type argument makes the matching runtime value
   * required, so e.g. `new Template<"a:", "data-b">()` is a type error
   * instead of silent type/runtime drift.
   * @param {CompleteTemplateSelectors<P, A> extends typeof Template.defaultSelectors ? [selectors?: TemplateSelectors<P, A>] : [selectors: TemplateSelectors<P, A>]} args
   */
  constructor(...args) {
    const [selectors] = args;
    this.#selectors = /** @type {CompleteTemplateSelectors<P, A>} */ ({
      slotPrefix: selectors?.slotPrefix ?? Template.defaultSelectors.slotPrefix,
      refAttr: selectors?.refAttr ?? Template.defaultSelectors.refAttr,
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
    return /** @type {Fragment<T, HTMLElementTagNameMap, P, A>} */ (
      new Fragment(template, document.documentElement, this.#selectors)
    );
  }

  /**
   * @template {string} T
   * @param {T} template
   */
  svg(template) {
    return /** @type {Fragment<T, SVGElementTagNameMap, P, A>} */ (
      new Fragment(template, Template.#svgContext, this.#selectors)
    );
  }

  /**
   * @template {string} T
   * @param {T} template
   */
  mathML(template) {
    return /** @type {Fragment<T, MathMLElementTagNameMap, P, A>} */ (
      new Fragment(template, Template.#mathMLContext, this.#selectors)
    );
  }
}

/** A ready-to-use Template configured with the default selectors. */
export const template = new Template(Template.defaultSelectors);

/**
 * @template {string} P
 * @template {string} A
 * @typedef {{ slotPrefix: P, refAttr: A }} CompleteTemplateSelectors
 */

/**
 * The selectors argument for a Template: each selector is optional while its
 * type matches the default, and required once it deviates — keeping runtime
 * values in lockstep with the type parameters.
 * @template {string} P
 * @template {string} A
 * @typedef {([P] extends [typeof Template.defaultSelectors.slotPrefix] ? { slotPrefix?: P } : { slotPrefix: P }) & ([A] extends [typeof Template.defaultSelectors.refAttr] ? { refAttr?: A } : { refAttr: A })} TemplateSelectors
 */
/**
 * Accumulator-passing style keeps the recursive reference in tail position so
 * TypeScript evaluates it iteratively (tail-recursion elimination on
 * conditional types) instead of counting against the instantiation depth limit.
 * @template {string} S
 * @template {string} [P="slot:"]
 * @template {string} [Acc=never]
 * @typedef {S extends `${string}${MatchSlot<infer T, P>}${infer Rest}` ? ExtractSlots<Rest, P, Acc | T> : Acc} ExtractSlots
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
 * @template {string} [Acc=""]
 * @typedef {S extends `${infer First}<!--${string}-->${infer Rest}` ? StripComments<Rest, `${Acc}${First}`> : `${Acc}${S}`} StripComments
 */
/**
 * The ref-match test lives in the accumulator type-argument so the result
 * position holds exactly one bare tail call (eligible for tail-recursion
 * elimination). The base case flattens the accumulated intersection into a
 * single object type.
 * @template {string} S
 * @template {{ [K in keyof M & string]: Element }} [M=HTMLElementTagNameMap]
 * @template {string} [A="data-ref"]
 * @template {Record<string, Element>} [Acc={}]
 * @typedef {S extends `${string}<${infer TagAndAttr}>${infer Rest}` ? ExtractRefsHelper<Rest, M, A, TagAndAttr extends MatchRefAndTag<infer T, infer Ref, A> ? Acc & { [K in Ref]: TagToElement<T, M> } : Acc> : { [K in keyof Acc]: Acc[K] }} ExtractRefsHelper
 */
/**
 * @template {string} T
 * @template {string} R
 * @template {string} [A="data-ref"]
 * @typedef {`${string} ${A}="${R}"${string}` & `${T} ${string}`} MatchRefAndTag
 */
/**
 * The `infer R extends ...` reassertion gives the accumulator-built result a
 * provable `Record<string, Element>` upper bound in generic contexts (where
 * the helper is deferred and otherwise opaque); for concrete template strings
 * it is an identity.
 * @template {string} S
 * @template {{ [K in keyof M & string]: Element }} [M=HTMLElementTagNameMap]
 * @template {string} [A="data-ref"]
 * @typedef {ExtractRefsHelper<StripClosingTags<StripComments<S>>, M, A> extends infer R extends Record<string, Element> ? R : never} ExtractRefs
 */
/**
 * @template {string} K
 * @template {{ [K in keyof M & string]: Element }} [M=HTMLElementTagNameMap]
 * @typedef {K extends keyof M ? M[K] : Element} TagToElement
 */
/**
 * @template {string} S
 * @template {string} [Acc=""]
 * @typedef {S extends `${infer First}</${string}>${infer Rest}` ? StripClosingTags<Rest, `${Acc}${First}`> : `${Acc}${S}`} StripClosingTags
 */
