/* Fotogalerie — lightbox pro stránky alb.
 * Seznam fotek si bere přímo z mřížky náhledů (.foto-grid a.foto):
 * odkaz vede na plnou verzi, alt náhledu slouží jako popisek.
 * Bez JS odkazy fungují dál — otevřou fotku napřímo. */
(function () {
  "use strict";

  var links = Array.prototype.slice.call(document.querySelectorAll(".foto-grid a.foto"));
  if (links.length === 0) return;

  var overlay = null;
  var imageEl, counterEl, captionEl;
  var current = 0;
  var lastFocused = null;
  var touchStartX = null;

  function buildOverlay() {
    overlay = document.createElement("div");
    overlay.className = "lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Zvětšená fotografie");
    overlay.hidden = true;
    overlay.innerHTML =
      '<img alt="">' +
      '<span class="lb-counter"></span>' +
      '<span class="lb-caption"></span>' +
      '<button type="button" class="lb-close" aria-label="Zavřít">✕</button>' +
      '<button type="button" class="lb-prev" aria-label="Předchozí fotka">‹</button>' +
      '<button type="button" class="lb-next" aria-label="Další fotka">›</button>';
    document.body.appendChild(overlay);

    imageEl = overlay.querySelector("img");
    counterEl = overlay.querySelector(".lb-counter");
    captionEl = overlay.querySelector(".lb-caption");

    overlay.querySelector(".lb-close").addEventListener("click", close);
    overlay.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
    overlay.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });

    // Klik mimo fotku a tlačítka zavírá
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) close();
    });

    // Listování swipem na dotykových zařízeních
    overlay.addEventListener("touchstart", function (event) {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    overlay.addEventListener("touchend", function (event) {
      if (touchStartX === null) return;
      var delta = event.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (delta > 40) show(current - 1);
      else if (delta < -40) show(current + 1);
    }, { passive: true });
  }

  function onKeyDown(event) {
    if (event.key === "Escape") close();
    else if (event.key === "ArrowLeft") show(current - 1);
    else if (event.key === "ArrowRight") show(current + 1);
  }

  function captionFor(index) {
    var thumb = links[index].querySelector("img");
    return thumb ? thumb.alt : "";
  }

  function preload(index) {
    if (index < 0 || index >= links.length) return;
    var img = new Image();
    img.src = links[index].href;
  }

  function show(index) {
    // Na krajích alba se listování zastaví (nepřetéká dokola)
    current = Math.max(0, Math.min(links.length - 1, index));
    imageEl.src = links[current].href;
    imageEl.alt = captionFor(current);
    counterEl.textContent = (current + 1) + " / " + links.length;
    captionEl.textContent = captionFor(current);
    preload(current - 1);
    preload(current + 1);
  }

  function open(index) {
    if (!overlay) buildOverlay();
    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    show(index);
    overlay.querySelector(".lb-close").focus();
  }

  function close() {
    overlay.hidden = true;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeyDown);
    if (lastFocused) lastFocused.focus();
  }

  links.forEach(function (link, index) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      open(index);
    });
  });
})();
