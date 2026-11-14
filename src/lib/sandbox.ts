/**
 * Injects a safe storage polyfill, link/navigation guard, and runtime error bridge
 * into the generated HTML before it renders inside the sandboxed <iframe srcDoc>.
 */
export function injectSandboxRuntime(
  rawHtml: string,
  instanceId = 'default'
): string {
  if (!rawHtml || !rawHtml.trim()) return '';

  const safeId = JSON.stringify(instanceId);

  const bridgeStyle = `<style data-prompt2app-scrollbars="true">
html{color-scheme:dark;}
::-webkit-scrollbar{width:7px;height:7px;}
::-webkit-scrollbar-button{display:none;width:0;height:0;}
::-webkit-scrollbar-track,::-webkit-scrollbar-corner{background:#0a0a0c;}
::-webkit-scrollbar-thumb{background:#222228;border-radius:9999px;border:1.5px solid #0a0a0c;}
::-webkit-scrollbar-thumb:hover{background:#34343e;}
::-webkit-scrollbar-thumb:active{background:#484854;}
</style>`;

  const bridgeScript = `${bridgeStyle}\n<script data-prompt2app-runtime="true">
(function() {
  var INSTANCE_ID = ${safeId};

  // 1. Safe localStorage & sessionStorage shim for opaque sandboxed origin
  function createMemoryStorage() {
    var store = Object.create(null);
    return {
      getItem: function(key) {
        return Object.prototype.hasOwnProperty.call(store, key) ? store[String(key)] : null;
      },
      setItem: function(key, val) {
        store[String(key)] = String(val);
      },
      removeItem: function(key) {
        delete store[String(key)];
      },
      clear: function() {
        store = Object.create(null);
      },
      key: function(index) {
        var keys = Object.keys(store);
        return keys[index] !== undefined ? keys[index] : null;
      },
      get length() {
        return Object.keys(store).length;
      }
    };
  }

  try {
    var testKey = '__p2a_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
  } catch (e) {
    try {
      Object.defineProperty(window, 'localStorage', {
        value: createMemoryStorage(),
        configurable: true,
        writable: true
      });
      Object.defineProperty(window, 'sessionStorage', {
        value: createMemoryStorage(),
        configurable: true,
        writable: true
      });
    } catch (_) {}
  }

  // 2. Prevent accidental empty href="" or external link navigation from blanking the preview iframe
  document.addEventListener('click', function(e) {
    var anchor = e.target && e.target.closest ? e.target.closest('a') : null;
    if (!anchor) return;
    var href = anchor.getAttribute('href');
    if (href === '' || href === '#') {
      e.preventDefault();
      return;
    }
    if (href && /^https?:\\/\\//i.test(href) && !anchor.getAttribute('target')) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');
    }
  }, true);

  // 3. Runtime error reporter to parent Studio (tagged with INSTANCE_ID)
  function reportError(message, line, column) {
    try {
      window.parent.postMessage({
        type: 'PROMPT2APP_RUNTIME_ERROR',
        instanceId: INSTANCE_ID,
        payload: {
          message: String(message || 'Unknown runtime error'),
          line: typeof line === 'number' ? line : undefined,
          column: typeof column === 'number' ? column : undefined,
          timestamp: Date.now()
        }
      }, '*');
    } catch (_) {}
  }

  window.addEventListener('error', function(event) {
    if (event && event.message) {
      var msg = String(event.message);
      if (msg.indexOf('ResizeObserver') !== -1 || msg === 'Script error.') return;
      reportError(msg, event.lineno, event.colno);
    }
  });

  window.addEventListener('unhandledrejection', function(event) {
    var reason = event && event.reason;
    var msg = reason instanceof Error ? reason.message : String(reason || 'Unhandled Promise Rejection');
    reportError(msg);
  });
})();
</script>`;

  if (/<head[^>]*>/i.test(rawHtml)) {
    return rawHtml.replace(/<head[^>]*>/i, (match) => `${match}\n${bridgeScript}`);
  }
  if (/<html[^>]*>/i.test(rawHtml)) {
    return rawHtml.replace(
      /<html[^>]*>/i,
      (match) => `${match}\n<head>${bridgeScript}</head>`
    );
  }
  return `${bridgeScript}\n${rawHtml}`;
}
