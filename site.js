/* =============================================================================
   Svět autismu — společný skript webu

   Jediný JS soubor pro celý web. Připojuje se ze všech stránek jedním řádkem
   v hlavičce:  <script src="site.js" defer></script>
   (404.html používá absolutní cestu /site.js — viz komentář v její hlavičce.)

   Obsahuje tři nezávislé části:
     1. mobilní menu
     2. odesílání kontaktního formuláře
     3. cookie lišta a Google Analytics

   Každá si na začátku ověří, jestli na stránce má co dělat, takže je bezpečné
   načítat tenhle soubor všude.

   Konvence: názvy funkcí a proměnných anglicky, komentáře a texty pro
   návštěvníky česky.
   ========================================================================== */

(function () {
  'use strict';

  /* --- 1. Mobilní menu ---------------------------------------------------- */

  (function mobileMenu() {
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('mainNav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  })();

  /* --- 2. Kontaktní formulář ---------------------------------------------- */
  /* Web je statický, takže formulář nemá kam odeslat data — místo toho složí
     mailto: odkaz a předá ho poštovnímu klientovi. Adresa se skládá ze dvou
     kusů, aby ji ze zdrojáku hůř sbíraly roboty rozesílající spam. */

  (function contactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var to = 'svetautismu' + '@' + 'svetautismu.cz';
      var val = function (id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
      };
      var subject = val('subject') || 'Dotaz z webu';
      var body = val('message') + '\n\n--\nOdesílatel: ' + val('name') +
                 '\nE-mail: ' + val('email');
      window.location.href = 'mailto:' + to +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
    });
  })();

  /* --- 3. Cookie lišta a Google Analytics --------------------------------- */
  /*
     GA4 ukládá cookies, takže se podle zákona o elektronických komunikacích
     smí spustit až PO souhlasu návštěvníka. Proto se měřicí skript nevkládá
     do stránek napevno — načte ho až funkce loadAnalytics() níže.

     Volba (souhlas i odmítnutí) se ukládá do localStorage, takže platí pro
     celou doménu i pro příští návštěvy. Odmítnutí se pamatuje stejně jako
     souhlas — jinak by lišta otravovala na každé stránce.

     Souhlas platí rok, odmítnutí půl roku — podle doporučení ÚOOÚ. Po vypršení
     se lišta zeptá znovu. Lhůtu pro odmítnutí nezkracuj: časté dotazování
     někoho, kdo už řekl ne, se hodnotí jako nátlaková praktika.

     Odvolat souhlas jde odkazem v patičce (atribut data-cookie-settings),
     který lištu vyvolá znovu.
  */

  var GA_ID = 'G-2D4XV4PHYS';
  var STORAGE_KEY = 'sa-cookie-consent';
  var CONSENT_DAYS = 365;   // platnost souhlasu
  var REFUSAL_DAYS = 180;   // platnost odmítnutí

  function loadConsent() {
    try {
      var stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!stored || !stored.state || !stored.date) return null;
      var ageDays = (Date.now() - new Date(stored.date).getTime()) / 86400000;
      var limit = stored.state === 'yes' ? CONSENT_DAYS : REFUSAL_DAYS;
      if (ageDays > limit) return null;          // vypršelo, zeptáme se znovu
      return stored.state;
    } catch (e) {
      // Soukromý režim prohlížeče může localStorage zakázat. Pak se lišta
      // ukáže pokaždé, ale web funguje dál a měření se nespustí.
      return null;
    }
  }

  function saveConsent(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        state: state,
        date: new Date().toISOString()
      }));
    } catch (e) { /* viz výše — bez uložení se web chová jako bez souhlasu */ }
  }

  var analyticsLoaded = false;

  function loadAnalytics() {
    if (analyticsLoaded) return;        // po druhém kliknutí ať se nenačte 2×
    analyticsLoaded = true;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  /* Odvolání souhlasu musí uklidit i cookies, které Google Analytics stihlo
     nastavit — jinak by po odmítnutí zůstaly v prohlížeči ležet. Maže se
     _ga, _ga_<ID> a starší _gid/_gat, a to jak na aktuálním jménu, tak na
     doméně s tečkou (na tu je GA ukládá, aby platily i pro subdomény). */
  function deleteAnalyticsCookies() {
    var parts = document.cookie.split(';');
    var domains = ['', location.hostname, '.' + location.hostname];

    // www.svetautismu.cz → přidat i .svetautismu.cz
    var segments = location.hostname.split('.');
    if (segments.length > 2) domains.push('.' + segments.slice(-2).join('.'));

    for (var i = 0; i < parts.length; i++) {
      var name = parts[i].split('=')[0].trim();
      if (!/^_ga|^_gid$|^_gat/.test(name)) continue;
      for (var d = 0; d < domains.length; d++) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' +
          (domains[d] ? '; domain=' + domains[d] : '');
      }
    }
  }

  /* Styly lišty se vkládají odsud, ne do CSS souboru: podstránky používají
     detail.css, ale homepage má vlastní inline styl — takhle lišta vypadá
     všude stejně a je celá v jednom souboru. */
  function injectStyles() {
    if (document.getElementById('sa-cookie-style')) return;
    var css =
      '.sa-cookie{position:fixed;left:0;right:0;bottom:0;z-index:9999;' +
      'background:#1a1a2e;color:#fff;padding:20px 24px;' +
      'box-shadow:0 -4px 24px rgba(0,0,0,.25);' +
      'font-family:inherit;font-size:14.5px;line-height:1.6}' +
      '.sa-cookie-in{max-width:1200px;margin:0 auto;display:flex;' +
      'gap:20px;align-items:center;flex-wrap:wrap}' +
      '.sa-cookie-text{flex:1 1 380px;color:rgba(255,255,255,.85)}' +
      '.sa-cookie-text a{color:#fff;text-decoration:underline}' +
      '.sa-cookie-actions{display:flex;gap:10px;flex-wrap:wrap}' +
      '.sa-cookie button{font:inherit;font-weight:700;cursor:pointer;' +
      'border-radius:8px;padding:11px 22px;border:1px solid transparent;' +
      'transition:opacity .2s}' +
      '.sa-cookie button:hover{opacity:.85}' +
      '.sa-cookie .accept{background:#4a90d9;color:#fff}' +
      '.sa-cookie .decline{background:transparent;color:#fff;' +
      'border-color:rgba(255,255,255,.45)}' +
      '@media(max-width:640px){.sa-cookie{padding:16px}' +
      '.sa-cookie-actions{width:100%}.sa-cookie button{flex:1}}';
    var el = document.createElement('style');
    el.id = 'sa-cookie-style';
    el.textContent = css;
    document.head.appendChild(el);
  }

  function closeBanner(banner) {
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
  }

  function showBanner() {
    if (document.querySelector('.sa-cookie')) return;
    injectStyles();

    var banner = document.createElement('div');
    banner.className = 'sa-cookie';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Souhlas s měřením návštěvnosti');
    banner.innerHTML =
      '<div class="sa-cookie-in">' +
        '<div class="sa-cookie-text">' +
          'Rádi bychom měřili návštěvnost webu, abychom věděli, co vás zajímá. ' +
          'K tomu používáme Google Analytics, které si do prohlížeče uloží ' +
          'cookies. Bez vašeho souhlasu se nespustí a web funguje i bez nich. ' +
          'Podrobnosti najdete v <a href="/ochrana-osobnich-udaju/">' +
          'zásadách ochrany osobních údajů</a>.' +
        '</div>' +
        '<div class="sa-cookie-actions">' +
          '<button type="button" class="decline">Nesouhlasím</button>' +
          '<button type="button" class="accept">Souhlasím</button>' +
        '</div>' +
      '</div>';

    banner.querySelector('.accept').addEventListener('click', function () {
      saveConsent('yes');
      closeBanner(banner);
      loadAnalytics();
    });
    banner.querySelector('.decline').addEventListener('click', function () {
      saveConsent('no');
      closeBanner(banner);
      deleteAnalyticsCookies();
      // Když už měření na téhle stránce běželo (návštěvník souhlas odvolal),
      // je gtag pořád v paměti — čistý stav zajistí až znovunačtení stránky.
      if (analyticsLoaded) location.reload();
    });

    document.body.appendChild(banner);
    banner.querySelector('.accept').focus();
  }

  (function cookieConsent() {
    var choice = loadConsent();

    if (choice === 'yes') {
      loadAnalytics();
    } else if (choice === 'no') {
      // Úklid při každém načtení, ne jen při kliknutí na „Nesouhlasím“:
      // gtag po odvolání ještě chvíli žije v paměti a stihne si cookie
      // přepsat zpátky. Tady už žádný neběží, takže smazání je konečné.
      deleteAnalyticsCookies();
    } else {
      showBanner();           // nic uloženého nebo vypršelo → zeptat se
    }

    // Odkaz „Nastavení cookies" v patičce vyvolá lištu znovu.
    var triggers = document.querySelectorAll('[data-cookie-settings]');
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener('click', function (e) {
        e.preventDefault();
        showBanner();
      });
    }
  })();

})();
