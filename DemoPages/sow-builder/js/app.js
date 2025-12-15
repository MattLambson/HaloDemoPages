/* CM.com SoW Builder (client-side)
   - Multi-step cards with slide transitions
   - Local save/load
   - Summary + PDF export (jsPDF text-based, crisp output)
   - Autosave on every change / step navigation (no toast)
   - Toast only on Save + Done
*/

const STORAGE_KEY = "cm_sow_builder_v1";

// Optional sections: can be left blank and still allow export.
// They should NOT auto-mark as "complete" in the stepper.
const OPTIONAL_SECTION_IDS = new Set(["futurePhases"]);

// Keep aligned with validateStep meta requirements
const REQUIRED_META_KEYS = ["companyName", "projectName", "salesRepName"];

// If you added a Clear All button in HTML, keep its id consistent here
const CLEAR_ALL_BTN_ID = "clearAllBtn";

// This element should exist in your HTML (hidden is fine):
// <img id="brandLogoLight" src="img/CM.com-logo-light.svg" ...>
// or
// <svg id="brandLogoLight">...</svg>
const BRAND_LOGO_LIGHT_ID = "brandLogoLight";

const SECTIONS = [
  {
    id: "meta",
    title: "Project Details",
    tag: "Setup",
    help: "Capture key details used across the SoW header and planning section.",
    fields: [
      { key: "companyName", label: "Company name", type: "text", placeholder: "Example: Acme Corp." },
      { key: "projectName", label: "Project name", type: "text", placeholder: "Example: Omnichannel Support + HALO Enablement" },
      { key: "salesRepName", label: "Sales rep name", type: "text", placeholder: "Example: Matt Lambson" },
      { key: "onboardingManager", label: "Onboarding manager", type: "text", placeholder: "Example: Jane Doe" },
      { key: "onboardingContact", label: "Onboarding manager contact info", type: "text", placeholder: "Email + phone" },
      { key: "startDate", label: "Intended start date", type: "date", placeholder: "" },
      { key: "estimatedLeadTime", label: "Estimated lead time", type: "text", placeholder: "Example: 6 weeks (dependent on customer responsiveness)" }
    ],
    layout: "grid"
  },
  {
    id: "customerBackground",
    title: "Customer Background",
    tag: "1",
    help: "Contextualize the customer's business. Briefly describe who the customer is, what they do, and their current situation.",
    fields: [
      {
        key: "customerBackgroundText",
        label: "Write the customer background",
        type: "textarea",
        placeholder:
`Who are they?
What do they do?
What's happening now?

Example:
"Acme Retail is a national e-commerce brand currently in a rapid growth phase, looking to modernize customer communications and support operations."`
      }
    ]
  },
  {
    id: "currentChallenges",
    title: "Current Challenges",
    tag: "2",
    help: "Define the problem CM.com is solving. Describe the pain points clearly and concretely.",
    fields: [
      {
        key: "currentChallengesText",
        label: "List current challenges",
        type: "textarea",
        placeholder:
`Write in plain language. 2 to 6 bullets is usually enough.

Examples:
- Communication is fragmented across decentralized channels.
- Agents spend too much time on repetitive questions.
- Upcoming changes in legislation require a channel shift.`
      }
    ]
  },
  {
    id: "projectGoals",
    title: "Project Goals",
    tag: "3",
    help: "State the high-level objective. What is the main outcome CM.com and the customer want to achieve?",
    fields: [
      {
        key: "projectGoalsText",
        label: "Describe project goals",
        type: "textarea",
        placeholder:
`Examples:
- Centralize support into a single platform.
- Automate FAQs with HALO while keeping a clean handover path to agents.
- Increase conversion with faster response times and proactive messaging.`
      }
    ]
  },
  {
    id: "successCriteria",
    title: "Success Criteria",
    tag: "4",
    help: "Define how you'll measure completion. Use tangible outcomes that are testable and time-bound when possible.",
    fields: [
      {
        key: "successCriteriaText",
        label: "Success criteria (bullets recommended)",
        type: "textarea",
        placeholder:
`Technical:
- Channels X, Y, and Z are live.
- Number porting is complete.

Operational:
- Agents are trained and working in MSC.

Data:
- Management has access to the Analytics Portal.`
      }
    ]
  },
  {
    id: "useCaseSpecifics",
    title: "Use Case Specifics",
    tag: "5",
    help: "Describe the solution logic at a detailed level. Be explicit about flows, routing, and handover behavior.",
    fields: [
      {
        key: "useCaseType",
        label: "Primary use case type",
        type: "select",
        options: ["HALO", "Voice", "MSC", "MMC/CDP", "Other / Mixed"]
      },
      {
        key: "useCaseTypeOther",
        label: "Describe the use case type",
        type: "text",
        placeholder: "Example: HALO + Voice for scheduling, plus MSC for agent support",
        showWhen: (data) => data.useCaseType === "Other / Mixed"
      },
      {
        key: "useCaseSpecificsText",
        label: "Describe the logic and flow",
        type: "textarea",
        placeholder:
`For HALO:
- Public FAQ vs authenticated flows
- Handover conditions and what data is passed to agents
- Guardrails and knowledge source(s)

For Voice:
- IVR and routing logic
- Call reasons and escalation paths

For MSC:
- Team structure, queues, users, roles, and channel coverage`
      }
    ],
    callout: {
      title: "Be precise",
      body: "If it isn't written here, it is easy for the customer to assume it is included. Err on the side of clarity."
    }
  },
  {
    id: "projectPhasing",
    title: "Project Phasing (Implementation Plan)",
    tag: "6",
    help: "Describe the standard CM.com implementation methodology. Clarify what is configured by CM.com vs completed by the customer.",
    fields: [
      {
        key: "projectPhasingText",
        label: "Describe phases 1 to 7",
        type: "textarea",
        placeholder:
`Phase 1: Preparation (Customer responsibility)
- Prerequisites: access to Meta Business Manager, website backend, DNS settings
- Assign project lead and stakeholders
- Provide content: FAQs, IVR scripts, knowledge sources

Phase 2: Enablement
- Environment provisioning and e-learning assignments

Phase 3: Implementation & Configuration
- Exactly what CM.com will configure (channels, users, bots, guardrails, consent, data sources)

Phase 4a & 4b: Testing & Go/No-Go
- Functional testing (happy/unhappy flows) and decision meeting

Phase 5: Go Live
- Launch-day support

Phase 6 & 7: Optimization, Aftercare & Handover
- Hypercare length and handover to Customer Success`
      }
    ]
  },
  {
    id: "planning",
    title: "Planning",
    tag: "7",
    help: "Capture timeline expectations. Always mention dependency on customer responsiveness and availability.",
    fields: [
      {
        key: "planningText",
        label: "Planning notes",
        type: "textarea",
        placeholder:
`Include:
- Intended start date
- Estimated lead time
- Dependencies and assumptions

Example:
"Estimated lead time is 6 weeks from kickoff, dependent on timely customer feedback and completion of prerequisites."`
      }
    ]
  },
  {
    id: "rolesResponsibilities",
    title: "Roles & Responsibilities",
    tag: "8",
    help: "Manage expectations clearly. What can the customer expect from CM.com. What is expected from the customer.",
    fields: [
      {
        key: "rolesCm",
        label: "What CM.com will provide",
        type: "textarea",
        placeholder:
`Examples:
- Project management and coordination
- Technical setup of the backend
- Guidance and coaching (not doing customer work unless explicitly scoped)`
      },
      {
        key: "rolesCustomer",
        label: "What the customer will provide",
        type: "textarea",
        placeholder:
`Examples:
- Availability for meetings and testing
- Creating content (emails, FAQs, IVR scripts)
- Technical tasks on their side (DNS, website scripts)
- Channel onboarding tasks (embedded signup for WhatsApp)`
      }
    ],
    layout: "grid"
  },
  {
    id: "outOfScope",
    title: "Out of Scope",
    tag: "9",
    help: "Prevent scope creep by listing what is not included unless explicitly stated.",
    fields: [
      {
        key: "outOfScopeText",
        label: "Out of scope items",
        type: "textarea",
        placeholder:
`Common examples:
- Integrations with custom CRMs/ERPs (unless specified)
- Channels not listed on the order
- Custom development (coding)
- Content creation (writing the actual text for the bot)`
      }
    ]
  },
  {
    id: "futurePhases",
    title: "Future Phases (Optional)",
    tag: "10",
    help: "Capture future wishes as later phases. This shows you listened, while keeping the current scope tight.",
    fields: [
      {
        key: "futurePhasesText",
        label: "Future phases",
        type: "textarea",
        placeholder:
`Examples:
- Add Instagram as Phase B
- Expand knowledge sources and languages
- Add proactive campaigns or outbound messaging`
      }
    ]
  },
  {
    id: "summary",
    title: "Summary + Export",
    tag: "Finish",
    help: "Review the full SoW content. You can jump back to any section to refine language. When ready, export a PDF.",
    summary: true
  }
];

function $(sel, root = document) { return root.querySelector(sel); }
function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

const state = {
  step: 0,
  data: { useCaseType: "HALO" }
};

function isBlank(v) { return !(String(v ?? "").trim().length); }

function isSectionComplete(sec) {
  if (!sec) return false;
  if (sec.summary) return getMissingRequiredSections().length === 0;

  // Optional: only complete if user actually typed something
  if (OPTIONAL_SECTION_IDS.has(sec.id)) {
    const keys = (sec.fields || []).map(f => f.key);
    return keys.some(k => !isBlank(state.data[k]));
  }

  if (sec.id === "meta") {
    return REQUIRED_META_KEYS.every(k => !isBlank(state.data[k]));
  }

  if (sec.id === "rolesResponsibilities") {
    return !isBlank(state.data.rolesCm) && !isBlank(state.data.rolesCustomer);
  }

  if (sec.id === "planning") {
    // Avoid auto-complete due to mergePlanning auto block when user did nothing in planning
    return !isBlank((state.data.planningText || "").trim());
  }

  if (sec.id === "useCaseSpecifics") {
    return !isBlank(state.data.useCaseSpecificsText);
  }

  const keys = (sec.fields || []).map(f => f.key);
  return keys.some(k => !isBlank(state.data[k]));
}

function getMissingRequiredSections() {
  return SECTIONS
    .filter(sec => !sec.summary)
    .filter(sec => !OPTIONAL_SECTION_IDS.has(sec.id))
    .filter(sec => !isSectionComplete(sec));
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("cm_sow_theme", theme);
}
function initTheme() {
  const saved = localStorage.getItem("cm_sow_theme");
  if (saved) { setTheme(saved); return; }
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");
}

function toast(title, msg) {
  const host = $("#toastHost");
  if (!host) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<div class="toast__title">${escapeHtml(title)}</div><div class="toast__msg">${escapeHtml(msg)}</div>`;
  host.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(8px)"; }, 2600);
  setTimeout(() => { el.remove(); }, 3200);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      state.data = { ...state.data, ...parsed.data };
      state.step = Math.min(parsed.step ?? 0, SECTIONS.length - 1);
      return true;
    }
  } catch (e) {}
  return false;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: state.step, data: state.data }));
  } catch (e) {}
}

function saveWithToast() {
  persist();
  toast("Saved", "Your progress is stored in this browser.");
}

function clearSaved() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

function clearAllHardReset() {
  clearSaved();
  try { localStorage.removeItem("cm_sow_theme"); } catch (e) {}
  state.data = { useCaseType: "HALO" };
  state.step = 0;
  initTheme();
  renderCards();
  activateStep(0, "back");
  toast("Cleared", "All fields have been cleared.");
}

function renderCards(){
  const deck = $("#cardDeck");
  if(!deck) return;
  deck.innerHTML = "";

  SECTIONS.forEach((sec, idx) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.index = String(idx);

    // Only the Summary card should scroll
    if(sec.summary){
      card.classList.add("card--scroll");
    }

    const top = document.createElement("div");
    top.innerHTML = `
      <div class="card__tag"><span class="dot"></span><span>${escapeHtml(sec.tag)}</span></div>
      <h2 class="card__title">${escapeHtml(sec.title)}</h2>
      <p class="card__help">${escapeHtml(sec.help)}</p>
    `;
    card.appendChild(top);

    if(sec.callout){
      const callout = document.createElement("div");
      callout.className = "callout";
      callout.innerHTML = `<b>${escapeHtml(sec.callout.title)}.</b> ${escapeHtml(sec.callout.body)}`;
      card.appendChild(callout);
    }

    card.appendChild(sec.summary ? renderSummary() : renderFields(sec));
    deck.appendChild(card);
  });
}

function renderFields(section) {
  const wrap = document.createElement("div");
  wrap.className = section.layout === "grid" ? "grid" : "stack";

  (section.fields || []).forEach(field => {
    const shouldShow = typeof field.showWhen === "function" ? field.showWhen(state.data) : true;
    if(!shouldShow) return;
    const f = document.createElement("div");
    f.className = "field";

    const id = `${section.id}_${field.key}`;
    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.textContent = field.label;
    f.appendChild(label);

    let input;
    if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 8;
    } else if (field.type === "select") {
      input = document.createElement("select");
      (field.options || []).forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        input.appendChild(o);
      });
    } else {
      input = document.createElement("input");
      input.type = field.type || "text";
    }

    input.id = id;
    input.name = field.key;
    input.placeholder = field.placeholder || "";
    input.value = state.data[field.key] || "";

    const onChange = () => {
      state.data[field.key] = input.value;
      if(field.key === "useCaseType" && input.value !== "Other / Mixed"){
        delete state.data.useCaseTypeOther;
      }
      persist();
      updateProgress(true);
    };
    input.addEventListener("input", onChange);
    input.addEventListener("change", onChange);

    f.appendChild(input);
    wrap.appendChild(f);
  });

  if (section.id === "meta") {
    const note = document.createElement("div");
    note.className = "callout";
    note.innerHTML = `<b>Note.</b> Your start date and lead time will also appear in the Planning section unless you override it there.`;
    wrap.appendChild(note);
  }

  return wrap;
}

function renderSummary() {
  const wrap = document.createElement("div");
  wrap.className = "summary";

  const s = document.createElement("div");
  s.className = "callout";
  s.innerHTML = `<b>Before you export.</b> Tighten language, remove ambiguity, and ensure every promise is backed by a scoped phase or deliverable.`;
  wrap.appendChild(s);

  const missing = getMissingRequiredSections();
  const status = document.createElement("div");
  status.className = "summary__status";
  status.innerHTML = missing.length
    ? `<div class="summary__statusline"><b>Missing required sections.</b> Complete these before exporting: ${missing.map(m => escapeHtml(m.tag)).join(", ")}</div>`
    : `<div class="summary__statusline"><b>All required sections complete.</b> You can export when ready.</div>`;
  wrap.appendChild(status);

  const items = SECTIONS.filter(x => !x.summary).map((sec, idx) => {
    const val = summarizeSection(sec);
    const optional = OPTIONAL_SECTION_IDS.has(sec.id);
    const complete = isSectionComplete(sec);

    const item = document.createElement("div");
    item.className = "summary__item";
    item.innerHTML = `
      <div class="summary__top">
        <div class="summary__title">
          ${escapeHtml(sec.tag)}. ${escapeHtml(sec.title)}
          ${optional ? '<span class="badge badge--muted">Optional</span>' : ""}
          ${complete ? '<span class="badge">Complete</span>' : '<span class="badge badge--warn">Needs info</span>'}
        </div>
        <button class="summary__btn" type="button" data-jump="${idx}">Edit</button>
      </div>
      <div class="summary__text">${val ? escapeHtml(val) : '<span class="summary__empty">No content yet.</span>'}</div>
    `;
    return item;
  });

  items.forEach(el => wrap.appendChild(el));

  const actions = document.createElement("div");
  actions.className = "nav";
  actions.innerHTML = `
    <button class="btn btn--ghost" type="button" id="clearBtn">Clear saved</button>
    <div class="nav__right">
      <button class="btn btn--ghost" type="button" id="previewBtn">Preview PDF</button>
      <button class="btn btn--primary" type="button" id="exportBtn">Export PDF</button>
      <button class="btn btn--ghost" type="button" id="doneBtn">Done</button>
    </div>
  `;
  wrap.appendChild(actions);

  return wrap;
}

function refreshSummaryIfActive() {
  const sec = SECTIONS[state.step];
  if (!sec || !sec.summary) return;

  const card = $all(".card")?.[state.step];
  if (!card) return;

  // Replace the summary DOM in-place so it always reflects latest state
  const old = $(".summary", card);
  if (!old) return;

  const fresh = renderSummary();
  old.replaceWith(fresh);
  bindSummaryActions(true);
}

function summarizeSection(sec) {
  if (sec.id === "meta") {
    const parts = [
      line("Company", state.data.companyName),
      line("Project", state.data.projectName),
      line("Sales Rep", state.data.salesRepName),
      line("Onboarding", state.data.onboardingManager),
      line("Contact", state.data.onboardingContact),
      line("Start Date", state.data.startDate),
      line("Lead Time", state.data.estimatedLeadTime)
    ].filter(Boolean);
    return parts.join("\n");
  }

  if (sec.id === "rolesResponsibilities") {
    const cm = state.data.rolesCm?.trim();
    const cu = state.data.rolesCustomer?.trim();
    return [
      cm ? `CM.com will provide:\n${cm}` : "",
      cu ? `Customer will provide:\n${cu}` : ""
    ].filter(Boolean).join("\n\n");
  }

  const vals = (sec.fields || []).map(f => state.data[f.key]).filter(v => (v ?? "").trim().length);
  return vals.join("\n\n");
}

function line(k, v) {
  const s = String(v ?? "").trim();
  if (!s) return "";
  return `${k}: ${s}`;
}

function validateStep(idx) {
  const sec = SECTIONS[idx];
  if (!sec || sec.summary) return { ok: true };

  if (sec.id === "meta") {
    const missing = REQUIRED_META_KEYS.filter(k => isBlank(state.data[k]));
    if (missing.length) {
      return { ok: false, msg: "Please fill Company name, Project name, and Sales rep name before continuing." };
    }
  }
  return { ok: true };
}

function ensureStepper() {
  if ($("#stepper")) return;
  const head = $(".shell__head");
  if (!head) return;

  const stepper = document.createElement("nav");
  stepper.id = "stepper";
  stepper.className = "stepper";
  stepper.setAttribute("aria-label", "Section navigation");

  stepper.innerHTML = `
    <div class="stepper__row">
      ${SECTIONS.map((sec, idx) => {
        const optional = OPTIONAL_SECTION_IDS.has(sec.id);
        const title = optional ? `${sec.title} (Optional)` : sec.title;
        const label = `${sec.tag}`;
        return `
          <button type="button" class="stepper__step" data-step="${idx}" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}">
            <span class="stepper__dot" aria-hidden="true"></span>
            <span class="stepper__txt">${escapeHtml(label)}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;

  const progress = head.querySelector(".progress");
  if (progress && progress.parentElement) {
    progress.parentElement.appendChild(stepper);
  } else {
    head.appendChild(stepper);
  }

  stepper.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-step]");
    if (!btn) return;
    const idx = Number(btn.dataset.step);
    if (Number.isNaN(idx)) return;

    persist();
    const dir = idx > state.step ? "forward" : "back";
    activateStep(idx, dir);
  });
}

function updateStepper() {
  const stepper = $("#stepper");
  if (!stepper) return;
  const btns = $all(".stepper__step", stepper);

  btns.forEach(btn => {
    const idx = Number(btn.dataset.step);
    const sec = SECTIONS[idx];
    btn.classList.toggle("is-active", idx === state.step);
    btn.classList.toggle("is-complete", isSectionComplete(sec));
    btn.classList.toggle("is-optional", OPTIONAL_SECTION_IDS.has(sec?.id));
  });
}

function updateProgress(alsoRefreshSummary = false) {
  const total = SECTIONS.length;
  const stepNum = state.step + 1;

  $("#stepLabel").textContent = `Step ${stepNum} of ${total}`;
  const pct = Math.round((state.step) / (total - 1) * 100);
  $("#progressPct").textContent = `${pct}%`;
  $("#progressFill").style.width = `${pct}%`;
  $(".progress__bar").setAttribute("aria-valuenow", String(pct));

  $("#prevBtn").disabled = state.step === 0;
  $("#nextBtn").textContent = state.step === total - 1 ? "Done" : "Next";
  $("#nextBtn").disabled = state.step === total - 1;

  ensureStepper();
  updateStepper();

  if (alsoRefreshSummary) refreshSummaryIfActive();
}

function activateStep(nextIdx, direction) {
  const deck = $("#cardDeck");
  const cards = $all(".card", deck);
  const current = cards[state.step];
  const next = cards[nextIdx];
  if (!next) return;

  // ensure only the intended card is visible
  cards.forEach(c => {
    c.classList.remove("card--active");
    c.classList.remove("card--exit-left");
  });

  if (current && current !== next) {
    if (direction === "forward") current.classList.add("card--exit-left");
    setTimeout(() => current.classList.remove("card--exit-left"), 600);
  }

  next.classList.add("card--active");
  state.step = nextIdx;

  persist();
  updateProgress();

  const sec = SECTIONS[state.step];
  if (sec.summary) {
    bindSummaryActions(true);
    refreshSummaryIfActive();
  }
}

function bindSummaryActions(force = false) {
  const summaryRoot = $(".summary");
  if (!summaryRoot) return;
  if (!force && summaryRoot.dataset.bound === "1") {
    updateStepper();
    return;
  }
  summaryRoot.dataset.bound = "1";

  $all("[data-jump]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.jump);
      activateStep(idx, "back");
    });
  });

  const clearBtn = $("#clearBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      clearSaved();
      state.data = { useCaseType: "HALO" };
      state.step = 0;
      renderCards();
      activateStep(0, "back");
      toast("Cleared", "Saved data removed.");
    });
  }

  const previewBtn = $("#previewBtn");
  const exportBtn = $("#exportBtn");
  const doneBtn = $("#doneBtn");

  previewBtn?.addEventListener("click", async () => {
    const missing = getMissingRequiredSections();
    if (missing.length) {
      toast("Cannot preview", `Complete: ${missing.map(m => m.tag).join(", ")}`);
      return;
    }
    try {
      await previewPdf();
      toast("Preview ready", "PDF opened in a new tab.");
    } catch (e) {
      toast("Preview failed", "Could not generate preview.");
    }
  });

  exportBtn?.addEventListener("click", async () => {
    const missing = getMissingRequiredSections();
    if (missing.length) {
      toast("Cannot export", `Complete: ${missing.map(m => m.tag).join(", ")}`);
      return;
    }
    await exportPdf();
  });

  doneBtn?.addEventListener("click", () => {
    saveWithToast();
    toast("Done", "Saved.");
  });
}

function bindNav() {
  $("#prevBtn").addEventListener("click", () => {
    if (state.step <= 0) return;
    persist();
    activateStep(state.step - 1, "back");
  });

  $("#nextBtn").addEventListener("click", () => {
    const v = validateStep(state.step);
    if (!v.ok) {
      toast("Missing info", v.msg);
      return;
    }
    persist();
    if (state.step < SECTIONS.length - 1) {
      activateStep(state.step + 1, "forward");
    }
  });

  $("#saveBtn").addEventListener("click", saveWithToast);

  const clearAllBtn = $("#" + CLEAR_ALL_BTN_ID);
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", clearAllHardReset);
  }

  $("#themeToggle").addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "light";
    setTheme(current === "dark" ? "light" : "dark");
    persist();
  });
}

function buildPdfSubtitle() {
  const company = (state.data.companyName || "").trim();
  const project = (state.data.projectName || "").trim();
  const sales = (state.data.salesRepName || "").trim();
  const ob = (state.data.onboardingManager || "").trim();
  const start = (state.data.startDate || "").trim();
  const lead = (state.data.estimatedLeadTime || "").trim();

  const bits = [];
  if (company) bits.push(company);
  if (project) bits.push(project);
  if (sales) bits.push(`Sales: ${sales}`);
  if (ob) bits.push(`Onboarding: ${ob}`);
  if (start) bits.push(`Start: ${start}`);
  if (lead) bits.push(`Lead time: ${lead}`);
  return bits.join(" • ");
}

function makeFilename() {
  const company = (state.data.companyName || "Customer").trim().replaceAll(/[^a-z0-9]+/gi, "_");
  const project = (state.data.projectName || "SoW").trim().replaceAll(/[^a-z0-9]+/gi, "_");
  return `SoW_${company}_${project}.pdf`;
}

function mergePlanning() {
  const planning = (state.data.planningText || "").trim();
  const start = (state.data.startDate || "").trim();
  const lead = (state.data.estimatedLeadTime || "").trim();

  const auto = [];
  if (start) auto.push(`Intended start date: ${start}`);
  if (lead) auto.push(`Estimated lead time: ${lead}`);
  const autoBlock = auto.length ? auto.join("\n") : "";

  if (planning && autoBlock) return `${autoBlock}\n\n${planning}`;
  if (planning) return planning;
  return autoBlock;
}

/* ---------------------------
   PDF. High quality, text based
---------------------------- */

function getPdfSectionsOrdered() {
  return [
    { title: "Customer Background", text: state.data.customerBackgroundText },
    { title: "Current Challenges", text: state.data.currentChallengesText },
    { title: "Project Goals", text: state.data.projectGoalsText },
    { title: "Success Criteria", text: state.data.successCriteriaText },
    { title: `Use Case Specifics (${(state.data.useCaseType || "").trim() || "N/A"})`, text: state.data.useCaseSpecificsText },
    { title: "Project Phasing (Implementation Plan)", text: state.data.projectPhasingText },
    { title: "Planning", text: mergePlanning() },
    { title: "Roles & Responsibilities. CM.com", text: state.data.rolesCm },
    { title: "Roles & Responsibilities. Customer", text: state.data.rolesCustomer },
    { title: "Out of Scope", text: state.data.outOfScopeText },
    { title: "Future Phases (Optional)", text: state.data.futurePhasesText }
  ];
}

async function svgElementToPngDataUrl(svgEl, targetWidthPx = 520) {
  // Serialize SVG
  const serializer = new XMLSerializer();
  let svgText = serializer.serializeToString(svgEl);

  // Ensure xmlns
  if (!svgText.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgText = svgText.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // Build blob url
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  // Load into Image and draw to canvas
  const img = new Image();
  img.crossOrigin = "anonymous";

  const loaded = await new Promise((resolve, reject) => {
    img.onload = () => resolve(true);
    img.onerror = () => reject(new Error("SVG load failed"));
    img.src = url;
  });

  URL.revokeObjectURL(url);

  // Create canvas
  const aspect = img.height / img.width || 0.25;
  const w = Math.max(10, targetWidthPx);
  const h = Math.max(10, Math.round(w * aspect));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  return canvas.toDataURL("image/png");
}

async function imgTagToDataUrl(imgEl) {
  // If it is already a data URL
  const src = imgEl.getAttribute("src") || "";
  if (src.startsWith("data:")) return src;

  // Fetch and convert to blob to avoid CORS surprises (works on GitHub Pages)
  const res = await fetch(src, { cache: "no-store" });
  const blob = await res.blob();
  return await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function getBrandLogoPngDataUrl() {
  const el = document.getElementById(BRAND_LOGO_LIGHT_ID);
  if (!el) return null;

  // inline svg
  if (el.tagName && el.tagName.toLowerCase() === "svg") {
    return await svgElementToPngDataUrl(el, 520);
  }

  // img tag pointing to svg or png
  if (el.tagName && el.tagName.toLowerCase() === "img") {
    const src = el.getAttribute("src") || "";
    if (src.toLowerCase().endsWith(".svg")) {
      // Load SVG text and convert using an offscreen SVG element
      const res = await fetch(src, { cache: "no-store" });
      const svgText = await res.text();
      const wrap = document.createElement("div");
      wrap.style.position = "absolute";
      wrap.style.left = "-99999px";
      wrap.style.top = "-99999px";
      wrap.innerHTML = svgText;
      document.body.appendChild(wrap);
      const svgNode = wrap.querySelector("svg");
      if (!svgNode) {
        wrap.remove();
        return null;
      }
      const png = await svgElementToPngDataUrl(svgNode, 520);
      wrap.remove();
      return png;
    }

    // png or other raster
    return await imgTagToDataUrl(el);
  }

  return null;
}

function jsPdfSetFontSafe(pdf, family, style) {
  try {
    pdf.setFont(family, style);
  } catch (e) {
    // Fall back silently to built-in font
    try { pdf.setFont("helvetica", style); } catch (_e) {}
  }
}

function wrapText(pdf, text, maxWidth) {
  const s = String(text || "").replaceAll("\r\n", "\n").trim();
  if (!s) return [" "];
  // Preserve blank lines by splitting paragraphs, then re-joining with spacing
  const paras = s.split("\n");
  const out = [];
  paras.forEach((p, i) => {
    const line = p.trim();
    if (!line) {
      out.push(" ");
      return;
    }
    const wrapped = pdf.splitTextToSize(line, maxWidth);
    wrapped.forEach(w => out.push(w));
  });
  return out.length ? out : [" "];
}

async function buildPdf({ openInNewTab = false } = {}) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    toast("PDF library missing", "jsPDF did not load. Check script tags.");
    return null;
  }

  // Make sure fonts are ready before we measure text width
  try { await document.fonts.ready; } catch (e) {}

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4", compress: true });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const marginX = 54;
  const marginTop = 54;
  const contentW = pageW - marginX * 2;

  // Header
  const title = "Statement of Work";
  const subtitle = buildPdfSubtitle();
  const dateStr = new Date().toLocaleDateString();

  let y = marginTop;

  // Logo (top-left)
  try {
    const logoPng = await getBrandLogoPngDataUrl();
    if (logoPng) {
      // Place logo at top-left, scaled to fit
      const logoW = 140;
      const logoH = 34;
      pdf.addImage(logoPng, "PNG", marginX, y - 6, logoW, logoH);
    }
  } catch (e) {
    // Ignore logo failures, do not block PDF
  }

  // Title centered
  jsPdfSetFontSafe(pdf, "helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text(title, pageW / 2, y + 8, { align: "center" });

  // Subtitle centered
  jsPdfSetFontSafe(pdf, "helvetica", "normal");
  pdf.setFontSize(10.5);
  if (subtitle) {
    pdf.text(subtitle, pageW / 2, y + 28, { align: "center" });
  }

  // Divider
  y += 46;
  pdf.setDrawColor(225, 225, 225);
  pdf.setLineWidth(1);
  pdf.line(marginX, y, pageW - marginX, y);
  y += 26;

  // Body sections
  const sections = getPdfSectionsOrdered();

  const H_FONT = 13;
  const P_FONT = 10.5;
  const H_GAP = 8;
  const P_LINE = 14;
  const SECTION_GAP = 16;

  const addPageIfNeeded = (neededHeight) => {
    if (y + neededHeight <= pageH - 54) return;
    pdf.addPage();
    y = marginTop;
  };

  sections.forEach((sec) => {
    const heading = String(sec.title || "").trim() || "Section";
    const rawText = String(sec.text || "").trim();

    // Heading
    addPageIfNeeded(38);
    jsPdfSetFontSafe(pdf, "helvetica", "bold");
    pdf.setFontSize(H_FONT);
    pdf.setTextColor(20, 20, 20);
    pdf.text(heading, marginX, y);
    y += H_GAP;

    // Body text
    jsPdfSetFontSafe(pdf, "helvetica", "normal");
    pdf.setFontSize(P_FONT);
    pdf.setTextColor(35, 35, 35);

    const lines = wrapText(pdf, rawText || " ", contentW);
    lines.forEach((ln) => {
      addPageIfNeeded(P_LINE + 4);
      pdf.text(ln, marginX, y + P_LINE);
      y += P_LINE;
    });

    y += SECTION_GAP;
  });

  // Footer (last page only)
  pdf.setFontSize(9);
  pdf.setTextColor(120, 120, 120);
  pdf.text("Generated with CM.com SoW Builder", marginX, pageH - 34);
  pdf.text(dateStr, pageW - marginX, pageH - 34, { align: "right" });

  if (openInNewTab) {
    const blobUrl = pdf.output("bloburl");
    window.open(blobUrl, "_blank", "noopener,noreferrer");
  }

  return pdf;
}

async function previewPdf() {
  const pdf = await buildPdf({ openInNewTab: true });
  return pdf;
}

async function exportPdf() {
  toast("Exporting", "Generating high quality PDF.");
  const pdf = await buildPdf({ openInNewTab: false });
  if (!pdf) {
    toast("Export failed", "Could not generate PDF.");
    return;
  }
  const filename = makeFilename();
  pdf.save(filename);
  saveWithToast();
  toast("Done", `Downloaded ${filename}`);
}

function init() {
  initTheme();
  loadSaved();
  renderCards();
  bindNav();
  updateProgress();

  ensureStepper();
  updateStepper();

  const first = $all(".card")[state.step];
  if (first) first.classList.add("card--active");

  persist();

  window.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      if (!$("#nextBtn").disabled) $("#nextBtn").click();
    }
    if (e.key === "Escape") {
      saveWithToast();
    }
  });

  toast("Ready", "Autosave is on. Use Save anytime for confirmation.");
}

document.addEventListener("DOMContentLoaded", init);