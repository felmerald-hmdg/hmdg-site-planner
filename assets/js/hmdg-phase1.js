/**
 * HMDG Site Planner — Phase 1 JS
 *
 * Flow:
 *   1. Hero      — project description input
 *   2. Chat      — guided conversational questionnaire (split-screen)
 *   3. Results   — AI-generated plan (brief / sitemap / wireframes / dev notes)
 *   4. Send      — approve + send to Project Manager
 *   5. Confirmation
 *
 * Vanilla JavaScript only. No jQuery.
 * Version: 2.0.0
 */

'use strict';

const HMDG_Phase1 = (() => {

    // -------------------------------------------------------------------------
    // Module state
    // -------------------------------------------------------------------------
    let planData        = null;   // Current generated plan
    let lastFormData    = null;   // Data sent to AI (used for regeneration)
    let lastClientEmail = '';     // For prefilling the Send step
    let chatEngine      = null;   // Chat engine instance

    // -------------------------------------------------------------------------
    // Question definitions — drives the entire chat flow
    // -------------------------------------------------------------------------
    const CHAT_QUESTIONS = [
        {
            key:         'business_name',
            message:     'To get started, could you tell me the name of your company, or your own name if this is a personal website?',
            bold:        'What is your business or website name?',
            type:        'text',
            placeholder: 'e.g. Acme Corp',
            hint:        'Enter the name that will appear on your website — your business or personal brand.',
            required:    true,
            section:     'Client',
            label:       'Client',
        },
        {
            key:         'business_type',
            message:     'Thanks! Now, could you please specify the type of business you have? For example, is it a clinic, an agency, or something else?',
            bold:        'What is the specific description of your business operation type?',
            type:        'chips_single',
            chips:       ['Agency', 'E-commerce', 'Restaurant / Food', 'Medical / Healthcare', 'Real Estate', 'Law Firm', 'Fitness / Wellness', 'Salon / Beauty', 'Tech Startup', 'Education', 'Non-Profit', 'Construction', 'Finance / Accounting', 'Photography / Creative', 'Consulting', 'Other'],
            placeholder: 'Or type your business type\u2026',
            hint:        'Choose the category that best describes your business, or type your own.',
            required:    true,
            section:     'Business Type',
            label:       'Business Type',
        },
        {
            key:         'description',
            message:     'Great! To understand your website better, can you elaborate on what your {business_name} does or showcases? For example, do you provide services, sell products, offer information, or something else?',
            bold:        'What does your business behind the website do or showcase?',
            type:        'chips_single',
            chips:       ['Provide {business_type} services', 'Sell {business_type} products', 'Offer {business_type} information'],
            dynamic:     true,
            placeholder: 'Or describe in your own words\u2026',
            hint:        'Briefly describe the primary purpose of your website.',
            required:    false,
            section:     'Showcase',
            label:       'Showcase',
        },
        {
            key:         'services',
            message:     'What specific services or products does {business_name} offer?',
            bold:        'Describe your main services or products.',
            type:        'textarea',
            placeholder: 'e.g. Physiotherapy assessments, sports massage, rehabilitation programs\u2026',
            hint:        'List your key services or products. The more specific you are, the more accurate your site plan will be.',
            required:    true,
            section:     'Services',
            label:       'Services',
        },
        {
            key:         'goals',
            message:     'What are the main goals for your website? Feel free to pick from the suggestions or write your own.',
            bold:        'What are your main website goals?',
            type:        'chips_single',
            chips:       ['Generate leads', 'Increase sales', 'Build brand awareness', 'Provide information', 'Attract talent', 'Grow email list', 'Sell products online'],
            placeholder: 'Or describe your goals\u2026',
            hint:        'What do you want visitors to do on your website? What business outcome are you aiming for?',
            required:    true,
            section:     'Goals',
            label:       'Goals',
        },
        {
            key:         'audience',
            message:     'Who is the target audience for this website?',
            bold:        'Who is your ideal customer or visitor?',
            type:        'textarea',
            placeholder: 'e.g. Adults aged 25\u201345 experiencing sports injuries, based in Manchester\u2026',
            hint:        'Describe the people who will most benefit from your website \u2014 age, interests, location, and pain points.',
            required:    true,
            section:     'Goals',
            label:       'Target Audience',
        },
        {
            key:         'contact_name',
            message:     "Almost there! I just need a few contact details. What\u2019s your name?",
            bold:        'What is your name or the contact person for this project?',
            type:        'text',
            placeholder: 'e.g. John Smith',
            hint:        'Enter the name of the person we should contact regarding this project.',
            required:    true,
            section:     'Client',
            label:       'Contact',
        },
        {
            key:         'client_email',
            message:     "What\u2019s the best email address to reach you?",
            bold:        'Your email address?',
            type:        'email',
            placeholder: 'e.g. john@yourbusiness.com',
            hint:        "We\u2019ll use this to send your plan and keep you updated on the project.",
            required:    true,
            section:     'Client',
            label:       'Email',
        },
        {
            key:         'client_phone',
            message:     'And your phone number?',
            bold:        'Your contact number?',
            type:        'tel',
            placeholder: 'e.g. +44 7700 900000',
            hint:        'Useful for our team to reach you quickly if needed.',
            required:    true,
            section:     'Client',
            label:       'Phone',
        },
        {
            key:         'location',
            message:     'Where is your business based?',
            bold:        'Your business location?',
            type:        'chips_single',
            chips:       ['United Kingdom', 'United States', 'Philippines', 'Australia', 'Canada', 'Other'],
            placeholder: 'Or type your city, region, or country\u2026',
            hint:        'Enter the location where your business operates.',
            required:    true,
            section:     'Business Type',
            label:       'Location',
        },
        {
            key:         'language',
            message:     'What language should the website be in?',
            bold:        'Preferred website language?',
            type:        'chips_single',
            chips:       ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Filipino', 'Other'],
            placeholder: 'Or type a language\u2026',
            hint:        'Select the primary language for your website content.',
            required:    false,
            section:     'Business Type',
            label:       'Language',
        },
        {
            key:         'tone',
            message:     'What tone should the website have?',
            bold:        "What\u2019s your preferred tone of voice?",
            type:        'chips_single',
            chips:       ['Professional', 'Friendly & Approachable', 'Bold & Modern', 'Minimalist', 'Luxury & Premium', 'Playful & Fun', 'Authoritative & Trustworthy'],
            placeholder: 'Or describe your tone\u2026',
            hint:        'The tone shapes how your website \u201cspeaks\u201d to visitors \u2014 choose what best fits your brand personality.',
            required:    false,
            section:     'Branding',
            label:       'Tone',
        },
        {
            key:         'brand_style',
            message:     'What visual style do you prefer for the website?',
            bold:        'Preferred visual / brand style?',
            type:        'chips_single',
            chips:       ['Modern & Clean', 'Bold & Colorful', 'Minimal & White Space', 'Corporate', 'Creative & Artistic', 'Dark & Edgy', 'Warm & Earthy'],
            placeholder: 'Or describe your style\u2026',
            hint:        'This shapes the overall look and feel \u2014 colors, typography, and layout approach.',
            required:    false,
            section:     'Branding',
            label:       'Brand Style',
        },
        {
            key:         'showcase',
            message:     'Do you need a portfolio or gallery section to showcase your work?',
            bold:        'Include a portfolio / showcase section?',
            type:        'chips_single',
            chips:       ['Yes', 'No'],
            placeholder: '',
            hint:        'A portfolio or gallery lets you display past work, case studies, or before-and-after photos.',
            required:    false,
            section:     'Showcase',
            label:       'Portfolio',
        },
        {
            key:         'features',
            message:     'Which features would you like on the website? Select all that apply, then click Done.',
            bold:        'Key website features?',
            type:        'chips_multi',
            chips:       ['Contact Form', 'Portfolio / Gallery', 'Blog', 'Booking System', 'Live Chat', 'E-commerce / Shop', 'Client Portal', 'FAQ Section', 'Testimonials', 'Team Page', 'Events', 'Newsletter Signup'],
            placeholder: 'Or type additional features\u2026',
            hint:        'Select the features most important for your business. You can select multiple.',
            required:    false,
            section:     'Features',
            label:       'Features',
        },
        {
            key:         'integrations',
            message:     'Any specific integrations or third-party tools you need? Select all that apply.',
            bold:        'Required integrations?',
            type:        'chips_multi',
            chips:       ['CRM', 'Email Marketing', 'Payment Gateway', 'Booking Software', 'Google Analytics', 'Facebook Pixel', 'WhatsApp', 'Social Media'],
            placeholder: 'Or type additional integrations\u2026',
            hint:        'These are platforms or tools your website needs to connect with.',
            required:    false,
            section:     'Integrations',
            label:       'Integrations',
        },
        {
            key:         'competitors',
            message:     'Do you have any competitor websites we should be aware of? (Optional \u2014 skip if not applicable)',
            bold:        'Competitor websites?',
            type:        'textarea',
            placeholder: 'e.g. www.competitor1.com, www.competitor2.com',
            hint:        'Sharing competitor sites helps us understand your market and design something that stands out.',
            required:    false,
            optional:    true,
            section:     'Additional',
            label:       'Competitors',
        },
        {
            key:         'hosting',
            message:     'Do you have a hosting platform in mind? (Optional)',
            bold:        'Hosting platform?',
            type:        'text',
            placeholder: 'e.g. SiteGround, WP Engine, Cloudways\u2026',
            hint:        "If you already have hosting or a preference, let us know. Otherwise we\u2019ll recommend something.",
            required:    false,
            optional:    true,
            section:     'Additional',
            label:       'Hosting',
        },
        {
            key:         'requirements',
            message:     "Finally, any other specific requirements or notes you\u2019d like us to know? (Optional)",
            bold:        'Additional requirements or notes?',
            type:        'textarea',
            placeholder: 'e.g. Must be ADA accessible, needs to match existing brand guide\u2026',
            hint:        "This is your chance to tell us anything else that\u2019s important for your project.",
            required:    false,
            optional:    true,
            section:     'Additional',
            label:       'Notes',
        },
    ];

    // -------------------------------------------------------------------------
    // Init
    // -------------------------------------------------------------------------
    function init() {
        chatEngine = initChat();
        bindHero();
        initTypingPlaceholder();
        bindResults();
        bindSend();
        bindConfirmation();
    }

    // -------------------------------------------------------------------------
    // Step navigation
    // -------------------------------------------------------------------------
    function showStep(id) {
        document.querySelectorAll('.hmdg-step').forEach(el => {
            el.hidden = (el.id !== id);
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // -------------------------------------------------------------------------
    // STEP 1 — Typing placeholder animation
    // -------------------------------------------------------------------------
    function initTypingPlaceholder() {
        const input = document.getElementById('hmdg-hero-prompt');
        if (!input) return;

        const phrase   = 'Describe your project, and get an AI-powered wireframe in minutes...';
        let charIndex  = 0;
        let typeTimer  = null;
        let pauseTimer = null;
        let blinkTimer = null;
        let cursorOn   = true;
        let running    = false;

        const SPEED_TYPE  = 46;   // ms per character
        const SPEED_PAUSE = 2200; // ms pause at end before reset
        const BLINK_RATE  = 480;  // ms per blink
        const BLINK_COUNT = 5;    // blinks before reset

        function clearAll() {
            clearTimeout(typeTimer);
            clearTimeout(pauseTimer);
            clearInterval(blinkTimer);
        }

        function setPlaceholder(text) {
            input.placeholder = text;
        }

        function typeNext() {
            if (!running) return;
            if (charIndex < phrase.length) {
                charIndex++;
                setPlaceholder(phrase.slice(0, charIndex) + '\u2502'); // block cursor
                typeTimer = setTimeout(typeNext, SPEED_TYPE);
            } else {
                // Finished typing — blink the cursor then pause and reset
                let blinks = 0;
                blinkTimer = setInterval(() => {
                    cursorOn = !cursorOn;
                    setPlaceholder(phrase + (cursorOn ? '\u2502' : ' '));
                    if (++blinks >= BLINK_COUNT * 2) {
                        clearInterval(blinkTimer);
                        setPlaceholder(phrase);
                        pauseTimer = setTimeout(resetCycle, SPEED_PAUSE);
                    }
                }, BLINK_RATE);
            }
        }

        function resetCycle() {
            if (!running) return;
            charIndex = 0;
            cursorOn  = true;
            setPlaceholder('');
            typeTimer = setTimeout(typeNext, 400);
        }

        function startAnimation() {
            if (running || input.value.trim()) return;
            running   = true;
            charIndex = 0;
            typeTimer = setTimeout(typeNext, 900);
        }

        function stopAnimation() {
            clearAll();
            running = false;
            setPlaceholder('');
        }

        // Pause while user is focused or has typed something
        input.addEventListener('focus', stopAnimation);

        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                // Small delay so stopAnimation from focus isn't immediately overridden
                setTimeout(startAnimation, 300);
            }
        });

        input.addEventListener('input', () => {
            if (input.value.trim()) {
                stopAnimation();
            } else if (!running) {
                setTimeout(startAnimation, 300);
            }
        });

        // Initial start after a short delay
        setTimeout(startAnimation, 800);
    }

    // -------------------------------------------------------------------------
    // STEP 1 — Hero
    // -------------------------------------------------------------------------
    function bindHero() {
        const startBtn   = document.getElementById('hmdg-start');
        const heroPrompt = document.getElementById('hmdg-hero-prompt');

        if (!startBtn) return;

        const goToChat = () => {
            const prompt   = heroPrompt?.value.trim() || '';
            const descField = document.getElementById('hmdg-description');
            if (descField) descField.value = prompt;
            showStep('hmdg-step-questionnaire');
            chatEngine.startChat();
        };

        startBtn.addEventListener('click', goToChat);
        heroPrompt?.addEventListener('keydown', e => {
            if (e.key === 'Enter') goToChat();
        });
    }

    // -------------------------------------------------------------------------
    // STEP 2 — Chat Engine
    // -------------------------------------------------------------------------
    function initChat() {
        let currentQ = -1;
        let answers  = {};

        // DOM references
        const thread   = document.getElementById('hmdg-chat-thread');
        const input    = document.getElementById('hmdg-chat-input');
        const sendBtn  = document.getElementById('hmdg-chat-send');
        const chipsEl  = document.getElementById('hmdg-chat-chips');
        const hintBtn  = document.getElementById('hmdg-chat-hint-btn');
        const skipBtn  = document.getElementById('hmdg-chat-skip-btn');
        const briefEl  = document.getElementById('hmdg-brief-body');
        const backBtn  = document.getElementById('hmdg-q-back');

        if (!thread) return { startChat: () => {}, resetChat: () => {} };

        // -- Event wiring --

        sendBtn?.addEventListener('click', handleSend);

        input?.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                const q = CHAT_QUESTIONS[currentQ];
                if (q?.type === 'chips_multi') return; // Done button handles this
                e.preventDefault();
                handleSend();
            }
        });

        // Auto-grow textarea
        input?.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        });

        hintBtn?.addEventListener('click', () => {
            const q = CHAT_QUESTIONS[currentQ];
            if (q?.hint) appendHint(q.hint);
        });

        skipBtn?.addEventListener('click', () => submitAnswer(null));

        backBtn?.addEventListener('click', () => showStep('hmdg-step-hero'));

        // -- Core: start / reset --

        function startChat() {
            resetChat();
            const desc = document.getElementById('hmdg-description')?.value.trim() || '';

            // Opening greeting
            appendAI("Hi! I\u2019m your website planning assistant. I\u2019ll ask you a few questions to create a detailed brief for your project.", null, 200);

            if (desc) {
                // Pre-filled from hero prompt — acknowledge it, then start questions
                answers.description = desc;
                appendAI("I can see you\u2019ve already described your project. Let me ask a few more questions to build a complete brief.", null, 1000);
                appendUser(desc, 1100);
                setBriefEntry({ section: 'Showcase', label: 'Description' }, desc, 1200);
                setTimeout(() => askQuestion(0), 1600);
            } else {
                setTimeout(() => askQuestion(0), 900);
            }
        }

        function resetChat() {
            currentQ = -1;
            answers  = {};
            if (thread)  thread.innerHTML  = '';
            if (briefEl) briefEl.innerHTML = '';
            hideChips();
            if (input)  { input.value = ''; input.style.height = ''; input.disabled = false; }
            if (sendBtn) sendBtn.disabled = false;
            clearError('hmdg-q-error');
        }

        // -- Questions --

        function askQuestion(index) {
            currentQ = index;

            if (index >= CHAT_QUESTIONS.length) {
                submitChat();
                return;
            }

            const q    = CHAT_QUESTIONS[index];
            const msg  = fill(q.message, answers);
            const bold = q.bold ? fill(q.bold, answers) : null;

            appendAI(msg, bold, 300);

            setTimeout(() => {
                // Chips
                if (q.chips && (q.type === 'chips_single' || q.type === 'chips_multi')) {
                    showChips(q.chips.map(c => fill(c, answers)), q.type === 'chips_multi');
                } else {
                    hideChips();
                }

                // Input state
                if (input) {
                    input.placeholder = q.placeholder || 'Write an answer\u2026';
                    input.value       = '';
                    input.style.height = '';
                    if (q.type !== 'chips_single') input.focus();
                }

                // Skip visibility: hide for required non-optional questions
                if (skipBtn) {
                    skipBtn.style.display = (q.required && !q.optional) ? 'none' : '';
                }
            }, 450);
        }

        // -- Answer handling --

        function handleSend() {
            submitAnswer(input?.value.trim() || null);
        }

        function submitAnswer(value) {
            const q = CHAT_QUESTIONS[currentQ];
            if (!q) return;

            // For multi-chips: collect selected + typed value
            if (q.type === 'chips_multi') {
                const selected = [...(chipsEl?.querySelectorAll('.hmdg-chip--selected') || [])].map(b => b.textContent.trim());
                const typed    = (value || '').trim();
                const combined = [...selected];
                if (typed) combined.push(typed);
                value = combined.length ? combined : null;
            }

            // Validate required
            const isEmpty = value === null || value === '' || (Array.isArray(value) && value.length === 0);
            if (q.required && !q.optional && isEmpty) {
                showError('hmdg-q-error', 'Please provide an answer to continue.');
                return;
            }
            clearError('hmdg-q-error');

            // Store + display
            if (!isEmpty) {
                answers[q.key] = value;
                appendUser(Array.isArray(value) ? value.join(', ') : value);
                setBriefEntry(q, value);
            }

            hideChips();
            if (input) { input.value = ''; input.style.height = ''; }

            setTimeout(() => askQuestion(currentQ + 1), 500);
        }

        // -- Chips --

        function showChips(labels, multi) {
            if (!chipsEl) return;
            chipsEl.innerHTML = '';

            labels.forEach(label => {
                const btn       = document.createElement('button');
                btn.type        = 'button';
                btn.className   = 'hmdg-chip';
                btn.textContent = label;

                if (multi) {
                    btn.addEventListener('click', () => btn.classList.toggle('hmdg-chip--selected'));
                } else {
                    btn.addEventListener('click', () => {
                        clearError('hmdg-q-error');
                        const q = CHAT_QUESTIONS[currentQ];
                        answers[q.key] = label;
                        appendUser(label);
                        setBriefEntry(q, label);
                        hideChips();
                        if (input) { input.value = ''; input.style.height = ''; }
                        setTimeout(() => askQuestion(currentQ + 1), 500);
                    });
                }

                chipsEl.appendChild(btn);
            });

            if (multi) {
                const doneBtn       = document.createElement('button');
                doneBtn.type        = 'button';
                doneBtn.className   = 'hmdg-chip hmdg-chip--done';
                doneBtn.textContent = '\u2713 Done';
                doneBtn.addEventListener('click', () => {
                    clearError('hmdg-q-error');
                    const selected = [...chipsEl.querySelectorAll('.hmdg-chip--selected')].map(b => b.textContent.trim());
                    const typed    = input?.value.trim() || '';
                    const combined = [...selected];
                    if (typed) combined.push(typed);

                    const val = combined.length ? combined : null;
                    if (val !== null) {
                        const q = CHAT_QUESTIONS[currentQ];
                        answers[q.key] = val;
                        appendUser(val.join(', '));
                        setBriefEntry(q, val);
                    }
                    hideChips();
                    if (input) { input.value = ''; input.style.height = ''; }
                    setTimeout(() => askQuestion(currentQ + 1), 500);
                });
                chipsEl.appendChild(doneBtn);
            }

            chipsEl.hidden = false;
        }

        function hideChips() {
            if (!chipsEl) return;
            chipsEl.hidden    = true;
            chipsEl.innerHTML = '';
        }

        // -- Message rendering --

        function appendAI(text, boldText, delay = 0) {
            setTimeout(() => {
                if (!thread) return;
                const wrap = document.createElement('div');
                wrap.className = 'hmdg-msg hmdg-msg--ai hmdg-msg--entering';

                let html = `<div class="hmdg-msg-bubble">${esc(text)}`;
                if (boldText) html += `<p class="hmdg-msg-subtitle">${esc(boldText)}</p>`;
                html += '</div>';
                wrap.innerHTML = html;

                thread.appendChild(wrap);
                requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.remove('hmdg-msg--entering')));
                scrollThread();
            }, delay);
        }

        function appendUser(text, delay = 0) {
            setTimeout(() => {
                if (!thread) return;
                const wrap = document.createElement('div');
                wrap.className   = 'hmdg-msg hmdg-msg--user hmdg-msg--entering';
                wrap.innerHTML   = `<div class="hmdg-msg-bubble">${esc(String(text))}</div>`;
                thread.appendChild(wrap);
                requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.remove('hmdg-msg--entering')));
                scrollThread();
            }, delay);
        }

        function appendHint(text) {
            if (!thread) return;
            const wrap = document.createElement('div');
            wrap.className = 'hmdg-msg hmdg-msg--hint hmdg-msg--entering';
            wrap.innerHTML = `<div class="hmdg-msg-bubble hmdg-msg-bubble--hint">\uD83D\uDCA1 ${esc(text)}</div>`;
            thread.appendChild(wrap);
            requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.remove('hmdg-msg--entering')));
            scrollThread();

            // Auto-remove after 7 seconds
            setTimeout(() => {
                wrap.classList.add('hmdg-msg--leaving');
                setTimeout(() => wrap.remove(), 300);
            }, 7000);
        }

        function scrollThread() {
            if (thread) thread.scrollTop = thread.scrollHeight;
        }

        // -- Live brief panel --

        function setBriefEntry(q, value, delay = 0) {
            setTimeout(() => {
                if (!briefEl) return;

                const sectionKey = q.section;

                // Find or create section
                let section = null;
                for (const el of briefEl.children) {
                    if (el.dataset.briefSection === sectionKey) { section = el; break; }
                }
                if (!section) {
                    section = document.createElement('div');
                    section.className = 'hmdg-bs';
                    section.dataset.briefSection = sectionKey;
                    section.innerHTML =
                        `<h3 class="hmdg-bs__title">${esc(sectionKey)}</h3>` +
                        `<div class="hmdg-bs__entries"></div>`;
                    briefEl.appendChild(section);
                    requestAnimationFrame(() => requestAnimationFrame(() => section.classList.add('hmdg-bs--visible')));
                }

                const entriesEl = section.querySelector('.hmdg-bs__entries');

                // Find or create entry
                let entry = null;
                for (const el of entriesEl.children) {
                    if (el.dataset.briefLabel === q.label) { entry = el; break; }
                }
                if (!entry) {
                    entry = document.createElement('div');
                    entry.className        = 'hmdg-be';
                    entry.dataset.briefLabel = q.label;
                    entry.innerHTML =
                        `<span class="hmdg-be__label">${esc(q.label)}</span>` +
                        `<span class="hmdg-be__value"></span>`;
                    entriesEl.appendChild(entry);
                }

                const valueEl = entry.querySelector('.hmdg-be__value');
                if (valueEl) {
                    valueEl.textContent = Array.isArray(value) ? value.join(', ') : String(value);
                    // Pulse highlight
                    entry.classList.remove('hmdg-be--pulse');
                    void entry.offsetWidth; // force reflow
                    entry.classList.add('hmdg-be--pulse');
                }
            }, delay);
        }

        // -- Submission --

        function submitChat() {
            appendAI("All set! I have everything I need. Generating your website plan now \u2014 this may take 15\u201330 seconds\u2026", null, 300);

            setTimeout(() => {
                if (input)   input.disabled   = true;
                if (sendBtn) sendBtn.disabled  = true;
            }, 400);

            // Build the data payload from collected answers
            const data = {
                description:   answers.description   || '',
                contact_name:  answers.contact_name  || '',
                business_name: answers.business_name || '',
                client_email:  answers.client_email  || '',
                client_phone:  answers.client_phone  || '',
                business_type: answers.business_type || '',
                location:      answers.location      || '',
                language:      answers.language      || 'English',
                services:      answers.services      || '',
                goals:         answers.goals         || '',
                audience:      answers.audience      || '',
                tone:          answers.tone          || '',
                brand_style:   answers.brand_style   || '',
                showcase:      answers.showcase      || 'No',
                competitors:   answers.competitors   || '',
                hosting:       answers.hosting       || '',
                requirements:  answers.requirements  || '',
                features:      Array.isArray(answers.features)     ? answers.features     : [],
                integrations:  Array.isArray(answers.integrations) ? answers.integrations : [],
            };

            lastFormData    = data;
            lastClientEmail = data.client_email;

            generatePlan(data);
        }

        // -- Utility --

        function fill(str, data) {
            return str.replace(/\{(\w+)\}/g, (_, k) => data[k] || '');
        }

        return { startChat, resetChat };
    }

    // -------------------------------------------------------------------------
    // STEP 3 — Results + Approval
    // -------------------------------------------------------------------------
    function bindResults() {
        // Tab switching via event delegation
        document.addEventListener('click', e => {
            const tab = e.target.closest('.hmdg-results-tab');
            if (tab) switchTab(tab.dataset.tab);
        });

        document.getElementById('hmdg-start-over')?.addEventListener('click', resetApp);

        document.getElementById('hmdg-approve-plan')?.addEventListener('click', () => {
            prefillSendStep();
            showStep('hmdg-step-send');
        });

        document.getElementById('hmdg-request-changes')?.addEventListener('click', () => {
            const panel = document.getElementById('hmdg-revision-panel');
            if (panel) {
                panel.hidden = false;
                panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
                document.getElementById('hmdg-revision-notes')?.focus();
            }
        });

        document.getElementById('hmdg-cancel-revision')?.addEventListener('click', () => {
            const panel = document.getElementById('hmdg-revision-panel');
            if (panel) panel.hidden = true;
        });

        document.getElementById('hmdg-regenerate')?.addEventListener('click', async () => {
            const feedback = document.getElementById('hmdg-revision-notes')?.value.trim();
            if (!feedback) {
                document.getElementById('hmdg-revision-notes')?.focus();
                return;
            }
            const btn       = document.getElementById('hmdg-regenerate');
            btn.disabled    = true;
            btn.innerHTML   = '<span class="hmdg-spinner" aria-hidden="true"></span> Regenerating\u2026';
            await regeneratePlan(feedback);
            btn.disabled    = false;
            btn.innerHTML   = '<span aria-hidden="true">\u2736</span> Regenerate Plan';
        });
    }

    function switchTab(tabId) {
        document.querySelectorAll('.hmdg-results-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tabId);
            t.setAttribute('aria-selected', t.dataset.tab === tabId);
        });
        document.querySelectorAll('.hmdg-results-panel').forEach(p => {
            const active = p.id === `hmdg-tab-${tabId}`;
            p.classList.toggle('active', active);
            p.hidden = !active;
        });
    }

    // -------------------------------------------------------------------------
    // STEP 4 — Send to PM
    // -------------------------------------------------------------------------
    function bindSend() {
        document.getElementById('hmdg-send-back')?.addEventListener('click', () => {
            showStep('hmdg-step-results');
        });

        const form       = document.getElementById('hmdg-send-form');
        const emailInput = document.getElementById('hmdg-send-client-email');

        emailInput?.addEventListener('input', () => {
            const recipient = document.getElementById('hmdg-client-recipient');
            const display   = document.getElementById('hmdg-client-email-display');
            if (!recipient || !display) return;
            const val           = emailInput.value.trim();
            recipient.hidden    = !val;
            display.textContent = val;
        });

        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearError('hmdg-send-error');

            const btn   = document.getElementById('hmdg-send-submit');
            const email = emailInput?.value.trim() || '';
            const notes = document.getElementById('hmdg-send-pm-notes')?.value.trim() || '';

            btn.disabled  = true;
            btn.innerHTML = '<span class="hmdg-spinner" aria-hidden="true"></span> Sending\u2026';

            await sendToPM(email, notes);

            btn.disabled  = false;
            btn.innerHTML = '<span aria-hidden="true">\u2709</span> Send to HMDG to proceed to website development';
        });
    }

    function prefillSendStep() {
        const emailInput = document.getElementById('hmdg-send-client-email');
        if (emailInput && lastClientEmail) {
            emailInput.value = lastClientEmail;
            const recipient  = document.getElementById('hmdg-client-recipient');
            const display    = document.getElementById('hmdg-client-email-display');
            if (recipient && display) {
                recipient.hidden    = false;
                display.textContent = lastClientEmail;
            }
        }
    }

    // -------------------------------------------------------------------------
    // STEP 5 — Confirmation
    // -------------------------------------------------------------------------
    function bindConfirmation() {
        document.getElementById('hmdg-new-plan')?.addEventListener('click', resetApp);
    }

    // -------------------------------------------------------------------------
    // AJAX — Generate Plan
    // -------------------------------------------------------------------------
    async function generatePlan(data) {
        const body = buildFormBody(data, { action: 'hmdg_generate_site_plan' });

        try {
            const json = await postAjax(body);
            if (!json.success) {
                showError('hmdg-q-error', json.data?.message || 'Something went wrong. Please try again.');
                // Re-enable chat input on failure
                const inp = document.getElementById('hmdg-chat-input');
                const btn = document.getElementById('hmdg-chat-send');
                if (inp) inp.disabled = false;
                if (btn) btn.disabled = false;
                return;
            }
            planData = json.data;
            renderResults(planData);
            showStep('hmdg-step-results');
            const panel = document.getElementById('hmdg-revision-panel');
            if (panel) panel.hidden = true;
            const notes = document.getElementById('hmdg-revision-notes');
            if (notes)  notes.value = '';
        } catch (err) {
            showError('hmdg-q-error', 'Network error. Please check your connection and try again.');
            const inp = document.getElementById('hmdg-chat-input');
            const btn = document.getElementById('hmdg-chat-send');
            if (inp) inp.disabled = false;
            if (btn) btn.disabled = false;
            console.error('[HMDG Phase1]', err);
        }
    }

    // -------------------------------------------------------------------------
    // AJAX — Regenerate Plan
    // -------------------------------------------------------------------------
    async function regeneratePlan(feedback) {
        const body = buildFormBody(lastFormData, {
            action:        'hmdg_regenerate_site_plan',
            feedback:      feedback,
            previous_plan: JSON.stringify(planData),
        });

        try {
            const json = await postAjax(body);
            if (!json.success) { showError('hmdg-q-error', json.data?.message || 'Regeneration failed. Please try again.'); return; }
            planData = json.data;
            renderResults(planData);
            const panel = document.getElementById('hmdg-revision-panel');
            if (panel) panel.hidden = true;
            document.getElementById('hmdg-results-wrap')?.scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
            showError('hmdg-q-error', 'Network error.');
            console.error('[HMDG Phase1]', err);
        }
    }

    // -------------------------------------------------------------------------
    // AJAX — Send to PM
    // -------------------------------------------------------------------------
    async function sendToPM(clientEmail, pmNotes) {
        const body = new FormData();
        body.append('action',       'hmdg_send_to_pm');
        body.append('nonce',        HMDG.nonce);
        body.append('client_email', clientEmail);
        body.append('pm_notes',     pmNotes);
        body.append('contact_name', lastFormData?.contact_name || '');
        body.append('client_phone', lastFormData?.client_phone || '');
        body.append('plan',         JSON.stringify(planData));

        try {
            const json = await postAjax(body);
            if (!json.success) { showError('hmdg-send-error', json.data?.message || 'Failed to send. Please try again.'); return; }
            showStep('hmdg-step-confirmation');
        } catch (err) {
            showError('hmdg-send-error', 'Network error. Please try again.');
            console.error('[HMDG Phase1]', err);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    function buildFormBody(data, extra = {}) {
        const body = new FormData();
        body.append('nonce', HMDG.nonce);
        for (const [key, val] of Object.entries({ ...data, ...extra })) {
            if (Array.isArray(val)) {
                val.forEach(v => body.append(key + '[]', v));
            } else {
                body.append(key, val ?? '');
            }
        }
        return body;
    }

    async function postAjax(body) {
        const response = await fetch(HMDG.ajaxUrl, {
            method: 'POST', body, credentials: 'same-origin',
        });
        return response.json();
    }

    function resetApp() {
        planData = lastFormData = null;
        lastClientEmail = '';
        const heroPrompt = document.getElementById('hmdg-hero-prompt');
        if (heroPrompt) heroPrompt.value = '';
        const descField = document.getElementById('hmdg-description');
        if (descField)  descField.value  = '';
        chatEngine.resetChat();
        showStep('hmdg-step-hero');
    }

    function showError(id, message) {
        const el = document.getElementById(id);
        if (!el) return;
        el.textContent = message;
        el.hidden      = false;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function clearError(id) {
        const el = document.getElementById(id);
        if (el) { el.textContent = ''; el.hidden = true; }
    }

    // -------------------------------------------------------------------------
    // Results rendering
    // -------------------------------------------------------------------------
    function renderResults(data) {
        switchTab('brief');
        renderBrief(data.project_brief);
        renderSitemap(data.sitemap);
        renderWireframes(data.wireframes);
        renderPhase2(data.phase2_notes);
    }

    function renderBrief(brief) {
        const el = document.getElementById('hmdg-brief-content');
        if (!el || !brief) return;

        const cards = [
            { icon: '\uD83C\uDFE2', label: 'Business Overview', value: brief.business_overview },
            { icon: '\uD83C\uDFAF', label: 'Target Audience',   value: brief.target_audience },
            { icon: '\uD83D\uDCA1', label: 'Unique Value Prop',  value: brief.unique_value_proposition },
            { icon: '\uD83D\uDDE3\uFE0F', label: 'Tone & Voice', value: brief.tone },
        ];
        const listCards = [
            { icon: '\u2705', label: 'Goals',             items: brief.goals },
            { icon: '\u2699\uFE0F', label: 'Features',    items: brief.features },
            { icon: '\uD83D\uDCC4', label: 'Recommended Pages', items: brief.recommended_pages },
        ];

        let html = '';
        cards.forEach(c => {
            if (!c.value) return;
            html += `<div class="hmdg-brief-card">
                <div class="hmdg-brief-card__icon">${c.icon}</div>
                <div class="hmdg-brief-card__body">
                    <h4 class="hmdg-brief-card__label">${esc(c.label)}</h4>
                    <p class="hmdg-brief-card__value">${esc(c.value)}</p>
                </div></div>`;
        });
        listCards.forEach(c => {
            if (!c.items?.length) return;
            html += `<div class="hmdg-brief-card">
                <div class="hmdg-brief-card__icon">${c.icon}</div>
                <div class="hmdg-brief-card__body">
                    <h4 class="hmdg-brief-card__label">${esc(c.label)}</h4>
                    <ul class="hmdg-brief-card__list">${c.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
                </div></div>`;
        });
        el.innerHTML = html;
    }

    function renderSitemap(sitemap) {
        const el = document.getElementById('hmdg-sitemap-content');
        if (!el || !sitemap?.pages) return;

        const buildTree = (pages, depth = 0) => {
            if (!pages?.length) return '';
            let html = `<ul class="hmdg-sitemap-tree ${depth === 0 ? 'hmdg-sitemap-root' : 'hmdg-sitemap-children'}">`;
            pages.forEach(page => {
                html += `<li class="hmdg-sitemap-node">
                    <div class="hmdg-sitemap-node__inner">
                        <span class="hmdg-sitemap-node__name">${esc(page.name)}</span>
                        <span class="hmdg-sitemap-node__slug">${esc(page.slug)}</span>
                        ${page.purpose ? `<span class="hmdg-sitemap-node__purpose">${esc(page.purpose)}</span>` : ''}
                    </div>
                    ${page.children?.length ? buildTree(page.children, depth + 1) : ''}
                </li>`;
            });
            return html + '</ul>';
        };

        el.innerHTML = `<div class="hmdg-sitemap-wrap">${buildTree(sitemap.pages)}</div>`;
    }

    function renderWireframes(wireframes) {
        const el = document.getElementById('hmdg-wireframes-content');
        if (!el || !wireframes?.length) return;

        let html = '<div class="hmdg-wf-accordion">';
        wireframes.forEach((page, i) => {
            const id      = `hmdg-wf-${i}`;
            const isFirst = i === 0;
            const sections = (page.sections || []).map(s => `
                <div class="hmdg-wf-section">
                    <div class="hmdg-wf-section__header">
                        <span class="hmdg-wf-section__name">${esc(s.name)}</span>
                        ${s.cta ? `<span class="hmdg-wf-section__cta">CTA: ${esc(s.cta)}</span>` : ''}
                    </div>
                    ${s.key_message ? `<p class="hmdg-wf-section__msg">"${esc(s.key_message)}"</p>` : ''}
                    ${s.description ? `<p class="hmdg-wf-section__desc">${esc(s.description)}</p>` : ''}
                </div>`).join('');

            html += `<div class="hmdg-wf-item ${isFirst ? 'open' : ''}">
                <button class="hmdg-wf-toggle" type="button" aria-expanded="${isFirst}" aria-controls="${id}">
                    <span class="hmdg-wf-toggle__page">${esc(page.page)}</span>
                    <span class="hmdg-wf-toggle__slug">${esc(page.slug)}</span>
                    <span class="hmdg-wf-toggle__count">${page.sections?.length || 0} sections</span>
                    <span class="hmdg-wf-toggle__arrow" aria-hidden="true">\u203A</span>
                </button>
                <div class="hmdg-wf-body" id="${id}" ${isFirst ? '' : 'hidden'}>
                    <div class="hmdg-wf-sections">${sections}</div>
                </div></div>`;
        });
        html += '</div>';
        el.innerHTML = html;

        el.querySelectorAll('.hmdg-wf-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.closest('.hmdg-wf-item');
                const body = item.querySelector('.hmdg-wf-body');
                const open = item.classList.toggle('open');
                body.hidden = !open;
                btn.setAttribute('aria-expanded', open);
            });
        });
    }

    function renderPhase2(notes) {
        const el = document.getElementById('hmdg-phase2-content');
        if (!el || !notes) return;

        let html = '<div class="hmdg-phase2-grid">';
        if (notes.content_strategy) {
            html += `<div class="hmdg-phase2-card"><h4 class="hmdg-phase2-card__title">Content Strategy</h4><p>${esc(notes.content_strategy)}</p></div>`;
        }
        if (notes.seo_focus) {
            html += `<div class="hmdg-phase2-card"><h4 class="hmdg-phase2-card__title">SEO Focus</h4><p>${esc(notes.seo_focus)}</p></div>`;
        }
        [
            { label: 'Key Integrations',      items: notes.key_integrations },
            { label: 'Conversion Priorities', items: notes.conversion_priorities },
        ].forEach(l => {
            if (!l.items?.length) return;
            html += `<div class="hmdg-phase2-card"><h4 class="hmdg-phase2-card__title">${esc(l.label)}</h4>
                <ul class="hmdg-brief-card__list">${l.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`;
        });
        html += `<div class="hmdg-phase2-ready"><span class="hmdg-phase2-ready__dot"></span>Automation Ready for Phase 2</div>`;
        html += '</div>';
        el.innerHTML = html;
    }

    function esc(str) {
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    return { init };

})();

document.addEventListener('DOMContentLoaded', () => HMDG_Phase1.init());
