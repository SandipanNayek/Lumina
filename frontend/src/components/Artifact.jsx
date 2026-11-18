import { useEffect, useMemo, useRef, useState } from "react"
import { Check, Code2, Copy, Download, Eye, FileCode2, Sparkles, X } from "lucide-react"
import { useSelector } from "react-redux"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

const getLanguageFromFile = (fileName = "", fallback = "javascript") => {
  const ext = fileName.split(".").pop()?.toLowerCase()
  const extMap = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    html: "html",
    css: "css",
    py: "python",
    cpp: "cpp",
    c: "c",
    java: "java",
    json: "json",
    sql: "sql",
    sh: "bash",
    vue: "html",
  }
  return extMap[ext] || fallback
}

function Artifact({ artifact: propArtifact, isOpen = true, onClose }) {
  const artifacts = useSelector((state) => state.message?.artifacts) ?? []
  const artifact =
    propArtifact || (artifacts.length > 0 ? artifacts[artifacts.length - 1] : null)

  const [activeFileIndex, setActiveFileIndex] = useState(0)
  const [viewMode, setViewMode] = useState("code")
  const [copied, setCopied] = useState(false)
  const [prevArtifactId, setPrevArtifactId] = useState(artifact?.id)
  const [isReady, setIsReady] = useState(!isOpen)
  const [isClosing, setIsClosing] = useState(false)
  const closeTimerRef = useRef(null)

  if (!isOpen && isClosing) {
    setIsClosing(false)
  }

  if (artifact?.id !== prevArtifactId) {
    setPrevArtifactId(artifact?.id)
    setActiveFileIndex(0)
    setViewMode("code")
  }

  useEffect(() => {
    let frame1
    let frame2
    frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        setIsReady(true)
      })
    })
    return () => {
      cancelAnimationFrame(frame1)
      cancelAnimationFrame(frame2)
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (isOpen && closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
      setIsClosing(false)
    }
  }, [isOpen])

  const handleClose = () => {
    if (!onClose || isClosing) return
    setIsClosing(true)
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null
      onClose()
    }, 320)
  }

  const visible = isOpen && isReady && !isClosing

  const files = useMemo(() => {
    if (!artifact) return []
    if (Array.isArray(artifact.files) && artifact.files.length > 0) {
      return artifact.files
    }
    if (typeof artifact.content === "string" && artifact.content.trim()) {
      const ext = artifact.language || "txt"
      return [
        {
          name: `${(artifact.title || "artifact").toLowerCase().replace(/\s+/g, "-")}.${ext}`,
          content: artifact.content,
        },
      ]
    }
    return []
  }, [artifact])

  const currentFile = files[activeFileIndex] || files[0] || null
  const currentCode = currentFile?.content || ""
  const currentLang = getLanguageFromFile(currentFile?.name, artifact?.language || "javascript")

  const previewHtml = useMemo(() => {
    if (files.length === 0) return ""

    const htmlFile = files.find((f) => f.name?.toLowerCase().endsWith(".html"))
    const cssFiles = files.filter((f) => f.name?.toLowerCase().endsWith(".css"))
    const pkgFile = files.find((f) => /(^|\/)package\.json$/i.test(f.name || ""))

    const isConfigOrBootstrap = (name = "") => {
      const lower = name.replace(/\\/g, "/").replace(/^\.\//, "").toLowerCase()
      return (
        /(^|\/)(next|tailwind|postcss|vite|webpack|babel|jest|eslint)\.config\.(js|ts|mjs|cjs)$/.test(lower) ||
        /(^|\/)pages\/_(app|document)\.(js|jsx|ts|tsx)$/.test(lower) ||
        /(^|\/)app\/layout\.(js|jsx|ts|tsx)$/.test(lower) ||
        /(^|\/)(src\/)?(main|index|reportwebvitals|setuptests)\.(js|jsx|ts|tsx)$/.test(lower) ||
        /(^|\/)server\.(js|ts)$/.test(lower)
      )
    }

    const hasReactInPackage =
      pkgFile && /["'](?:react|react-dom|next)["']\s*:/.test(pkgFile.content || "")

    const hasReactSyntax = (content = "") =>
      /from\s+['"](?:react|next\/|react-router)|require\s*\(\s*['"]react['"]\s*\)|className\s*=|<\/[A-Za-z][^>]*>|\b(?:useState|useEffect|useMemo|useRef|useContext)\s*\(/.test(
        content
      )

    const isReactProject =
      Boolean(hasReactInPackage) ||
      files.some((f) => {
        const lower = (f.name || "").toLowerCase()
        return (
          lower.endsWith(".jsx") ||
          lower.endsWith(".tsx") ||
          (/\.(js|ts)$/.test(lower) && hasReactSyntax(f.content || ""))
        )
      })

    const reactCandidateFiles = isReactProject
      ? files.filter((f) => {
          const lower = (f.name || "").toLowerCase()
          if (isConfigOrBootstrap(lower)) return false
          return /\.(jsx|tsx|js|ts)$/.test(lower)
        })
      : []

    const jsFiles = files.filter(
      (f) => f.name?.toLowerCase().endsWith(".js") || f.name?.toLowerCase().endsWith(".ts")
    )

    if (reactCandidateFiles.length > 0) {
      const entryFile =
        reactCandidateFiles.find((f) => /(^|\/)(pages\/index|app\/page)\.(jsx|tsx|js|ts)$/i.test(f.name)) ||
        reactCandidateFiles.find((f) => /(^|\/)app\.(jsx|tsx|js|ts)$/i.test(f.name)) ||
        reactCandidateFiles.find((f) => hasReactSyntax(f.content || "")) ||
        reactCandidateFiles[0]

      const moduleFiles = files
        .filter((f) => /\.(jsx|tsx|js|ts|json)$/i.test(f.name || ""))
        .map((f) => ({
          name: (f.name || "").replace(/\\/g, "/").replace(/^\.\//, ""),
          content: f.content || "",
        }))

      const normalizedEntryName = (entryFile.name || "").replace(/\\/g, "/").replace(/^\.\//, "")
      const combinedCss = cssFiles.map((f) => f.content).join("\n")
      const serializedBundle = JSON.stringify({
        entry: normalizedEntryName,
        files: moduleFiles,
      }).replace(/<\/script>/gi, "<\\/script>")

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script async src="https://cdn.tailwindcss.com"></script>
  <style>
    html, body, #root { min-height: 100%; margin: 0; }
    ${combinedCss}
  </style>
</head>
<body>
  <div id="root"><div style="padding:20px;font-family:system-ui,sans-serif;color:#64748b;font-size:13px;">Loading preview...</div></div>
  <script>
    function showPreviewError(title, err) {
      var root = document.getElementById("root");
      if (root) {
        root.innerHTML =
          '<div style="padding:16px;color:#f43f5e;background:#0b0e15;min-height:100vh;font-family:monospace;">' +
          "<strong>" + title + ":</strong>" +
          '<pre style="white-space:pre-wrap;margin-top:8px;">' +
          (err && (err.stack || err.message) ? (err.stack || err.message) : String(err)) +
          "</pre></div>";
      }
    }
    window.onerror = function(msg, url, line, col, err) {
      showPreviewError("Preview Error", err || msg);
    };

    document.addEventListener("submit", function(e) {
      e.preventDefault();
    });

    document.addEventListener("click", function(e) {
      var anchor = e.target && e.target.closest ? e.target.closest("a") : null;
      if (!anchor) return;
      var href = anchor.getAttribute("href");
      if (href === null || href === undefined) return;
      e.preventDefault();
      if (href.charAt(0) === "#") {
        var id = href.slice(1);
        var el = id ? document.getElementById(id) : null;
        if (el) el.scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (typeof window.__luminaNavigate === "function") {
        window.__luminaNavigate(href);
      }
    });
  </script>
  <script type="application/json" id="__lumina_bundle">${serializedBundle}</script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js" onerror="showPreviewError('CDN Error', 'Failed to load React runtime')"></script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js" onerror="showPreviewError('CDN Error', 'Failed to load ReactDOM runtime')"></script>
  <script src="https://cdn.jsdelivr.net/npm/@babel/standalone@7.23.10/babel.min.js" onerror="showPreviewError('CDN Error', 'Failed to load Babel transpiler')"></script>
  <script>
    (function() {
      if (typeof Babel === "undefined" || typeof React === "undefined" || typeof ReactDOM === "undefined") {
        showPreviewError("Preview Error", "Preview dependencies failed to initialize.");
        return;
      }

      window.React = React;
      window.ReactDOM = ReactDOM;
      React.default = React;
      ReactDOM.default = ReactDOM;

      var RouterContext = React.createContext({
        path: "/",
        navigate: function(to) {
          if (typeof window.__luminaNavigate === "function") window.__luminaNavigate(to);
        }
      });

      var cssModuleShim = new Proxy({}, {
        get: function(_, prop) {
          if (prop === "__esModule") return true;
          if (prop === "default") return cssModuleShim;
          return typeof prop === "string" ? prop : "";
        }
      });

      function NextImageShim(props) {
        var imgProps = Object.assign({}, props);
        delete imgProps.fill;
        delete imgProps.priority;
        delete imgProps.quality;
        delete imgProps.placeholder;
        delete imgProps.blurDataURL;
        if (props && props.fill) {
          imgProps.style = Object.assign({ width: "100%", height: "100%", objectFit: "cover" }, props.style);
        }
        return React.createElement("img", imgProps);
      }

      function NextLinkShim(props) {
        var targetHref = typeof props.href === "string" ? props.href : (typeof props.to === "string" ? props.to : "#");
        var linkProps = Object.assign({}, props, {
          href: targetHref,
          onClick: function(e) {
            e.preventDefault();
            if (props && typeof props.onClick === "function") props.onClick(e);
            if (typeof window.__luminaNavigate === "function") window.__luminaNavigate(targetHref);
          }
        });
        delete linkProps.to;
        return React.createElement("a", linkProps, props ? props.children : null);
      }

      function NextHeadShim() {
        return null;
      }

      function createIconProxy() {
        return new Proxy({}, {
          get: function(_, prop) {
            if (prop === "__esModule") return true;
            return function IconComponent(props) {
              var size = (props && props.size) || 18;
              var className = (props && props.className) || "";
              return React.createElement(
                "svg",
                {
                  width: size,
                  height: size,
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: 2,
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  className: className
                },
                React.createElement("circle", { cx: 12, cy: 12, r: 9 })
              );
            };
          }
        });
      }

      function RouterProvider(props) {
        var parentCtx = React.useContext(RouterContext);
        var state = React.useState(parentCtx.path || "/");
        var path = state[0];
        var setPath = state[1];

        React.useEffect(function() {
          var prevNav = window.__luminaNavigate;
          window.__luminaNavigate = function(to) {
            if (typeof to === "string") {
              var clean = to.split("?")[0] || "/";
              if (clean.charAt(0) !== "/") clean = "/" + clean;
              setPath(clean);
            }
            if (typeof prevNav === "function") prevNav(to);
          };
          return function() {
            window.__luminaNavigate = prevNav;
          };
        }, []);

        var value = React.useMemo(function() {
          return {
            path: path,
            navigate: function(to) {
              if (typeof window.__luminaNavigate === "function") {
                window.__luminaNavigate(to);
              } else if (typeof to === "string") {
                setPath(to.split("?")[0] || "/");
              }
            }
          };
        }, [path]);

        return React.createElement(RouterContext.Provider, { value: value }, props.children);
      }

      function RouterRoutes(props) {
        var ctx = React.useContext(RouterContext);
        var items = React.Children.toArray(props.children);
        var matched = null;
        var fallback = null;

        for (var i = 0; i < items.length; i++) {
          var child = items[i];
          if (!child || !child.props) continue;
          var routePath = child.props.path;
          if (!fallback && (routePath === "/" || routePath === "*" || child.props.index)) {
            fallback = child;
          }
          if (routePath === ctx.path || (routePath && routePath.indexOf(":") !== -1)) {
            matched = child;
            break;
          }
        }

        var activeRoute = matched || fallback || items[0];
        if (!activeRoute || !activeRoute.props) return null;
        if (activeRoute.props.element) return activeRoute.props.element;
        if (activeRoute.props.component) return React.createElement(activeRoute.props.component);
        return activeRoute.props.children || null;
      }

      function RouterRoute(props) {
        if (props.element) return props.element;
        if (props.component) return React.createElement(props.component);
        return props.children || null;
      }

      var reactRouterShim = {
        __esModule: true,
        BrowserRouter: RouterProvider,
        HashRouter: RouterProvider,
        MemoryRouter: RouterProvider,
        Routes: RouterRoutes,
        Switch: RouterRoutes,
        Route: RouterRoute,
        Link: NextLinkShim,
        NavLink: NextLinkShim,
        Outlet: function() { return null; },
        Navigate: function(props) {
          var ctx = React.useContext(RouterContext);
          React.useEffect(function() {
            if (props && props.to) ctx.navigate(props.to);
          }, [props && props.to]);
          return null;
        },
        useNavigate: function() {
          var ctx = React.useContext(RouterContext);
          return ctx.navigate;
        },
        useLocation: function() {
          var ctx = React.useContext(RouterContext);
          return { pathname: ctx.path, search: "", hash: "", state: null };
        },
        useParams: function() { return {}; },
        useSearchParams: function() { return [new URLSearchParams(), function() {}]; }
      };

      function createFallbackModule() {
        var fn = function(props) {
          if (props && typeof props === "object" && "children" in props) {
            return React.createElement(React.Fragment, null, props.children);
          }
          return null;
        };
        return new Proxy(fn, {
          get: function(_, prop) {
            if (prop === "__esModule") return true;
            if (prop === "default") return createFallbackModule();
            if (typeof prop === "string" && /^(div|span|button|section|header|footer|nav|main|ul|li|a|p|h[1-6]|img|input|form)$/.test(prop)) {
              return function(props) {
                var cleanProps = Object.assign({}, props);
                delete cleanProps.initial;
                delete cleanProps.animate;
                delete cleanProps.exit;
                delete cleanProps.transition;
                delete cleanProps.whileHover;
                delete cleanProps.whileTap;
                return React.createElement(prop, cleanProps);
              };
            }
            return createFallbackModule();
          }
        });
      }

      var bundle = JSON.parse(document.getElementById("__lumina_bundle").textContent);
      var fileMap = {};
      for (var i = 0; i < bundle.files.length; i++) {
        fileMap[bundle.files[i].name] = bundle.files[i].content;
      }

      function resolveLocalPath(fromFile, request) {
        var target = request;
        if (target.indexOf("@/") === 0 || target.indexOf("~/") === 0) {
          target = target.slice(2);
        } else if (target.indexOf("./") === 0 || target.indexOf("../") === 0) {
          var baseParts = fromFile.split("/");
          baseParts.pop();
          var relParts = target.split("/");
          for (var j = 0; j < relParts.length; j++) {
            var seg = relParts[j];
            if (seg === "." || seg === "") continue;
            if (seg === "..") {
              baseParts.pop();
            } else {
              baseParts.push(seg);
            }
          }
          target = baseParts.join("/");
        } else {
          return null;
        }

        var candidates = [
          target,
          target + ".jsx",
          target + ".tsx",
          target + ".js",
          target + ".ts",
          target + ".json",
          target + "/index.jsx",
          target + "/index.tsx",
          target + "/index.js",
          target + "/index.ts"
        ];

        for (var k = 0; k < candidates.length; k++) {
          if (Object.prototype.hasOwnProperty.call(fileMap, candidates[k])) {
            return candidates[k];
          }
          if (Object.prototype.hasOwnProperty.call(fileMap, "src/" + candidates[k])) {
            return "src/" + candidates[k];
          }
        }
        return null;
      }

      var moduleCache = {};
      var NL = String.fromCharCode(10);

      function loadModule(fileName) {
        if (moduleCache[fileName]) return moduleCache[fileName].exports;

        var mod = { exports: {} };
        moduleCache[fileName] = mod;

        if (fileName.toLowerCase().endsWith(".json")) {
          try {
            mod.exports = JSON.parse(fileMap[fileName]);
          } catch (e) {
            mod.exports = {};
          }
          return mod.exports;
        }

        var localRequire = function(req) {
          if (req === "react") return React;
          if (req === "react-dom" || req === "react-dom/client") return ReactDOM;
          if (req === "react-router-dom" || req === "react-router") return reactRouterShim;
          if (req === "next/image") return { __esModule: true, default: NextImageShim };
          if (req === "next/link") return { __esModule: true, default: NextLinkShim };
          if (req === "next/head") return { __esModule: true, default: NextHeadShim };
          if (req === "next/router" || req === "next/navigation") {
            return {
              __esModule: true,
              useRouter: function() {
                return {
                  push: function(to) { if (typeof window.__luminaNavigate === "function") window.__luminaNavigate(to); },
                  replace: function(to) { if (typeof window.__luminaNavigate === "function") window.__luminaNavigate(to); },
                  back: function() { if (typeof window.__luminaNavigate === "function") window.__luminaNavigate("/"); },
                  pathname: "/",
                  query: {}
                };
              },
              usePathname: function() { return "/"; },
              useSearchParams: function() { return new URLSearchParams(); }
            };
          }
          if (typeof req === "string" && req.indexOf("next/font") === 0) {
            return new Proxy({}, {
              get: function(_, prop) {
                if (prop === "__esModule") return true;
                return function() { return { className: "", style: {}, variable: "" }; };
              }
            });
          }
          if (typeof req === "string" && /^(lucide-react|react-icons|@heroicons)/.test(req)) {
            return createIconProxy();
          }
          if (typeof req === "string" && /\.css$/i.test(req)) {
            return cssModuleShim;
          }

          var resolved = resolveLocalPath(fileName, req);
          if (resolved) {
            return loadModule(resolved);
          }

          return createFallbackModule();
        };

        var source = (fileMap[fileName] || "")
          .replace(/\bimport\.meta\.env\b/g, '({ DEV: true, PROD: false, MODE: "development" })')
          .replace(/\bimport\.meta\b/g, '({ env: { DEV: true, PROD: false, MODE: "development" } })');

        var compiledCode;
        try {
          compiledCode = Babel.transform(source, {
            presets: ["react", "typescript"],
            plugins: ["transform-modules-commonjs"],
            filename: fileName
          }).code;
        } catch (compileErr) {
          if (fileName === bundle.entry) {
            throw compileErr;
          }
          mod.exports = {
            __esModule: true,
            default: function TruncatedComponentFallback() {
              return null;
            }
          };
          return mod.exports;
        }

        var fallbackExportTrailer = [
          "if (module.exports && !module.exports.default && typeof module.exports !== 'function') {",
          "  if (typeof App === 'function') module.exports.default = App;",
          "  else if (typeof Home === 'function') module.exports.default = Home;",
          "  else if (typeof Page === 'function') module.exports.default = Page;",
          "}"
        ].join(NL);

        var factory = new Function(
          "module",
          "exports",
          "require",
          "React",
          "ReactDOM",
          compiledCode + NL + fallbackExportTrailer
        );

        factory(mod, mod.exports, localRequire, React, ReactDOM);
        return mod.exports;
      }

      function extractComponent(entryExports) {
        var comp =
          (entryExports && typeof entryExports.default === "function" && entryExports.default) ||
          (typeof entryExports === "function" && entryExports) ||
          (entryExports && (entryExports.App || entryExports.Home || entryExports.Page)) ||
          null;

        if (!comp && entryExports && typeof entryExports === "object") {
          var keys = Object.keys(entryExports);
          for (var m = 0; m < keys.length; m++) {
            if (typeof entryExports[keys[m]] === "function") {
              comp = entryExports[keys[m]];
              break;
            }
          }
        }
        return comp;
      }

      function resolveNextPageFile(routePath) {
        var clean = (routePath || "/").split("?")[0].split("#")[0].replace(/^\/+|\/+$/g, "");
        if (!clean) return bundle.entry;
        var exts = [".jsx", ".tsx", ".js", ".ts"];
        var prefixes = ["pages/", "src/pages/", "app/", "src/app/"];
        for (var p = 0; p < prefixes.length; p++) {
          for (var e = 0; e < exts.length; e++) {
            var c1 = prefixes[p] + clean + exts[e];
            var c2 = prefixes[p] + clean + "/index" + exts[e];
            var c3 = prefixes[p] + clean + "/page" + exts[e];
            if (Object.prototype.hasOwnProperty.call(fileMap, c1)) return c1;
            if (Object.prototype.hasOwnProperty.call(fileMap, c2)) return c2;
            if (Object.prototype.hasOwnProperty.call(fileMap, c3)) return c3;
          }
        }
        return null;
      }

      try {
        var DefaultRootComponent = extractComponent(loadModule(bundle.entry));

        class ErrorBoundary extends React.Component {
          constructor(props) {
            super(props);
            this.state = { error: null };
          }
          static getDerivedStateFromError(error) {
            return { error: error };
          }
          render() {
            if (this.state.error) {
              return React.createElement(
                "div",
                { style: { padding: "16px", color: "#f43f5e", background: "#0b0e15", minHeight: "100vh", fontFamily: "monospace" } },
                React.createElement("strong", null, "Component Render Error:"),
                React.createElement("pre", { style: { whiteSpace: "pre-wrap", marginTop: "8px" } }, String(this.state.error))
              );
            }
            return this.props.children;
          }
        }

        function PreviewAppHost() {
          var state = React.useState("/");
          var routePath = state[0];
          var setRoutePath = state[1];

          React.useEffect(function() {
            window.__luminaNavigate = function(to) {
              if (typeof to !== "string") return;
              if (to.indexOf("http://") === 0 || to.indexOf("https://") === 0) return;
              var clean = to.split("?")[0] || "/";
              if (clean.charAt(0) !== "/") clean = "/" + clean;
              setRoutePath(clean);
            };
          }, []);

          var ctxValue = React.useMemo(function() {
            return {
              path: routePath,
              navigate: function(to) {
                if (typeof window.__luminaNavigate === "function") window.__luminaNavigate(to);
              }
            };
          }, [routePath]);

          var ActiveComponent = DefaultRootComponent;
          if (routePath !== "/") {
            var matchedFile = resolveNextPageFile(routePath);
            if (matchedFile) {
              try {
                var pageComp = extractComponent(loadModule(matchedFile));
                if (pageComp) ActiveComponent = pageComp;
              } catch (_) {}
            }
          }

          return React.createElement(
            RouterContext.Provider,
            { value: ctxValue },
            React.createElement(ActiveComponent)
          );
        }

        var rootEl = document.getElementById("root");
        if (DefaultRootComponent) {
          ReactDOM.createRoot(rootEl).render(
            React.createElement(ErrorBoundary, null, React.createElement(PreviewAppHost))
          );
        } else {
          rootEl.innerHTML = '<div style="padding:16px;color:#94a3b8;background:#0b0e15;min-height:100vh;font-family:monospace;">No default exported React/Next.js component found in ' + bundle.entry + '.</div>';
        }
      } catch (err) {
        showPreviewError("Preview Compilation Error", err);
      }
    })();
  </script>
</body>
</html>`
    }

    if (!htmlFile && jsFiles.length > 0) {
      const combinedJs = jsFiles.map((f) => f.content).join("\n").replace(/<\/script>/gi, "<\\/script>")
      const isNodeBackend = /require\s*\(|from\s+['"](?:express|mongoose|fastify|koa|http|fs|path)['"]/.test(combinedJs)

      if (isNodeBackend) {
        return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; background: #0b0e15; color: #cbd5e1; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; padding: 24px; box-sizing: border-box; text-align: center; }
    .box { max-width: 340px; border: 1px solid #1e293b; background: #0f1420; padding: 20px; border-radius: 12px; }
    h3 { margin: 0 0 8px; color: #2dd4bf; font-size: 15px; }
    p { margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5; }
    code { color: #e2e8f0; background: #1e293b; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="box">
    <h3>Backend / Node.js Project</h3>
    <p>Server-side Node.js code cannot run inside a browser preview. Switch to the <strong>Code</strong> tab to inspect or download the files and run <code>npm install && npm start</code> locally.</p>
  </div>
</body>
</html>`
      }

      return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; background: #0b0e15; color: #a1a1aa; font-family: monospace; padding: 16px; overflow-y: auto; }
    .log { color: #34d399; margin-bottom: 8px; white-space: pre-wrap; word-break: break-all; }
    .err { color: #f43f5e; margin-bottom: 8px; white-space: pre-wrap; word-break: break-all; }
    .info { color: #60a5fa; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #1e293b; font-weight: bold; }
  </style>
</head>
<body>
  <div class="info">Live Console Output:</div>
  <div id="out"></div>
  <script>
    const out = document.getElementById('out');
    function formatArgs(args) {
      return args.map(a => {
        if (a === null) return "null";
        if (a === undefined) return "undefined";
        if (typeof a === "object") {
          try { return JSON.stringify(a, null, 2); } catch(e) { return a.toString(); }
        }
        return a.toString();
      }).join(' ');
    }
    console.log = (...args) => { out.innerHTML += '<div class="log">' + formatArgs(args) + '</div>'; };
    console.error = (...args) => { out.innerHTML += '<div class="err">' + formatArgs(args) + '</div>'; };
    try {
      ${combinedJs}
    } catch(e) {
      console.error(e.toString());
    }
  </script>
</body>
</html>`
    }

    let html = htmlFile?.content || ""
    const styleBlock = cssFiles.map((f) => `<style>\n${f.content}\n</style>`).join("\n")
    const navGuardScript = `<script>
      document.addEventListener("submit", function(e) {
        e.preventDefault();
      });
      document.addEventListener("click", function(e) {
        var anchor = e.target && e.target.closest ? e.target.closest("a") : null;
        if (!anchor) return;
        var href = anchor.getAttribute("href");
        if (!href) return;
        e.preventDefault();
        if (href.charAt(0) === "#") {
          var id = href.slice(1);
          var el = id ? document.getElementById(id) : null;
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }
      });
    </script>`
    const scriptBlock = jsFiles.map((f) => `<script>\n${f.content}\n</script>`).join("\n")

    if (!html.trim()) {
      return `<!DOCTYPE html><html><body style="margin:0;background:#0b0e15;color:#94a3b8;font-family:monospace;padding:16px;">Preview is not available for this file type. Switch to the Code tab to view or download.</body></html>`
    }

    html = html.includes("</head>")
      ? html.replace("</head>", `${styleBlock}\n${navGuardScript}\n</head>`)
      : `${styleBlock}\n${navGuardScript}\n${html}`

    html = html.includes("</body>")
      ? html.replace("</body>", `${scriptBlock}\n</body>`)
      : `${html}\n${scriptBlock}`

    return html
  }, [files])

  const isDarkPreview =
    previewHtml.includes("Live Console Output:") ||
    previewHtml.includes("Backend / Node.js Project") ||
    previewHtml.includes("Preview is not available")

  const handleCopy = async () => {
    if (!currentCode) return
    try {
      await navigator.clipboard.writeText(currentCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {}
  }

  const handleDownload = () => {
    if (!currentCode) return
    const fileName =
      currentFile?.name ||
      `${(artifact?.title || "lumina-artifact").toLowerCase().replace(/\s+/g, "-")}.txt`

    const blob = new Blob([currentCode], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div
        onClick={handleClose}
        className={`lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        aria-hidden={!visible}
        className={`fixed inset-y-0 right-0 z-40 lg:static lg:z-auto shrink-0 h-full bg-[#07090e] text-zinc-100 select-none overflow-hidden transform-gpu will-change-[width,transform,opacity] transition-[width,transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible
            ? "w-full lg:w-[420px] xl:w-[480px] opacity-100 translate-x-0 border-l border-white/[0.06] pointer-events-auto"
            : "w-full lg:w-0 opacity-0 translate-x-full lg:translate-x-0 border-l-0 pointer-events-none"
        }`}
      >
        <div
          className={`w-full lg:w-[420px] xl:w-[480px] h-full flex flex-col shrink-0 transform-gpu transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            visible ? "translate-x-0 opacity-100" : "lg:translate-x-6 lg:opacity-0"
          }`}
        >
          <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-white/[0.06] bg-[#07090e]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/25 shrink-0">
                <FileCode2 size={14} className="text-teal-300" />
              </div>
              <span className="text-[13.5px] font-semibold text-zinc-100 truncate">
                {artifact?.title || "Artifact"}
              </span>
              {currentFile?.name && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full shrink-0">
                  {currentLang}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {artifact && files.length > 0 && (
                <>
                  <div className="flex items-center p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.07] mr-1">
                    <button
                      onClick={() => setViewMode("preview")}
                      title="Preview"
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border-none ${
                        viewMode === "preview"
                          ? "bg-teal-500/20 text-teal-300"
                          : "bg-transparent text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Eye size={12} />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => setViewMode("code")}
                      title="Code"
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border-none ${
                        viewMode === "code"
                          ? "bg-teal-500/20 text-teal-300"
                          : "bg-transparent text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Code2 size={12} />
                      <span>Code</span>
                    </button>
                  </div>

                  <button
                    onClick={handleCopy}
                    title="Copy content"
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-transparent border-none text-zinc-400 hover:text-teal-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-teal-400" /> : <Copy size={14} />}
                  </button>

                  <button
                    onClick={handleDownload}
                    title="Download file"
                    className="flex items-center justify-center w-7 h-7 rounded-lg bg-transparent border-none text-zinc-400 hover:text-teal-300 hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <Download size={14} />
                  </button>
                </>
              )}

              {onClose && (
                <button
                  onClick={handleClose}
                  title="Close panel"
                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-transparent border-none text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {artifact && files.length > 0 && viewMode === "code" && (
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/[0.06] bg-[#090c12] shrink-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {files.map((file, idx) => {
                const isActive = idx === activeFileIndex
                return (
                  <button
                    key={`${file.name}-${idx}`}
                    type="button"
                    onClick={() => setActiveFileIndex(idx)}
                    className={`px-2.5 py-1 rounded-md text-[11.5px] font-mono cursor-pointer border transition-colors whitespace-nowrap ${
                      isActive
                        ? "bg-teal-500/15 border-teal-500/30 text-teal-300"
                        : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
                    }`}
                  >
                    {file.name || `file-${idx + 1}`}
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex-1 p-4 flex flex-col relative overflow-hidden">
            {artifact && files.length > 0 ? (
              viewMode === "code" ? (
                <div className="flex-1 rounded-xl bg-[#0b0e15] border border-white/[0.06] overflow-auto select-text [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <SyntaxHighlighter
                    language={currentLang}
                    style={oneDark}
                    showLineNumbers
                    wrapLongLines
                    customStyle={{
                      margin: 0,
                      padding: "16px",
                      background: "transparent",
                      fontSize: "12.5px",
                      lineHeight: "1.55",
                    }}
                    codeTagProps={{
                      style: { background: "transparent" },
                    }}
                  >
                    {currentCode}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <div className="flex-1 rounded-xl bg-[#0b0e15] border border-white/[0.06] overflow-hidden flex flex-col relative">
                  <iframe
                    title={artifact.title || "Artifact Preview"}
                    srcDoc={previewHtml}
                    sandbox="allow-scripts allow-same-origin"
                    className={`flex-1 w-full h-full min-h-0 border-none ${isDarkPreview ? "bg-[#0b0e15]" : "bg-white"}`}
                  />
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-6 relative">
                <div className="pointer-events-none absolute w-48 h-48 bg-teal-500/[0.05] rounded-full blur-3xl" />
                <div className="w-11 h-11 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-3.5 shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)]">
                  <Sparkles size={18} className="text-teal-300" />
                </div>
                <h3 className="text-[14px] font-semibold text-zinc-200 tracking-tight">
                  No Active Artifact
                </h3>
                <p className="text-[12px] text-zinc-500 mt-1.5 leading-relaxed max-w-[240px]">
                  Generated code snippets, documents, and live previews from Lumina will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

export default Artifact