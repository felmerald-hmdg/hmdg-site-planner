<?php
/**
 * Questionnaire partial — Phase 1 Step 2 (Chat Planner UI).
 *
 * @package HMDG_Site_Planner
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>

<div class="hmdg-chat-layout">

    <!-- ===================================================
         LEFT PANEL: Guided Chat Thread
    ==================================================== -->
    <div class="hmdg-chat-left">

        <!-- Top bar -->
        <div class="hmdg-chat-topbar">
            <button id="hmdg-q-back" class="hmdg-chat-back-btn" type="button">
                <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                <?php esc_html_e( 'Back', 'hmdg-site-planner' ); ?>
            </button>
            <span class="hmdg-chat-topbar-title">
                <?php esc_html_e( 'Generate: Brief', 'hmdg-site-planner' ); ?>
            </span>
            <div class="hmdg-chat-topbar-gap"></div>
        </div>

        <!-- Scrollable message thread -->
        <div
            class="hmdg-chat-thread"
            id="hmdg-chat-thread"
            role="log"
            aria-live="polite"
            aria-label="<?php esc_attr_e( 'Chat conversation', 'hmdg-site-planner' ); ?>"
        >
            <!-- Messages injected by JS -->
        </div>

        <!-- Fixed input area -->
        <div class="hmdg-chat-input-area">

            <!-- Quick-reply chips (shown per question) -->
            <div class="hmdg-chat-chips" id="hmdg-chat-chips" hidden></div>

            <!-- Text input row -->
            <div class="hmdg-chat-inputrow">
                <button
                    class="hmdg-chat-attach-btn"
                    type="button"
                    disabled
                    title="<?php esc_attr_e( 'Attach file', 'hmdg-site-planner' ); ?>"
                    aria-label="<?php esc_attr_e( 'Attach file', 'hmdg-site-planner' ); ?>"
                >
                    <svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                    </svg>
                </button>

                <textarea
                    id="hmdg-chat-input"
                    class="hmdg-chat-textarea"
                    placeholder="<?php esc_attr_e( 'Write an answer or upload files...', 'hmdg-site-planner' ); ?>"
                    rows="1"
                    aria-label="<?php esc_attr_e( 'Your answer', 'hmdg-site-planner' ); ?>"
                ></textarea>

                <button
                    class="hmdg-chat-send-btn"
                    id="hmdg-chat-send"
                    type="button"
                    aria-label="<?php esc_attr_e( 'Send answer', 'hmdg-site-planner' ); ?>"
                >
                    <svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                </button>
            </div>

            <!-- Helper actions row -->
            <div class="hmdg-chat-helpers">
                <button type="button" class="hmdg-chat-helper-btn" id="hmdg-chat-hint-btn">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <?php esc_html_e( 'What should I write?', 'hmdg-site-planner' ); ?>
                </button>
                <button type="button" class="hmdg-chat-helper-btn" id="hmdg-chat-skip-btn">
                    <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    <?php esc_html_e( 'Skip question', 'hmdg-site-planner' ); ?>
                </button>
            </div>

            <!-- Error message -->
            <div id="hmdg-q-error" class="hmdg-chat-error" hidden></div>

        </div><!-- .hmdg-chat-input-area -->

    </div><!-- .hmdg-chat-left -->

    <!-- ===================================================
         RIGHT PANEL: Live Brief Summary
    ==================================================== -->
    <div class="hmdg-chat-right">
        <div class="hmdg-brief-wrap">
            <h2 class="hmdg-brief-heading">
                <?php esc_html_e( 'Brief Summary', 'hmdg-site-planner' ); ?>
            </h2>
            <div id="hmdg-brief-body">
                <!-- Section entries populated dynamically by JS -->
            </div>
        </div>
        <!-- Subtle bottom gradient -->
        <div class="hmdg-brief-fade" aria-hidden="true"></div>
    </div><!-- .hmdg-chat-right -->

</div><!-- .hmdg-chat-layout -->

<!-- Hidden field so bindHero() can pass the initial project description into the chat -->
<input type="hidden" id="hmdg-description" name="description">
