import { computed as U, watch as D, shallowRef as J, ref as M, nextTick as $, onMounted as le, onUnmounted as N, defineComponent as he, toRef as G, createElementBlock as te, openBlock as K, createElementVNode as Q, normalizeStyle as se, Fragment as je, renderList as Qe, unref as F, renderSlot as V, createBlock as Ze, mergeProps as et, withCtx as be, normalizeProps as Ye, guardReactiveProps as Xe, withDirectives as tt, normalizeClass as we, createCommentVNode as _e, vShow as nt, reactive as Pe, provide as st, createVNode as ot } from "vue";
function De(t, e, s = 0, n = t.length - 1, l = lt) {
  for (; n > s; ) {
    if (n - s > 600) {
      const c = n - s + 1, u = e - s + 1, d = Math.log(c), r = 0.5 * Math.exp(2 * d / 3), h = 0.5 * Math.sqrt(d * r * (c - r) / c) * (u - c / 2 < 0 ? -1 : 1), f = Math.max(s, Math.floor(e - u * r / c + h)), v = Math.min(n, Math.floor(e + (c - u) * r / c + h));
      De(t, e, f, v, l);
    }
    const o = t[e];
    let i = s, a = n;
    for (j(t, s, e), l(t[n], o) > 0 && j(t, s, n); i < a; ) {
      for (j(t, i, a), i++, a--; l(t[i], o) < 0; ) i++;
      for (; l(t[a], o) > 0; ) a--;
    }
    l(t[s], o) === 0 ? j(t, s, a) : (a++, j(t, a, n)), a <= e && (s = a + 1), e <= a && (n = a - 1);
  }
}
function j(t, e, s) {
  const n = t[e];
  t[e] = t[s], t[s] = n;
}
function lt(t, e) {
  return t < e ? -1 : t > e ? 1 : 0;
}
class ae {
  constructor(e = 9) {
    this._maxEntries = Math.max(4, e), this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4)), this.clear();
  }
  all() {
    return this._all(this.data, []);
  }
  search(e) {
    let s = this.data;
    const n = [];
    if (!ue(e, s)) return n;
    const l = this.toBBox, o = [];
    for (; s; ) {
      for (let i = 0; i < s.children.length; i++) {
        const a = s.children[i], c = s.leaf ? l(a) : a;
        ue(e, c) && (s.leaf ? n.push(a) : Ie(e, c) ? this._all(a, n) : o.push(a));
      }
      s = o.pop();
    }
    return n;
  }
  collides(e) {
    let s = this.data;
    if (!ue(e, s)) return !1;
    const n = [];
    for (; s; ) {
      for (let l = 0; l < s.children.length; l++) {
        const o = s.children[l], i = s.leaf ? this.toBBox(o) : o;
        if (ue(e, i)) {
          if (s.leaf || Ie(e, i)) return !0;
          n.push(o);
        }
      }
      s = n.pop();
    }
    return !1;
  }
  load(e) {
    if (!(e && e.length)) return this;
    if (e.length < this._minEntries) {
      for (let n = 0; n < e.length; n++)
        this.insert(e[n]);
      return this;
    }
    let s = this._build(e.slice(), 0, e.length - 1, 0);
    if (!this.data.children.length)
      this.data = s;
    else if (this.data.height === s.height)
      this._splitRoot(this.data, s);
    else {
      if (this.data.height < s.height) {
        const n = this.data;
        this.data = s, s = n;
      }
      this._insert(s, this.data.height - s.height - 1, !0);
    }
    return this;
  }
  insert(e) {
    return e && this._insert(e, this.data.height - 1), this;
  }
  clear() {
    return this.data = q([]), this;
  }
  remove(e, s) {
    if (!e) return this;
    let n = this.data;
    const l = this.toBBox(e), o = [], i = [];
    let a, c, u;
    for (; n || o.length; ) {
      if (n || (n = o.pop(), c = o[o.length - 1], a = i.pop(), u = !0), n.leaf) {
        const d = at(e, n.children, s);
        if (d !== -1)
          return n.children.splice(d, 1), o.push(n), this._condense(o), this;
      }
      !u && !n.leaf && Ie(n, l) ? (o.push(n), i.push(a), a = 0, c = n, n = n.children[0]) : c ? (a++, n = c.children[a], u = !1) : n = null;
    }
    return this;
  }
  toBBox(e) {
    return e;
  }
  compareMinX(e, s) {
    return e.minX - s.minX;
  }
  compareMinY(e, s) {
    return e.minY - s.minY;
  }
  toJSON() {
    return this.data;
  }
  fromJSON(e) {
    return this.data = e, this;
  }
  _all(e, s) {
    const n = [];
    for (; e; )
      e.leaf ? s.push(...e.children) : n.push(...e.children), e = n.pop();
    return s;
  }
  _build(e, s, n, l) {
    const o = n - s + 1;
    let i = this._maxEntries, a;
    if (o <= i)
      return a = q(e.slice(s, n + 1)), W(a, this.toBBox), a;
    l || (l = Math.ceil(Math.log(o) / Math.log(i)), i = Math.ceil(o / Math.pow(i, l - 1))), a = q([]), a.leaf = !1, a.height = l;
    const c = Math.ceil(o / i), u = c * Math.ceil(Math.sqrt(i));
    Le(e, s, n, u, this.compareMinX);
    for (let d = s; d <= n; d += u) {
      const r = Math.min(d + u - 1, n);
      Le(e, d, r, c, this.compareMinY);
      for (let h = d; h <= r; h += c) {
        const f = Math.min(h + c - 1, r);
        a.children.push(this._build(e, h, f, l - 1));
      }
    }
    return W(a, this.toBBox), a;
  }
  _chooseSubtree(e, s, n, l) {
    for (; l.push(s), !(s.leaf || l.length - 1 === n); ) {
      let o = 1 / 0, i = 1 / 0, a;
      for (let c = 0; c < s.children.length; c++) {
        const u = s.children[c], d = xe(u), r = rt(e, u) - d;
        r < i ? (i = r, o = d < o ? d : o, a = u) : r === i && d < o && (o = d, a = u);
      }
      s = a || s.children[0];
    }
    return s;
  }
  _insert(e, s, n) {
    const l = n ? e : this.toBBox(e), o = [], i = this._chooseSubtree(l, this.data, s, o);
    for (i.children.push(e), ee(i, l); s >= 0 && o[s].children.length > this._maxEntries; )
      this._split(o, s), s--;
    this._adjustParentBBoxes(l, o, s);
  }
  // split overflowed node into two
  _split(e, s) {
    const n = e[s], l = n.children.length, o = this._minEntries;
    this._chooseSplitAxis(n, o, l);
    const i = this._chooseSplitIndex(n, o, l), a = q(n.children.splice(i, n.children.length - i));
    a.height = n.height, a.leaf = n.leaf, W(n, this.toBBox), W(a, this.toBBox), s ? e[s - 1].children.push(a) : this._splitRoot(n, a);
  }
  _splitRoot(e, s) {
    this.data = q([e, s]), this.data.height = e.height + 1, this.data.leaf = !1, W(this.data, this.toBBox);
  }
  _chooseSplitIndex(e, s, n) {
    let l, o = 1 / 0, i = 1 / 0;
    for (let a = s; a <= n - s; a++) {
      const c = Z(e, 0, a, this.toBBox), u = Z(e, a, n, this.toBBox), d = ut(c, u), r = xe(c) + xe(u);
      d < o ? (o = d, l = a, i = r < i ? r : i) : d === o && r < i && (i = r, l = a);
    }
    return l || n - s;
  }
  // sorts node children by the best axis for split
  _chooseSplitAxis(e, s, n) {
    const l = e.leaf ? this.compareMinX : it, o = e.leaf ? this.compareMinY : ct, i = this._allDistMargin(e, s, n, l), a = this._allDistMargin(e, s, n, o);
    i < a && e.children.sort(l);
  }
  // total margin of all possible split distributions where each node is at least m full
  _allDistMargin(e, s, n, l) {
    e.children.sort(l);
    const o = this.toBBox, i = Z(e, 0, s, o), a = Z(e, n - s, n, o);
    let c = re(i) + re(a);
    for (let u = s; u < n - s; u++) {
      const d = e.children[u];
      ee(i, e.leaf ? o(d) : d), c += re(i);
    }
    for (let u = n - s - 1; u >= s; u--) {
      const d = e.children[u];
      ee(a, e.leaf ? o(d) : d), c += re(a);
    }
    return c;
  }
  _adjustParentBBoxes(e, s, n) {
    for (let l = n; l >= 0; l--)
      ee(s[l], e);
  }
  _condense(e) {
    for (let s = e.length - 1, n; s >= 0; s--)
      e[s].children.length === 0 ? s > 0 ? (n = e[s - 1].children, n.splice(n.indexOf(e[s]), 1)) : this.clear() : W(e[s], this.toBBox);
  }
}
function at(t, e, s) {
  if (!s) return e.indexOf(t);
  for (let n = 0; n < e.length; n++)
    if (s(t, e[n])) return n;
  return -1;
}
function W(t, e) {
  Z(t, 0, t.children.length, e, t);
}
function Z(t, e, s, n, l) {
  l || (l = q(null)), l.minX = 1 / 0, l.minY = 1 / 0, l.maxX = -1 / 0, l.maxY = -1 / 0;
  for (let o = e; o < s; o++) {
    const i = t.children[o];
    ee(l, t.leaf ? n(i) : i);
  }
  return l;
}
function ee(t, e) {
  return t.minX = Math.min(t.minX, e.minX), t.minY = Math.min(t.minY, e.minY), t.maxX = Math.max(t.maxX, e.maxX), t.maxY = Math.max(t.maxY, e.maxY), t;
}
function it(t, e) {
  return t.minX - e.minX;
}
function ct(t, e) {
  return t.minY - e.minY;
}
function xe(t) {
  return (t.maxX - t.minX) * (t.maxY - t.minY);
}
function re(t) {
  return t.maxX - t.minX + (t.maxY - t.minY);
}
function rt(t, e) {
  return (Math.max(e.maxX, t.maxX) - Math.min(e.minX, t.minX)) * (Math.max(e.maxY, t.maxY) - Math.min(e.minY, t.minY));
}
function ut(t, e) {
  const s = Math.max(t.minX, e.minX), n = Math.max(t.minY, e.minY), l = Math.min(t.maxX, e.maxX), o = Math.min(t.maxY, e.maxY);
  return Math.max(0, l - s) * Math.max(0, o - n);
}
function Ie(t, e) {
  return t.minX <= e.minX && t.minY <= e.minY && e.maxX <= t.maxX && e.maxY <= t.maxY;
}
function ue(t, e) {
  return e.minX <= t.maxX && e.minY <= t.maxY && e.maxX >= t.minX && e.maxY >= t.minY;
}
function q(t) {
  return {
    children: t,
    height: 1,
    leaf: !0,
    minX: 1 / 0,
    minY: 1 / 0,
    maxX: -1 / 0,
    maxY: -1 / 0
  };
}
function Le(t, e, s, n, l) {
  const o = [e, s];
  for (; o.length; ) {
    if (s = o.pop(), e = o.pop(), s - e <= n) continue;
    const i = e + Math.ceil((s - e) / n / 2) * n;
    De(t, i, e, s, l), o.push(e, i, i, s);
  }
}
function Fe(t) {
  let e = [], s = null;
  const n = (...o) => (e = o, s !== null || (s = requestAnimationFrame(() => {
    s = null, t(...e);
  })), s), l = () => {
    s !== null && (cancelAnimationFrame(s), s = null);
  };
  return n.cancel = l, n;
}
const Ue = 15e6;
let de = class {
  minX;
  minY;
  maxX;
  maxY;
  id;
  data;
  isPlaceholder;
  index;
  columnIndex;
  indexInColumn;
  width;
  height;
  x;
  y;
  constructor(e) {
    this.id = e.id, this.data = e.data, this.isPlaceholder = e.isPlaceholder, this.index = e.index, this.columnIndex = e.columnIndex, this.indexInColumn = e.indexInColumn, this.width = e.width, this.height = e.height, this.x = e.x, this.y = e.y, this.minX = e.x, this.minY = e.y, this.maxX = e.x + e.width, this.maxY = e.y + e.height;
  }
};
function Oe(t) {
  return Array.from({ length: t }, () => ({ height: 0, items: [] }));
}
function $e(t) {
  let e = { index: -1, height: 1 / 0 };
  return t.forEach((s, n) => {
    s.height < e.height && (e = { index: n, height: s.height });
  }), e;
}
function Ee(t, e, s, n) {
  if (t.length === 0 && s === "masonry")
    return 0;
  let l = 0;
  if (s === "grid" || s === "justified") {
    const o = e[e.length - 1];
    o && (l = o.y + o.height);
  } else
    l = Math.max(...t.map((o) => o.height));
  if (n && n > e.length && e.length > 0) {
    const i = l / e.length * n;
    l = Math.max(l, i);
  }
  return Math.min(l, Ue);
}
function Se({ containerWidth: t, columnWidth: e }) {
  return U(() => !t.value || !e.value ? 1 : Math.max(1, Math.floor(t.value / e.value)));
}
function fe(t, e, s) {
  return U(() => {
    const n = e?.value, l = s.length;
    if (n && n > l) {
      const o = t.value;
      return (l > 0 ? o / l : 100) * n;
    }
    return t.value;
  });
}
function me(t) {
  return U(() => Math.min(t.value, Ue));
}
function Me(t, e, s, n) {
  D(t, (l, o) => {
    if (l.length > o.length) {
      const i = l.slice(o.length);
      e(i);
    } else (l.length < o.length || l.some((i, a) => i[n] !== o[a]?.[n])) && s();
  });
}
function ge(t, e) {
  const s = Fe(e);
  return D(t, (n) => {
    n || setTimeout(() => {
      s();
    }, 100);
  }), s;
}
function ht(t) {
  const {
    itemsToAppend: e,
    columnWidth: s,
    gap: n,
    idKey: l,
    itemHeight: o,
    columns: i,
    allItems: a,
    idToItemMap: c
  } = t;
  if (e.length === 0)
    return { newLayoutItems: [], newBushItems: [], modifiedColumns: i };
  const u = [], d = [], r = [...i];
  return e.forEach((h) => {
    const f = h[l];
    if (c.has(f)) return;
    const v = $e(r), x = v.index, b = {
      id: f,
      data: h,
      isPlaceholder: !!h.isPlaceholder,
      index: a.length + u.length,
      columnIndex: x,
      indexInColumn: r[x].items.length,
      width: s.value,
      height: o ? o(h, s.value) : s.value,
      x: x * (s.value + n.value),
      y: v.height,
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0
      // 将在 BushItem 中计算
    };
    r[x].items.push(b), r[x].height += b.height + n.value, d.push(new de(b)), u.push(b);
  }), { newLayoutItems: u, newBushItems: d, modifiedColumns: r };
}
function dt(t) {
  const { pendingUpdates: e, idToItemMap: s, allItems: n, columns: l, gap: o } = t;
  if (e.size === 0)
    return {
      updatedItems: n,
      updatedColumns: l,
      changedColumns: /* @__PURE__ */ new Map(),
      hasChanges: !1
    };
  const i = [...n], a = [...l], c = /* @__PURE__ */ new Map();
  let u = !1;
  return e.forEach((d, r) => {
    const h = s.get(r);
    if (!h) return;
    const f = h.height;
    if (f === d) return;
    const v = h.columnIndex, x = a[v], b = d - f;
    h.height = d, (!c.has(v) || c.get(v) > h.indexInColumn) && c.set(v, h.indexInColumn), x.height += b, u = !0;
  }), u ? (c.forEach((d, r) => {
    const f = a[r].items;
    if (d >= f.length) return;
    let v = 0;
    if (d > 0) {
      const x = f[d - 1];
      v = x.y + x.height + o.value;
    }
    for (let x = d; x < f.length; x++) {
      const b = f[x];
      b.y = v, v += b.height + o.value;
    }
  }), {
    updatedItems: i,
    updatedColumns: a,
    changedColumns: c,
    hasChanges: u
  }) : {
    updatedItems: i,
    updatedColumns: a,
    changedColumns: c,
    hasChanges: u
  };
}
function ft(t) {
  const { tree: e, viewport: s, containerWidth: n, allItems: l } = t, o = e.search({
    minX: 0,
    minY: s.top,
    maxX: n.value,
    maxY: s.top + s.height
  }), i = new Set(o.map((a) => a.id));
  return l.filter((a) => i.has(a.id));
}
function mt({
  containerWidth: t,
  columnWidth: e,
  rowHeight: s,
  gap: n,
  items: l,
  isScrolling: o,
  idKey: i,
  itemHeight: a,
  estimatedTotalCount: c,
  onBeforeRebuildLayout: u,
  onAfterRebuildLayout: d
}) {
  const r = new ae(), h = J([]), f = /* @__PURE__ */ new Map();
  let v = [];
  const x = /* @__PURE__ */ new Map(), b = M(Date.now()), T = M(0), Y = Se({ containerWidth: t, columnWidth: e }), C = () => {
    v = Oe(Y.value);
  }, X = () => {
    T.value = Ee(
      v,
      h.value,
      "masonry",
      c?.value
    );
  }, k = (I) => {
    if (I.length === 0) return;
    const { newLayoutItems: p, newBushItems: w, modifiedColumns: m } = ht({
      itemsToAppend: I,
      columnWidth: e,
      gap: n,
      idKey: i,
      itemHeight: a,
      columns: v,
      allItems: h.value,
      idToItemMap: f
    });
    p.length > 0 && (v = m, p.forEach((g) => {
      f.set(g.id, g);
    }), r.load(w), h.value = [...h.value, ...p], X(), b.value = Date.now());
  }, L = ge(o, () => {
    if (x.size === 0) return;
    const I = new Map(x);
    x.clear();
    const { updatedItems: p, updatedColumns: w, hasChanges: m } = dt({
      pendingUpdates: I,
      idToItemMap: f,
      allItems: h.value,
      columns: v,
      gap: n
    });
    m && (h.value = p, v = w, X(), b.value = Date.now());
  }), _ = (I, p) => {
    const w = f.get(I);
    w && w.height === p || (x.set(I, p), o.value || L());
  }, P = fe(T, c, h.value), y = me(P), E = () => {
    u && u(), r.clear(), f.clear();
    const I = [...l.value];
    h.value = [], C(), k(I), d && $(() => {
      d();
    });
  }, B = (I) => ft({
    tree: r,
    viewport: I,
    containerWidth: t,
    allItems: h.value
  });
  return Me(l, k, E, i), C(), {
    allItems: h,
    totalHeight: T,
    logicalScrollHeight: P,
    contentHeight: y,
    columnCount: Y,
    updateItemHeight: _,
    rebuildLayout: E,
    findVisibleItems: B,
    layoutUpdateStamp: b
  };
}
function gt(t) {
  const {
    itemsToAppend: e,
    columnWidth: s,
    gap: n,
    idKey: l,
    itemHeight: o,
    columns: i,
    allItems: a,
    idToItemMap: c
  } = t;
  if (e.length === 0)
    return { newLayoutItems: [], newBushItems: [], modifiedColumns: i };
  const u = [], d = [], r = [...i];
  return e.forEach((h) => {
    const f = h[l];
    if (c.has(f)) return;
    const v = $e(r), x = v.index, b = {
      id: f,
      data: h,
      isPlaceholder: !!h.isPlaceholder,
      index: a.length + u.length,
      columnIndex: x,
      indexInColumn: r[x].items.length,
      width: s.value,
      height: o ? o(h, s.value) : s.value,
      x: x * (s.value + n.value),
      y: v.height,
      minX: 0,
      minY: 0,
      maxX: 0,
      maxY: 0
      // 将在 BushItem 中计算
    };
    r[x].items.push(b), r[x].height += b.height + n.value, d.push(new de(b)), u.push(b);
  }), { newLayoutItems: u, newBushItems: d, modifiedColumns: r };
}
function pt(t) {
  const { pendingUpdates: e, idToItemMap: s, allItems: n, columnCount: l, gap: o } = t;
  if (e.size === 0)
    return {
      updatedItems: n,
      hasChanges: !1
    };
  const i = [...n], a = /* @__PURE__ */ new Set();
  if (e.forEach((r, h) => {
    const f = s.get(h);
    !f || f.height === r || (f.height = r, a.add(f.indexInColumn));
  }), a.size === 0)
    return {
      updatedItems: i,
      hasChanges: !1
    };
  const c = Array.from(a).sort((r, h) => r - h);
  c.forEach((r) => {
    const h = r * l.value, f = Math.min(h + l.value, i.length), v = i.slice(h, f);
    if (v.length === 0) return;
    const x = Math.max(...v.map((b) => b.height));
    v.forEach((b) => b.height = x);
  });
  const u = c[0];
  let d = 0;
  if (u > 0) {
    const r = u * l.value - 1;
    if (r >= 0 && r < i.length) {
      const h = i[r];
      d = h.y + h.height + o.value;
    }
  }
  for (let r = u * l.value; r < i.length; r++) {
    const h = i[r];
    if (h.columnIndex === 0 && r > u * l.value) {
      const v = i[r - 1];
      d = v.y + v.height + o.value;
    }
    h.y = d;
  }
  return {
    updatedItems: i,
    hasChanges: !0
  };
}
function vt(t) {
  const { tree: e, viewport: s, containerWidth: n, allItems: l } = t, o = e.search({
    minX: 0,
    minY: s.top,
    maxX: n.value,
    maxY: s.top + s.height
  }), i = new Set(o.map((a) => a.id));
  return l.filter((a) => i.has(a.id));
}
function xt({
  containerWidth: t,
  columnWidth: e,
  rowHeight: s,
  gap: n,
  items: l,
  isScrolling: o,
  idKey: i,
  itemHeight: a,
  estimatedTotalCount: c,
  onBeforeRebuildLayout: u,
  onAfterRebuildLayout: d
}) {
  const r = new ae(), h = J([]), f = /* @__PURE__ */ new Map();
  let v = [];
  const x = /* @__PURE__ */ new Map(), b = M(Date.now()), T = M(0), Y = Se({ containerWidth: t, columnWidth: e }), C = () => {
    v = Oe(Y.value);
  }, X = () => {
    T.value = Ee(
      v,
      h.value,
      "grid",
      c?.value
    );
  }, k = (I) => {
    if (I.length === 0) return;
    const { newLayoutItems: p, newBushItems: w, modifiedColumns: m } = gt({
      itemsToAppend: I,
      columnWidth: e,
      gap: n,
      idKey: i,
      itemHeight: a,
      columns: v,
      allItems: h.value,
      idToItemMap: f
    });
    p.length > 0 && (v = m, p.forEach((g) => {
      f.set(g.id, g);
    }), r.load(w), h.value = [...h.value, ...p], X(), b.value = Date.now());
  }, L = ge(o, () => {
    if (x.size === 0) return;
    const I = new Map(x);
    x.clear();
    const { updatedItems: p, hasChanges: w } = pt({
      pendingUpdates: I,
      idToItemMap: f,
      allItems: h.value,
      columnCount: Y,
      gap: n
    });
    w && (h.value = p, X(), b.value = Date.now());
  }), _ = (I, p) => {
    const w = f.get(I);
    w && w.height === p || (x.set(I, p), o.value || L());
  }, P = fe(T, c, h.value), y = me(P), E = () => {
    u && u(), r.clear(), f.clear();
    const I = [...l.value];
    h.value = [], C(), k(I), d && $(() => {
      d();
    });
  }, B = (I) => vt({
    tree: r,
    viewport: I,
    containerWidth: t,
    allItems: h.value
  });
  return Me(l, k, E, i), C(), {
    allItems: h,
    totalHeight: T,
    logicalScrollHeight: P,
    contentHeight: y,
    columnCount: Y,
    updateItemHeight: _,
    rebuildLayout: E,
    findVisibleItems: B,
    layoutUpdateStamp: b
  };
}
const ze = 1;
function It(t) {
  const {
    startIndex: e = 0,
    items: s,
    containerWidth: n,
    rowHeight: l,
    gap: o,
    idealWidths: i,
    segmentTree: a,
    idKey: c,
    existingItems: u = []
  } = t;
  if (!a)
    return { newLayoutItems: [], layoutComplete: !1 };
  const d = n.value, r = e > 0 && u.length > 0 ? u.slice(0, e) : [];
  let h = e, f = 0;
  if (e > 0 && r.length > 0) {
    const x = r[e - 1];
    x && (f = x.y + x.height + o.value);
  }
  const v = s.length;
  for (; h < v; ) {
    const x = a.query(h, v - 1) / (v - h), b = x > 0 ? Math.max(1, Math.floor(d / (x + o.value))) : 1, T = d - (b - 1) * o.value, Y = a.findBreakpoint(h, T);
    let C = Y.endIndex;
    C < h && (C = h);
    const X = s.slice(h, C + 1);
    if (C === v - 1) {
      let A = 0;
      X.forEach((L, _) => {
        const P = h + _, y = i[P];
        r[P] = {
          id: L[c],
          data: L,
          index: P,
          isPlaceholder: !!L.isPlaceholder,
          width: y,
          height: l.value,
          x: A,
          y: f,
          minX: A,
          minY: f,
          maxX: A + y,
          maxY: f + l.value,
          columnIndex: _,
          indexInColumn: 0
        }, A += y + o.value;
      }), f += l.value + o.value;
    } else {
      const A = Y.sum, L = (X.length - 1) * o.value, _ = (d - L) / A, P = l.value * _;
      let y = 0;
      X.forEach((E, B) => {
        const I = h + B, w = i[I] * _;
        r[I] = {
          id: E[c],
          data: E,
          index: I,
          isPlaceholder: !!E.isPlaceholder,
          width: w,
          height: P,
          x: y,
          y: f,
          minX: y,
          minY: f,
          maxX: y + w,
          maxY: f + P,
          columnIndex: B,
          indexInColumn: 0
        }, y += w + o.value;
      }), f += P + o.value;
    }
    h = C + 1;
  }
  return { newLayoutItems: r, layoutComplete: !0 };
}
function bt(t) {
  const {
    itemsToAppend: e,
    rowHeight: s,
    idKey: n,
    itemAspectRatios: l
  } = t;
  return e.length === 0 ? { newIdealWidths: [] } : { newIdealWidths: e.map((i) => {
    const a = l.get(i[n]) || ze;
    return s.value * a;
  }) };
}
function wt(t) {
  const {
    pendingUpdates: e,
    idToItemMap: s,
    itemAspectRatios: n,
    segmentTree: l,
    idealWidths: o,
    rowHeight: i
  } = t;
  if (e.size === 0 || !l)
    return {
      minChangedIndex: 1 / 0,
      updatedSegmentTree: l,
      updatedIdealWidths: o,
      hasChanges: !1
    };
  const a = [...o];
  let c = 1 / 0, u = !1;
  return e.forEach((d, r) => {
    const h = s.get(r);
    if (!h || h.height === d) return;
    const f = n.get(r) || ze, v = h.width / d;
    if (Math.abs(f - v) > 1e-6) {
      const x = i.value * v;
      l.update(h.index, x), a[h.index] = x, h.index < c && (c = h.index, u = !0);
    }
  }), {
    minChangedIndex: c,
    updatedSegmentTree: l,
    updatedIdealWidths: a,
    hasChanges: u
  };
}
function yt(t) {
  const { tree: e, viewport: s, containerWidth: n, allItems: l } = t, o = e.search({
    minX: 0,
    minY: s.top,
    maxX: n.value,
    maxY: s.top + s.height
  }), i = new Set(o.map((a) => a.id));
  return l.filter((a) => i.has(a.id));
}
function Et(t) {
  const e = t.length, s = Array(4 * e).fill(null).map(() => ({ sum: 0 })), n = (i, a, c) => {
    if (a === c) {
      s[i] = { sum: t[a] };
      return;
    }
    const u = Math.floor((a + c) / 2), d = 2 * i + 1, r = 2 * i + 2;
    n(d, a, u), n(r, u + 1, c), s[i].sum = s[d].sum + s[r].sum;
  }, l = (i, a, c, u, d) => {
    if (a === c) {
      s[i].sum = d;
      return;
    }
    const r = Math.floor((a + c) / 2), h = 2 * i + 1, f = 2 * i + 2;
    u <= r ? l(h, a, r, u, d) : l(f, r + 1, c, u, d), s[i].sum = s[h].sum + s[f].sum;
  }, o = (i, a, c, u, d) => {
    if (u > c || d < a)
      return 0;
    if (u <= a && c <= d)
      return s[i].sum;
    const r = Math.floor((a + c) / 2), h = 2 * i + 1, f = 2 * i + 2, v = o(h, a, r, u, d), x = o(f, r + 1, c, u, d);
    return v + x;
  };
  return e > 0 && n(0, 0, e - 1), {
    update: (i, a) => {
      i < 0 || i >= e || (t[i] = a, l(0, 0, e - 1, i, a));
    },
    query: (i, a) => i < 0 || a >= e || i > a ? 0 : o(0, 0, e - 1, i, a),
    findBreakpoint: (i, a) => {
      if (i < 0 || i >= e) return { endIndex: i - 1, sum: 0 };
      let c = i, u = e - 1, d = i - 1;
      for (; c <= u; ) {
        const h = Math.floor((c + u) / 2);
        o(0, 0, e - 1, i, h) <= a ? (d = h, c = h + 1) : u = h - 1;
      }
      const r = d >= i ? o(0, 0, e - 1, i, d) : 0;
      return { endIndex: d, sum: r };
    }
  };
}
function St({
  containerWidth: t,
  columnWidth: e,
  rowHeight: s,
  gap: n,
  items: l,
  isScrolling: o,
  idKey: i,
  itemHeight: a,
  estimatedTotalCount: c,
  onBeforeRebuildLayout: u,
  onAfterRebuildLayout: d
}) {
  const r = new ae();
  let h = [], f = null;
  const v = /* @__PURE__ */ new Map(), x = J([]), b = /* @__PURE__ */ new Map(), T = /* @__PURE__ */ new Map(), Y = M(Date.now()), C = M(0), X = Se({ containerWidth: t, columnWidth: e }), k = () => {
    C.value = Ee(
      [],
      // justified模式不使用columns
      x.value,
      "justified",
      c?.value
    );
  }, A = (m = 0) => {
    if (!f) return;
    const { newLayoutItems: g, layoutComplete: S } = It({
      startIndex: m,
      items: l.value,
      containerWidth: t,
      rowHeight: s,
      gap: n,
      idealWidths: h,
      segmentTree: f,
      idKey: i,
      existingItems: x.value
    });
    if (!S) return;
    x.value = g, b.clear(), g.forEach((R) => {
      R && b.set(R.id, R);
    }), r.clear();
    const H = g.map((R) => new de(R));
    r.load(H), k(), Y.value = Date.now();
  }, L = (m) => {
    if (m.length === 0) return;
    const { newIdealWidths: g } = bt({
      itemsToAppend: m,
      rowHeight: s,
      idKey: i,
      itemAspectRatios: v
    });
    h.push(...g), f = Et(h), A(0);
  }, P = ge(o, () => {
    if (T.size === 0) return;
    const m = new Map(T);
    T.clear();
    const {
      minChangedIndex: g,
      updatedSegmentTree: S,
      updatedIdealWidths: H,
      hasChanges: R
    } = wt({
      pendingUpdates: m,
      idToItemMap: b,
      itemAspectRatios: v,
      segmentTree: f,
      idealWidths: h,
      rowHeight: s
    });
    f = S, h = H, R && g !== 1 / 0 && A(g);
  }), y = (m, g) => {
    const S = b.get(m);
    S && S.height === g || (T.set(m, g), o.value || P());
  }, E = fe(C, c, x.value), B = me(E), I = () => {
    u && u(), r.clear(), b.clear(), x.value = [], C.value = 0, h = [], f = null;
    const m = [...l.value];
    L(m), d && $(() => {
      d();
    });
  }, p = (m) => yt({
    tree: r,
    viewport: m,
    containerWidth: t,
    allItems: x.value
  });
  function w() {
    let m = l.value.length;
    D(l, (g) => {
      if (g.length > m) {
        const S = g.slice(m);
        L(S), m = g.length;
      } else
        I(), m = g.length;
    });
  }
  return w(), {
    allItems: x,
    totalHeight: C,
    logicalScrollHeight: E,
    contentHeight: B,
    columnCount: X,
    updateItemHeight: y,
    rebuildLayout: I,
    findVisibleItems: p,
    layoutUpdateStamp: Y
  };
}
function Re(t, e) {
  let s = 0, n = t.length;
  for (; s < n; ) {
    const l = Math.floor((s + n) / 2);
    e(t[l]) ? n = l : s = l + 1;
  }
  return s;
}
function Mt(t, e, s) {
  const n = Re(t, (o) => o.y >= e), l = Re(t, (o) => o.y > s);
  return t.slice(n, l);
}
function Bt(t) {
  return new de(t);
}
function ye(t) {
  return t.map(Bt);
}
function Tt(t, e, s, n, l) {
  let o = 0;
  return t.map((i, a) => {
    const c = s(i), u = {
      id: i[l],
      data: i,
      index: a,
      x: 0,
      y: o,
      width: Math.max(0, e - n),
      // 减去间距，防止溢出
      height: c,
      minX: 0,
      minY: o,
      maxX: Math.max(0, e - n),
      maxY: o + c,
      columnIndex: 0,
      indexInColumn: a,
      isPlaceholder: !!i.isPlaceholder
    };
    return o += c + n, u;
  });
}
function Ct({
  itemsToAppend: t,
  containerWidth: e,
  itemHeight: s,
  gap: n,
  idKey: l,
  existingItems: o,
  idToItemMap: i
}) {
  if (t.length === 0)
    return { newLayoutItems: [], newBushItems: [] };
  const a = o.length > 0 ? o[o.length - 1].y + o[o.length - 1].height + n : 0, c = [];
  let u = a;
  t.forEach((r, h) => {
    const f = o.length + h, v = s(r), x = {
      id: r[l],
      data: r,
      index: f,
      x: 0,
      y: u,
      width: Math.max(0, e - n),
      // 减去间距，防止溢出
      height: v,
      minX: 0,
      minY: u,
      maxX: Math.max(0, e - n),
      maxY: u + v,
      columnIndex: 0,
      indexInColumn: f,
      isPlaceholder: !!r.isPlaceholder
    };
    c.push(x), i.set(r[l], x), u += v + n;
  });
  const d = ye(c);
  return { newLayoutItems: c, newBushItems: d };
}
function Ht({
  pendingUpdates: t,
  idToItemMap: e,
  allItems: s,
  gap: n
}) {
  if (t.size === 0)
    return { updatedItems: s, hasChanges: !1 };
  const l = new Map(t), o = [...s];
  let i = !1;
  const a = Array.from(l.entries()).sort(([c], [u]) => c - u);
  for (const [c, u] of a) {
    const d = e.get(c);
    if (!d || d.height === u) continue;
    d.height, d.height = u, d.maxY = d.y + u, i = !0;
    const r = d.index;
    let h = d.y + u + n;
    for (let f = r + 1; f < o.length; f++) {
      const v = o[f];
      h - v.y !== 0 && (v.y = h, v.minY = h, v.maxY = h + v.height, i = !0), h = v.y + v.height + n;
    }
  }
  return { updatedItems: o, hasChanges: i };
}
function Yt({
  sortedItems: t,
  viewport: e,
  containerWidth: s
}) {
  const { top: n, height: l } = e, o = n + l;
  return Mt(t, n, o);
}
function Xt({
  containerWidth: t,
  columnWidth: e,
  rowHeight: s,
  gap: n,
  items: l,
  isScrolling: o,
  idKey: i,
  itemHeight: a,
  estimatedTotalCount: c,
  onBeforeRebuildLayout: u,
  onAfterRebuildLayout: d
}) {
  const r = new ae(), h = J([]), f = /* @__PURE__ */ new Map(), v = [], x = /* @__PURE__ */ new Map(), b = M(Date.now()), T = M(0), Y = M(1), C = () => {
    if (h.value.length === 0) {
      T.value = 0;
      return;
    }
    const I = h.value[h.value.length - 1];
    let p = I.y + I.height;
    if (c?.value && c.value > h.value.length) {
      const m = p / h.value.length * c.value;
      p = Math.max(p, m);
    }
    T.value = Math.min(p, 15e6);
  }, X = () => {
    v.length = 0, v.push(...h.value.sort((I, p) => I.y - p.y));
  }, k = (I) => {
    if (I.length === 0) return;
    const { newLayoutItems: p, newBushItems: w } = Ct({
      itemsToAppend: I,
      containerWidth: t.value,
      itemHeight: a ? (m) => a(m, t.value) : () => s.value,
      gap: n.value,
      idKey: i,
      existingItems: h.value,
      idToItemMap: f
    });
    p.length > 0 && (p.forEach((m) => {
      f.set(m.id, m);
    }), r.load(w), h.value = [...h.value, ...p], X(), C(), b.value = Date.now());
  }, L = ge(o, () => {
    if (x.size === 0) return;
    const I = new Map(x);
    x.clear();
    const { updatedItems: p, hasChanges: w } = Ht({
      pendingUpdates: I,
      idToItemMap: f,
      allItems: h.value,
      gap: n.value
    });
    if (w) {
      h.value = p, X(), C(), b.value = Date.now(), r.clear();
      const m = ye(p);
      r.load(m);
    }
  }), _ = (I, p) => {
    const w = f.get(I);
    w && w.height === p || (x.set(I, p), o.value || L());
  }, P = fe(T, c, h.value), y = me(P), E = () => {
    u && u(), r.clear(), f.clear();
    const I = [...l.value];
    h.value = [], v.length = 0;
    const p = Tt(
      I,
      t.value,
      a ? (m) => a(m, t.value) : () => s.value,
      n.value,
      i
    );
    h.value = p, p.forEach((m) => {
      f.set(m.id, m);
    }), X();
    const w = ye(p);
    r.load(w), C(), b.value = Date.now(), d && $(() => {
      d();
    });
  }, B = (I) => Yt({
    sortedItems: v,
    viewport: I,
    containerWidth: t.value
  });
  return Me(l, k, E, i), {
    allItems: h,
    totalHeight: T,
    logicalScrollHeight: P,
    contentHeight: y,
    columnCount: Y,
    updateItemHeight: _,
    rebuildLayout: E,
    findVisibleItems: B,
    layoutUpdateStamp: b
  };
}
function Pt(t) {
  const { mode: e = "masonry" } = t;
  return e === "grid" ? xt(t) : e === "justified" ? St(t) : e === "list" ? Xt(t) : mt(t);
}
function Lt({ allItems: t, scrollTop: e, containerHeight: s, overscanBy: n = 2 }) {
  const l = M([]), o = U(() => n * s.value), i = () => {
    const a = e.value - o.value, c = e.value + s.value + o.value, u = t.value.filter(
      (d) => d.y + d.height > a && d.y < c
    );
    l.value = u;
  };
  return D([t, e, s], i, {
    immediate: !0,
    // 确保初始加载时执行
    deep: !1
    // allItems 是 shallowRef，我们只关心它的替换
  }), {
    visibleItems: l,
    forceUpdate: i
    // forceUpdate 仍然可以作为手动触发的手段
  };
}
function Rt(t, e) {
  let s = null, n = null, l = null, o, i = 0;
  function a() {
    i = Date.now(), s = null, o = t.apply(l, n), s || (n = l = null);
  }
  return function(...c) {
    const u = Date.now();
    i || (i = u);
    const d = e - (u - i);
    return n = c, l = this, d <= 0 || d > e ? (s && (clearTimeout(s), s = null), i = u, o = t.apply(l, n), s || (n = l = null)) : s || (s = setTimeout(a, d)), o;
  };
}
function kt(t, e, s, n, l, o, i, a = 50, c = 150) {
  let u = null, d = 0;
  return { handleScroll: Rt(() => {
    if (!t.value || n.value) return;
    const h = t.value.scrollTop;
    h > d ? l.value = "down" : h < d && (l.value = "up"), e.value = h, d = h, o && o(h, l.value), s.value = !0, u && clearTimeout(u), u = setTimeout(() => {
      s.value = !1, l.value = "none", i && i(e.value);
    }, c);
  }, a), scrollTimeout: u };
}
function At(t) {
  let e = null;
  return { ignoreScrollEventsFor: (n) => {
    t.value = !0, e && clearTimeout(e), e = setTimeout(() => {
      t.value = !1;
    }, n);
  }, ignoreTimeout: e };
}
function _t({
  scrollContainer: t,
  onScroll: e,
  onScrollSettled: s,
  throttleTime: n = 50,
  scrollSettleTime: l = 150
}) {
  const o = M(0), i = M(!1), a = M(!1), c = M("none"), { handleScroll: u, scrollTimeout: d } = kt(
    t,
    o,
    i,
    a,
    c,
    e,
    s,
    n,
    l
  ), { ignoreScrollEventsFor: r, ignoreTimeout: h } = At(a);
  return le(() => {
    t.value && t.value.addEventListener("scroll", u, { passive: !0 });
  }), N(() => {
    t.value && t.value.removeEventListener("scroll", u), d && clearTimeout(d), h && clearTimeout(h);
  }), {
    scrollTop: o,
    isScrolling: i,
    scrollDirection: c,
    ignoreScrollEventsFor: r
  };
}
const ke = 20;
function Dt({ scrollContainer: t, totalHeight: e }) {
  const s = M(null), n = M(null);
  let l = null;
  const o = () => {
    if (!t.value || !s.value || !n.value) return;
    const {
      scrollTop: f,
      scrollHeight: v,
      clientHeight: x
    } = t.value;
    if (v <= x) {
      s.value.style.display = "none", n.value.style.display = "none";
      return;
    } else
      s.value.style.display = "block", n.value.style.display = "block";
    const b = x / v, T = Math.max(b * x, ke), Y = v - x, C = Y > 0 ? f / Y : 0, k = x - T, A = C * k;
    s.value.style.height = `${T}px`, s.value.style.transform = `translateY(${A}px)`;
  }, i = () => {
    l && cancelAnimationFrame(l), l = requestAnimationFrame(o);
  };
  le(() => {
    t.value && (t.value.addEventListener("scroll", i, { passive: !0 }), requestAnimationFrame(o)), n.value && n.value.addEventListener("mousedown", d);
  }), N(() => {
    t.value && t.value.removeEventListener("scroll", i), l && cancelAnimationFrame(l), document.removeEventListener("mousemove", r), document.removeEventListener("mouseup", h), n.value && n.value.removeEventListener("mousedown", d);
  }), D([e, () => t.value?.clientHeight], () => {
    o();
  });
  const a = M(!1);
  let c = 0, u = 0;
  const d = (f) => {
    if (f.target instanceof HTMLElement) {
      if (f.target === s.value || f.target.parentElement === n.value)
        f.preventDefault(), f.stopPropagation(), a.value = !0, c = f.clientY, u = t.value?.scrollTop ?? 0, document.addEventListener("mousemove", r), document.addEventListener("mouseup", h);
      else if (f.target === n.value) {
        const { clientY: v, currentTarget: x } = f;
        if (!t.value || !x) return;
        const b = x.getBoundingClientRect(), T = (v - b.top) / b.height, Y = t.value.scrollHeight, C = t.value.clientHeight;
        t.value.scrollTop = T * (Y - C);
      }
    }
  }, r = (f) => {
    if (!a.value || !t.value) return;
    f.preventDefault(), f.stopPropagation();
    const v = f.clientY - c;
    t.value.clientHeight;
    const x = t.value.scrollHeight, b = t.value.clientHeight, T = x - b, Y = Math.max(b / x * b, ke), C = b - Y, X = T / C, k = u + v * X;
    t.value.scrollTop = Math.max(0, Math.min(k, T));
  }, h = (f) => {
    a.value && (f.preventDefault(), f.stopPropagation(), a.value = !1, document.removeEventListener("mousemove", r), document.removeEventListener("mouseup", h));
  };
  return {
    thumbRef: s,
    trackRef: n
  };
}
const Ft = { class: "virtual-masonry-grid-wrapper" }, Ut = /* @__PURE__ */ he({
  __name: "VirtualMasonryGrid",
  props: {
    items: {},
    columnWidth: { default: 200 },
    rowHeight: { default: 200 },
    gap: { default: 15 },
    idKey: { default: "id" },
    itemHeight: { type: Function, default: void 0 },
    overscanBy: { default: 2 },
    estimatedTotalCount: { default: void 0 },
    scrollToIndex: {},
    scrollToOptions: {},
    mode: { default: "masonry" },
    managedByProvider: { type: Boolean, default: !1 }
  },
  emits: ["load-more", "scroll-settled", "scroll"],
  setup(t, { expose: e, emit: s }) {
    const n = t, l = s, o = M(null), i = M(0), a = M(0), c = M(0), { scrollTop: u, isScrolling: d, scrollDirection: r, ignoreScrollEventsFor: h } = _t({
      scrollContainer: o,
      onScroll: (g, S) => {
        l("scroll", g, S);
      },
      onScrollSettled: (g) => {
        const S = L.value.map((H) => H.index);
        S.length > 0 && l("scroll-settled", S);
      }
    }), f = M(-1), {
      allItems: v,
      logicalScrollHeight: x,
      contentHeight: b,
      updateItemHeight: T,
      rebuildLayout: Y,
      layoutUpdateStamp: C
    } = Pt({
      containerWidth: i,
      columnWidth: G(n, "columnWidth"),
      rowHeight: G(n, "rowHeight"),
      gap: G(n, "gap"),
      items: G(n, "items"),
      isScrolling: d,
      idKey: n.idKey,
      itemHeight: n.itemHeight,
      estimatedTotalCount: G(n, "estimatedTotalCount"),
      mode: n.mode,
      // 传入保存/恢复滚动位置的回调函数
      onBeforeRebuildLayout: () => {
        o.value && o.value.scrollHeight > 0 && o.value.scrollTop > 0 && (f.value = o.value.scrollTop / o.value.scrollHeight, console.log(`[VirtualMasonryGrid] 保存滚动比例: ${f.value}`));
      },
      onAfterRebuildLayout: () => {
        o.value && f.value > 0 && requestAnimationFrame(() => {
          if (o.value) {
            const g = f.value * o.value.scrollHeight;
            o.value.scrollTop = g, console.log(`[VirtualMasonryGrid] 恢复滚动位置: ${g}`), f.value = -1;
          }
        });
      }
    }), { thumbRef: X, trackRef: k } = Dt({
      scrollContainer: o,
      totalHeight: c
    });
    e({
      ignoreScrollEventsFor: h,
      setTransitionEnabled: (g) => {
        E.value = g;
      }
    });
    const { visibleItems: L, forceUpdate: _ } = Lt({
      allItems: v,
      scrollTop: u,
      containerHeight: a,
      overscanBy: n.overscanBy
    }), P = U(() => ({
      height: `${b.value}px`
    })), y = M(-1);
    D(d, (g) => {
      if (!g && u.value !== y.value) {
        const S = L.value.map((H) => H.index);
        S.length > 0 && l("scroll-settled", S), y.value = u.value;
      }
    }), D(() => n.scrollToIndex, (g) => {
      if (g === void 0 || g < 0 || !o.value) return;
      const S = v.value.find((H) => H.index === g);
      if (S) {
        const H = S.y;
        o.value.scrollTo({
          top: H,
          behavior: n.scrollToOptions?.behavior || "smooth"
        });
      } else
        console.warn(`[VirtualMasonryGrid] scrollToIndex: 无法立即找到索引 ${g} 的项。`);
    });
    const E = M(!0), B = (g) => ({
      position: "absolute",
      top: `${g.y}px`,
      left: `${g.x}px`,
      width: `${g.width}px`,
      // 在滚动过程中或手动禁用时不使用过渡动画
      transition: d.value || !E.value ? "none" : "top 0.3s, left 0.3s"
    }), I = /* @__PURE__ */ new Map(), p = /* @__PURE__ */ new WeakMap(), w = new ResizeObserver((g) => {
      for (const S of g) {
        const H = p.get(S.target);
        if (H !== void 0) {
          const R = S.contentRect.height;
          T(H, R);
        }
      }
    }), m = (g) => (S) => {
      if (S)
        I.set(g, S), $(() => {
          const H = I.get(g);
          if (!H) return;
          const R = H.children[0];
          if (R && R.nodeType === 1) {
            const O = R.getBoundingClientRect().height;
            T(g, O), p.set(R, g), w.observe(R);
          } else
            console.warn(`[VirtualMasonryGrid] Item ${g} has no valid child element on nextTick.`);
        });
      else {
        const H = I.get(g);
        if (H) {
          const R = H.children[0];
          R && w.unobserve(R), I.delete(g);
        }
      }
    };
    return D(v, () => {
      _();
    }), D(C, () => {
      _();
    }), D([i, () => n.columnWidth, () => n.gap, () => n.rowHeight], () => {
      o.value && o.value.scrollHeight > 0 && (f.value = o.value.scrollTop / o.value.scrollHeight), Y(), f.value > 0 && $(() => {
        requestAnimationFrame(() => {
          if (o.value) {
            const g = f.value * o.value.scrollHeight;
            o.value.scrollTo({
              top: g,
              behavior: "auto"
            });
          }
        });
      });
    }), le(() => {
      if (n.managedByProvider || console.warn(
        `%c[VirtualMasonryGrid] 警告：您正在直接使用 VirtualMasonryGrid 组件。
建议使用 VirtualMasonryDataProvider 组件进行封装，以获得更好的数据加载体验。
直接使用 VirtualMasonryGrid 需要自行处理数据加载、占位符和动态高度等复杂逻辑。
查看示例: examples/layout/data-provider.vue`,
        "color: #ff9800; font-weight: bold;"
      ), !o.value) return;
      const g = new ResizeObserver((S) => {
        if (S[0]) {
          const { width: H, height: R } = S[0].contentRect;
          let O = -1;
          o.value && o.value.scrollHeight > 0 && (O = o.value.scrollTop / o.value.scrollHeight), i.value = H, a.value = R, $(() => {
            Y(), O > 0 && o.value ? requestAnimationFrame(() => {
              if (o.value) {
                const ce = O * o.value.scrollHeight;
                o.value.scrollTop = ce;
              }
              setTimeout(() => {
                o.value?.dispatchEvent(new Event("scroll"));
              }, 50);
            }) : setTimeout(() => {
              o.value?.dispatchEvent(new Event("scroll"));
            }, 50);
          });
        }
      });
      g.observe(o.value), $(() => {
        Y(), setTimeout(() => {
          o.value?.dispatchEvent(new Event("scroll"));
        }, 50);
      }), N(() => {
        g.disconnect();
      });
    }), (g, S) => (K(), te("div", Ft, [
      Q("div", {
        class: "virtual-masonry-grid-container",
        ref_key: "scrollContainer",
        ref: o
      }, [
        Q("div", {
          class: "virtual-masonry-grid-content",
          style: se(P.value)
        }, [
          (K(!0), te(je, null, Qe(F(L), (H) => (K(), te("div", {
            key: H.id,
            class: "virtual-masonry-grid-item",
            style: se(B(H)),
            ref_for: !0,
            ref: m(H.id)
          }, [
            H.isPlaceholder ? V(g.$slots, "placeholder", {
              key: 0,
              item: H.data,
              index: H.index
            }, void 0, !0) : V(g.$slots, "default", {
              key: 1,
              item: H.data,
              index: H.index,
              isScrolling: F(d)
            }, void 0, !0)
          ], 4))), 128))
        ], 4)
      ], 512),
      Q("div", {
        class: "scrollbar-track",
        ref_key: "trackRef",
        ref: k
      }, [
        Q("div", {
          class: "scrollbar-thumb",
          ref_key: "thumbRef",
          ref: X
        }, null, 512)
      ], 512)
    ]));
  }
}), Be = (t, e) => {
  const s = t.__vccOpts || t;
  for (const [n, l] of e)
    s[n] = l;
  return s;
}, Ot = /* @__PURE__ */ Be(Ut, [["__scopeId", "data-v-e7ba4590"]]), $t = (t) => ({
  id: `placeholder-${t}`,
  isPlaceholder: !0,
  index: t
}), zt = (t) => new Map(t.map((e) => [e.index, e])), Vt = (t, e, s) => {
  const n = e.get(t);
  if (n) {
    const l = s[t];
    if (l && l.isPlaceholder)
      return s[t] = n, !0;
  }
  return !1;
}, Nt = (t, e, s) => {
  const n = [...t];
  let l = !1;
  return e.forEach((o) => {
    Vt(o, s, n) && (l = !0);
  }), { newItems: n, replaced: l };
}, Wt = (t, e, s, n) => async (l) => {
  if (s.value) return [];
  const o = l.filter((i) => !n.has(i));
  if (o.length === 0)
    return [];
  try {
    s.value = !0, o.forEach((d) => n.add(d));
    const i = await t(o), a = zt(i), { newItems: c, replaced: u } = Nt(e.value, o, a);
    return u && (e.value = c), i;
  } catch (i) {
    return Kt(i, o, n), [];
  } finally {
    s.value = !1;
  }
}, Gt = (t) => (e) => {
  const s = [];
  for (let n = 0; n < e; n++) {
    const l = t(n);
    s.push(l);
  }
  return s;
}, qt = (t, e) => (s) => {
  if (t > 0 && s > 0) {
    const n = Array.from({ length: Math.min(t, s) }, (l, o) => o);
    e(n);
  }
}, Kt = (t, e, s) => {
  console.error("[useVirtualDataSource] Error fetching data:", t), e.forEach((n) => s.delete(n));
};
function Jt({
  totalCount: t,
  dataFetcher: e,
  initialPageSize: s = 50,
  // 默认初始加载50条
  createPlaceholder: n = $t
}) {
  const l = J([]), o = M(!1), i = /* @__PURE__ */ new Set(), a = Wt(e, l, o, i), c = Gt(n), u = qt(s, a);
  return D(t, (d) => {
    l.value = c(d), i.clear(), o.value = !1, u(d);
  }, { immediate: !0 }), {
    items: l,
    isFetching: o,
    requestDataForRange: a
  };
}
const Ln = /* @__PURE__ */ he({
  __name: "VirtualMasonryDataProvider",
  props: {
    totalCount: {},
    dataFetcher: { type: Function }
  },
  setup(t) {
    const e = M(null), s = t, { items: n, requestDataForRange: l } = Jt({
      totalCount: G(s, "totalCount"),
      dataFetcher: s.dataFetcher
    }), o = async (i) => {
      if (i.length !== 0) {
        e.value && e.value.setTransitionEnabled(!1);
        try {
          const a = await l(i);
          a && a.length > 0 && e.value ? (e.value.ignoreScrollEventsFor(200), await $(), requestAnimationFrame(() => {
            e.value && e.value.setTransitionEnabled(!0);
          })) : e.value && e.value.setTransitionEnabled(!0);
        } catch (a) {
          console.error("[VirtualMasonryDataProvider] 数据加载错误:", a), e.value && e.value.setTransitionEnabled(!0);
        }
      }
    };
    return (i, a) => (K(), Ze(Ot, et({
      ref_key: "gridRef",
      ref: e
    }, i.$props, {
      items: F(n),
      "estimated-total-count": t.totalCount,
      "managed-by-provider": !0,
      onScrollSettled: o
    }), {
      default: be((c) => [
        V(i.$slots, "default", Ye(Xe(c)))
      ]),
      placeholder: be((c) => [
        V(i.$slots, "placeholder", Ye(Xe(c)))
      ]),
      _: 3
    }, 16, ["items", "estimated-total-count"]));
  }
}), jt = /* @__PURE__ */ he({
  __name: "SelectionBox",
  props: {
    visible: { type: Boolean, default: !1 },
    isSelecting: { type: Boolean, default: !1 },
    left: { default: 0 },
    top: { default: 0 },
    width: { default: 0 },
    height: { default: 0 },
    selectionBoxState: {},
    renderMode: { default: "default" },
    zIndex: { default: 1e3 },
    class: { default: "" },
    style: { default: void 0 }
  },
  setup(t) {
    const e = t, s = U(() => {
      const n = {
        left: `${e.left}px`,
        top: `${e.top}px`,
        width: `${e.width}px`,
        height: `${e.height}px`,
        zIndex: e.zIndex,
        ...e.style
      };
      return e.selectionBoxState ? {
        ...n,
        left: `${e.selectionBoxState.left}px`,
        top: `${e.selectionBoxState.top}px`,
        width: `${e.selectionBoxState.width}px`,
        height: `${e.selectionBoxState.height}px`
      } : n;
    });
    return (n, l) => tt((K(), te("div", {
      class: we(["selection-box", [e.class, {
        "selection-box--active": t.isSelecting,
        "selection-box--custom": !!n.$slots.default
      }]]),
      style: se(s.value)
    }, [
      l[0] || (l[0] = Q("div", { class: "selection-box__border" }, null, -1)),
      n.$slots.default ? V(n.$slots, "default", {
        key: 0,
        selectionBox: e.selectionBoxState || {
          visible: e.visible,
          isSelecting: e.isSelecting,
          left: e.left,
          top: e.top,
          width: e.width,
          height: e.height,
          selectedElements: []
        }
      }, void 0, !0) : _e("", !0)
    ], 6)), [
      [nt, t.visible]
    ]);
  }
}), Qt = /* @__PURE__ */ Be(jt, [["__scopeId", "data-v-ae628ce4"]]);
function Zt(t = {}) {
  const {
    mode: e = "multiple",
    allowEmpty: s = !0,
    onSelectionChange: n,
    onFocusChange: l
  } = t, o = Pe({
    selectedIds: /* @__PURE__ */ new Set(),
    focusedId: null,
    selectionMode: e,
    isSelecting: !1,
    lastSelectedId: null,
    navigableEntities: []
  }), i = Pe({
    // 状态查询
    isSelected: (a) => o.selectedIds.has(a),
    isFocused: (a) => o.focusedId === a,
    getSelectedIds: () => Array.from(o.selectedIds),
    getFocusedId: () => o.focusedId,
    getSelectionMode: () => o.selectionMode,
    // 选择操作
    select: (a, c = "programmatic") => {
      o.selectionMode === "single" && o.selectedIds.clear(), o.selectedIds.add(a), o.lastSelectedId = a, n?.({
        type: "select",
        entityId: a,
        source: c
      });
    },
    deselect: (a, c = "programmatic") => {
      if (!s && o.selectedIds.size === 1)
        return;
      o.selectedIds.delete(a), n?.({
        type: "deselect",
        entityId: a,
        source: c
      });
    },
    toggle: (a, c = "programmatic") => {
      o.selectedIds.has(a) ? i.deselect(a, c) : i.select(a, c);
    },
    clear: (a = "programmatic") => {
      if (!s) return;
      o.selectedIds.clear(), n?.({
        type: "clear",
        entityId: null,
        source: a
      });
    },
    // 批量选择操作
    selectEntities: (a) => {
      o.selectionMode === "single" && a.length > 0 ? (o.selectedIds.clear(), o.selectedIds.add(a[0]), o.lastSelectedId = a[0]) : (a.forEach((u) => {
        o.selectedIds.add(u);
      }), a.length > 0 && (o.lastSelectedId = a[a.length - 1])), n?.({
        type: "select",
        entityId: null,
        source: "programmatic"
      });
    },
    invertSelection: () => {
      const a = /* @__PURE__ */ new Set();
      o.navigableEntities.forEach((u) => {
        o.selectedIds.has(u) || a.add(u);
      }), o.selectedIds = a, n?.({
        type: "select",
        entityId: null,
        source: "programmatic"
      });
    },
    // 焦点操作
    focus: (a) => {
      o.focusedId !== a && (o.focusedId = a, l?.(a));
    },
    blur: () => {
      o.focusedId = null, l?.(null);
    },
    // 导航操作
    navigateNext: () => {
      if (o.navigableEntities.length === 0) return;
      let a = 0;
      if (o.focusedId !== null) {
        const u = o.navigableEntities.indexOf(o.focusedId);
        u > -1 && (a = (u + 1) % o.navigableEntities.length);
      }
      const c = o.navigableEntities[a];
      i.focus(c);
    },
    navigatePrevious: () => {
      if (o.navigableEntities.length === 0) return;
      let a = o.navigableEntities.length - 1;
      if (o.focusedId !== null) {
        const u = o.navigableEntities.indexOf(o.focusedId);
        u > -1 && (a = u === 0 ? o.navigableEntities.length - 1 : u - 1);
      }
      const c = o.navigableEntities[a];
      i.focus(c);
    },
    navigateToFirst: () => {
      o.navigableEntities.length > 0 && i.focus(o.navigableEntities[0]);
    },
    navigateToLast: () => {
      o.navigableEntities.length > 0 && i.focus(o.navigableEntities[o.navigableEntities.length - 1]);
    },
    // 批量操作
    selectAll: () => {
      o.navigableEntities.forEach((c) => {
        o.selectedIds.add(c);
      }), n?.({
        type: "select",
        entityId: null,
        source: "programmatic"
      });
    },
    selectRange: (a, c) => {
      const u = o.navigableEntities.indexOf(a), d = o.navigableEntities.indexOf(c);
      if (u === -1 || d === -1) return;
      const r = Math.min(u, d), h = Math.max(u, d);
      for (let v = r; v <= h; v++)
        o.selectedIds.add(o.navigableEntities[v]);
      n?.({
        type: "select",
        entityId: null,
        source: "programmatic"
      });
    },
    // 实体管理
    updateNavigableEntities: (a) => {
      o.navigableEntities = a;
    },
    // 键盘事件处理
    handleKeyboardEvent: (a) => {
      if (!(a.target instanceof HTMLInputElement || a.target instanceof HTMLTextAreaElement)) {
        switch (a.key) {
          case "ArrowDown":
          case "ArrowRight":
            a.preventDefault(), i.navigateNext();
            break;
          case "ArrowUp":
          case "ArrowLeft":
            a.preventDefault(), i.navigatePrevious();
            break;
          case "Home":
            a.preventDefault(), i.navigateToFirst();
            break;
          case "End":
            a.preventDefault(), i.navigateToLast();
            break;
          case " ":
          case "Enter":
            a.preventDefault(), o.focusedId !== null && i.toggle(o.focusedId, "keyboard");
            break;
          case "Escape":
            a.preventDefault(), i.clear("keyboard"), i.blur();
            break;
          case "a":
            (a.ctrlKey || a.metaKey) && (a.preventDefault(), i.selectAll());
            break;
        }
        a.shiftKey && (a.key === "ArrowDown" || a.key === "ArrowRight" || a.key === "ArrowUp" || a.key === "ArrowLeft") && (a.preventDefault(), o.lastSelectedId !== null && o.focusedId !== null && i.selectRange(o.lastSelectedId, o.focusedId));
      }
    }
  });
  return D(() => e, (a) => {
    o.selectionMode = a;
  }), {
    selectionApi: i,
    selectionState: o
  };
}
const en = (t, e) => {
  if (!t) return [];
  const s = [], n = document.createTreeWalker(
    t,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (o) => e(o) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP
    }
  );
  let l;
  for (; l = n.nextNode(); )
    s.push(l);
  return s;
}, tn = (t, e) => t.length !== e.length ? !0 : !t.every((s, n) => s === e[n]), Ae = (t, e) => {
  if (t.nodeType !== Node.ELEMENT_NODE) return !1;
  const s = t;
  return e(s) || !!s.querySelector("[data-selectable]");
}, nn = (t) => t.type === "attributes" && (t.attributeName === "data-selectable" || t.attributeName === "data-id"), sn = (t, e) => {
  if (t.type !== "childList") return !1;
  for (const s of t.addedNodes)
    if (Ae(s, e)) return !0;
  for (const s of t.removedNodes)
    if (Ae(s, e)) return !0;
  return !1;
}, on = (t, e, s) => {
  let n = !1;
  for (const l of t)
    if (sn(l, e) || nn(l)) {
      n = !0;
      break;
    }
  n && requestAnimationFrame(s);
};
function ln(t) {
  const { container: e, elementFilter: s, onElementsChange: n } = t, l = M(null), o = M([]), i = () => {
    if (!e.value) return;
    const h = en(e.value, s);
    tn(h, o.value) && (o.value = h, n(h));
  }, a = () => new MutationObserver((h) => {
    on(h, s, i);
  }), c = () => {
    e.value && (i(), l.value = a(), l.value.observe(e.value, {
      childList: !0,
      subtree: !0,
      attributes: !0,
      attributeFilter: ["data-selectable", "data-id"]
    }));
  }, u = () => {
    l.value && (l.value.disconnect(), l.value = null), o.value = [];
  }, d = () => {
    i();
  }, r = () => o.value;
  return N(() => {
    u();
  }), {
    startObserving: c,
    stopObserving: u,
    refreshElements: d,
    getCurrentElements: r
  };
}
const an = (t) => ({
  left: t.left,
  top: t.top,
  right: t.right,
  bottom: t.bottom,
  width: t.width,
  height: t.height
}), cn = (t) => ({
  x: t.left + t.width / 2,
  y: t.top + t.height / 2
}), Te = (t) => t.width * t.height, oe = (t, e) => !(t.right < e.left || t.left > e.right || t.bottom < e.top || t.top > e.bottom), Ce = (t, e) => t.left <= e.left && t.top <= e.top && t.right >= e.right && t.bottom >= e.bottom, rn = (t, e) => {
  if (!oe(t, e)) return null;
  const s = Math.max(t.left, e.left), n = Math.max(t.top, e.top), l = Math.min(t.right, e.right), o = Math.min(t.bottom, e.bottom);
  return {
    left: s,
    top: n,
    right: l,
    bottom: o,
    width: l - s,
    height: o - n
  };
}, un = (t, e) => {
  const s = rn(t, e);
  return s ? Te(s) : 0;
}, hn = (t, e) => {
  if (!oe(t, e)) return "none";
  if (Ce(t, e)) return "contained";
  const s = un(t, e), n = Te(e);
  return s / n > 0.9 ? "contained" : "intersecting";
}, dn = () => ({
  data: /* @__PURE__ */ new WeakMap(),
  lastUpdate: 0,
  dirtyElements: /* @__PURE__ */ new Set()
}), fn = (t, e) => {
  const s = performance.now();
  return !t.dirty && s - t.timestamp < e;
}, pe = (t, e, s = 16) => {
  const n = t.data.get(e);
  return n && fn(n, s) ? n : null;
}, ne = (t, e) => {
  const s = e.getBoundingClientRect(), n = an(s), l = cn(n), o = Te(n), i = {
    element: e,
    rect: n,
    center: l,
    area: o,
    timestamp: performance.now(),
    dirty: !1
  };
  return t.data.set(e, i), t.dirtyElements.delete(e), i;
}, mn = (t, e = 6e4) => {
  const s = performance.now(), n = [];
  t.dirtyElements.forEach((l) => {
    const o = t.data.get(l);
    o && s - o.timestamp > e && n.push(l);
  }), n.forEach((l) => {
    t.data.delete(l), t.dirtyElements.delete(l);
  });
}, gn = (t, e = 16) => performance.now() - t.lastUpdate >= e, pn = (t) => ({
  totalElements: 0,
  // WeakMap无法统计
  dirtyElements: t.dirtyElements.size,
  lastUpdate: t.lastUpdate
}), vn = (t = 100) => ({
  blockSize: t,
  blocks: /* @__PURE__ */ new Map(),
  bounds: null
}), Ve = (t, e) => {
  const s = Math.floor(t.left / e), n = Math.floor(t.right / e), l = Math.floor(t.top / e), o = Math.floor(t.bottom / e), i = [];
  for (let a = s; a <= n; a++)
    for (let c = l; c <= o; c++)
      i.push(`${a},${c}`);
  return i;
}, He = (t, e, s) => {
  Ve(s, t.blockSize).forEach((l) => {
    t.blocks.has(l) || t.blocks.set(l, []), t.blocks.get(l).push(e);
  }), In(t, s);
}, Ne = (t, e) => {
  t.blocks.forEach((s, n) => {
    const l = s.indexOf(e);
    l !== -1 && (s.splice(l, 1), s.length === 0 && t.blocks.delete(n));
  });
}, xn = (t, e, s, n) => {
  Ne(t, e), He(t, e, n);
}, We = (t, e) => {
  const s = Ve(e, t.blockSize), n = /* @__PURE__ */ new Set();
  return s.forEach((l) => {
    const o = t.blocks.get(l);
    o && o.forEach((i) => n.add(i));
  }), Array.from(n);
}, In = (t, e) => {
  if (!t.bounds) {
    t.bounds = { ...e };
    return;
  }
  t.bounds.left = Math.min(t.bounds.left, e.left), t.bounds.top = Math.min(t.bounds.top, e.top), t.bounds.right = Math.max(t.bounds.right, e.right), t.bounds.bottom = Math.max(t.bounds.bottom, e.bottom), t.bounds.width = t.bounds.right - t.bounds.left, t.bounds.height = t.bounds.bottom - t.bounds.top;
}, bn = (t) => {
  let e = 0;
  return t.blocks.forEach((s) => {
    e += s.length;
  }), {
    totalBlocks: t.blocks.size,
    totalElements: e,
    averageElementsPerBlock: t.blocks.size > 0 ? e / t.blocks.size : 0
  };
}, wn = (t) => {
  const e = [];
  t.blocks.forEach((s, n) => {
    s.length === 0 && e.push(n);
  }), e.forEach((s) => {
    t.blocks.delete(s);
  });
}, yn = (t, e, s) => {
  t.blocks.clear(), t.bounds = null, e.forEach((n) => {
    const l = s(n);
    He(t, n, l);
  });
}, ie = (t, e, s, n, l) => {
  const o = We(e, n), i = [];
  return o.forEach((a) => {
    let c = pe(t, a, l.updateInterval);
    c || (c = ne(t, a)), oe(c.rect, n) && i.push(a);
  }), i;
}, Ge = (t, e, s, n, l) => {
  const o = ie(
    t,
    e,
    s,
    n,
    l
  ), i = [];
  return o.forEach((a) => {
    const c = pe(t, a, l.updateInterval);
    c && Ce(n, c.rect) && i.push(a);
  }), i;
}, qe = (t, e, s, n, l) => {
  const o = ie(
    t,
    e,
    s,
    n,
    l
  ), i = [];
  return o.forEach((a) => {
    const c = pe(t, a, l.updateInterval);
    c && hn(n, c.rect) === "intersecting" && i.push(a);
  }), i;
}, En = (t, e, s, n, l) => {
  gn(t, l.updateInterval) && We(e, n).forEach((u) => {
    ne(t, u);
  });
  const o = ie(
    t,
    e,
    s,
    n,
    l
  ), i = Ge(
    t,
    e,
    s,
    n,
    l
  ), a = qe(
    t,
    e,
    s,
    n,
    l
  );
  return {
    elements: s,
    intersectingElements: o,
    containedElements: i,
    partialElements: a
  };
}, Sn = (t, e, s, n, l, o) => {
  const i = {
    left: n.x - l,
    top: n.y - l,
    right: n.x + l,
    bottom: n.y + l
  }, a = ie(
    t,
    e,
    s,
    i,
    o
  ), c = [];
  return a.forEach((u) => {
    const d = pe(t, u, o.updateInterval);
    if (d) {
      const r = d.center;
      Math.sqrt(
        Math.pow(r.x - n.x, 2) + Math.pow(r.y - n.y, 2)
      ) <= l && c.push(u);
    }
  }), c;
}, Mn = () => {
  const t = dn(), e = vn(100), s = {
    cacheStrategy: "weak",
    updateInterval: 16,
    blockSize: 100,
    useVirtualization: !0,
    intersectionThreshold: 0.1
  };
  return {
    cache: t,
    grid: e,
    options: s,
    // 便捷方法
    queryIntersecting: (n, l) => ie(t, e, n, l, s),
    queryContained: (n, l) => Ge(t, e, n, l, s),
    queryPartial: (n, l) => qe(t, e, n, l, s),
    queryNearPoint: (n, l, o) => Sn(t, e, n, l, o, s),
    executeQuery: (n, l) => En(t, e, n, l, s),
    // 管理方法
    addElement: (n, l) => {
      He(e, n, l), ne(t, n);
    },
    removeElement: (n) => {
      Ne(e, n);
    },
    updateElement: (n, l, o) => {
      xn(e, n, l, o), ne(t, n);
    },
    rebuild: (n, l) => {
      yn(e, n, l), n.forEach((o) => {
        ne(t, o);
      });
    },
    cleanup: () => {
      wn(e), mn(t);
    },
    getStats: () => ({
      cache: pn(t),
      grid: bn(e)
    })
  };
};
function Bn(t) {
  const { elements: e, onPositionChange: s } = t, n = M(null), l = M(/* @__PURE__ */ new Map()), o = () => {
    const r = /* @__PURE__ */ new Map();
    e.forEach((h) => {
      const f = h.getBoundingClientRect();
      r.set(h, f);
    }), l.value = r, s(r);
  }, i = () => new ResizeObserver((r) => {
    requestAnimationFrame(() => {
      o();
    });
  }), a = () => {
    e.length !== 0 && (o(), n.value = i(), e.forEach((r) => {
      n.value?.observe(r);
    }));
  }, c = () => {
    n.value && (n.value.disconnect(), n.value = null), l.value.clear();
  }, u = (r) => {
    c(), e.length = 0, e.push(...r), a();
  }, d = (r) => l.value.get(r) || null;
  return N(() => {
    c();
  }), {
    startObserving: a,
    stopObserving: c,
    updateElements: u,
    getElementPosition: d,
    elementPositions: l
  };
}
function Tn(t = {}) {
  const {
    enableSpatialSelection: e = !1,
    elementFilter: s = (p) => p.hasAttribute("data-selectable"),
    idExtractor: n = (p) => p.getAttribute("data-id") || p.id,
    onSelectionBoxChange: l,
    onSelectionBoxStart: o,
    onSelectionBoxUpdate: i,
    onSelectionBoxEnd: a
  } = t, c = M(!1), u = M(!1), d = M(null), r = M({
    visible: !1,
    isSelecting: !1,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    selectedElements: []
  }), h = M(null), f = e ? Mn() : null, v = M([]), {
    startObserving: x,
    stopObserving: b,
    updateElements: T,
    getElementPosition: Y,
    elementPositions: C
  } = Bn({
    elements: v.value,
    onPositionChange: (p) => {
      if (f) {
        const w = Array.from(p.keys());
        f.rebuild(w, (m) => {
          const g = p.get(m);
          return {
            left: g.left,
            top: g.top,
            right: g.right,
            bottom: g.bottom,
            width: g.width,
            height: g.height
          };
        });
      }
    }
  }), X = U(() => ({
    left: `${r.value.left}px`,
    top: `${r.value.top}px`,
    width: `${r.value.width}px`,
    height: `${r.value.height}px`
  }));
  return {
    // 状态
    selectionBoxState: r,
    selectionBoxStyle: X,
    isMouseDown: c,
    isDragging: u,
    dragDirection: h,
    // 引用
    containerRef: d,
    setContainerRef: (p) => {
      d.value = p;
    },
    // 事件处理
    handleMouseDown: (p) => {
      if (p.target instanceof HTMLInputElement || p.target instanceof HTMLTextAreaElement)
        return;
      c.value = !0, u.value = !1, h.value = null;
      const w = p.clientX, m = p.clientY;
      r.value = {
        ...r.value,
        visible: !0,
        isSelecting: !0,
        startX: w,
        startY: m,
        currentX: w,
        currentY: m,
        left: w,
        top: m,
        width: 0,
        height: 0,
        selectedElements: []
      }, o?.(p), l?.(r.value);
    },
    handleMouseMove: (p) => {
      if (!c.value || !r.value.isSelecting) return;
      const w = p.clientX, m = p.clientY;
      r.value.currentX = w, r.value.currentY = m;
      const g = Math.min(r.value.startX, w), S = Math.min(r.value.startY, m), H = Math.abs(w - r.value.startX), R = Math.abs(m - r.value.startY);
      if (r.value.left = g, r.value.top = S, r.value.width = H, r.value.height = R, !h.value && H > 5 && (h.value = w > r.value.startX ? "left-to-right" : "right-to-left"), f) {
        const O = { left: g, top: S, right: g + H, bottom: S + R }, ce = Array.from(d.value?.querySelectorAll("[data-selectable]") || []);
        if (ce.length > 0) {
          const Ke = ce.filter((Je) => {
            const z = Y(Je);
            if (!z) return !1;
            const ve = {
              left: z.left,
              top: z.top,
              right: z.right,
              bottom: z.bottom,
              width: z.width,
              height: z.height
            };
            return h.value === "left-to-right" ? Ce(O, ve) : (h.value === "right-to-left", oe(O, ve));
          });
          r.value.selectedElements = Ke;
        } else
          r.value.selectedElements = [];
      } else
        r.value.selectedElements = [];
      u.value = !0, i?.(p), l?.(r.value);
    },
    handleMouseUp: (p) => {
      c.value && (c.value = !1, r.value.isSelecting && (r.value.isSelecting = !1, r.value.visible = !1, a?.(p), l?.(r.value)));
    },
    // 控制方法
    startSelectionBox: () => {
      r.value.visible = !0, r.value.isSelecting = !0;
    },
    stopSelectionBox: () => {
      r.value.visible = !1, r.value.isSelecting = !1;
    },
    clearSelectionBox: () => {
      r.value = {
        visible: !1,
        isSelecting: !1,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        selectedElements: []
      };
    },
    // 工具方法
    getSelectedEntityIds: () => !r.value.selectedElements || r.value.selectedElements.length === 0 ? [] : r.value.selectedElements.map((p) => n(p)),
    updateSpatialSelector: (p) => {
      !f || !p || p.length === 0 || p.forEach((w) => {
        const m = w.getBoundingClientRect(), g = {
          left: m.left,
          top: m.top,
          right: m.right,
          bottom: m.bottom,
          width: m.width,
          height: m.height
        };
        f.addElement(w, g);
      });
    },
    // 位置观察器方法
    startPositionObserving: x,
    stopPositionObserving: b,
    updatePositionElements: T,
    getElementPosition: Y,
    elementPositions: C
  };
}
const Cn = /* @__PURE__ */ he({
  __name: "SelectionWrapper",
  props: {
    mode: { default: "multiple" },
    allowEmpty: { type: Boolean, default: !0 },
    enableMouseSelection: { type: Boolean, default: !0 },
    enableKeyboardSelection: { type: Boolean, default: !0 },
    enableSpatialSelection: { type: Boolean, default: !1 },
    elementFilter: { type: Function, default: (t) => t.hasAttribute("data-selectable") },
    idExtractor: { type: Function, default: (t) => t.getAttribute("data-id") || t.id },
    wrapperClass: { default: "" },
    wrapperStyle: { default: void 0 },
    selectionBoxClass: { default: "" },
    selectionBoxStyle: { default: void 0 },
    selectionBoxZIndex: { default: 1e3 },
    onSelectionChange: {},
    onFocusChange: {},
    onSelectionBoxChange: {},
    onSelectionBoxStart: {},
    onSelectionBoxUpdate: {},
    onSelectionBoxEnd: {}
  },
  emits: ["selection-change", "focus-change", "selection-box-change", "selection-box-start", "selection-box-update", "selection-box-end"],
  setup(t, { expose: e, emit: s }) {
    const n = t, l = s, o = M(null), { selectionApi: i, selectionState: a } = Zt({
      mode: n.mode,
      allowEmpty: n.allowEmpty,
      onSelectionChange: (m) => {
        l("selection-change", m), n.onSelectionChange?.(m);
      },
      onFocusChange: (m) => {
        l("focus-change", m), n.onFocusChange?.(m);
      }
    }), {
      selectionBoxState: c,
      selectionBoxStyle: u,
      handleMouseDown: d,
      handleMouseMove: r,
      handleMouseUp: h,
      startSelectionBox: f,
      stopSelectionBox: v,
      clearSelectionBox: x,
      getSelectedEntityIds: b,
      updateSpatialSelector: T,
      setContainerRef: Y,
      startPositionObserving: C,
      stopPositionObserving: X,
      updatePositionElements: k,
      dragDirection: A,
      elementPositions: L
    } = Tn({
      enableSpatialSelection: n.enableSpatialSelection,
      elementFilter: n.elementFilter,
      idExtractor: n.idExtractor,
      onSelectionBoxChange: (m) => {
        l("selection-box-change", m), n.onSelectionBoxChange?.(m);
      },
      onSelectionBoxStart: (m) => {
        l("selection-box-start", m), n.onSelectionBoxStart?.(m);
      },
      onSelectionBoxUpdate: (m) => {
        l("selection-box-update", m), n.onSelectionBoxUpdate?.(m);
      },
      onSelectionBoxEnd: (m) => {
        if (l("selection-box-end", m), n.onSelectionBoxEnd?.(m), n.enableMouseSelection) {
          const g = b();
          g && g.length > 0 && i.selectEntities(g);
        }
      }
    }), { startObserving: _, stopObserving: P } = ln({
      container: o,
      elementFilter: n.elementFilter,
      idExtractor: n.idExtractor,
      onElementsChange: (m) => {
        if (m && m.length > 0) {
          const g = m.map((S) => n.idExtractor(S));
          i.updateNavigableEntities(g);
        } else
          i.updateNavigableEntities([]);
        n.enableSpatialSelection && m && m.length > 0 && k(m);
      }
    }), y = (m) => {
      n.enableMouseSelection && d(m);
    }, E = (m) => {
      n.enableMouseSelection && r(m);
    }, B = (m) => {
      n.enableMouseSelection && h(m);
    }, I = (m) => {
      n.enableKeyboardSelection && (m.target instanceof HTMLInputElement || m.target instanceof HTMLTextAreaElement || i.handleKeyboardEvent(m));
    }, p = () => {
      a.focusedId === null && a.navigableEntities && a.navigableEntities.length > 0 && i.navigateToFirst();
    }, w = () => {
      i.blur();
    };
    return st("selection-context", {
      api: i,
      state: a,
      selectionBox: c,
      selectionBoxStyle: u,
      startSelectionBox: f,
      stopSelectionBox: v,
      clearSelectionBox: x
    }), e({
      selectionApi: i,
      selectionState: a,
      selectionBox: c,
      selectionBoxStyle: u,
      startSelectionBox: f,
      stopSelectionBox: v,
      clearSelectionBox: x,
      getSelectedEntityIds: b,
      dragDirection: A,
      elementPositions: L
    }), le(() => {
      o.value && (o.value.focus(), Y(o.value)), _(), n.enableSpatialSelection && C();
    }), N(() => {
      P(), X(), i && i.clear(), x(), Y(null);
    }), (m, g) => (K(), te("div", {
      class: we(["selection-wrapper", t.wrapperClass]),
      style: se(t.wrapperStyle),
      ref_key: "wrapperRef",
      ref: o,
      tabindex: "0",
      onMousedown: y,
      onMousemove: E,
      onMouseup: B,
      onKeydown: I,
      onFocus: p,
      onBlur: w
    }, [
      V(m.$slots, "default", {
        selectionApi: F(i),
        selectionState: F(a),
        selectionBox: F(c),
        dragDirection: F(A)
      }, void 0, !0),
      ot(Qt, {
        visible: F(c).visible,
        "is-selecting": F(c).isSelecting,
        "selection-box-state": F(c),
        "z-index": t.selectionBoxZIndex,
        class: we(t.selectionBoxClass),
        style: se(F(u))
      }, {
        default: be(() => [
          m.$slots.selectionBoxContent ? V(m.$slots, "selectionBoxContent", {
            key: 0,
            selectionBox: F(c)
          }, void 0, !0) : _e("", !0)
        ]),
        _: 3
      }, 8, ["visible", "is-selecting", "selection-box-state", "z-index", "class", "style"])
    ], 38));
  }
}), Rn = /* @__PURE__ */ Be(Cn, [["__scopeId", "data-v-7bc7fbf8"]]), Hn = 15e6;
class Yn {
  minX;
  minY;
  maxX;
  maxY;
  id;
  data;
  index;
  columnIndex;
  indexInColumn;
  width;
  height;
  x;
  y;
  constructor(e) {
    this.id = e.id, this.data = e.data, this.index = e.index, this.columnIndex = e.columnIndex, this.indexInColumn = e.indexInColumn, this.width = e.width, this.height = e.height, this.x = e.x, this.y = e.y, this.minX = e.x, this.minY = e.y, this.maxX = e.x + e.width, this.maxY = e.y + e.height;
  }
}
function kn({ containerWidth: t, columnWidth: e, gap: s, items: n, idKey: l, itemHeight: o, estimatedTotalCount: i }) {
  const a = new ae(), c = J([]), u = /* @__PURE__ */ new Map();
  let d = [];
  const r = /* @__PURE__ */ new Map(), h = M(Date.now()), f = M(0), v = U(() => !t.value || !e.value ? 1 : Math.max(1, Math.floor(t.value / e.value))), x = () => {
    d = Array.from({ length: v.value }, () => ({ height: 0, items: [] }));
  }, b = () => {
    let y = { index: -1, height: 1 / 0 };
    return d.forEach((E, B) => {
      E.height < y.height && (y = { index: B, height: E.height });
    }), y;
  }, T = () => {
    d.length === 0 ? f.value = 0 : f.value = Math.max(...d.map((y) => y.height));
  }, C = Fe(() => {
    if (r.size === 0)
      return;
    const y = new Map(r);
    r.clear();
    const E = /* @__PURE__ */ new Map();
    y.forEach((B, I) => {
      const p = u.get(I);
      if (!p || p.height === B) return;
      p.height = B;
      const m = p.columnIndex;
      if (m !== void 0) {
        const g = p.indexInColumn, S = E.get(m);
        (S === void 0 || g < S) && E.set(m, g);
      }
    }), E.size > 0 && (E.forEach((B, I) => {
      const p = d[I];
      if (!p) return;
      let m = p.items[B].y;
      for (let g = B; g < p.items.length; g++) {
        const S = p.items[g];
        S.y = m, m += S.height + (s?.value ?? 0);
      }
      p.height = m - (s?.value ?? 0);
    }), T(), h.value = Date.now());
  }), X = (y, E) => {
    const B = u.get(y);
    B && B.height === E || (r.set(y, E), C());
  }, k = U(() => {
    const y = i?.value, E = c.value.length;
    if (y && y > E) {
      const B = f.value;
      return (E > 0 ? B / E : e.value) * y;
    }
    return f.value;
  }), A = U(() => Math.min(k.value, Hn)), L = (y) => {
    if (y.length === 0) return;
    const E = [], B = [];
    y.forEach((I) => {
      const p = I[l];
      if (u.has(p)) return;
      const w = b(), m = w.index, g = {
        id: p,
        data: I,
        index: c.value.length + E.length,
        columnIndex: m,
        indexInColumn: d[m].items.length,
        width: e.value,
        height: o ? o(I, e.value) : e.value,
        x: m * (e.value + s.value),
        y: w.height,
        minX: 0,
        minY: 0,
        maxX: 0,
        maxY: 0
        // 将在 BushItem 中计算
      };
      d[m].items.push(g), d[m].height += g.height + s.value, u.set(p, g), B.push(new Yn(g)), E.push(g);
    }), E.length > 0 && (a.load(B), c.value = [...c.value, ...E], T(), h.value = Date.now());
  }, _ = () => {
    x(), a.clear(), u.clear(), c.value = [], L(n.value);
  };
  D(n, (y, E) => {
    if (y.length > E.length) {
      const B = y.slice(E.length);
      L(B);
    } else (y.length < E.length || y.some((B, I) => B[l] !== E[I]?.[l])) && _();
  });
  const P = (y) => {
    const E = a.search({
      minX: 0,
      minY: y.top,
      maxX: t.value,
      maxY: y.top + y.height
    }), B = new Set(E.map((I) => I.id));
    return c.value.filter((I) => B.has(I.id));
  };
  return x(), le(() => {
  }), N(() => {
    C.cancel();
  }), {
    // @织: 不再直接暴露 layoutItems，而是通过 allItems 这个 shallowRef
    allItems: c,
    totalHeight: f,
    logicalScrollHeight: k,
    // <-- 修改这里
    contentHeight: A,
    // <-- 新增这里
    columnCount: v,
    // @织: 之前的修改好像把这个弄丢了，它应该在
    updateItemHeight: X,
    rebuildLayout: _,
    findVisibleItems: P,
    layoutUpdateStamp: h
  };
}
export {
  Qt as SelectionBox,
  Rn as SelectionWrapper,
  Ln as VirtualMasonryDataProvider,
  Ot as VirtualMasonryGrid,
  Pt as useLayoutEngine,
  kn as useMasonryLayout,
  _t as useScrollObserver,
  Tn as useSelectionBox,
  Zt as useSelectionSystem,
  Jt as useVirtualDataSource,
  Dt as useVirtualScrollbar,
  Lt as useVirtualization
};
//# sourceMappingURL=my-masonry.es.js.map
