/* CM.com SoW Builder (client-side)
   - Multi-step cards with slide transitions
   - Local save/load
   - Summary + PDF export (html2canvas + jsPDF)
   - Autosave on every change / step navigation (no toast). Toast only on Save + Done.
   - Clear All (hard reset)
*/

const STORAGE_KEY = "cm_sow_builder_v1";

// Optional sections: can be left blank and still allow export.
// They should NOT auto-mark as "complete" in the stepper.
const OPTIONAL_SECTION_IDS = new Set(["futurePhases"]);

// Keep aligned with validateStep meta requirements
const REQUIRED_META_KEYS = ["companyName", "projectName", "salesRepName"];

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
      { key: "customerBackgroundText", label: "Write the customer background", type: "textarea", placeholder:
`Who are they?
What do they do?
What's happening now?

Example:
"Acme Retail is a national e-commerce brand currently in a rapid growth phase, looking to modernize customer communications and support operations."` }
    ]
  },
  {
    id: "currentChallenges",
    title: "Current Challenges",
    tag: "2",
    help: "Define the problem CM.com is solving. Describe the pain points clearly and concretely.",
    fields: [
      { key: "currentChallengesText", label: "List current challenges", type: "textarea", placeholder:
`Write in plain language. 2 to 6 bullets is usually enough.

Examples:
- Communication is fragmented across decentralized channels.
- Agents spend too much time on repetitive questions.
- Upcoming changes in legislation require a channel shift.` }
    ]
  },
  {
    id: "projectGoals",
    title: "Project Goals",
    tag: "3",
    help: "State the high-level objective. What is the main outcome CM.com and the customer want to achieve?",
    fields: [
      { key: "projectGoalsText", label: "Describe project goals", type: "textarea", placeholder:
`Examples:
- Centralize support into a single platform.
- Automate FAQs with HALO while keeping a clean handover path to agents.
- Increase conversion with faster response times and proactive messaging.` }
    ]
  },
  {
    id: "successCriteria",
    title: "Success Criteria",
    tag: "4",
    help: "Define how you'll measure completion. Use tangible outcomes that are testable and time-bound when possible.",
    fields: [
      { key: "successCriteriaText", label: "Success criteria (bullets recommended)", type: "textarea", placeholder:
`Technical:
- Channels X, Y, and Z are live.
- Number porting is complete.

Operational:
- Agents are trained and working in MSC.

Data:
- Management has access to the Analytics Portal.` }
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
        options: ["Chatbot (CAIC/HALO)", "Voice", "MSC", "MMC/CDP", "Other / Mixed"]
      },
      {
        key: "useCaseSpecificsText",
        label: "Describe the logic and flow",
        type: "textarea",
        placeholder:
`For Chatbots (CAIC/HALO):
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
      { key: "projectPhasingText", label: "Describe phases 1 to 7", type: "textarea", placeholder:
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
- Hypercare length and handover to Customer Success` }
    ]
  },
  {
    id: "planning",
    title: "Planning",
    tag: "7",
    help: "Capture timeline expectations. Always mention dependency on customer responsiveness and availability.",
    fields: [
      { key: "planningText", label: "Planning notes", type: "textarea", placeholder:
`Include:
- Intended start date
- Estimated lead time
- Dependencies and assumptions

Example:
"Estimated lead time is 6 weeks from kickoff, dependent on timely customer feedback and completion of prerequisites."` }
    ]
  },
  {
    id: "rolesResponsibilities",
    title: "Roles & Responsibilities",
    tag: "8",
    help: "Manage expectations clearly. What can the customer expect from CM.com. What is expected from the customer.",
    fields: [
      { key: "rolesCm", label: "What CM.com will provide", type: "textarea", placeholder:
`Examples:
- Project management and coordination
- Technical setup of the backend
- Guidance and coaching (not doing customer work unless explicitly scoped)` },
      { key: "rolesCustomer", label: "What the customer will provide", type: "textarea", placeholder:
`Examples:
- Availability for meetings and testing
- Creating content (emails, FAQs, IVR scripts)
- Technical tasks on their side (DNS, website scripts)
- Channel onboarding tasks (embedded signup for WhatsApp)` }
    ],
    layout: "grid"
  },
  {
    id: "outOfScope",
    title: "Out of Scope",
    tag: "9",
    help: "Prevent scope creep by listing what is not included unless explicitly stated.",
    fields: [
      { key: "outOfScopeText", label: "Out of scope items", type: "textarea", placeholder:
`Common examples:
- Integrations with custom CRMs/ERPs (unless specified)
- Channels not listed on the order
- Custom development (coding)
- Content creation (writing the actual text for the bot)` }
    ]
  },
  {
    id: "futurePhases",
    title: "Future Phases (Optional)",
    tag: "10",
    help: "Capture future wishes as later phases. This shows you listened, while keeping the current scope tight.",
    fields: [
      { key: "futurePhasesText", label: "Future phases", type: "textarea", placeholder:
`Examples:
- Add Instagram as Phase B
- Expand knowledge sources and languages
- Add proactive campaigns or outbound messaging` }
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

function $(sel, root = document){ return root.querySelector(sel); }
function $all(sel, root = document){ return Array.from(root.querySelectorAll(sel)); }

const state = {
  step: 0,
  data: { useCaseType: "Chatbot (CAIC/HALO)" }
};

function isBlank(v){ return !(String(v ?? "").trim().length); }

function isSectionComplete(sec){
  if(!sec) return false;
  if(sec.summary) return getMissingRequiredSections().length === 0;

  if(OPTIONAL_SECTION_IDS.has(sec.id)){
    const keys = (sec.fields || []).map(f => f.key);
    return keys.some(k => !isBlank(state.data[k]));
  }

  if(sec.id === "meta"){
    return REQUIRED_META_KEYS.every(k => !isBlank(state.data[k]));
  }

  if(sec.id === "rolesResponsibilities"){
    return !isBlank(state.data.rolesCm) && !isBlank(state.data.rolesCustomer);
  }

  if(sec.id === "planning"){
    return !isBlank(mergePlanning());
  }

  if(sec.id === "useCaseSpecifics"){
    return !isBlank(state.data.useCaseSpecificsText);
  }

  const keys = (sec.fields || []).map(f => f.key);
  return keys.some(k => !isBlank(state.data[k]));
}

function getMissingRequiredSections(){
  return SECTIONS
    .filter(sec => !sec.summary)
    .filter(sec => !OPTIONAL_SECTION_IDS.has(sec.id))
    .filter(sec => !isSectionComplete(sec));
}

function setTheme(theme){
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("cm_sow_theme", theme);
}

function initTheme(){
  const saved = localStorage.getItem("cm_sow_theme");
  if(saved){ setTheme(saved); return; }
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");
}

function toast(title, msg){
  const host = $("#toastHost");
  if(!host) return;
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<div class="toast__title">${escapeHtml(title)}</div><div class="toast__msg">${escapeHtml(msg)}</div>`;
  host.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateY(8px)"; }, 2600);
  setTimeout(() => { el.remove(); }, 3200);
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function loadSaved(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return false;
    const parsed = JSON.parse(raw);
    if(parsed && typeof parsed === "object"){
      state.data = { ...state.data, ...parsed.data };
      state.step = Math.min(parsed.step ?? 0, SECTIONS.length - 1);
      return true;
    }
  }catch(e){}
  return false;
}

function persist(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: state.step, data: state.data }));
  }catch(e){}
}

function saveWithToast(){
  persist();
  toast("Saved", "Your progress is stored in this browser.");
}

function clearSaved(){
  try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
}

/** Hard reset: clears storage + in-memory state + DOM */
function resetAll(){
  clearSaved();
  state.step = 0;
  state.data = { useCaseType: "Chatbot (CAIC/HALO)" };
  renderCards();
  activateStep(0, "back");
  toast("Cleared", "All sections have been reset.");
}

function renderCards(){
  const deck = $("#cardDeck");
  if(!deck) return;
  deck.innerHTML = "";

  SECTIONS.forEach((sec, idx) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.index = String(idx);

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

function renderFields(section){
  const wrap = document.createElement("div");
  wrap.className = section.layout === "grid" ? "grid" : "stack";

  (section.fields || []).forEach(field => {
    const f = document.createElement("div");
    f.className = "field";

    const id = `${section.id}_${field.key}`;
    const label = document.createElement("label");
    label.setAttribute("for", id);
    label.textContent = field.label;
    f.appendChild(label);

    let input;
    if(field.type === "textarea"){
      input = document.createElement("textarea");
      input.rows = 8;
    }else if(field.type === "select"){
      input = document.createElement("select");
      (field.options || []).forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        input.appendChild(o);
      });
    }else{
      input = document.createElement("input");
      input.type = field.type || "text";
    }

    input.id = id;
    input.name = field.key;
    input.placeholder = field.placeholder || "";
    input.value = state.data[field.key] || "";

    const onChange = () => {
      state.data[field.key] = input.value;
      persist();         // autosave, no toast
      updateProgress();  // keep stepper + summary state correct
    };

    input.addEventListener("input", onChange);
    input.addEventListener("change", onChange);

    f.appendChild(input);

    if(field.small){
      const small = document.createElement("div");
      small.className = "small";
      small.textContent = field.small;
      f.appendChild(small);
    }

    wrap.appendChild(f);
  });

  if(section.id === "meta"){
    const note = document.createElement("div");
    note.className = "callout";
    note.innerHTML = `<b>Note.</b> Your start date and lead time will also appear in the Planning section unless you override it there.`;
    wrap.appendChild(note);
  }

  return wrap;
}

function renderSummary(){
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
      <button class="btn btn--ghost" type="button" id="previewBtn" ${missing.length ? "disabled" : ""}>Preview PDF</button>
      <button class="btn btn--primary" type="button" id="exportBtn" ${missing.length ? "disabled" : ""}>Export PDF</button>
    </div>
  `;
  wrap.appendChild(actions);

  return wrap;
}

function summarizeSection(sec){
  if(sec.id === "meta"){
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

  if(sec.id === "rolesResponsibilities"){
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

function line(k, v){
  const s = String(v ?? "").trim();
  if(!s) return "";
  return `${k}: ${s}`;
}

function validateStep(idx){
  const sec = SECTIONS[idx];
  if(!sec || sec.summary) return { ok: true };

  if(sec.id === "meta"){
    const missing = REQUIRED_META_KEYS.filter(k => isBlank(state.data[k]));
    if(missing.length){
      return { ok:false, msg: "Please fill Company name, Project name, and Sales rep name before continuing." };
    }
  }
  return { ok:true };
}

function ensureStepper(){
  if($("#stepper")) return;
  const head = $(".shell__head");
  if(!head) return;

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
  if(progress && progress.parentElement){
    progress.parentElement.appendChild(stepper);
  }else{
    head.appendChild(stepper);
  }

  stepper.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-step]");
    if(!btn) return;
    const idx = Number(btn.dataset.step);
    if(Number.isNaN(idx)) return;

    persist();
    const dir = idx > state.step ? "forward" : "back";
    activateStep(idx, dir);
  });
}

function updateStepper(){
  const stepper = $("#stepper");
  if(!stepper) return;
  const btns = $all(".stepper__step", stepper);

  btns.forEach(btn => {
    const idx = Number(btn.dataset.step);
    const sec = SECTIONS[idx];
    btn.classList.toggle("is-active", idx === state.step);
    btn.classList.toggle("is-complete", isSectionComplete(sec));
    btn.classList.toggle("is-optional", OPTIONAL_SECTION_IDS.has(sec?.id));
  });
}

function updateProgress(){
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
}

function resetCardClasses(cards){
  cards.forEach(c => {
    c.classList.remove("card--active");
    c.classList.remove("card--exit-left");
  });
}

function activateStep(nextIdx, direction){
  const deck = $("#cardDeck");
  const cards = $all(".card", deck);
  const current = cards[state.step];
  const next = cards[nextIdx];
  if(!next) return;

  next.classList.remove("card--exit-left");

  if(current){
    current.classList.remove("card--active");
    if(direction === "forward") current.classList.add("card--exit-left");
    setTimeout(() => current.classList.remove("card--exit-left"), 600);
  }

  next.classList.add("card--active");
  state.step = nextIdx;

  persist();
  updateProgress();

  const sec = SECTIONS[state.step];
  if(sec.summary){
    bindSummaryActions();
  }

  const anyActive = cards.some(c => c.classList.contains("card--active"));
  if(!anyActive){
    resetCardClasses(cards);
    next.classList.add("card--active");
  }
}

function bindSummaryActions(){
  const summaryRoot = $(".summary");
  if(summaryRoot && summaryRoot.dataset.bound === "1"){
    updateStepper();
    return;
  }
  if(summaryRoot) summaryRoot.dataset.bound = "1";

  $all("[data-jump]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.jump);
      activateStep(idx, "back");
    });
  });

  const clearBtn = $("#clearBtn");
  if(clearBtn){
    clearBtn.addEventListener("click", () => {
      const ok = confirm("This will clear all sections and cannot be undone.\n\nContinue?");
      if(!ok) return;
      resetAll();
    });
  }

  const previewBtn = $("#previewBtn");
  const exportBtn = $("#exportBtn");

  previewBtn?.addEventListener("click", async () => {
    const missing = getMissingRequiredSections();
    if(missing.length){
      toast("Complete sections", `Finish: ${missing.map(m => m.tag).join(", ")}`);
      return;
    }
    await buildPdfDom();
    toast("Preview ready", "Use Export PDF to download.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  exportBtn?.addEventListener("click", async () => {
    const missing = getMissingRequiredSections();
    if(missing.length){
      toast("Complete sections", `Finish: ${missing.map(m => m.tag).join(", ")}`);
      return;
    }
    await exportPdf();
  });
}

function bindNav(){
  $("#prevBtn").addEventListener("click", () => {
    if(state.step <= 0) return;
    persist();
    activateStep(state.step - 1, "back");
  });

  $("#nextBtn").addEventListener("click", () => {
    const v = validateStep(state.step);
    if(!v.ok){
      toast("Missing info", v.msg);
      return;
    }
    persist();
    if(state.step < SECTIONS.length - 1){
      activateStep(state.step + 1, "forward");
    }
  });

  $("#saveBtn").addEventListener("click", saveWithToast);

  const clearAllBtn = $("#clearAllBtn");
  if(clearAllBtn){
    clearAllBtn.addEventListener("click", () => {
      const ok = confirm("This will clear all sections and cannot be undone.\n\nContinue?");
      if(!ok) return;
      resetAll();
    });
  }

  $("#themeToggle").addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "light";
    setTheme(current === "dark" ? "light" : "dark");
    persist();
  });
}

function buildPdfSubtitle(){
  const company = (state.data.companyName || "").trim();
  const project = (state.data.projectName || "").trim();
  const sales = (state.data.salesRepName || "").trim();
  const ob = (state.data.onboardingManager || "").trim();
  const start = (state.data.startDate || "").trim();
  const lead = (state.data.estimatedLeadTime || "").trim();

  const bits = [];
  if(company) bits.push(company);
  if(project) bits.push(project);
  if(sales) bits.push(`Sales: ${sales}`);
  if(ob) bits.push(`Onboarding: ${ob}`);
  if(start) bits.push(`Start: ${start}`);
  if(lead) bits.push(`Lead time: ${lead}`);
  return bits.join(" • ");
}

function getBrandLogoLightEl(){
  return document.getElementById("brandLogoLight");
}

async function buildPdfDom(){
  const logoHost = $("#pdfLogo");
  if(logoHost){
    logoHost.innerHTML = "";
    const lightLogo = getBrandLogoLightEl();
    if(lightLogo){
      const clone = lightLogo.cloneNode(true);
      clone.removeAttribute("id");
      clone.style.display = "block";
      logoHost.appendChild(clone);
    }
  }

  $("#pdfTitle").textContent = "Statement of Work";
  $("#pdfSubtitle").textContent = buildPdfSubtitle();
  $("#pdfDate").textContent = new Date().toLocaleDateString();

  const body = $("#pdfBody");
  body.innerHTML = "";

  const ordered = [
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

  ordered.forEach(sec => {
    const section = document.createElement("div");
    section.className = "pdf__section";
    section.innerHTML = `
      <h3 class="pdf__h">${escapeHtml(sec.title)}</h3>
      <p class="pdf__p">${escapeHtml((sec.text || "").trim() || " ")}</p>
    `;
    body.appendChild(section);
  });
}

function mergePlanning(){
  const planning = (state.data.planningText || "").trim();
  const start = (state.data.startDate || "").trim();
  const lead = (state.data.estimatedLeadTime || "").trim();

  const auto = [];
  if(start) auto.push(`Intended start date: ${start}`);
  if(lead) auto.push(`Estimated lead time: ${lead}`);
  const autoBlock = auto.length ? auto.join("\n") : "";

  if(planning && autoBlock) return `${autoBlock}\n\n${planning}`;
  if(planning) return planning;
  return autoBlock;
}

async function exportPdf(){
  await buildPdfDom();

  const node = $("#pdfContent");
  if(!node){
    toast("Error", "PDF content not found.");
    return;
  }

  try{ await document.fonts.ready; }catch(e){}

  toast("Exporting", "Rendering PDF. This may take a moment.");

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: "#FFFFFF",
    useCORS: true,
    logging: false
  });

  const imgData = canvas.toDataURL("image/png");
  const { jsPDF } = window.jspdf;

  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = canvas.height * (imgWidth / canvas.width);

  if(imgHeight <= pageHeight){
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  }else{
    let y = 0;
    let remaining = imgHeight;
    while(remaining > 0){
      pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
      remaining -= pageHeight;
      if(remaining > 0){
        pdf.addPage();
        y -= pageHeight;
      }
    }
  }

  const filename = makeFilename();
  pdf.save(filename);

  // “Done” should give confirmation. Autosave is silent.
  saveWithToast();
  toast("Done", `Downloaded ${filename}`);
}

function makeFilename(){
  const company = (state.data.companyName || "Customer").trim().replaceAll(/[^a-z0-9]+/gi, "_");
  const project = (state.data.projectName || "SoW").trim().replaceAll(/[^a-z0-9]+/gi, "_");
  return `SoW_${company}_${project}.pdf`;
}

function init(){
  initTheme();
  loadSaved();
  renderCards();
  bindNav();
  updateProgress();

  ensureStepper();
  updateStepper();

  const first = $all(".card")[state.step];
  if(first) first.classList.add("card--active");

  persist();

  window.addEventListener("keydown", (e) => {
    if(e.key === "Enter" && (e.metaKey || e.ctrlKey)){
      if(!$("#nextBtn").disabled) $("#nextBtn").click();
    }
    if(e.key === "Escape"){
      saveWithToast();
    }
  });

  toast("Ready", "Autosave is on. Use Save anytime for confirmation.");
}

document.addEventListener("DOMContentLoaded", init);