// ── STATE ──────────────────────────────

// ── THEME TOGGLE ───────────────────────
const savedTheme = localStorage.getItem('codementor_theme') || 'mocha';

function applyTheme(theme) {
    if (theme === 'latte') {
        document.documentElement.setAttribute('data-theme', 'latte');
        const btn = document.getElementById('themeToggle');
        if (btn) btn.textContent = '☀️';
    } else {
        document.documentElement.removeAttribute('data-theme');
        const btn = document.getElementById('themeToggle');
        if (btn) btn.textContent = '🌙';
    }
    localStorage.setItem('codementor_theme', theme);
}

function toggleTheme() {
    const current = localStorage.getItem('codementor_theme') || 'mocha';
    applyTheme(current === 'mocha' ? 'latte' : 'mocha');
}

// Load saved config from localStorage (so keys persist across sessions)
const _saved = (() => { try { return JSON.parse(localStorage.getItem('codementor_config') || '{}'); } catch { return {}; } })();
const CONFIG = {
    hindsightUrl: _saved.hindsightUrl || 'https://api.hindsight.vectorize.io',
    hindsightKey: _saved.hindsightKey || '',
    anthropicKey: _saved.anthropicKey || '',
    userName: _saved.userName || 'Alex',
    demoMode: !_saved.hindsightKey,
};
const STATE = {
    lang: 'Python', memories: [], memoryCount: 0,
    challengeIdx: 0, solvedCount: 0,
    mistakePatterns: {}, sessionStart: Date.now(), history: [],
    hintsUsed: 0, messagesCount: 0, langUsed: new Set(['Python']),
    accuracy: { correct: 0, total: 0 },
};

const BANK_ID = () => 'codementor-v1';
const STUDENT_TAG = () => `student:${CONFIG.userName.toLowerCase().replace(/\s+/g, '-')}`;

// ── HINDSIGHT API ──────────────────────
function hsHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${CONFIG.hindsightKey}` };
}

async function hsRetain(content, context = 'coding-session', extra = {}) {
    if (CONFIG.demoMode) { logAPI('retain', content.substring(0, 65) + '…'); return; }
    try {
        const body = { items: [{ content, context, tags: [STUDENT_TAG(), `lang:${STATE.lang.toLowerCase()}`], observation_scopes: 'per_tag', ...extra }] };
        const r = await fetch(`${CONFIG.hindsightUrl}/v1/default/banks/${BANK_ID()}/retain`, { method: 'POST', headers: hsHeaders(), body: JSON.stringify(body) });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        logAPI('retain', `✓ retained [${d.items_count ?? '?'} items] — ${content.substring(0, 45)}…`);
    } catch (e) { logAPI('error', 'retain: ' + e.message); }
}

async function hsRecall(query) {
    if (CONFIG.demoMode) { logAPI('recall', query.substring(0, 45)); return DEMO_MEMORIES.map(m => m.text).join('\n'); }
    try {
        const body = { query, tags: [STUDENT_TAG()], tags_match: 'any', types: ['world', 'experience', 'observation'], budget: 'mid', max_tokens: 2000 };
        const r = await fetch(`${CONFIG.hindsightUrl}/v1/default/banks/${BANK_ID()}/recall`, { method: 'POST', headers: hsHeaders(), body: JSON.stringify(body) });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        logAPI('recall', `✓ "${query.substring(0, 35)}" → ${d.results?.length ?? 0} facts`);
        d.results?.slice(0, 5).forEach(m => addMemCard(m.type, m.text, m.context || ''));
        return d.results?.map(m => `[${m.type}] ${m.text}`).join('\n') || '';
    } catch (e) { logAPI('error', 'recall: ' + e.message); return ''; }
}

// ── SETUP ──────────────────────────────
async function testAndSave() {
    CONFIG.hindsightUrl = document.getElementById('cfgHindsightUrl').value.trim() || CONFIG.hindsightUrl;
    CONFIG.hindsightKey = document.getElementById('cfgHindsightKey').value.trim();
    CONFIG.anthropicKey = document.getElementById('cfgAnthropicKey').value.trim();
    CONFIG.userName = document.getElementById('cfgUserName').value.trim() || 'Alex';

    const csEl = document.getElementById('connectionStatus');
    csEl.style.display = 'flex';

    // No preflight test — browser CORS blocks it. Trust the keys and confirm on first real call.
    if (CONFIG.hindsightKey) {
        CONFIG.demoMode = false;
        csEl.className = 'conn-status cs-ok';
        csEl.textContent = '✅ Keys saved — Hindsight memory is live!';
        document.getElementById('modeBadge').textContent = '🟢 Hindsight Live';
        document.getElementById('modeBadge').className = 'badge live';
    } else {
        CONFIG.demoMode = true;
        csEl.className = 'conn-status cs-checking';
        csEl.textContent = '🎮 No Hindsight key — running in demo mode';
    }

    // Save to localStorage so keys persist on refresh
    localStorage.setItem('codementor_config', JSON.stringify({
        hindsightUrl: CONFIG.hindsightUrl,
        hindsightKey: CONFIG.hindsightKey,
        anthropicKey: CONFIG.anthropicKey,
        userName: CONFIG.userName,
    }));
    applyConfig();
    setTimeout(() => document.getElementById('configModal').classList.remove('open'), 800);

    // Background retain to verify — errors show in API Monitor
    if (!CONFIG.demoMode) {
        hsRetain(
            `${CONFIG.userName} started a CodeMentor AI session. Language: ${STATE.lang}.`,
            'session-start',
            { document_id: `session-${Date.now()}` }
        );
    }
}

function skipConfig() {
    CONFIG.demoMode = true;
    applyConfig();
    document.getElementById('configModal').classList.remove('open');
    showToast('🎮 Demo mode active');
}

function applyConfig() {
    const n = CONFIG.userName;
    document.getElementById('userName').textContent = n;
    document.getElementById('userAvatar').textContent = n[0].toUpperCase();
    document.getElementById('bankLabel').textContent = CONFIG.demoMode ? 'demo mode' : `${BANK_ID()} · ${STUDENT_TAG()}`;
    document.getElementById('memStatusLabel').textContent = CONFIG.demoMode ? 'Demo Mode' : '🟢 Hindsight Live';
    document.getElementById('memStatusSub').textContent = CONFIG.demoMode ? 'Simulated memory' : `tag: ${STUDENT_TAG()}`;
    if (CONFIG.demoMode) loadDemoMemories();
    renderProgress();
    loadChallenge(0);
}

// ── DEMO DATA ──────────────────────────
const DEMO_MEMORIES = [
    { type: 'observation', text: 'Student frequently forgets edge cases with empty arrays — flagged 5 times', context: 'coding-session' },
    { type: 'world', text: 'Preferred language: Python. Secondary: JavaScript', context: 'profile' },
    { type: 'experience', text: 'Recommended recursion exercises after loop confusion', context: 'coding-session' },
    { type: 'observation', text: 'Strong with basic sorting; ready for O(n log n)', context: 'progress' },
    { type: 'world', text: 'Recurring off-by-one errors in binary search implementations', context: 'mistake-pattern' },
    { type: 'experience', text: '12 Python challenges solved, 8 JavaScript challenges solved', context: 'progress' },
];

function loadDemoMemories() {
    STATE.memories = [...DEMO_MEMORIES];
    STATE.memoryCount = STATE.memories.length;
    renderMemoryPanel();
    updateMemBadge();
}

function addMemCard(type, text, ctx) {
    if (STATE.memories.some(m => m.text.substring(0, 40) === text.substring(0, 40))) return;
    STATE.memories.unshift({ type, text, context: ctx });
    STATE.memoryCount++;
    renderMemoryPanel();
    updateMemBadge();
}

function renderMemoryPanel() {
    const el = document.getElementById('memoryPanel');
    if (!STATE.memories.length) { el.innerHTML = '<div style="font-size:12px;color:var(--text-dimmer);text-align:center;padding:16px">No memories yet…</div>'; return; }
    el.innerHTML = STATE.memories.slice(0, 20).map(m => `
    <div class="memory-card">
      <div class="memory-card-type mct-${m.type}">${m.type.toUpperCase()}</div>
      <div class="memory-card-text">${esc(m.text.substring(0, 110))}${m.text.length > 110 ? '…' : ''}</div>
      ${m.context ? `<div class="memory-card-meta">ctx: ${m.context}</div>` : ''}
    </div>`).join('');
}

function updateMemBadge() { document.getElementById('memoryBadge').textContent = `${STATE.memoryCount} memories`; }

// ── LOGGING ────────────────────────────
function logAPI(type, msg) {
    const el = document.getElementById('apiMonitor');
    const ts = new Date().toLocaleTimeString('en', { hour12: false });
    const cls = type === 'error' ? 'log-error' : `log-${type}`;
    el.innerHTML += `<span class="log-ts">[${ts}]</span> <span class="${cls}">${type.toUpperCase()}</span> ${esc(msg)}<br>`;
    el.scrollTop = el.scrollHeight;
}

// ── CHAT ───────────────────────────────
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = ''; autoResize(input);
    appendMsg('user', msg);
    STATE.messagesCount++;
    document.getElementById('sendBtn').disabled = true;

    // RETAIN user message
    await hsRetain(`${CONFIG.userName} (${new Date().toISOString()}): ${msg}`, 'student-message', { document_id: `msg-${Date.now()}` });

    const tid = showTyping();
    let response;

    if (!CONFIG.anthropicKey) {
        // No Groq key — use demo responses
        await sleep(1000 + Math.random() * 700);
        response = demoResponse(msg);
    } else {
        // Pass any code from editor into AI for analysis
        const code = document.getElementById('codeEditor')?.value || '';
        response = await callAI(msg, code);
    }

    removeTyping(tid);
    appendMsg('ai', response);

    // RETAIN AI response
    await hsRetain(`CodeMentor responded to ${CONFIG.userName}: ${response.substring(0, 300)}`, 'mentor-response', { document_id: `resp-${Date.now()}` });

    // Detect + retain mistake patterns
    const mistakeKws = ['forgot', 'missing edge', 'off-by-one', 'wrong base case', 'unhandled'];
    if (mistakeKws.some(k => response.toLowerCase().includes(k))) {
        await hsRetain(`Mistake pattern noted for ${CONFIG.userName}: ${response.substring(0, 150)}`, 'mistake-pattern', { tags: [STUDENT_TAG(), 'mistake'], document_id: `mp-${Date.now()}` });
        if (CONFIG.demoMode) addMemCard('world', `Mistake pattern: ${response.substring(0, 80)}`, 'mistake-pattern');
    }

    document.getElementById('sendBtn').disabled = false;
    if (response.toLowerCase().includes('challenge') && response.includes('tab')) {
        setTimeout(() => switchTab('challenge'), 1600);
    }
}

function demoResponse(msg) {
    const l = msg.toLowerCase();
    if (l.includes('mistake') || l.includes('pattern') || l.includes('error'))
        return `Based on your Hindsight memory bank, here are your top recurring patterns:\n\n**🔴 Off-by-one errors** — 7 occurrences, mostly in binary search. Hindsight flagged this as a persistent observation.\n\n**🟡 Missing edge cases** — 5 occurrences. Empty arrays and null inputs trip you up frequently.\n\n**🟠 Brute-force tendency** — 4 occurrences. You reach for O(n²) before considering hash maps.\n\nHindsight has built observations from these patterns and future challenges will specifically target them. Want a drill?`;
    if (l.includes('challenge') || l.includes('problem') || l.includes('practice'))
        return `I've prepared a personalized challenge in the **Challenges tab** 🎯\n\nHindsight recalled you're working on hash maps with a history of off-by-one errors, so I selected a problem targeting exactly that. Switching you over now...`;
    if (l.includes('learn') || l.includes('next') || l.includes('path'))
        return `Your personalized learning path (based on Hindsight observations):\n\n✅ **Arrays & Loops** — Mastered\n✅ **String Manipulation** — Mastered\n🔵 **Hash Maps** — In progress (3/6 challenges)\n📍 **Stacks & Queues** — Hindsight recommends this next (gap detected)\n🔮 **Recursion** — Unlocks after Stacks\n🔮 **Trees & Graphs** — Advanced track\n\nYou're making great progress! Want to also build JavaScript parity with your Python skills?`;
    if (l.includes('array') || l.includes('loop'))
        return `Arrays — your foundation! Memory says you've mastered iteration but miss empty-array guards.\n\n\`\`\`python\ndef process(arr):\n    if not arr:  # ← You often skip this!\n        return []\n    return [x * 2 for x in arr]\n\`\`\`\n\nThis "guard clause" pattern is second nature for senior devs. Want a targeted exercise?`;
    if (l.includes('recursion'))
        return `Recursion — great! Memory shows you understand loops well, so let's bridge from there.\n\n\`\`\`python\ndef factorial(n):\n    if n <= 1:   # base case — define this FIRST\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(5))  # 120\n\`\`\`\n\n**Rule**: Every recursive function needs (1) a base case and (2) movement toward it.\n\n*I've retained this session — next time you log in, I'll suggest recursion challenges!* 🧠`;
    return `Great question! I checked your memory bank — based on your sessions in **${STATE.lang}**, here's personalized guidance.\n\nCould you share more context or paste some code? I'll compare it against your known patterns and give targeted feedback.\n\n*This conversation is being retained in Hindsight for future personalization.*`;
}

// ── ADVANCED AI ENGINE ──────────────────

function analyzeCode(code) {
    if (!code || code.trim().length < 5) return null;
    return {
        hasEdgeCase: /if\s*\(?.*(length|len).*0|if not/.test(code),
        usesLoop: /(for|while)/.test(code),
        nestedLoop: /(for[\s\S]{0,200}for)/.test(code),
        usesHashMap: /(Map|dict|\{.*:.*\})/.test(code),
        recursion: /return\s+.*\w+\s*\(/.test(code),
        conditionCount: (code.match(/if/g) || []).length,
        timeComplexityHint: (() => {
            if (/(for[\s\S]{0,200}for)/.test(code)) return 'O(n²) — nested loops detected';
            if (/(for|while)/.test(code)) return 'O(n) — single loop';
            return 'O(1) — no loops';
        })()
    };
}

function getMentorMode() {
    const modes = ['strict reviewer', 'supportive teacher', 'technical interviewer'];
    return modes[Math.floor(Math.random() * modes.length)];
}

function buildMemoryRules(memoriesText) {
    return `Student Behavior Insights (from Hindsight memory):
${memoriesText || 'No prior data — first session'}

Mentoring rules derived from memory:
- Always check edge cases first based on student history
- Watch for off-by-one errors (recurring pattern)
- Suggest optimal solutions over brute force
- Be direct and specific — no generic advice`;
}

function buildSystemPrompt(memories, analysis) {
    const analysisBlock = analysis
        ? `Code Analysis (auto-detected):
- Edge case handled: ${analysis.hasEdgeCase ? '✅' : '❌ MISSING'}
- Loops: ${analysis.usesLoop ? 'Yes' : 'No'} | Nested: ${analysis.nestedLoop ? '⚠️ Yes' : 'No'}
- Hash map used: ${analysis.usesHashMap ? 'Yes' : 'No'}
- Recursion: ${analysis.recursion ? 'Yes' : 'No'}
- Conditions: ${analysis.conditionCount}
- Estimated complexity: ${analysis.timeComplexityHint}`
        : 'No code submitted — conversational mode';

    return `You are an elite coding mentor currently acting as: ${getMentorMode()}.

${buildMemoryRules(memories)}

${analysisBlock}

Student name: ${CONFIG.userName} | Language: ${STATE.lang}

When code is provided, respond with this exact format:
🔍 **Issue** — what's wrong
⚠️ **Why** — explain the root cause
✅ **Fix** — corrected code snippet
🚀 **Optimized Solution** — best approach
⏱ **Complexity** — time & space

For conversational questions (no code), give clear personalized explanations based on the student memory above. Use markdown and code blocks. Be concise and precise.`;
}

async function callAI(userMsg, code = '') {
    if (!CONFIG.anthropicKey) return demoResponse(userMsg);

    const memories = CONFIG.hindsightKey ? await hsRecall(userMsg) : '';
    const analysis = analyzeCode(code);
    const systemPrompt = buildSystemPrompt(memories, analysis);

    try {
        logAPI('reflect', `Calling GPT-4o-mini [mode: ${systemPrompt.match(/acting as: (.+)\./)?.[1] || 'mentor'}]…`);
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.anthropicKey}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                max_tokens: 900,
                temperature: 0.7,
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...STATE.history.slice(-6),
                    {
                        role: 'user', content: userMsg + (code ? `

MY CODE:
\`\`\`${STATE.lang.toLowerCase()}
${code}
\`\`\`` : '')
                    }
                ],
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            logAPI('error', `Groq error: ${err?.error?.message || res.status}`);
            return demoResponse(userMsg);
        }

        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || demoResponse(userMsg);
        logAPI('reflect', `✓ Groq responded (${reply.length} chars)`);
        STATE.history.push({ role: 'user', content: userMsg }, { role: 'assistant', content: reply });
        return reply;
    } catch (e) {
        logAPI('error', 'AI call failed: ' + e.message);
        return demoResponse(userMsg);
    }
}

// Kept for backward compat
async function callClaude(userMsg, memories) { return callAI(userMsg); }

// ── LIVE FEEDBACK (real-time as you type) ──
let liveTimer;
function initLiveFeedback() {
    const editor = document.getElementById('codeEditor');
    if (!editor) return;
    editor.addEventListener('input', () => {
        clearTimeout(liveTimer);
        liveTimer = setTimeout(async () => {
            const code = editor.value;
            if (code.length < 30 || !CONFIG.anthropicKey) return;
            const analysis = analyzeCode(code);
            if (!analysis) return;
            // Show instant analysis without calling AI (fast, free)
            const issues = [];
            if (!analysis.hasEdgeCase) issues.push('⚠️ No edge case check detected');
            if (analysis.nestedLoop) issues.push('⚠️ Nested loops — consider O(n) approach');
            if (analysis.conditionCount === 0) issues.push('💡 No conditions found — logic complete?');
            if (issues.length) showLiveFeedback(issues.join('<br>') + `<br><span style="color:var(--text-dimmer);font-size:10px">${analysis.timeComplexityHint}</span>`);
            else showLiveFeedback(`✅ Looking good! Complexity: ${analysis.timeComplexityHint}`);
        }, 800);
    });
}

function showLiveFeedback(text) {
    let panel = document.getElementById('liveFeedback');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'liveFeedback';
        panel.style.cssText = `
      position:absolute; bottom:58px; right:16px;
      width:260px; max-height:120px; overflow:auto;
      background:var(--surface); border:1px solid var(--accent2);
      padding:10px 12px; border-radius:10px;
      font-size:11px; font-family:'DM Mono',monospace;
      z-index:50; color:var(--text-dim); line-height:1.6;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    `;
        // Close button
        const close = document.createElement('div');
        close.innerHTML = '✕';
        close.style.cssText = 'position:absolute;top:6px;right:8px;cursor:pointer;color:var(--text-dimmer);font-size:10px';
        close.onclick = () => panel.remove();
        panel.appendChild(close);
        document.querySelector('.challenge-right')?.appendChild(panel);
    }
    const content = panel.querySelector('.fb-content') || (() => {
        const d = document.createElement('div');
        d.className = 'fb-content';
        panel.appendChild(d);
        return d;
    })();
    content.innerHTML = text;
}

function appendMsg(role, text) {
    const c = document.getElementById('chatMessages');
    const isAI = role === 'ai';
    const d = document.createElement('div');
    d.className = `msg ${role}`;
    const ts = new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
    d.innerHTML = `
    <div class="msg-avatar">${isAI ? '🤖' : '👤'}</div>
    <div class="msg-content">
      <div class="msg-sender">${isAI ? 'CodeMentor AI' : CONFIG.userName} · ${ts}</div>
      <div class="msg-bubble">${fmtMsg(text)}</div>
    </div>`;
    c.appendChild(d); c.scrollTop = c.scrollHeight;
}

function fmtMsg(t) {
    return t
        .replace(/```(\w*)\n([\s\S]*?)```/g, (_, l, c) => `<pre>${esc(c)}</pre>`)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, `<code style="font-family:'DM Mono',monospace;background:var(--surface2);padding:1px 5px;border-radius:4px;font-size:12px">$1</code>`)
        .replace(/\n/g, '<br>');
}

function showTyping() {
    const c = document.getElementById('chatMessages');
    const id = 'typing-' + Date.now();
    const d = document.createElement('div');
    d.className = 'msg ai'; d.id = id;
    d.innerHTML = `<div class="msg-avatar">🤖</div><div class="msg-content"><div class="msg-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div></div>`;
    c.appendChild(d); c.scrollTop = c.scrollHeight; return id;
}
function removeTyping(id) { document.getElementById(id)?.remove(); }
function sendQuick(t) { document.getElementById('chatInput').value = t; switchTab('chat'); sendMessage(); }
function handleKey(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }
function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 150) + 'px'; }
function insertCodeBlock() { const ta = document.getElementById('chatInput'); ta.value += `\n\`\`\`${STATE.lang.toLowerCase()}\n\n\`\`\``; ta.focus(); }

// ── CHALLENGES ─────────────────────────
const CHALLENGES = [
    {
        title: "Two Sum — Hash Map Focus", diff: "easy", tags: ["arrays", "hash-map", "O(n)"],
        rationale: "Hindsight flagged you use nested loops when a hash map would be O(n). This challenge builds that reflex.",
        desc: "Given an array <code>nums</code> and a <code>target</code>, return indices of the two numbers that add up to target. Exactly one solution exists.",
        examples: [{ input: "nums=[2,7,11,15], target=9", output: "[0,1]" }, { input: "nums=[3,2,4], target=6", output: "[1,2]" }],
        starter: {
            Python: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}  # value → index
    # Your solution here
    pass

print(two_sum([2,7,11,15], 9))  # Expected: [0, 1]`,
            JavaScript: `function twoSum(nums, target) {
  const seen = new Map();
  // Your solution here
}
console.log(twoSum([2,7,11,15], 9));`,
            TypeScript: `function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>();
  // Your solution here
  return [];
}
console.log(twoSum([2,7,11,15], 9));`,
            Java: `import java.util.HashMap;
class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> seen = new HashMap<>();
        // Your solution here
        return new int[]{};
    }
    public static void main(String[] args) {
        System.out.println(java.util.Arrays.toString(
            new Solution().twoSum(new int[]{2,7,11,15}, 9)));
    }
}`,
            'C++': `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;
vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int,int> seen;
    // Your solution here
    return {};
}
int main() {
    vector<int> nums = {2,7,11,15};
    auto res = twoSum(nums, 9);
    cout << res[0] << ", " << res[1] << endl;
}`,
            Go: `package main
import "fmt"
func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    // Your solution here
    return nil
}
func main() {
    fmt.Println(twoSum([]int{2,7,11,15}, 9))
}`
        }
    },
    {
        title: "Valid Parentheses", diff: "medium", tags: ["stack", "string", "brackets"],
        rationale: "Your memory bank shows no stack experience. This is the classic problem that unlocks stack intuition.",
        desc: "Given string <code>s</code> with <code>'('</code>, <code>')'</code>, <code>'{'</code>, <code>'}'</code>, <code>'['</code>, <code>']'</code> — determine if it's valid. Brackets must close in correct order.",
        examples: [{ input: `s="()[]{}"`, output: "true" }, { input: `s="(]"`, output: "false" }],
        starter: {
            Python: `def is_valid(s: str) -> bool:
    stack = []
    mapping = {')':'(', '}':'{', ']':'['}
    # Your solution here
    pass

print(is_valid("()[]{}"))  # True
print(is_valid("(]"))       # False`,
            JavaScript: `function isValid(s) {
  const stack = [];
  const map = {')':'(', '}':'{', ']':'['};
  // Your solution here
}
console.log(isValid("()[]{}"));`,
            TypeScript: `function isValid(s: string): boolean {
  const stack: string[] = [];
  const map: Record<string,string> = {')':'(', '}':'{', ']':'['};
  // Your solution here
  return false;
}
console.log(isValid("()[]{}"));`,
            Java: `class Solution {
    public boolean isValid(String s) {
        java.util.Stack<Character> stack = new java.util.Stack<>();
        // Your solution here
        return false;
    }
    public static void main(String[] args) {
        System.out.println(new Solution().isValid("()[]{}"));
    }
}`,
            'C++': `#include <iostream>
#include <stack>
#include <string>
using namespace std;
bool isValid(string s) {
    stack<char> st;
    // Your solution here
    return false;
}
int main() {
    cout << isValid("()[]{}") << endl;
}`,
            Go: `package main
import "fmt"
func isValid(s string) bool {
    stack := []rune{}
    // Your solution here
    return false
}
func main() {
    fmt.Println(isValid("()[]{}"))
}`
        }
    },
    {
        title: "Binary Search — Off-By-One Focus", diff: "hard", tags: ["binary-search", "off-by-one", "O(log n)"],
        rationale: "Hindsight has flagged off-by-one errors as your #1 mistake across sessions. Let's drill binary search until it's automatic.",
        desc: "Given sorted array <code>nums</code> and <code>target</code>, return its index or -1. Must be O(log n). Pay close attention to your bounds!",
        examples: [{ input: "nums=[-1,0,3,5,9,12], target=9", output: "4" }, { input: "nums=[-1,0,3,5,9,12], target=2", output: "-1" }],
        starter: {
            Python: `def binary_search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    while left <= right:  # ← note the <=
        mid = left + (right - left) // 2
        # Your logic here
        pass
    return -1

print(binary_search([-1,0,3,5,9,12], 9))  # 4`,
            JavaScript: `function search(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    // Your logic here
  }
  return -1;
}
console.log(search([-1,0,3,5,9,12], 9));`,
            TypeScript: `function search(nums: number[], target: number): number {
  let left = 0, right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    // Your logic here
  }
  return -1;
}
console.log(search([-1,0,3,5,9,12], 9));`,
            Java: `class Solution {
    public int search(int[] nums, int target) {
        int left = 0, right = nums.length - 1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            // Your logic here
        }
        return -1;
    }
    public static void main(String[] args) {
        System.out.println(new Solution().search(
            new int[]{-1,0,3,5,9,12}, 9));
    }
}`,
            'C++': `#include <iostream>
#include <vector>
using namespace std;
int search(vector<int>& nums, int target) {
    int left = 0, right = nums.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        // Your logic here
    }
    return -1;
}
int main() {
    vector<int> nums = {-1,0,3,5,9,12};
    cout << search(nums, 9) << endl;
}`,
            Go: `package main
import "fmt"
func search(nums []int, target int) int {
    left, right := 0, len(nums)-1
    for left <= right {
        mid := left + (right-left)/2
        // Your logic here
    }
    return -1
}
func main() {
    fmt.Println(search([]int{-1,0,3,5,9,12}, 9))
}`
        }
    },
];

function loadChallenge(idx) {
    STATE.challengeIdx = idx % CHALLENGES.length;
    const ch = CHALLENGES[STATE.challengeIdx];
    const ext = { Python: 'py', JavaScript: 'js', TypeScript: 'ts', Java: 'java', 'C++': 'cpp', Go: 'go' };
    document.getElementById('editorFilename').textContent = `solution.${ext[STATE.lang] || 'py'}`;
    document.getElementById('codeEditor').value = ch.starter[STATE.lang] || ch.starter['Python'];
    document.getElementById('challengeDesc').innerHTML = `
    <div class="challenge-header">
      <div class="challenge-title">${ch.title}</div>
      <span class="diff-badge diff-${ch.diff}">${ch.diff.toUpperCase()}</span>
    </div>
    <div class="challenge-meta">${ch.tags.map(t => `<span class="meta-chip">${t}</span>`).join('')}</div>
    <div class="memory-rationale">🧠 <strong>Why this challenge?</strong><br>${ch.rationale}</div>
    <div class="challenge-desc">${ch.desc}</div>
    <div>
      <div class="example-label" style="margin-bottom:5px">EXAMPLES</div>
      <div class="examples-block">${ch.examples.map(ex => `
        <div class="example"><div class="example-label">Input</div>${ex.input}<div class="example-label" style="margin-top:5px">Output</div>${ex.output}</div>`).join('')}
      </div>
    </div>`;
    logAPI('recall', `Challenge loaded — targeting: ${ch.tags.join(', ')}`);
}

function loadNextChallenge() { loadChallenge(STATE.challengeIdx + 1); showToast('📚 Next challenge loaded!'); }

async function submitSolution() {
    const code = document.getElementById('codeEditor').value.trim();
    if (!code) { showToast('Write some code first!'); return; }
    showToast('🔍 Analyzing…');
    const ch = CHALLENGES[STATE.challengeIdx];
    const hasEdge = /if not |if len|if \(!|\.length === 0/.test(code);

    // RETAIN: solution attempt with rich context + per-student observation scoping
    await hsRetain(
        `${CONFIG.userName} submitted solution for "${ch.title}" in ${STATE.lang}.\nEdge cases handled: ${hasEdge}.\nCode:\n${code.substring(0, 400)}`,
        'solution-attempt',
        { document_id: `sol-${ch.title.replace(/\s/g, '-')}-${Date.now()}`, tags: [STUDENT_TAG(), `lang:${STATE.lang.toLowerCase()}`, `topic:${ch.tags[0]}`, 'solution'], observation_scopes: 'per_tag' }
    );

    STATE.solvedCount++;
    STATE.accuracy.total++;
    if (hasEdge) STATE.accuracy.correct++;
    STATE.langUsed.add(STATE.lang);
    if (!hasEdge) {
        STATE.mistakePatterns['Missing edge cases'] = (STATE.mistakePatterns['Missing edge cases'] || 0) + 1;
        await hsRetain(`${CONFIG.userName} submitted without edge case handling for "${ch.title}". Recurring pattern.`, 'mistake-pattern', { tags: [STUDENT_TAG(), 'mistake', 'edge-case'], document_id: `mp-ec-${Date.now()}` });
        if (CONFIG.demoMode) addMemCard('world', `Missing edge case in "${ch.title}" — pattern reinforced`, 'mistake-pattern');
    } else {
        await hsRetain(`${CONFIG.userName} handled edge cases correctly in "${ch.title}" — improvement!`, 'progress', { tags: [STUDENT_TAG(), 'improvement'], document_id: `imp-${Date.now()}` });
        if (CONFIG.demoMode) addMemCard('observation', `Improvement: edge case handled in "${ch.title}"`, 'progress');
    }

    renderProgress();
    setTimeout(() => {
        switchTab('chat');
        appendMsg('ai', hasEdge
            ? `Great work on **${ch.title}**! ✅ You handled edge cases — Hindsight has logged this improvement to your observation bank.\n\nReady for the next challenge?`
            : `I reviewed your **${ch.title}** solution. Core logic looks solid, but you skipped the edge case check again — that's ${(STATE.mistakePatterns['Missing edge cases'] || 1)}x Hindsight has flagged this pattern now.\n\nI've retained this as a world fact in your memory bank. Future challenges will include edge case emphasis. Want me to show the defensive guard clause pattern?`);
        showToast(hasEdge ? '✅ Nice work!' : '⚠️ Mistake pattern retained');
    }, 600);
}

async function getHint() {
    const ch = CHALLENGES[STATE.challengeIdx];
    switchTab('chat');
    const hints = {
        'hash-map': 'Iterate once. For each element, check if its complement (target - num) exists in a dict you\'re building. dict[complement] → index.',
        'stack': 'Push opening brackets onto a stack. On a closing bracket, pop and verify it matches. Stack empty at end = valid.',
        'binary-search': 'Use `while left <= right`. Set `mid = left + (right-left)//2`. If nums[mid]==target: return mid. elif nums[mid]<target: left=mid+1. else: right=mid-1.',
    };
    const hint = hints[ch.tags[0]] || 'Break it down: (1) edge case / base case, (2) core logic, (3) return value.';
    appendMsg('ai', `💡 **Hint for "${ch.title}"**\n\n${hint}\n\n*Hint retained in Hindsight — I'll remember you needed this.*`);
    STATE.hintsUsed++;
    await hsRetain(`${CONFIG.userName} requested a hint for "${ch.title}". Topic: ${ch.tags[0]}.`, 'hint-request', { document_id: `hint-${Date.now()}` });
}

// ── PROGRESS ───────────────────────────
function renderProgress() {
    const acc = STATE.accuracy.total > 0
        ? Math.round((STATE.accuracy.correct / STATE.accuracy.total) * 100)
        : 0;
    const mins = Math.floor((Date.now() - STATE.sessionStart) / 60000);
    const sessionTime = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h${mins % 60}m`;
    const langsArr = Array.from(STATE.langUsed);

    document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="stat-label">Solved This Session</div><div class="stat-value">${STATE.solvedCount}</div><div class="stat-sub">${STATE.accuracy.total} submitted total</div></div>
    <div class="stat-card"><div class="stat-label">Memories Stored</div><div class="stat-value">${STATE.memoryCount}</div><div class="stat-sub">Via Hindsight retain()</div></div>
    <div class="stat-card"><div class="stat-label">Messages Sent</div><div class="stat-value" style="color:var(--accent4)">${STATE.messagesCount}</div><div class="stat-sub">This session</div></div>
    <div class="stat-card"><div class="stat-label">Accuracy</div><div class="stat-value" style="color:var(--accent2)">${STATE.accuracy.total > 0 ? acc + '%' : '—'}</div><div class="stat-sub">${STATE.accuracy.correct}/${STATE.accuracy.total} with edge cases</div></div>
    <div class="stat-card"><div class="stat-label">Languages Used</div><div class="stat-value">${langsArr.length}</div><div class="stat-sub">${langsArr.join(', ')}</div></div>
    <div class="stat-card"><div class="stat-label">Session Time</div><div class="stat-value" style="color:var(--accent3)" id="sessionTime">${sessionTime}</div><div class="stat-sub">Hints used: ${STATE.hintsUsed}</div></div>`;

    // Mistake patterns — only show ones actually recorded this session, or all if none yet
    const sessionMistakes = Object.keys(STATE.mistakePatterns).length > 0
        ? STATE.mistakePatterns
        : { 'No mistakes recorded yet — start solving challenges!': 0 };
    document.getElementById('mistakeList').innerHTML = Object.entries(sessionMistakes).sort((a, b) => b[1] - a[1]).map(([n, f]) => `<div class="mistake-item"><span>${n}</span>${f > 0 ? `<span class="mistake-freq">${f}x</span>` : ''}</div>`).join('');
    document.getElementById('pathList').innerHTML = `
    <div class="path-item"><div class="path-icon pi-done">✅</div><div><div class="path-label">Arrays & Basic Loops</div><div class="path-sub">Completed · 8 challenges</div></div></div>
    <div class="path-item"><div class="path-icon pi-done">✅</div><div><div class="path-label">String Manipulation</div><div class="path-sub">Completed · 4 challenges</div></div></div>
    <div class="path-item" style="border-color:rgba(123,108,255,0.35)"><div class="path-icon pi-next">🔵</div><div><div class="path-label">Hash Maps & Sets</div><div class="path-sub">In progress · 3/6 challenges</div></div></div>
    <div class="path-item" style="border-color:rgba(79,255,176,0.2)"><div class="path-icon pi-next">📍</div><div><div class="path-label">Stacks & Queues</div><div class="path-sub">Next — Hindsight recommends this gap</div></div></div>
    <div class="path-item"><div class="path-icon pi-future">🔮</div><div><div class="path-label">Recursion & Backtracking</div><div class="path-sub">Unlocks after Stacks</div></div></div>
    <div class="path-item"><div class="path-icon pi-future">🔮</div><div><div class="path-label">Trees & Graphs</div><div class="path-sub">Advanced · ~2 weeks</div></div></div>`;
}

// ── NAV ────────────────────────────────
function switchTab(name) {
    ['chat', 'challenge', 'progress'].forEach(t => {
        document.getElementById('view-' + t).style.display = t === name ? 'flex' : 'none';
        document.getElementById('tab-' + t)?.classList.toggle('active', t === name);
        document.getElementById('nav-' + t)?.classList.toggle('active', t === name);
    });
}

function selectLang(btn, lang) {
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); STATE.lang = lang;
    document.getElementById('activeLangLabel').textContent = lang;
    // Reload challenge starter code for the new language
    loadChallenge(STATE.challengeIdx);
    hsRetain(`${CONFIG.userName} switched to ${lang}`, 'language-switch', { document_id: `lang-${Date.now()}` });
    showToast(`Language → ${lang}`);
}

// ── UTILS ──────────────────────────────
function showToast(msg, err = false) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = 'toast show' + (err ? ' error' : '');
    setTimeout(() => t.className = 'toast', 2500);
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
setInterval(() => { const el = document.getElementById('sessionTime'); if (el) { const m = Math.floor((Date.now() - STATE.sessionStart) / 60000); el.textContent = m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60}m`; } }, 15000);

// ── BOOT ───────────────────────────────
// Pre-fill modal with saved values
document.getElementById('cfgHindsightUrl').value = CONFIG.hindsightUrl;
document.getElementById('cfgHindsightKey').value = CONFIG.hindsightKey;
document.getElementById('cfgAnthropicKey').value = CONFIG.anthropicKey;
document.getElementById('cfgUserName').value = CONFIG.userName;

// Auto-skip modal if keys are already saved
if (CONFIG.hindsightKey) {
    document.getElementById('configModal').classList.remove('open');
    document.getElementById('modeBadge').textContent = '🟢 Hindsight Live';
    document.getElementById('modeBadge').className = 'badge live';
}

applyConfig();
logAPI('retain', CONFIG.hindsightKey ? 'Keys loaded from storage — Hindsight live' : 'System ready — enter keys to go live');
applyTheme(savedTheme);
initLiveFeedback();