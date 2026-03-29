<?php
/**
 * Front-end template for [hmdg-website-development-ai] shortcode.
 *
 * Phase 1 — 5-step flow:
 *   1. Hero
 *   2. Questionnaire
 *   3. Results + Approval
 *   4. Send to PM
 *   5. Confirmation
 *
 * @package HMDG_Site_Planner
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>

<div class="hmdg-wrap hmdg-phase1-app" id="hmdg-app">

    <!-- ================================================================
         STEP 1 — HERO
    ================================================================ -->
    <section class="hmdg-step hmdg-hero" id="hmdg-step-hero" data-step="1">
        <div class="hmdg-hero__inner">

            <div class="hmdg-hero__eyebrow"><span class="hmdg-hero__eyebrow-dot" aria-hidden="true"></span><?php esc_html_e( 'HMDG AI Website Builder', 'hmdg-site-planner' ); ?></div>

            <h1 class="hmdg-hero__headline">
                <?php esc_html_e( 'Generate sitemaps', 'hmdg-site-planner' ); ?><br>
                <?php esc_html_e( 'and wireframes', 'hmdg-site-planner' ); ?><br>
                <span class="hmdg-hero__headline-accent"><?php esc_html_e( 'with HMDG', 'hmdg-site-planner' ); ?></span>
            </h1>

            <p class="hmdg-hero__sub">
                <?php esc_html_e( 'Go from concept to wireframes in record time with AI Site Planner, ready for client review, feedback, and fast revisions.', 'hmdg-site-planner' ); ?>
            </p>

            <div class="hmdg-hero__prompt-bar">
                <input
                    type="text"
                    id="hmdg-hero-prompt"
                    class="hmdg-hero__input"
                    autocomplete="off"
                    aria-label="<?php esc_attr_e( 'Describe your project', 'hmdg-site-planner' ); ?>"
                />
                <button class="hmdg-hero__cta" id="hmdg-start" type="button"><svg class="hmdg-hero__cta-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 1l1.8 4.2L13 7l-4.2 1.8L7 13 5.2 8.8 1 7l4.2-1.8L7 1z" fill="currentColor"/></svg><?php esc_html_e( 'Generate', 'hmdg-site-planner' ); ?></button>
            </div>

        </div>
    </section>

    <!-- ================================================================
         STEP 2 — QUESTIONNAIRE
    ================================================================ -->
    <section class="hmdg-step" id="hmdg-step-questionnaire" data-step="2" hidden>
        <?php require HMDG_SP_DIR . 'templates/partials/step-questionnaire.php'; ?>
    </section>

    <!-- ================================================================
         STEP 3 — RESULTS + APPROVAL
    ================================================================ -->
    <section class="hmdg-step" id="hmdg-step-results" data-step="3" hidden>
        <?php require HMDG_SP_DIR . 'templates/partials/step-results.php'; ?>
    </section>

    <!-- ================================================================
         STEP 4 — SEND TO PROJECT MANAGER
    ================================================================ -->
    <section class="hmdg-step" id="hmdg-step-send" data-step="4" hidden>
        <?php require HMDG_SP_DIR . 'templates/partials/step-send.php'; ?>
    </section>

    <!-- ================================================================
         STEP 5 — CONFIRMATION
    ================================================================ -->
    <section class="hmdg-step" id="hmdg-step-confirmation" data-step="5" hidden>
        <?php require HMDG_SP_DIR . 'templates/partials/step-confirmation.php'; ?>
    </section>

</div><!-- #hmdg-app -->
