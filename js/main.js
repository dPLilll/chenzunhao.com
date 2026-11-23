/* 白色洞洞板：点按打开详情；桌面可拖动并对齐到孔位 */
(function () {
  const board = document.getElementById("board");
  const lightbox = document.getElementById("lightbox");
  const lbTitle = document.getElementById("lb-title");
  const lbMeta = document.getElementById("lb-meta");
  const lbBody = document.getElementById("lb-body");
  const lbVisual = document.getElementById("lb-visual");
  const panel = lightbox.querySelector(".lightbox__panel");
  const details = JSON.parse(document.getElementById("details").textContent);
  const desktopMq = window.matchMedia("(min-width: 900px)");
  const isDesktop = () => desktopMq.matches;

  let lastFocus = null;
  let previousOverflow = "";
  let zTop = 10;
  let drag = null;

  function gridMetrics() {
    const cs = getComputedStyle(board);
    const grid = parseFloat(cs.getPropertyValue("--grid"));
    const start = parseFloat(cs.getPropertyValue("--hole-start"));
    const startY = parseFloat(cs.getPropertyValue("--hole-y0")) || 0;
    return { grid, start, startY };
  }

  function holeCenter(col, row) {
    const { grid, start, startY } = gridMetrics();
    return {
      x: start + col * grid + grid / 2,
      y: startY + row * grid + (isDesktop() ? grid / 2 : grid / 2),
    };
  }

  function openItem(btn) {
    const id = btn.getAttribute("data-item");
    const data = details[id];
    if (!data) return;
    lastFocus = document.activeElement;
    panel.classList.remove("is-category");
    lbTitle.textContent = data.title;
    lbMeta.textContent = data.meta || "";
    lbBody.innerHTML = data.html || "";
    lbVisual.innerHTML = "";
    const face = btn.querySelector(".contact-face, .name-sign, picture, .obj-img, .hint, .work, .card, .tags");
    if (face) {
      const clone = face.cloneNode(true);
      clone.querySelectorAll("[aria-hidden]").forEach((n) => n.remove());
      lbVisual.appendChild(clone);
      lbVisual.hidden = false;
    } else {
      lbVisual.hidden = true;
    }
    btn.classList.add("is-open");
    lightbox.hidden = false;
    lightbox.classList.add("is-on");
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.focus({ preventScroll: true });
  }

  function closeLightbox() {
    closeVideoPlayer();
    lightbox.hidden = true;
    lightbox.classList.remove("is-on");
    document.body.style.overflow = previousOverflow;
    panel.classList.remove("is-category");
    document.querySelectorAll(".item.is-open").forEach((el) => el.classList.remove("is-open"));
    lbVisual.innerHTML = "";
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus({ preventScroll: true });
    }
  }

  lightbox.addEventListener("click", (e) => {
    if (e.target.closest("[data-player-close]")) {
      closeVideoPlayer();
      return;
    }
    if (e.target.closest("[data-close]")) {
      if (isVideoPlayerOpen()) closeVideoPlayer();
      else closeLightbox();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab" && !lightbox.hidden) {
      const root = isVideoPlayerOpen() ? videoPlayer : panel;
      const focusable = [...root.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')].filter((el) => !el.hidden && el.closest("[hidden]") == null);
      if (!focusable.length) { e.preventDefault(); root.focus(); }
      else if (e.shiftKey && (document.activeElement === focusable[0] || document.activeElement === root)) { e.preventDefault(); focusable[focusable.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === focusable[focusable.length - 1]) { e.preventDefault(); focusable[0].focus(); }
    }
    if (e.key === "Escape" && !lightbox.hidden) {
      e.preventDefault();
      if (isVideoPlayerOpen()) closeVideoPlayer();
      else closeLightbox();
    }
  });

  function anchorPx(cs, name) {
    const raw = cs.getPropertyValue(name).trim();
    if (!raw || raw.startsWith("calc(")) return null;
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : null;
  }
  function anchorOf(el) {
    const cs = getComputedStyle(el);
    let ax = anchorPx(cs, "--ax");
    let ay = anchorPx(cs, "--ay");
    if (ax == null || ay == null) {
      const sw = parseFloat(cs.getPropertyValue("--sw")) || 0;
      const ow = el.offsetWidth;
      const fx = parseFloat(cs.getPropertyValue("--fx")) || 0;
      const fy = parseFloat(cs.getPropertyValue("--fy")) || 0;
      ax = sw ? fx * ow / sw : 0;
      ay = sw ? fy * ow / sw : 0;
    }
    return { ax, ay };
  }

  function snapItem(item) {
    const { ax, ay } = anchorOf(item);
    const { grid, start, startY } = gridMetrics();
    const hookX = item.offsetLeft + ax;
    const hookY = item.offsetTop + ay;
    const col = Math.round((hookX - start - grid / 2) / grid);
    const row = Math.round((hookY - startY - grid / 2) / grid);
    const maxCol = Math.max(0, Math.floor((board.clientWidth - start) / grid) - 1);
    const maxRow = Math.max(0, Math.floor((board.offsetHeight - startY) / grid) - 1);
    const c = Math.max(0, Math.min(maxCol, col));
    const r = Math.max(0, Math.min(maxRow, row));
    const hole = holeCenter(c, r);
    item.style.left = hole.x - ax + "px";
    item.style.top = hole.y - ay + "px";
  }

  function onPointerDown(e) {
    const item = e.target.closest(".item");
    if (!item || !board.contains(item)) return;
    if (item.classList.contains("item--foot")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const canDrag = isDesktop() && (item.hasAttribute("data-item") || item.hasAttribute("data-drag"));
    item.style.zIndex = String(++zTop);
    drag = {
      item,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: item.offsetLeft,
      origTop: item.offsetTop,
      moved: false,
      canDrag,
    };
  }

  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.pointerId || !drag.canDrag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      drag.item.classList.add("is-dragging");
      try { drag.item.setPointerCapture(e.pointerId); } catch (_) {}
    }
    e.preventDefault();
    const boardRect = board.getBoundingClientRect();
    let left = drag.origLeft + dx;
    let top = drag.origTop + dy;
    left = Math.max(-40, Math.min(boardRect.width - 40, left));
    top = Math.max(-20, Math.min(board.offsetHeight - 40, top));
    drag.item.style.left = left + "px";
    drag.item.style.top = top + "px";
  }

  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const { item, moved } = drag;
    const id = item.getAttribute("data-item");
    item.classList.remove("is-dragging");
    try { item.releasePointerCapture(e.pointerId); } catch (_) {}
    if (moved) {
      snapItem(item);
      drag = null;
      return;
    }
    drag = null;
    if (item.hasAttribute("data-works")) {
      openWorks(item.getAttribute("data-works"));
      return;
    }
    if (id) openItem(item);
  }

  board.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);
  board.addEventListener("click", (e) => {
    if (e.target.closest(".item[data-item], .item[data-works]")) e.preventDefault();
  });
  board.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const item = e.target.closest(".item[data-item], .item[data-works]");
    if (!item) return;
    e.preventDefault();
    if (item.hasAttribute("data-works")) openWorks(item.getAttribute("data-works"));
    else openItem(item);
  });

  function pickCoverRatio(w, h) {
    if (!w || !h) return null;
    const r = w / h;
    return Math.abs(r - 4 / 3) <= Math.abs(r - 3 / 4) ? "4:3" : "3:4";
  }

  function applyCoverRatio(cover, img, item) {
    const rec = item && item.cover && coverAspects[item.cover];
    let ratio = null;
    if (item && item.platform === "douyin") {
      ratio = "3:4";
    } else {
      ratio = rec ? pickCoverRatio(rec.w, rec.h) : null;
      if (!ratio && img && img.naturalWidth && img.naturalHeight) {
        ratio = pickCoverRatio(img.naturalWidth, img.naturalHeight);
      }
    }
    cover.classList.toggle("work__cover--43", ratio === "4:3");
    cover.classList.toggle("work__cover--34", ratio === "3:4");
    if (img) {
      if (item && item.platform === "douyin") {
        img.width = 480;
        img.height = 640;
      } else if (rec && rec.w && rec.h) {
        img.width = rec.w;
        img.height = rec.h;
      } else if (ratio === "4:3") {
        img.width = 640;
        img.height = 480;
      } else if (ratio === "3:4") {
        img.width = 480;
        img.height = 640;
      }
    }
    return ratio;
  }

  function estimateCardHeight(card) {
    const cover = card.querySelector(".work__cover");
    const portrait = cover && cover.classList.contains("work__cover--34");
    const body = card.querySelector(".work__body");
    const textLen = body ? body.textContent.length : 0;
    return (portrait ? 4 / 3 : 3 / 4) + 0.2 + Math.min(0.7, textLen / 90 * 0.12);
  }

  function packMasonry(grid, cards, useMeasured) {
    let cols = Array.from(grid.querySelectorAll(".category-grid__col"));
    if (cols.length !== 2) {
      grid.replaceChildren();
      cols = [0, 1].map(() => {
        const col = document.createElement("div");
        col.className = "category-grid__col";
        grid.appendChild(col);
        return col;
      });
    }
    const measured = useMeasured ? cards.map((card) => card.offsetHeight) : null;
    cols.forEach((col) => { col.replaceChildren(); });
    const heights = [0, 0];
    cards.forEach((card, index) => {
      const i = heights[0] <= heights[1] ? 0 : 1;
      cols[i].appendChild(card);
      heights[i] += (measured && measured[index]) || estimateCardHeight(card);
    });
  }

  function workCard(item) {
    const playEmbed = item.play === "embed" && item.embed;
    const hasLink = !!item.link && !playEmbed;
    const el = document.createElement(playEmbed ? "button" : (hasLink ? "a" : "article"));
    el.className = "work";
    if (playEmbed) {
      el.type = "button";
      el.addEventListener("click", () => openVideoPlayer(item));
    } else if (hasLink) {
      el.href = item.link;
      el.target = "_blank";
      el.rel = "noopener";
    }
    const cover = document.createElement("div");
    cover.className = "work__cover";
    let img = null;
    if (item.cover) {
      const pic = document.createElement("picture");
      if (item.coverWebp) {
        const srcEl = document.createElement("source");
        srcEl.type = "image/webp";
        srcEl.srcset = item.coverWebp;
        pic.appendChild(srcEl);
      }
      img = document.createElement("img");
      img.src = item.cover;
      img.alt = item.title || "";
      img.width = 640;
      img.height = 480;
      pic.appendChild(img);
      cover.appendChild(pic);
      applyCoverRatio(cover, img, item);
      if (img && !cover.classList.contains("work__cover--43") && !cover.classList.contains("work__cover--34")) {
        img.addEventListener("load", () => {
          applyCoverRatio(cover, img, item);
          const grid = el.closest(".category-grid");
          if (grid && grid._masonryCards) packMasonry(grid, grid._masonryCards, true);
        }, { once: true });
      }
    } else {
      cover.classList.add("work__cover--34", "work__cover--text");
      const kicker = document.createElement("span");
      kicker.className = "work__cover-label";
      kicker.textContent = item.coverLabel || "";
      cover.appendChild(kicker);
      if (item.title) {
        const copy = document.createElement("span");
        copy.className = "work__cover-copy";
        copy.textContent = item.title;
        cover.appendChild(copy);
      }
    }
    el.appendChild(cover);
    const body = document.createElement("div");
    body.className = "work__body";
    const metaBits = [];
    if (item.date) metaBits.push(item.date);
    if (item.duration) metaBits.push(item.duration);
    if (item.plays) metaBits.push("播放 " + item.plays);
    if (metaBits.length || item.recent) {
      const meta = document.createElement("p");
      meta.className = "work__date";
      if (item.recent) {
        const badge = document.createElement("span");
        badge.className = "work__badge";
        badge.textContent = "近作";
        meta.appendChild(badge);
      }
      if (metaBits.length) meta.appendChild(document.createTextNode(metaBits.join("  ·  ")));
      body.appendChild(meta);
    }
    const title = document.createElement("h3");
    title.className = "work__title";
    title.textContent = item.title || "";
    body.appendChild(title);
    if (item.note) {
      const note = document.createElement("p");
      note.className = "work__note";
      note.textContent = item.note;
      body.appendChild(note);
    }
    el.appendChild(body);
    return el;
  }

  let worksPromise;
  let coverAspects = {};
  let videoPlayer = null;
  let videoPlayerFocus = null;

  function isGroupedCatalog(list) {
    return list && !Array.isArray(list) && Array.isArray(list.groups);
  }

  function renderWorksGroup(stage, group) {
    const frag = document.createDocumentFragment();
    if (group.credit || group.role) {
      const credit = document.createElement("p");
      credit.className = "works-group__credit";
      credit.textContent = [group.credit, group.role].filter(Boolean).join(" · ");
      frag.appendChild(credit);
    }
    if (group.note) {
      const note = document.createElement("p");
      note.className = "works-group__note";
      note.textContent = group.note;
      frag.appendChild(note);
    }
    if (group.placeholder && group.kind === "company") {
      const hint = document.createElement("p");
      hint.className = "works-group__hint";
      hint.textContent = group.placeholder;
      frag.appendChild(hint);
    }
    if (group.secondaryNote || group.secondaryLink) {
      const secondary = document.createElement("p");
      secondary.className = "works-group__secondary";
      if (group.secondaryNote) secondary.appendChild(document.createTextNode(group.secondaryNote + (group.secondaryLink ? " " : "")));
      if (group.secondaryLink && group.secondaryLink.url) {
        const a = document.createElement("a");
        a.href = group.secondaryLink.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = group.secondaryLink.label || "查看原文";
        secondary.appendChild(a);
      }
      frag.appendChild(secondary);
    }
    const items = group.items || [];
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "works-group__empty";
      empty.textContent = group.placeholder || "整理中";
      frag.appendChild(empty);
    } else {
      const grid = document.createElement("div");
      grid.className = "category-grid";
      if (items.length === 1) grid.classList.add("category-grid--single");
      else if (items.every((item) => !item.cover || item.coverStyle === "text")) grid.classList.add("category-grid--portrait");
      const cards = items.map((item) => workCard(item));
      grid._masonryCards = cards;
      packMasonry(grid, cards, false);
      frag.appendChild(grid);
      requestAnimationFrame(() => {
        if (!stage.contains(grid)) return;
        packMasonry(grid, cards, true);
      });
    }
    stage.replaceChildren(frag);
  }

  function renderCatalog(container, catalog) {
    const wrap = document.createElement("div");
    wrap.className = "works-catalog";
    const tablist = document.createElement("div");
    tablist.className = "works-tabs";
    tablist.setAttribute("role", "tablist");
    tablist.setAttribute("aria-label", "视频分类");
    const stage = document.createElement("div");
    stage.className = "works-tab-stage";
    let current = catalog.defaultGroup || (catalog.groups[0] && catalog.groups[0].id);
    function show(id) {
      current = id;
      const group = catalog.groups.find((entry) => entry.id === id) || catalog.groups[0];
      [...tablist.querySelectorAll("[role=tab]")].forEach((btn) => {
        const on = btn.dataset.group === group.id;
        btn.setAttribute("aria-selected", on ? "true" : "false");
        btn.tabIndex = on ? 0 : -1;
      });
      closeVideoPlayer();
      renderWorksGroup(stage, group);
    }
    catalog.groups.forEach((group) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "works-tabs__btn";
      btn.setAttribute("role", "tab");
      btn.dataset.group = group.id;
      btn.id = "works-tab-" + group.id;
      btn.textContent = group.label;
      btn.addEventListener("click", () => show(group.id));
      tablist.appendChild(btn);
    });
    tablist.addEventListener("keydown", (e) => {
      const tabs = [...tablist.querySelectorAll("[role=tab]")];
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        next.focus();
        show(next.dataset.group);
      }
    });
    wrap.append(tablist, stage);
    container.replaceChildren(wrap);
    show(current);
  }

  function isVideoPlayerOpen() {
    return !!(videoPlayer && !videoPlayer.hidden);
  }

  function ensureVideoPlayer() {
    if (videoPlayer) return videoPlayer;
    const root = document.createElement("div");
    root.className = "video-player";
    root.hidden = true;
    root.innerHTML = '<div class="video-player__dim" data-player-close="1"></div>'
      + '<div class="video-player__sheet" role="dialog" aria-modal="true" aria-labelledby="video-player-title" tabindex="-1">'
      + '<div class="video-player__bar">'
      + '<button class="video-player__back" type="button" data-player-close="1">返回</button>'
      + '<a class="video-player__ext" target="_blank" rel="noopener">在B站打开</a>'
      + '</div>'
      + '<h3 class="video-player__title" id="video-player-title"></h3>'
      + '<p class="video-player__meta"></p>'
      + '<div class="video-player__frame"><iframe allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="" referrerpolicy="unsafe-url"></iframe></div>'
      + '</div>';
    lightbox.appendChild(root);
    videoPlayer = root;
    return root;
  }

  function openVideoPlayer(item) {
    const root = ensureVideoPlayer();
    const sheet = root.querySelector(".video-player__sheet");
    const title = root.querySelector(".video-player__title");
    const meta = root.querySelector(".video-player__meta");
    const ext = root.querySelector(".video-player__ext");
    const frame = root.querySelector(".video-player__frame");
    const iframe = frame.querySelector("iframe");
    title.textContent = item.title || "";
    const bits = [];
    if (item.date) bits.push(item.date);
    if (item.duration) bits.push(item.duration);
    meta.textContent = bits.join("  ·  ");
    if (item.platform === "douyin") {
      ext.textContent = "在抖音打开";
      ext.href = item.link || ("https://www.douyin.com/video/" + (item.vid || ""));
    } else {
      ext.textContent = "在B站打开";
      ext.href = item.link || ("https://www.bilibili.com/video/" + item.bvid);
    }
    ext.hidden = !ext.href;
    const vertical = item.playerAspect === "9:16";
    frame.classList.toggle("video-player__frame--916", vertical);
    frame.classList.toggle("video-player__frame--169", !vertical);
    iframe.removeAttribute("src");
    iframe.referrerPolicy = item.platform === "douyin" ? "unsafe-url" : "no-referrer-when-downgrade";
    iframe.title = item.title || (item.platform === "douyin" ? "抖音播放器" : "Bilibili 播放器");
    iframe.src = item.embed;
    videoPlayerFocus = document.activeElement;
    root.hidden = false;
    lightbox.classList.add("is-playing");
    sheet.focus({ preventScroll: true });
  }

  function closeVideoPlayer() {
    if (!videoPlayer || videoPlayer.hidden) {
      lightbox.classList.remove("is-playing");
      return;
    }
    const iframe = videoPlayer.querySelector("iframe");
    if (iframe) {
      iframe.src = "about:blank";
      iframe.removeAttribute("src");
    }
    videoPlayer.hidden = true;
    lightbox.classList.remove("is-playing");
    if (videoPlayerFocus && typeof videoPlayerFocus.focus === "function") {
      videoPlayerFocus.focus({ preventScroll: true });
    }
    videoPlayerFocus = null;
  }

  function openWorks(id) {
    const trigger = board.querySelector('[data-works="' + id + '"]')
      || (["posts", "reviews", "推文", "影评"].includes(id) ? board.querySelector('[data-works="articles"]') : null);
    lastFocus = trigger;
    previousOverflow = document.body.style.overflow;
    panel.classList.add("is-category");
    lbTitle.textContent = trigger ? trigger.getAttribute("aria-label") : "";
    lbMeta.textContent = "";
    lbVisual.hidden = true;
    lbVisual.innerHTML = "";
    lbBody.textContent = "正在加载";
    if (trigger) trigger.classList.add("is-open");
    lightbox.hidden = false;
    lightbox.classList.add("is-on");
    document.body.style.overflow = "hidden";
    panel.scrollTop = 0;
    panel.focus({ preventScroll: true });
    if (!worksPromise) {
      worksPromise = Promise.all([
        fetch("assets/works/works.json").then((r) => {
          if (!r.ok) throw new Error("作品数据加载失败");
          return r.json();
        }),
        fetch("assets/works/cover-aspects.json").then((r) => r.ok ? r.json() : { covers: {} }).catch(() => ({ covers: {} }))
      ]).then(([data, aspects]) => {
        coverAspects = aspects.covers || {};
        return data;
      }).catch((err) => { worksPromise = null; throw err; });
    }
    worksPromise.then((data) => {
      if (lightbox.hidden || lastFocus !== trigger) return;
      const tab = data.tabs.find((entry) => entry.id === id || entry.key === id || (entry.aliases || []).includes(id));
      if (!tab) return;
      lbTitle.textContent = tab.label;
      const list = data.items[tab.key] || [];
      if (isGroupedCatalog(list)) {
        renderCatalog(lbBody, list);
      } else {
        const grid = document.createElement("div");
        grid.className = "category-grid";
        const cards = list.map((item) => workCard(item));
        grid._masonryCards = cards;
        packMasonry(grid, cards, false);
        lbBody.replaceChildren(grid);
        requestAnimationFrame(() => {
          if (lightbox.hidden || lastFocus !== trigger) return;
          packMasonry(grid, cards, true);
        });
      }
    }).catch(() => { if (!lightbox.hidden && lastFocus === trigger) lbBody.textContent = "加载失败，请稍后再试。"; });
  }

  const params = new URLSearchParams(location.search);
  const requested = params.get("cat") || params.get("open");
  if (requested) {
    const category = [...board.querySelectorAll("[data-works]")].find((el) => el.dataset.works === requested);
    const item = [...board.querySelectorAll("[data-item]")].find((el) => el.dataset.item === requested);
    if (item) openItem(item);
    else openWorks(requested);
  }
})();
