(()=>{
    const root = document.documentElement;
    /* images fade in once decoded */ document.querySelectorAll(".shots img, .product img").forEach((img)=>{
        const done = ()=>img.classList.add("ld");
        if (img.complete && img.naturalWidth) done();
        else {
            img.addEventListener("load", done, {
                once: true
            });
            img.addEventListener("error", done, {
                once: true
            });
        }
    });
    const reduceMotion = ()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* copy email: feedback only after a confirmed result */ const toast = document.querySelector(".toast");
    const msg = toast.querySelector(".msg");
    let tId;
    const show = (ok)=>{
        toast.classList.toggle("fail", !ok);
        msg.textContent = ok ? "이메일 주소를 복사했어요" : "복사하지 못했어요. 선택된 주소를 직접 복사해 주세요";
        toast.classList.remove("show");
        toast.offsetWidth;
        toast.classList.add("show");
        clearTimeout(tId);
        tId = setTimeout(()=>toast.classList.remove("show"), ok ? 2500 : 6000);
    };
    const legacyCopy = (v)=>{
        const t = document.createElement("textarea");
        t.value = v;
        t.setAttribute("readonly", "");
        t.style.position = "fixed";
        t.style.opacity = "0";
        document.body.appendChild(t);
        t.select();
        let ok = false;
        try {
            ok = document.execCommand("copy");
        } catch (_) {
            ok = false;
        }
        t.remove();
        return ok;
    };
    const copy = (v)=>{
        if (!(navigator.clipboard && window.isSecureContext)) return Promise.resolve(legacyCopy(v));
        const timeout = new Promise((res)=>setTimeout(()=>res("timeout"), 1500));
        return Promise.race([
            navigator.clipboard.writeText(v).then(()=>true, ()=>false),
            timeout
        ]).then((r)=>r === true ? true : legacyCopy(v));
    };
    document.querySelectorAll("[data-copy]").forEach((b)=>b.addEventListener("click", ()=>{
            copy(b.dataset.copy).then((ok)=>{
                show(ok);
                if (ok) {
                    const use = b.querySelector("use");
                    use.setAttribute("href", "#i-done");
                    b.classList.add("done");
                    clearTimeout(b._t);
                    b._t = setTimeout(()=>{
                        use.setAttribute("href", "#i-copy");
                        b.classList.remove("done");
                    }, 2500);
                } else {
                    const a = document.getElementById("addr");
                    if (a) {
                        a.scrollIntoView({
                            block: "center",
                            behavior: reduceMotion() ? "auto" : "smooth"
                        });
                        const r = document.createRange();
                        r.selectNodeContents(a);
                        const s = getSelection();
                        s.removeAllRanges();
                        s.addRange(r);
                    }
                }
            });
        }));
    /* accordion: CSS hides closed panels with visibility, which also drops them from tab order */ const setOpen = (card, open)=>{
        card.classList.toggle("open", open);
        card.querySelector(".p-btn").setAttribute("aria-expanded", String(open));
    };
    document.querySelectorAll(".proj").forEach((card)=>{
        setOpen(card, card.hasAttribute("data-default-open"));
        card.querySelector(".p-btn").addEventListener("click", ()=>setOpen(card, !card.classList.contains("open")));
    });
    /* feature gallery: prev / next with end states */ document.querySelectorAll(".gallery").forEach((g)=>{
        const list = g.querySelector(".shots");
        const [prev, next] = g.querySelectorAll(".g-nav button");
        const step = ()=>(list.querySelector("li")?.offsetWidth || 248) + 16;
        const sync = ()=>{
            prev.disabled = list.scrollLeft <= 2;
            next.disabled = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2;
        };
        g.querySelectorAll("[data-g]").forEach((b)=>b.addEventListener("click", ()=>list.scrollBy({
                    left: +b.dataset.g * step() * 2,
                    behavior: reduceMotion() ? "auto" : "smooth"
                })));
        list.addEventListener("scroll", ()=>requestAnimationFrame(sync), {
            passive: true
        });
        addEventListener("resize", sync);
        sync();
    });
    /* cost chart: crosshair + tooltip; the table below is the keyboard and screen-reader view */ document.querySelectorAll(".cost-area").forEach((area)=>{
        const svg = area.querySelector("svg"), tip = area.querySelector(".cost-tip");
        const cx = svg.querySelector(".cx"), dot = area.querySelector(".cd");
        const hide = ()=>{
            tip.hidden = true;
            dot.hidden = true;
            cx.setAttribute("visibility", "hidden");
        };
        svg.querySelectorAll(".hit rect").forEach((r)=>r.addEventListener("pointerenter", ()=>{
                const x = +r.dataset.x, y = +r.dataset.y;
                cx.setAttribute("x1", x * 10);
                cx.setAttribute("x2", x * 10);
                cx.setAttribute("visibility", "visible");
                dot.style.left = x + "%";
                dot.style.top = y + "%";
                dot.hidden = false;
                tip.innerHTML = r.dataset.d + " <b>" + r.dataset.v + "</b>";
                tip.hidden = false;
                const w = area.clientWidth, halfTip = tip.offsetWidth / 2;
                const px = Math.min(Math.max(x / 100 * w, halfTip - 40), w - halfTip + 8);
                tip.style.left = px + "px";
                tip.style.top = y + "%";
            }));
        svg.addEventListener("pointerleave", hide);
    });
    /* lightbox: native dialog gives Escape and focus trapping; focus returns to the opener */ const lb = document.querySelector(".lb");
    if (lb && lb.showModal) {
        const lbImg = lb.querySelector("img");
        const lbCap = lb.querySelector("figcaption");
        let opener = null;
        document.querySelectorAll(".zoom").forEach((z)=>z.addEventListener("click", ()=>{
                const img = z.querySelector("img");
                opener = z;
                lbImg.srcset = img.srcset;
                lbImg.sizes = z.closest(".wide") ? "min(1440px, 100vw)" : "min(480px, 100vw)";
                lbImg.src = img.src;
                lbImg.alt = img.alt;
                lbCap.textContent = z.closest("figure").querySelector("figcaption b").textContent;
                lb.showModal();
            }));
        lb.querySelector(".lb-close").addEventListener("click", ()=>lb.close());
        lb.addEventListener("click", (e)=>{
            if (e.target === lb) lb.close();
        });
        lb.addEventListener("close", ()=>{
            if (opener) opener.focus();
        });
    }
    /* top bar: border, current section, mobile menu */ const bar = document.querySelector(".top");
    const nav = bar.querySelector("nav");
    const menuBtn = bar.querySelector(".menu-btn");
    const ink = document.createElement("span");
    ink.className = "ink";
    ink.setAttribute("aria-hidden", "true");
    nav.appendChild(ink);
    const links = [
        ...nav.querySelectorAll('a[href^="#"]')
    ];
    const targets = links.map((a)=>document.querySelector(a.getAttribute("href")));
    const closeMenu = ()=>{
        bar.classList.remove("nav-open");
        menuBtn.setAttribute("aria-expanded", "false");
        menuBtn.setAttribute("aria-label", "메뉴 열기");
    };
    menuBtn.addEventListener("click", ()=>{
        const open = !bar.classList.contains("nav-open");
        bar.classList.toggle("nav-open", open);
        menuBtn.setAttribute("aria-expanded", String(open));
        menuBtn.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
        if (open) links[0].focus();
    });
    links.forEach((a)=>a.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e)=>{
        if (e.key === "Escape" && bar.classList.contains("nav-open")) {
            closeMenu();
            menuBtn.focus();
        }
    });
    /* current section and bar border come from IntersectionObserver, not scroll events,
     so no handler can feed back into layout and re-trigger itself */ let cur = null;
    const placeInk = ()=>{
        if (cur && cur.offsetParent) {
            ink.style.setProperty("--x", cur.offsetLeft + 12 + "px");
            ink.style.setProperty("--w", cur.offsetWidth - 24 + "px");
            ink.style.setProperty("--o", 1);
        } else ink.style.setProperty("--o", 0);
    };
    const setCurrent = (a)=>{
        if (a === cur) return;
        links.forEach((l)=>{
            if (l === a) l.setAttribute("aria-current", "true");
            else l.removeAttribute("aria-current");
        });
        cur = a;
        placeInk();
    };
    if ("IntersectionObserver" in window) {
        const sentinel = document.createElement("div");
        sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none";
        document.body.prepend(sentinel);
        new IntersectionObserver(([e])=>bar.classList.toggle("scrolled", !e.isIntersecting)).observe(sentinel);
        const seen = new Map();
        const sio = new IntersectionObserver((entries)=>{
            entries.forEach((e)=>seen.set(e.target, e.isIntersecting));
            let idx = -1;
            targets.forEach((t, i)=>{
                if (seen.get(t)) idx = i;
            });
            setCurrent(links[idx] || null);
        }, {
            rootMargin: "-30% 0px -60% 0px"
        });
        targets.forEach((t)=>t && sio.observe(t));
    }
    let rT;
    addEventListener("resize", ()=>{
        clearTimeout(rT);
        rT = setTimeout(()=>{
            if (innerWidth > 960) closeMenu();
            placeInk();
        }, 120);
    });
})();

//# sourceMappingURL=index.8a2d29d5.js.map
