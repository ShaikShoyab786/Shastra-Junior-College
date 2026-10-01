import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, Phone, X } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import {
  getGetCmsPageQueryKey,
  getGetHomePageQueryKey,
  useGetCmsPage,
  useGetHomePage,
} from "@workspace/api-client-react";
import { CursorSparkle } from "./cursor-sparkle";
import { collegeLogo } from "@/pages/public-home";
import {
  getPhoneHref,
  getWhatsAppHref,
  readContactDetails,
} from "@/lib/contact-details";
import { themeVariables } from "@/lib/theme-presets";
import { useLocation } from "wouter";

const INTRO_SESSION_KEY = "shastra-intro-seen";
const INTRO_HOLD_MS = 6000;
const INTRO_EXIT_MS = 650;
const CTA_SCROLL_THRESHOLD = 320;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function hasSeenIntro() {
  try {
    return window.sessionStorage.getItem(INTRO_SESSION_KEY) === "yes";
  } catch {
    return false;
  }
}

function markIntroSeen() {
  try {
    window.sessionStorage.setItem(INTRO_SESSION_KEY, "yes");
  } catch {
    // The in-memory guard still prevents replays during this app session.
  }
}

export default function PublicSiteEffects() {
  const [path] = useLocation();
  const isPublic =
    path !== "/admin" &&
    !path.startsWith("/admin/") &&
    !path.startsWith("/sign-in") &&
    !path.startsWith("/sign-up");
  const homeQuery = useGetHomePage({
    query: {
      enabled: isPublic,
      queryKey: getGetHomePageQueryKey(),
    },
  });
  const contactQuery = useGetCmsPage("contact", {
    query: {
      enabled: isPublic,
      queryKey: getGetCmsPageQueryKey("contact"),
    },
  });
  const settings = homeQuery.data?.settings;
  const introEnabled = settings?.introEnabled === true;
  const introStarted = useRef(false);
  const [introVisible, setIntroVisible] = useState(false);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [scrollCtaVisible, setScrollCtaVisible] = useState(false);
  const [scrollCtaDismissed, setScrollCtaDismissed] = useState(false);

  useEffect(() => {
    if (!isPublic || !introEnabled) {
      setIntroVisible(false);
      setIntroLeaving(false);
      return;
    }

    if (introStarted.current) return;
    introStarted.current = true;

    if (hasSeenIntro()) return;
    markIntroSeen();
    setIntroVisible(true);
    setIntroLeaving(false);

    const leaveTimer = window.setTimeout(
      () => setIntroLeaving(true),
      INTRO_HOLD_MS,
    );
    const closeTimer = window.setTimeout(
      () => setIntroVisible(false),
      INTRO_HOLD_MS + INTRO_EXIT_MS,
    );

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(closeTimer);
    };
  }, [isPublic, introEnabled]);

  useEffect(() => {
    if (!isPublic || !settings?.scrollCtaEnabled) {
      setScrollCtaVisible(false);
      return;
    }

    const updateVisibility = () => {
      setScrollCtaVisible(window.scrollY >= CTA_SCROLL_THRESHOLD);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, [isPublic, settings?.scrollCtaEnabled]);

  if (!isPublic || !settings) return null;

  const contactHero = contactQuery.data?.sections.find(
    (section) => section.sectionKey.toLowerCase() === "hero",
  );
  const contact = readContactDetails(contactHero?.content);
  const phone = contact.mobileNumbers
    .map((number) => ({ number, href: getPhoneHref(number) }))
    .find((entry) => entry.href);
  const whatsappHref = getWhatsAppHref(contact.whatsappNumber);
  const paletteStyle = themeVariables(
    settings.primaryColor,
    settings.accentColor,
    settings.surfaceColor,
  ) as CSSProperties;
  const floatingWhatsAppVisible =
    settings.floatingWhatsAppEnabled &&
    Boolean(whatsappHref) &&
    !introVisible;
  const barVisible =
    scrollCtaVisible &&
    !scrollCtaDismissed &&
    !introVisible &&
    settings.scrollCtaEnabled;
  const applyHref = `${basePath || ""}/#enquire`;

  return (
    <>
      <CursorSparkle
        enabled={settings.cursorSparkleEnabled && !introVisible}
        primaryColor={settings.primaryColor}
        accentColor={settings.accentColor}
      />

      {introVisible ? (
        <div
          className={`college-intro-screen${introLeaving ? " is-leaving" : ""}`}
          style={
            {
              ...paletteStyle,
              backgroundColor: settings.surfaceColor,
              backgroundImage: `radial-gradient(ellipse at 50% 39%, color-mix(in srgb, ${settings.primaryColor} 9%, ${settings.surfaceColor}) 0%, ${settings.surfaceColor} 66%)`,
            } as CSSProperties
          }
          role="status"
          aria-live="polite"
          data-testid="screen-college-intro"
        >
          <div className="college-intro-content">
            <div className="college-intro-logo-halo">
              <img
                src={collegeLogo(settings.logoUrl)}
                alt="Shastra Junior College"
                className="college-intro-logo"
                onError={(event) => {
                  event.currentTarget.src = collegeLogo(null);
                }}
              />
            </div>
            <p className="college-intro-quote" data-testid="text-intro-quote">
              {settings.introQuote}
            </p>
            <div className="college-intro-rule" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      ) : null}

      {barVisible ? (
        <nav
          className="college-scroll-cta"
          style={paletteStyle}
          aria-label="Quick college actions"
          data-testid="bar-scroll-cta"
        >
          <button
            type="button"
            className="college-scroll-cta-close"
            onClick={() => setScrollCtaDismissed(true)}
            aria-label="Close quick actions"
            data-testid="button-close-scroll-cta"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          {phone ? (
            <a
              href={phone.href}
              className="college-scroll-cta-link"
              aria-label={`Call Shastra Junior College at ${phone.number}`}
              data-testid="link-scroll-cta-call"
            >
              <Phone aria-hidden="true" />
              <span>Call Us</span>
            </a>
          ) : null}
          {whatsappHref ? (
            <a
              href={whatsappHref}
              className="college-scroll-cta-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Chat with Shastra Junior College on WhatsApp at ${contact.whatsappNumber}`}
              data-testid="link-scroll-cta-whatsapp"
            >
              <SiWhatsapp aria-hidden="true" />
              <span>WhatsApp</span>
            </a>
          ) : null}
          <a
            href={applyHref}
            className="college-scroll-cta-apply"
            data-testid="link-scroll-cta-apply"
          >
            <ArrowUpRight aria-hidden="true" />
            <span>Apply Now</span>
          </a>
        </nav>
      ) : null}

      {floatingWhatsAppVisible && whatsappHref ? (
        <a
          href={whatsappHref}
          className={`college-whatsapp-float${barVisible ? " above-cta" : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chat with Shastra Junior College on WhatsApp at ${contact.whatsappNumber}`}
          data-testid="link-floating-whatsapp"
        >
          <SiWhatsapp aria-hidden="true" />
        </a>
      ) : null}
    </>
  );
}