// @ts-check
import { describe, it, expect } from "vitest";
import { Template } from "./index.js";

// A deliberately large LITERAL template: ~123 opening tags, ~122 comments,
// ~123 closing tags. Before the tail-recursive rewrite of the type-level
// parsers, each pass (StripComments / StripClosingTags / ExtractRefsHelper)
// exceeded TypeScript's ~100 instantiation-depth limit on this fixture
// (ts2589). Tail-call-eliminated parsers stay well inside the ~1000-iteration
// budget. NOTE: this must remain a string literal — runtime-built strings
// (e.g. Array.from(...).join("")) widen to `string` and bypass type-level
// parsing entirely.
const template = new Template().html(
  `<section data-ref="root">
<p data-ref="p0">x</p><!--c0-->
<p data-ref="p1">x</p><!--c1-->
<p data-ref="p2">x</p><!--c2-->
<p data-ref="p3">x</p><!--c3-->
<p data-ref="p4">x</p><!--c4-->
<p data-ref="p5">x</p><!--c5-->
<p data-ref="p6">x</p><!--c6-->
<p data-ref="p7">x</p><!--c7-->
<p data-ref="p8">x</p><!--c8-->
<p data-ref="p9">x</p><!--c9-->
<p data-ref="p10">x</p><!--c10-->
<p data-ref="p11">x</p><!--c11-->
<p data-ref="p12">x</p><!--c12-->
<p data-ref="p13">x</p><!--c13-->
<p data-ref="p14">x</p><!--c14-->
<p data-ref="p15">x</p><!--c15-->
<p data-ref="p16">x</p><!--c16-->
<p data-ref="p17">x</p><!--c17-->
<p data-ref="p18">x</p><!--c18-->
<p data-ref="p19">x</p><!--c19-->
<p data-ref="p20">x</p><!--c20-->
<p data-ref="p21">x</p><!--c21-->
<p data-ref="p22">x</p><!--c22-->
<p data-ref="p23">x</p><!--c23-->
<p data-ref="p24">x</p><!--c24-->
<p data-ref="p25">x</p><!--c25-->
<p data-ref="p26">x</p><!--c26-->
<p data-ref="p27">x</p><!--c27-->
<p data-ref="p28">x</p><!--c28-->
<p data-ref="p29">x</p><!--c29-->
<p data-ref="p30">x</p><!--c30-->
<p data-ref="p31">x</p><!--c31-->
<p data-ref="p32">x</p><!--c32-->
<p data-ref="p33">x</p><!--c33-->
<p data-ref="p34">x</p><!--c34-->
<p data-ref="p35">x</p><!--c35-->
<p data-ref="p36">x</p><!--c36-->
<p data-ref="p37">x</p><!--c37-->
<p data-ref="p38">x</p><!--c38-->
<p data-ref="p39">x</p><!--c39-->
<p data-ref="p40">x</p><!--c40-->
<p data-ref="p41">x</p><!--c41-->
<p data-ref="p42">x</p><!--c42-->
<p data-ref="p43">x</p><!--c43-->
<p data-ref="p44">x</p><!--c44-->
<p data-ref="p45">x</p><!--c45-->
<p data-ref="p46">x</p><!--c46-->
<p data-ref="p47">x</p><!--c47-->
<p data-ref="p48">x</p><!--c48-->
<p data-ref="p49">x</p><!--c49-->
<p data-ref="p50">x</p><!--c50-->
<p data-ref="p51">x</p><!--c51-->
<p data-ref="p52">x</p><!--c52-->
<p data-ref="p53">x</p><!--c53-->
<p data-ref="p54">x</p><!--c54-->
<p data-ref="p55">x</p><!--c55-->
<p data-ref="p56">x</p><!--c56-->
<p data-ref="p57">x</p><!--c57-->
<p data-ref="p58">x</p><!--c58-->
<p data-ref="p59">x</p><!--c59-->
<p data-ref="p60">x</p><!--c60-->
<p data-ref="p61">x</p><!--c61-->
<p data-ref="p62">x</p><!--c62-->
<p data-ref="p63">x</p><!--c63-->
<p data-ref="p64">x</p><!--c64-->
<p data-ref="p65">x</p><!--c65-->
<p data-ref="p66">x</p><!--c66-->
<p data-ref="p67">x</p><!--c67-->
<p data-ref="p68">x</p><!--c68-->
<p data-ref="p69">x</p><!--c69-->
<p data-ref="p70">x</p><!--c70-->
<p data-ref="p71">x</p><!--c71-->
<p data-ref="p72">x</p><!--c72-->
<p data-ref="p73">x</p><!--c73-->
<p data-ref="p74">x</p><!--c74-->
<p data-ref="p75">x</p><!--c75-->
<p data-ref="p76">x</p><!--c76-->
<p data-ref="p77">x</p><!--c77-->
<p data-ref="p78">x</p><!--c78-->
<p data-ref="p79">x</p><!--c79-->
<p data-ref="p80">x</p><!--c80-->
<p data-ref="p81">x</p><!--c81-->
<p data-ref="p82">x</p><!--c82-->
<p data-ref="p83">x</p><!--c83-->
<p data-ref="p84">x</p><!--c84-->
<p data-ref="p85">x</p><!--c85-->
<p data-ref="p86">x</p><!--c86-->
<p data-ref="p87">x</p><!--c87-->
<p data-ref="p88">x</p><!--c88-->
<p data-ref="p89">x</p><!--c89-->
<p data-ref="p90">x</p><!--c90-->
<p data-ref="p91">x</p><!--c91-->
<p data-ref="p92">x</p><!--c92-->
<p data-ref="p93">x</p><!--c93-->
<p data-ref="p94">x</p><!--c94-->
<p data-ref="p95">x</p><!--c95-->
<p data-ref="p96">x</p><!--c96-->
<p data-ref="p97">x</p><!--c97-->
<p data-ref="p98">x</p><!--c98-->
<p data-ref="p99">x</p><!--c99-->
<p data-ref="p100">x</p><!--c100-->
<p data-ref="p101">x</p><!--c101-->
<p data-ref="p102">x</p><!--c102-->
<p data-ref="p103">x</p><!--c103-->
<p data-ref="p104">x</p><!--c104-->
<p data-ref="p105">x</p><!--c105-->
<p data-ref="p106">x</p><!--c106-->
<p data-ref="p107">x</p><!--c107-->
<p data-ref="p108">x</p><!--c108-->
<p data-ref="p109">x</p><!--c109-->
<p data-ref="p110">x</p><!--c110-->
<p data-ref="p111">x</p><!--c111-->
<p data-ref="p112">x</p><!--c112-->
<p data-ref="p113">x</p><!--c113-->
<p data-ref="p114">x</p><!--c114-->
<p data-ref="p115">x</p><!--c115-->
<p data-ref="p116">x</p><!--c116-->
<p data-ref="p117">x</p><!--c117-->
<p data-ref="p118">x</p><!--c118-->
<p data-ref="p119">x</p><!--c119-->
<span data-ref="last"><!--slot:sA--></span>
<em data-ref="end"><!--slot:sB--></em>
</section>`,
);

describe("large template stress (type + runtime)", () => {
  it("collects refs and replaces slots in a large template", () => {
    const m = template.bind({ sA: new Text("alpha"), sB: new Text("beta") });

    /** @type {HTMLParagraphElement} */
    const p0 = m.refs.p0;
    /** @type {HTMLParagraphElement} */
    const p119 = m.refs.p119;
    /** @type {HTMLSpanElement} */
    const last = m.refs.last;

    expect(p0).toBeInstanceOf(HTMLParagraphElement);
    expect(p119).toBeInstanceOf(HTMLParagraphElement);
    expect(last).toBeInstanceOf(HTMLSpanElement);
    expect(last.textContent).toBe("alpha");
    expect(m.refs.end.textContent).toBe("beta");
    // root + p0..p119 + last + end
    expect(Object.keys(m.refs)).toHaveLength(123);

    // Type-only assertion — function is defined but never invoked
    () => {
      // @ts-expect-error — "nope" was never declared as a ref
      m.refs.nope;
    };
  });

  it("requires every inferred slot at the type level", () => {
    () => {
      // @ts-expect-error — missing required slot "sB"
      template.bind({ sA: new Text("a") });
    };
  });
});
