const STORAGE_KEY = "routecraft.profiles.v1";
const THEME_KEY = "routecraft.theme.v1";

const protocolLabels = {
  vless: "VLESS",
  vmess: "VMess",
  trojan: "Trojan",
  shadowsocks: "Shadowsocks",
  hysteria2: "Hysteria 2",
  tuic: "TUIC",
};

const templates = [
  { protocol: "vless", security: "reality", transport: "grpc", name: "VLESS Reality + gRPC", icon: "shield-check", copy: "UUID, ключ Reality и сервис gRPC." },
  { protocol: "vless", security: "tls", transport: "ws", name: "VLESS TLS + WebSocket", icon: "radio-tower", copy: "WebSocket через TLS с Host и Path." },
  { protocol: "trojan", security: "tls", transport: "tcp", name: "Trojan TLS", icon: "lock-keyhole", copy: "Пароль и домен TLS-сертификата." },
  { protocol: "shadowsocks", security: "none", transport: "tcp", name: "Shadowsocks AEAD", icon: "zap", copy: "Шифр AEAD и пароль сервера." },
  { protocol: "hysteria2", security: "tls", transport: "tcp", name: "Hysteria 2", icon: "gauge", copy: "QUIC, пароль и TLS SNI." },
  { protocol: "tuic", security: "tls", transport: "tcp", name: "TUIC v5", icon: "route", copy: "UUID, пароль и QUIC-настройки." },
];

const protocolCapabilities = {
  vless: { transports: ["tcp", "ws", "grpc", "httpupgrade", "http"], securities: ["none", "tls", "reality"] },
  vmess: { transports: ["tcp", "ws", "grpc", "httpupgrade", "http"], securities: ["none", "tls"] },
  trojan: { transports: ["tcp", "ws", "grpc", "httpupgrade", "http"], securities: ["tls"] },
  shadowsocks: { transports: ["tcp"], securities: ["none"] },
  hysteria2: { transports: ["tcp"], securities: ["tls"] },
  tuic: { transports: ["tcp"], securities: ["tls"] },
};

function baseProfile(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: "Новый профиль",
    protocol: "vless",
    server: "",
    port: "443",
    uuid: "",
    password: "",
    method: "chacha20-ietf-poly1305",
    encryption: "auto",
    alterId: "0",
    flow: "",
    network: "tcp",
    transport: "tcp",
    path: "",
    host: "",
    serviceName: "",
    security: "none",
    sni: "",
    alpn: "h2,http/1.1",
    fingerprint: "chrome",
    publicKey: "",
    shortId: "",
    obfs: "",
    obfsPassword: "",
    upMbps: "",
    downMbps: "",
    congestionControl: "cubic",
    tag: "",
    note: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

const state = {
  profiles: loadProfiles(),
  selectedId: null,
  activeView: "profiles",
  filter: "all",
  search: "",
  preview: "uri",
  lastCheck: localStorage.getItem("routecraft.lastCheck") || "-",
};

const els = {
  profileGrid: document.getElementById("profile-grid"),
  emptyState: document.getElementById("empty-state"),
  profileCount: document.getElementById("profile-count"),
  secureCount: document.getElementById("secure-count"),
  lastCheck: document.getElementById("last-check"),
  search: document.getElementById("profile-search"),
  profileForm: document.getElementById("profile-form"),
  protocolSelect: document.getElementById("protocol-select"),
  credentialsFields: document.getElementById("credentials-fields"),
  credentialsHint: document.getElementById("credentials-hint"),
  transportSelect: document.getElementById("transport-select"),
  transportOptions: document.getElementById("transport-options"),
  securitySelect: document.getElementById("security-select"),
  securityOptions: document.getElementById("security-options"),
  editorTitle: document.getElementById("editor-profile-title"),
  composerList: document.getElementById("composer-profile-list"),
  codePreview: document.getElementById("code-preview"),
  validity: document.getElementById("validity"),
  validationBox: document.getElementById("validation-box"),
  templateGrid: document.getElementById("template-grid"),
  importModal: document.getElementById("import-modal"),
  importInput: document.getElementById("import-input"),
  importError: document.getElementById("import-error"),
  toast: document.getElementById("toast"),
};

function loadProfiles() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored.map((profile) => baseProfile(profile)) : [];
  } catch {
    return [];
  }
}

function saveProfiles() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.profiles));
}

function getSelected() {
  return state.profiles.find((profile) => profile.id === state.selectedId) || null;
}

function initials(protocol) {
  if (protocol === "hysteria2") return "H2";
  if (protocol === "shadowsocks") return "SS";
  return protocol.slice(0, 2).toUpperCase();
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  }[character]));
}

function renderIcons() {
  if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
}

function renderLibrary() {
  const query = state.search.trim().toLowerCase();
  const visible = state.profiles.filter((profile) => {
    const matchesSearch = !query || [profile.name, profile.server, profile.protocol].some((value) => String(value).toLowerCase().includes(query));
    const matchesFilter = state.filter === "all" || (state.filter === "vless" ? profile.protocol === "vless" : profile.protocol !== "vless");
    return matchesSearch && matchesFilter;
  });

  els.profileGrid.innerHTML = visible.map((profile) => `
    <article class="profile-card">
      <div class="profile-card-top">
        <span class="protocol-badge ${profile.protocol}">${initials(profile.protocol)}</span>
        <div>
          <h3 title="${escapeHtml(profile.name)}">${escapeHtml(profile.name)}</h3>
          <p class="host">${escapeHtml(profile.server || "сервер не указан")}${profile.port ? `:${escapeHtml(profile.port)}` : ""}</p>
        </div>
        <button class="card-menu" data-delete="${profile.id}" type="button" title="Удалить профиль" aria-label="Удалить профиль"><i data-lucide="trash-2"></i></button>
      </div>
      <div class="profile-tags">
        <span class="tag">${escapeHtml(profile.transport.toUpperCase())}</span>
        ${profile.security !== "none" ? `<span class="tag secure">${escapeHtml(profile.security === "reality" ? "Reality" : "TLS")}</span>` : ""}
        ${profile.network !== "both" ? `<span class="tag">${escapeHtml(profile.network.toUpperCase())}</span>` : ""}
      </div>
      <div class="card-actions">
        <button data-open="${profile.id}" type="button">Настроить</button>
        <button data-copy="${profile.id}" type="button">Скопировать</button>
      </div>
    </article>
  `).join("");
  els.emptyState.hidden = state.profiles.length > 0;
  els.profileGrid.hidden = state.profiles.length === 0;
  els.profileCount.textContent = state.profiles.length;
  els.secureCount.textContent = state.profiles.filter((profile) => profile.security !== "none").length;
  els.lastCheck.textContent = state.lastCheck;
  renderIcons();
}

function renderComposerList() {
  els.composerList.innerHTML = state.profiles.map((profile) => `
    <button class="composer-profile ${profile.id === state.selectedId ? "active" : ""}" data-select="${profile.id}" type="button">
      <div><span class="mini-dot"></span><b>${escapeHtml(profile.name)}</b></div>
      <span>${escapeHtml(protocolLabels[profile.protocol])}${profile.server ? ` · ${escapeHtml(profile.server)}` : ""}</span>
    </button>
  `).join("");
  if (!state.profiles.length) {
    els.composerList.innerHTML = `<p class="empty-list">Создайте или импортируйте профиль.</p>`;
  }
}

function inputMarkup(name, label, profile, options = {}) {
  const { type = "text", placeholder = "", required = false, list = "" } = options;
  return `<label>${label}<input name="${name}" type="${type}" value="${escapeHtml(profile[name] || "")}" ${placeholder ? `placeholder="${escapeHtml(placeholder)}"` : ""} ${required ? "required" : ""} ${list ? `list="${list}"` : ""} /></label>`;
}

function selectMarkup(name, label, value, options) {
  return `<label>${label}<select name="${name}">${options.map(([optionValue, optionLabel]) => `<option value="${optionValue}" ${value === optionValue ? "selected" : ""}>${optionLabel}</option>`).join("")}</select></label>`;
}

function renderCredentialFields(profile) {
  const fields = [];
  let hint = "Идентификатор пользователя для сервера.";
  if (profile.protocol === "vless") {
    hint = "UUID должен совпадать с пользователем, созданным на сервере.";
    fields.push(inputMarkup("uuid", "UUID", profile, { required: true, placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }));
    fields.push(selectMarkup("flow", "Flow", profile.flow, [["", "Не задан"], ["xtls-rprx-vision", "xtls-rprx-vision"]]));
  }
  if (profile.protocol === "vmess") {
    hint = "VMess использует UUID и метод шифрования из профиля сервера.";
    fields.push(inputMarkup("uuid", "UUID", profile, { required: true, placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }));
    fields.push(selectMarkup("encryption", "Шифрование", profile.encryption, [["auto", "auto"], ["aes-128-gcm", "aes-128-gcm"], ["chacha20-poly1305", "chacha20-poly1305"], ["none", "none"]]));
    fields.push(inputMarkup("alterId", "Alter ID", profile, { type: "number", placeholder: "0" }));
  }
  if (profile.protocol === "trojan") {
    hint = "Пароль Trojan задаётся на сервере и передаётся без изменений.";
    fields.push(inputMarkup("password", "Пароль", profile, { type: "password", required: true, placeholder: "Пароль пользователя" }));
  }
  if (profile.protocol === "shadowsocks") {
    hint = "Шифр и пароль должны совпадать с настройками Shadowsocks-сервера.";
    fields.push(selectMarkup("method", "Метод шифрования", profile.method, [
      ["aes-128-gcm", "aes-128-gcm"], ["aes-256-gcm", "aes-256-gcm"], ["chacha20-ietf-poly1305", "chacha20-ietf-poly1305"], ["2022-blake3-aes-128-gcm", "2022-blake3-aes-128-gcm"], ["2022-blake3-aes-256-gcm", "2022-blake3-aes-256-gcm"],
    ]));
    fields.push(inputMarkup("password", "Пароль", profile, { type: "password", required: true, placeholder: "Пароль сервера" }));
  }
  if (profile.protocol === "hysteria2") {
    hint = "Для Hysteria 2 нужны пароль, TLS и, при необходимости, обфускация.";
    fields.push(inputMarkup("password", "Пароль", profile, { type: "password", required: true, placeholder: "Пароль или user:password" }));
    fields.push(inputMarkup("obfs", "Obfs тип", profile, { placeholder: "salamander или gecko" }));
    fields.push(inputMarkup("obfsPassword", "Obfs пароль", profile, { type: "password", placeholder: "Необязательно" }));
    fields.push(inputMarkup("upMbps", "Скорость вверх, Mbps", profile, { type: "number", placeholder: "Необязательно" }));
    fields.push(inputMarkup("downMbps", "Скорость вниз, Mbps", profile, { type: "number", placeholder: "Необязательно" }));
  }
  if (profile.protocol === "tuic") {
    hint = "TUIC использует UUID, пароль и обязательный TLS.";
    fields.push(inputMarkup("uuid", "UUID", profile, { required: true, placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }));
    fields.push(inputMarkup("password", "Пароль", profile, { type: "password", required: true, placeholder: "Пароль пользователя" }));
    fields.push(selectMarkup("congestionControl", "Контроль перегрузки", profile.congestionControl, [["cubic", "cubic"], ["bbr", "bbr"], ["new_reno", "new_reno"]]));
  }
  els.credentialsHint.textContent = hint;
  els.credentialsFields.innerHTML = fields.join("");
}

function renderTransportOptions(profile) {
  const fields = [];
  if (profile.transport === "ws") {
    fields.push(inputMarkup("path", "Путь", profile, { placeholder: "/ws" }));
    fields.push(inputMarkup("host", "HTTP Host", profile, { placeholder: "cdn.example.com" }));
  }
  if (profile.transport === "grpc") {
    fields.push(inputMarkup("serviceName", "Имя gRPC-сервиса", profile, { placeholder: "grpc-service" }));
  }
  if (profile.transport === "httpupgrade") {
    fields.push(inputMarkup("path", "Путь", profile, { placeholder: "/upgrade" }));
    fields.push(inputMarkup("host", "HTTP Host", profile, { placeholder: "cdn.example.com" }));
  }
  if (profile.transport === "http") {
    fields.push(inputMarkup("path", "Путь", profile, { placeholder: "/" }));
    fields.push(inputMarkup("host", "HTTP Host", profile, { placeholder: "cdn.example.com" }));
  }
  els.transportOptions.innerHTML = fields.join("");
  els.transportOptions.hidden = fields.length === 0;
}

function renderSecurityOptions(profile) {
  const fields = [];
  if (profile.security === "tls" || profile.security === "reality") {
    fields.push(inputMarkup("alpn", "ALPN (через запятую)", profile, { placeholder: "h2,http/1.1" }));
    fields.push(selectMarkup("fingerprint", "uTLS fingerprint", profile.fingerprint, [["chrome", "chrome"], ["firefox", "firefox"], ["safari", "safari"], ["edge", "edge"], ["random", "random"]]));
  }
  if (profile.security === "reality") {
    fields.push(inputMarkup("publicKey", "Публичный ключ Reality", profile, { required: true, placeholder: "Ключ сервера (pbk)" }));
    fields.push(inputMarkup("shortId", "Short ID", profile, { placeholder: "hex, например 6ba85179e30d4fc2" }));
  }
  els.securityOptions.innerHTML = fields.join("");
  els.securityOptions.hidden = fields.length === 0;
}

function configureProtocolControls(profile) {
  const capabilities = protocolCapabilities[profile.protocol];
  const transportSection = document.getElementById("transport-section");
  const securitySection = document.getElementById("security-section");
  const supportsTransport = capabilities.transports.length > 1;
  const supportsSecurityChoice = capabilities.securities.length > 1;

  if (!capabilities.transports.includes(profile.transport)) profile.transport = capabilities.transports[0];
  if (!capabilities.securities.includes(profile.security)) profile.security = capabilities.securities[0];

  els.transportSelect.innerHTML = capabilities.transports.map((transport) => {
    const label = { tcp: "TCP", ws: "WebSocket", grpc: "gRPC", httpupgrade: "HTTPUpgrade", http: "HTTP/2" }[transport];
    return `<option value="${transport}" ${profile.transport === transport ? "selected" : ""}>${label}</option>`;
  }).join("");
  els.securitySelect.innerHTML = capabilities.securities.map((security) => {
    const label = { none: "Без TLS", tls: "TLS", reality: "Reality" }[security];
    return `<option value="${security}" ${profile.security === security ? "selected" : ""}>${label}</option>`;
  }).join("");
  transportSection.hidden = !supportsTransport;
  securitySection.hidden = !supportsSecurityChoice && profile.protocol === "shadowsocks";
}

function setFormValue(name, value) {
  const input = els.profileForm.elements.namedItem(name);
  if (input) input.value = value ?? "";
}

function renderEditor() {
  const profile = getSelected();
  if (!profile) {
    els.profileForm.reset();
    els.editorTitle.textContent = "Выберите профиль";
    els.credentialsFields.innerHTML = "";
    els.transportOptions.innerHTML = "";
    els.securityOptions.innerHTML = "";
    els.codePreview.textContent = "Создайте или выберите профиль для предпросмотра.";
    return;
  }
  els.editorTitle.textContent = profile.name || "Новый профиль";
  configureProtocolControls(profile);
  ["name", "protocol", "server", "port", "network", "transport", "security", "sni", "tag", "note"].forEach((name) => setFormValue(name, profile[name]));
  renderCredentialFields(profile);
  renderTransportOptions(profile);
  renderSecurityOptions(profile);
  renderPreview();
}

function formProfile() {
  const current = getSelected() || baseProfile();
  const data = new FormData(els.profileForm);
  const next = { ...current };
  data.forEach((value, key) => { next[key] = String(value).trim(); });
  next.updatedAt = Date.now();
  return next;
}

function requiredFields(profile) {
  const missing = [];
  if (!profile.name) missing.push("название");
  if (!profile.server) missing.push("адрес сервера");
  const port = Number(profile.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) missing.push("порт 1-65535");
  if (["vless", "vmess", "tuic"].includes(profile.protocol) && !profile.uuid) missing.push("UUID");
  if (["trojan", "shadowsocks", "hysteria2", "tuic"].includes(profile.protocol) && !profile.password) missing.push("пароль");
  if (profile.protocol === "hysteria2" && profile.security === "none") missing.push("TLS для Hysteria 2");
  if (profile.protocol === "tuic" && profile.security === "none") missing.push("TLS для TUIC");
  if (profile.security === "reality" && !profile.publicKey) missing.push("публичный ключ Reality");
  return missing;
}

function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64(value) {
  const safe = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - safe.length % 4) % 4);
  const binary = atob(safe + padding);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function setParam(params, key, value) {
  if (value !== undefined && value !== null && String(value) !== "") params.set(key, value);
}

function profileUri(profile) {
  const name = encodeURIComponent(profile.name || protocolLabels[profile.protocol]);
  const port = profile.port || "443";
  const params = new URLSearchParams();
  const shared = () => {
    setParam(params, "type", profile.transport === "http" ? "http" : profile.transport);
    setParam(params, "security", profile.security);
    setParam(params, "sni", profile.sni);
    if (profile.security !== "none") {
      setParam(params, "alpn", profile.alpn);
      setParam(params, "fp", profile.fingerprint);
    }
    if (profile.transport === "ws" || profile.transport === "httpupgrade" || profile.transport === "http") {
      setParam(params, "path", profile.path);
      setParam(params, "host", profile.host);
    }
    if (profile.transport === "grpc") setParam(params, "serviceName", profile.serviceName);
    if (profile.security === "reality") {
      setParam(params, "pbk", profile.publicKey);
      setParam(params, "sid", profile.shortId);
    }
  };
  if (profile.protocol === "vless") {
    setParam(params, "encryption", "none");
    setParam(params, "flow", profile.flow);
    shared();
    return `vless://${encodeURIComponent(profile.uuid)}@${profile.server}:${port}?${params.toString()}#${name}`;
  }
  if (profile.protocol === "trojan") {
    shared();
    return `trojan://${encodeURIComponent(profile.password)}@${profile.server}:${port}?${params.toString()}#${name}`;
  }
  if (profile.protocol === "shadowsocks") {
    const auth = encodeBase64(`${profile.method}:${profile.password}`);
    return `ss://${auth}@${profile.server}:${port}#${name}`;
  }
  if (profile.protocol === "hysteria2") {
    setParam(params, "sni", profile.sni);
    setParam(params, "insecure", "0");
    setParam(params, "obfs", profile.obfs);
    setParam(params, "obfs-password", profile.obfsPassword);
    return `hysteria2://${encodeURIComponent(profile.password)}@${profile.server}:${port}?${params.toString()}#${name}`;
  }
  if (profile.protocol === "tuic") {
    setParam(params, "sni", profile.sni);
    setParam(params, "alpn", profile.alpn);
    setParam(params, "congestion_control", profile.congestionControl);
    return `tuic://${encodeURIComponent(profile.uuid)}:${encodeURIComponent(profile.password)}@${profile.server}:${port}?${params.toString()}#${name}`;
  }
  if (profile.protocol === "vmess") {
    const vmess = {
      v: "2", ps: profile.name, add: profile.server, port: String(port), id: profile.uuid, aid: String(profile.alterId || 0),
      scy: profile.encryption || "auto", net: profile.transport, type: "none", host: profile.host || "", path: profile.transport === "grpc" ? profile.serviceName : profile.path || "",
      tls: profile.security === "reality" ? "reality" : profile.security === "tls" ? "tls" : "", sni: profile.sni || "", alpn: profile.alpn || "", fp: profile.fingerprint || "", pbk: profile.publicKey || "", sid: profile.shortId || "",
    };
    return `vmess://${encodeBase64(JSON.stringify(vmess))}`;
  }
  return "";
}

function tlsConfig(profile) {
  if (profile.security === "none") return undefined;
  const tls = { enabled: true };
  if (profile.sni) tls.server_name = profile.sni;
  const alpn = String(profile.alpn || "").split(",").map((part) => part.trim()).filter(Boolean);
  if (alpn.length) tls.alpn = alpn;
  if (profile.fingerprint) tls.utls = { enabled: true, fingerprint: profile.fingerprint };
  if (profile.security === "reality") {
    tls.reality = { enabled: true, public_key: profile.publicKey || "", short_id: profile.shortId || "" };
  }
  return tls;
}

function transportConfig(profile) {
  if (profile.transport === "tcp") return undefined;
  if (profile.transport === "ws") {
    const transport = { type: "ws", path: profile.path || "/" };
    if (profile.host) transport.headers = { Host: profile.host };
    return transport;
  }
  if (profile.transport === "grpc") return { type: "grpc", service_name: profile.serviceName || "" };
  if (profile.transport === "httpupgrade") {
    const transport = { type: "httpupgrade", path: profile.path || "/" };
    if (profile.host) transport.host = [profile.host];
    return transport;
  }
  if (profile.transport === "http") {
    const transport = { type: "http", path: profile.path || "/" };
    if (profile.host) transport.host = [profile.host];
    return transport;
  }
  return undefined;
}

function singboxOutbound(profile) {
  const outbound = {
    type: profile.protocol,
    tag: profile.tag || `proxy-${profile.id.slice(0, 8)}`,
    server: profile.server,
    server_port: Number(profile.port),
  };
  if (profile.protocol === "vless") {
    outbound.uuid = profile.uuid;
    if (profile.flow) outbound.flow = profile.flow;
  }
  if (profile.protocol === "vmess") {
    outbound.uuid = profile.uuid;
    outbound.security = profile.encryption || "auto";
    outbound.alter_id = Number(profile.alterId || 0);
  }
  if (profile.protocol === "trojan") outbound.password = profile.password;
  if (profile.protocol === "shadowsocks") {
    outbound.method = profile.method;
    outbound.password = profile.password;
  }
  if (profile.protocol === "hysteria2") {
    outbound.password = profile.password;
    if (profile.obfs && profile.obfsPassword) outbound.obfs = { type: profile.obfs, password: profile.obfsPassword };
    if (profile.upMbps) outbound.up_mbps = Number(profile.upMbps);
    if (profile.downMbps) outbound.down_mbps = Number(profile.downMbps);
  }
  if (profile.protocol === "tuic") {
    outbound.uuid = profile.uuid;
    outbound.password = profile.password;
    outbound.congestion_control = profile.congestionControl || "cubic";
  }
  if (profile.network !== "both") outbound.network = profile.network;
  const tls = tlsConfig(profile);
  if (tls) outbound.tls = tls;
  const transport = transportConfig(profile);
  if (transport && ["vless", "vmess", "trojan"].includes(profile.protocol)) outbound.transport = transport;
  return outbound;
}

function singboxConfig(profile) {
  const outbound = singboxOutbound(profile);
  return {
    log: { level: "info", timestamp: true },
    inbounds: [{ type: "mixed", tag: "mixed-in", listen: "127.0.0.1", listen_port: 2080 }],
    outbounds: [outbound, { type: "direct", tag: "direct" }, { type: "block", tag: "block" }],
    route: { final: outbound.tag },
  };
}

function renderPreview() {
  const draft = formProfile();
  const missing = requiredFields(draft);
  const valid = missing.length === 0;
  els.validity.classList.toggle("valid", valid);
  els.validity.innerHTML = valid ? `<i data-lucide="circle-check"></i>Формат готов` : `<i data-lucide="circle-alert"></i>Нужны данные`;
  els.validationBox.classList.toggle("valid", valid);
  els.validationBox.innerHTML = valid
    ? `<i data-lucide="badge-check"></i><p>Поля профиля заполнены в допустимом формате. Перед подключением сверяйте их с настройками сервера.</p>`
    : `<i data-lucide="info"></i><p>Добавьте: ${missing.join(", ")}. Проверка подтверждает формат данных, но не доступность сервера.</p>`;
  if (state.preview === "uri") {
    els.codePreview.textContent = profileUri(draft);
  } else {
    els.codePreview.textContent = JSON.stringify(singboxConfig(draft), null, 2);
  }
  renderIcons();
}

function syncFormToState() {
  const selected = getSelected();
  if (!selected) return;
  const draft = formProfile();
  Object.assign(selected, draft);
  els.editorTitle.textContent = draft.name || "Новый профиль";
  renderPreview();
}

function selectProfile(id, view = "composer") {
  state.selectedId = id;
  if (view) showView(view);
  renderComposerList();
  renderEditor();
}

function showView(view) {
  state.activeView = view;
  document.querySelectorAll(".view").forEach((element) => element.classList.toggle("active", element.id === `${view}-view`));
  document.querySelectorAll(".nav-item").forEach((element) => element.classList.toggle("active", element.dataset.view === view));
  const content = {
    profiles: ["Библиотека", "Профили подключения"],
    composer: ["Редактор", "Конфигуратор профиля"],
    templates: ["Каталог", "Шаблоны подключения"],
  }[view];
  document.getElementById("page-kicker").textContent = content[0];
  document.getElementById("page-title").textContent = content[1];
  if (view === "composer") renderEditor();
}

function addProfile(profile = baseProfile(), open = true) {
  state.profiles.unshift(profile);
  state.selectedId = profile.id;
  saveProfiles();
  renderLibrary();
  renderComposerList();
  if (open) selectProfile(profile.id, "composer");
}

function deleteProfile(id) {
  const profile = state.profiles.find((item) => item.id === id);
  if (!profile) return;
  if (!confirm(`Удалить профиль «${profile.name}»?`)) return;
  state.profiles = state.profiles.filter((item) => item.id !== id);
  if (state.selectedId === id) state.selectedId = state.profiles[0]?.id || null;
  saveProfiles();
  renderLibrary();
  renderComposerList();
  renderEditor();
  showToast("Профиль удалён.");
}

function saveCurrent(event) {
  event.preventDefault();
  const current = getSelected();
  if (!current) return;
  const draft = formProfile();
  const missing = requiredFields(draft);
  if (missing.length) {
    showToast(`Заполните: ${missing.join(", ")}.`);
    renderPreview();
    return;
  }
  Object.assign(current, draft, { updatedAt: Date.now() });
  saveProfiles();
  renderLibrary();
  renderComposerList();
  renderEditor();
  state.lastCheck = "сейчас";
  localStorage.setItem("routecraft.lastCheck", state.lastCheck);
  els.lastCheck.textContent = state.lastCheck;
  showToast("Профиль сохранён локально.");
}

function duplicateCurrent() {
  const profile = getSelected();
  if (!profile) return;
  const draft = formProfile();
  addProfile(baseProfile({ ...draft, id: crypto.randomUUID(), name: `${draft.name || profile.name} — копия`, createdAt: Date.now(), updatedAt: Date.now() }));
  showToast("Создана копия профиля.");
}

function parseUrlProfile(raw) {
  const input = raw.trim();
  if (!input.includes("://")) throw new Error("Ссылка должна начинаться с протокола, например vless://.");
  const scheme = input.slice(0, input.indexOf("://")).toLowerCase();
  if (scheme === "vmess") {
    const payload = input.replace(/^vmess:\/\//i, "").split("#")[0];
    let data;
    try { data = JSON.parse(decodeBase64(payload)); } catch { throw new Error("Не удалось прочитать VMess Base64 JSON."); }
    return baseProfile({
      protocol: "vmess", name: data.ps || "VMess профиль", server: data.add || "", port: String(data.port || "443"), uuid: data.id || "", alterId: String(data.aid || "0"), encryption: data.scy || "auto",
      transport: normalizeTransport(data.net), path: data.net === "grpc" ? "" : data.path || "", serviceName: data.net === "grpc" ? data.path || data.serviceName || "" : "", host: data.host || "", security: normalizeSecurity(data.tls), sni: data.sni || "", alpn: data.alpn || "h2,http/1.1", fingerprint: data.fp || "chrome", publicKey: data.pbk || "", shortId: data.sid || "",
    });
  }
  if (!["vless", "trojan", "ss", "shadowsocks", "hysteria2", "hy2", "tuic"].includes(scheme)) throw new Error("Этот формат пока не поддерживается.");
  if (scheme === "ss" || scheme === "shadowsocks") return parseShadowsocks(input);
  let url;
  try { url = new URL(input); } catch { throw new Error("Ссылка имеет некорректный формат."); }
  const query = url.searchParams;
  const protocol = scheme === "hy2" ? "hysteria2" : scheme;
  const profile = baseProfile({
    protocol,
    name: decodeURIComponent(url.hash.slice(1)) || protocolLabels[protocol],
    server: url.hostname,
    port: url.port || defaultPort(protocol),
    transport: normalizeTransport(query.get("type") || "tcp"),
    security: normalizeSecurity(query.get("security") || (protocol === "hysteria2" || protocol === "tuic" ? "tls" : "none")),
    sni: query.get("sni") || query.get("peer") || "",
    alpn: query.get("alpn") || "h2,http/1.1",
    fingerprint: query.get("fp") || "chrome",
    path: query.get("path") || "",
    host: query.get("host") || "",
    serviceName: query.get("serviceName") || query.get("service_name") || "",
    publicKey: query.get("pbk") || "",
    shortId: query.get("sid") || "",
  });
  if (protocol === "vless") {
    profile.uuid = decodeURIComponent(url.username);
    profile.flow = query.get("flow") || "";
  }
  if (protocol === "trojan" || protocol === "hysteria2") profile.password = decodeURIComponent(url.username);
  if (protocol === "hysteria2") {
    profile.obfs = query.get("obfs") || "";
    profile.obfsPassword = query.get("obfs-password") || query.get("obfs_password") || "";
  }
  if (protocol === "tuic") {
    profile.uuid = decodeURIComponent(url.username);
    profile.password = decodeURIComponent(url.password);
    profile.congestionControl = query.get("congestion_control") || "cubic";
  }
  return profile;
}

function parseShadowsocks(input) {
  const raw = input.replace(/^(ss|shadowsocks):\/\//i, "");
  const [withoutHash, hash = ""] = raw.split("#");
  const [main, query = ""] = withoutHash.split("?");
  let auth = "";
  let host = "";
  let port = "";
  if (main.includes("@")) {
    const [left, right] = main.split(/@(.*)/s);
    auth = left.includes(":") ? decodeURIComponent(left) : decodeBase64(left);
    const address = new URL(`ss://${auth}@${right}`);
    host = address.hostname;
    port = address.port;
  } else {
    const decoded = decodeBase64(main);
    const lastAt = decoded.lastIndexOf("@");
    auth = decoded.slice(0, lastAt);
    const address = new URL(`ss://${auth}@${decoded.slice(lastAt + 1)}`);
    host = address.hostname;
    port = address.port;
  }
  const colon = auth.indexOf(":");
  if (colon < 1) throw new Error("В ссылке Shadowsocks отсутствует метод или пароль.");
  return baseProfile({ protocol: "shadowsocks", name: decodeURIComponent(hash) || "Shadowsocks профиль", server: host, port: port || "8388", method: auth.slice(0, colon), password: auth.slice(colon + 1), note: query ? "Импортировано с дополнительными параметрами" : "" });
}

function defaultPort(protocol) {
  return { shadowsocks: "8388", hysteria2: "443", tuic: "443" }[protocol] || "443";
}

function normalizeTransport(value) {
  const map = { ws: "ws", websocket: "ws", grpc: "grpc", httpupgrade: "httpupgrade", http: "http", h2: "http", tcp: "tcp", raw: "tcp" };
  return map[String(value || "").toLowerCase()] || "tcp";
}

function normalizeSecurity(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "reality") return "reality";
  if (["tls", "xtls"].includes(normalized)) return "tls";
  return "none";
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const helper = document.createElement("textarea");
    helper.value = value;
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
}

function downloadConfig() {
  const selected = getSelected();
  if (!selected) return;
  const data = state.preview === "singbox" ? JSON.stringify(singboxConfig(formProfile()), null, 2) : JSON.stringify(singboxConfig(formProfile()), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slugify(formProfile().name || "profile")}-sing-box.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("JSON-конфигурация скачана.");
}

function slugify(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-+|-+$/g, "") || "profile";
}

let toastTimer;
function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 3200);
}

function openImport() {
  els.importError.textContent = "";
  els.importInput.value = "";
  els.importModal.showModal();
  setTimeout(() => els.importInput.focus(), 40);
}

function importProfile() {
  try {
    const profile = parseUrlProfile(els.importInput.value);
    addProfile(profile);
    els.importModal.close();
    showToast(`${protocolLabels[profile.protocol]}-профиль импортирован.`);
  } catch (error) {
    els.importError.textContent = error instanceof Error ? error.message : "Не удалось импортировать ссылку.";
  }
}

function createTemplate(profileTemplate) {
  addProfile(baseProfile({
    protocol: profileTemplate.protocol,
    name: profileTemplate.name,
    security: profileTemplate.security,
    transport: profileTemplate.transport,
    port: "443",
  }));
}

function renderTemplates() {
  els.templateGrid.innerHTML = templates.map((template, index) => `
    <article class="template-card">
      <i data-lucide="${template.icon}"></i>
      <h3>${escapeHtml(template.name)}</h3>
      <p>${escapeHtml(template.copy)}</p>
      <button class="button secondary" data-template="${index}" type="button">Использовать шаблон</button>
    </article>
  `).join("");
  renderIcons();
}

function setTheme(theme) {
  if (theme === "dark") document.documentElement.dataset.theme = "dark";
  else delete document.documentElement.dataset.theme;
  localStorage.setItem(THEME_KEY, theme);
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
  document.getElementById("new-profile").addEventListener("click", () => addProfile());
  document.getElementById("empty-new-profile").addEventListener("click", () => addProfile());
  document.getElementById("composer-new-profile").addEventListener("click", () => addProfile());
  document.getElementById("import-profile").addEventListener("click", openImport);
  document.getElementById("import-submit").addEventListener("click", importProfile);
  document.getElementById("duplicate-profile").addEventListener("click", duplicateCurrent);
  document.getElementById("copy-output").addEventListener("click", async () => { await copyText(state.preview === "uri" ? profileUri(formProfile()) : JSON.stringify(singboxConfig(formProfile()), null, 2)); showToast("Содержимое скопировано."); });
  document.getElementById("download-output").addEventListener("click", downloadConfig);
  document.getElementById("clear-storage").addEventListener("click", () => {
    if (!confirm("Удалить все локально сохранённые профили?")) return;
    state.profiles = [];
    state.selectedId = null;
    saveProfiles();
    renderLibrary();
    renderComposerList();
    renderEditor();
    showView("profiles");
    showToast("Локальные профили очищены.");
  });
  document.getElementById("theme-toggle").addEventListener("click", () => setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  els.search.addEventListener("input", () => { state.search = els.search.value; renderLibrary(); });
  document.querySelectorAll(".segmented button").forEach((button) => button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    document.querySelectorAll(".segmented button").forEach((item) => item.classList.toggle("active", item === button));
    renderLibrary();
  }));
  els.profileGrid.addEventListener("click", async (event) => {
    const action = event.target.closest("button");
    if (!action) return;
    if (action.dataset.open) selectProfile(action.dataset.open);
    if (action.dataset.delete) deleteProfile(action.dataset.delete);
    if (action.dataset.copy) {
      const profile = state.profiles.find((item) => item.id === action.dataset.copy);
      if (profile) { await copyText(profileUri(profile)); showToast("Ссылка профиля скопирована."); }
    }
  });
  els.composerList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-select]");
    if (button) selectProfile(button.dataset.select, null);
  });
  els.profileForm.addEventListener("submit", saveCurrent);
  els.profileForm.addEventListener("input", () => syncFormToState());
  els.profileForm.addEventListener("change", (event) => {
    const draft = formProfile();
    const profile = getSelected();
    if (!profile) return;
    Object.assign(profile, draft);
    if (event.target.name === "protocol") {
      const capabilities = protocolCapabilities[profile.protocol];
      profile.transport = capabilities.transports[0];
      profile.security = capabilities.securities[0];
      configureProtocolControls(profile);
      renderCredentialFields(profile);
      renderTransportOptions(profile);
      renderSecurityOptions(profile);
    }
    if (event.target.name === "transport") renderTransportOptions(profile);
    if (event.target.name === "security") renderSecurityOptions(profile);
    renderPreview();
  });
  document.querySelectorAll(".preview-tabs button").forEach((button) => button.addEventListener("click", () => {
    state.preview = button.dataset.preview;
    document.querySelectorAll(".preview-tabs button").forEach((item) => item.classList.toggle("active", item === button));
    renderPreview();
  }));
  document.getElementById("advanced-toggle").addEventListener("click", (event) => {
    const expanded = event.currentTarget.getAttribute("aria-expanded") === "true";
    event.currentTarget.setAttribute("aria-expanded", String(!expanded));
    document.getElementById("advanced-content").hidden = expanded;
  });
  els.templateGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-template]");
    if (button) createTemplate(templates[Number(button.dataset.template)]);
  });
}

function initialize() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) setTheme(savedTheme);
  if (state.profiles.length) state.selectedId = state.profiles[0].id;
  renderLibrary();
  renderComposerList();
  renderTemplates();
  renderEditor();
  bindEvents();
  renderIcons();
}

initialize();
