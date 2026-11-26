import { toaster } from "@decky/api";
import { Focusable, Navigation } from "@decky/ui";
import { FC, ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FaChevronRight, FaDownload, FaGithub } from "react-icons/fa";
import { LogLine, exportLogs, getLog, getVersion } from "../api";
import { AUTHOR_AVATAR, CREAMDECK_LOGO, DECKYDSH_LOGO, DECKYGCM_LOGO, PLUGIN_LOGO } from "../data/images";
import { getLanguage, t } from "../i18n/translations";
import { Button, IconButton, Row, SectionTitle, colors, mono } from "../ui";

const AUTHOR = "ProSS及时行乐";
const BILIBILI_URL = "https://space.bilibili.com/23706122";
const REPOSITORY_URL = "https://github.com/Qiming-Liu/DeckSMBx";
const ORIGINAL_URL = "https://github.com/bonorca/DeckSMB";
const DECKYGCM_URL = "https://github.com/Qiming-Liu/Decky-Game-Cheats-Manager#deckygcm";
const CREAMDECK_URL = "https://github.com/Qiming-Liu/CreamDeck#creamdeck";
const DECKYDSH_URL = "https://github.com/Qiming-Liu/DeckyDSH#deckydsh";
const LOG_LINES = 200;
const LOG_POLL_MS = 3000;

const chinese = () => getLanguage().startsWith("zh");

function openExternal(url: string) {
  Navigation.NavigateToExternalWeb(url);
  Navigation.CloseSideMenus();
}

const BilibiliIcon = () => <svg aria-hidden="true" width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
  <rect x="3" y="6" width="18" height="14" rx="3" /><path d="M8 3l3 3M16 3l-3 3M9 12v2M15 12v2" /></svg>;

const logo = (src: string, size = 36) => <img src={src} alt="" width={size} height={size} style={{ display: "block", borderRadius: size / 6 }} />;

function LinkRow({ title, description, note, icon, url }: { title: string; description?: string; note?: string; icon?: ReactNode; url: string }) {
  return <Row icon={icon} title={title} description={description} onActivate={() => openExternal(url)}>
    {note && <span style={{ fontSize: 12, color: colors.muted }}>{note}</span>}
    <FaChevronRight size={12} color={colors.muted} />
  </Row>;
}

const levelColor = (level: string) => level === "ERROR" || level === "CRITICAL" ? colors.danger
  : level === "WARNING" ? colors.warning : undefined;

/** The plugin's recent log lines, refreshed while shown, with an export button. */
function LogPanel() {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [exporting, setExporting] = useState(false);
  useEffect(() => {
    const load = () => getLog(LOG_LINES).then(setLines).catch(() => {});
    load();
    const timer = window.setInterval(load, LOG_POLL_MS);
    return () => window.clearInterval(timer);
  }, []);
  // Keep the newest lines in view while the log grows, unless the user scrolled up.
  const box = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  useLayoutEffect(() => {
    if (box.current && atBottom.current) box.current.scrollTop = box.current.scrollHeight;
  }, [lines]);

  const save = async () => {
    setExporting(true);
    const result = await exportLogs().catch((e) => ({ success: false, error: String(e), path: "" }));
    setExporting(false);
    toaster.toast({
      title: "DeckSMB+", critical: !result.success,
      body: result.success ? t("about.exportedTo", { path: String(result.path) }) : result.error || t("logs.failed"),
    });
  };

  return <section aria-label={t("about.log")} style={{
    height: "calc(100vh - 170px)", boxSizing: "border-box", padding: "12px 14px", borderRadius: 4, background: "rgba(0,0,0,.4)",
    display: "flex", flexDirection: "column", gap: 8,
  }}>
    <Focusable flow-children="row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: colors.muted }}>
      <span>{t("about.recentLines", { count: String(LOG_LINES) })}</span>
      <IconButton label={t("about.export")} disabled={exporting} onClick={save}
        style={{ width: 32, minWidth: 32, height: 30, background: colors.button, color: colors.text }}><FaDownload size={14} /></IconButton>
    </Focusable>
    <div ref={box} onScroll={() => {
      const el = box.current;
      if (el) atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    }} style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", ...mono, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "#a9b1b8" }}>
      {lines.length ? lines.map((line, index) => <div key={index}>
        <span style={{ color: colors.dim }}>{line.time}</span>{" "}
        <span style={{ color: levelColor(line.level) }}>{line.level === "WARNING" ? "WARN" : line.level} {line.message}</span>
      </div>) : <span style={{ color: colors.dim }}>{t("about.logEmpty")}</span>}
    </div>
  </section>;
}

/** The About tab of the settings page, like DeckyGCM's: author, plugin, thanks and recommended on the left, the log on the right. */
export const AboutTab: FC = () => {
  const linkButton = { background: colors.button, color: colors.text };
  const [version, setVersion] = useState("");
  useEffect(() => { getVersion().then(setVersion).catch(() => {}); }, []);
  return <>
    {/* One row of columns, so right from the author links reaches the log. */}
    <Focusable flow-children="row" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
      <Focusable flow-children="column" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Focusable flow-children="row" aria-label={AUTHOR} style={{ padding: "8px 12px", borderRadius: 4, background: colors.well, display: "flex", alignItems: "center", gap: 12 }}>
          <img src={AUTHOR_AVATAR} alt="" width={44} height={44} style={{ flex: "0 0 44px", borderRadius: 22, objectFit: "cover", background: colors.button }} />
          <div style={{ flex: "1 1 auto", minWidth: 0, fontSize: 18, fontWeight: 700, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{AUTHOR}</div>
          {chinese() && <IconButton label={t("about.bilibili")} style={linkButton} onClick={() => openExternal(BILIBILI_URL)}><BilibiliIcon /></IconButton>}
          <IconButton label="GitHub" style={linkButton} onClick={() => openExternal(chinese() ? `${REPOSITORY_URL}/blob/main/README_cn.md` : REPOSITORY_URL)}><FaGithub size={16} /></IconButton>
        </Focusable>

        <div style={{ height: 6 }} />
        <Row icon={logo(PLUGIN_LOGO, 40)} title="DeckSMB+" description={t("about.plugin")}>
          <span aria-label={t("about.version")} style={{ fontSize: 13, color: colors.muted }}>{version && `v${version}`}</span>
        </Row>
        <Row title={t("about.feedback")} description={t("about.feedbackHint")}>
          <Button onClick={() => openExternal(`${REPOSITORY_URL}/issues/new`)}><FaGithub size={14} />{t("about.openIssue")}</Button>
        </Row>
        <div style={{ borderTop: `1px solid ${colors.line}` }} />

        <SectionTitle>{t("about.thanks")}</SectionTitle>
        <LinkRow title="DeckSMB" description={t("about.originalHint")} note="chillibeaver" url={ORIGINAL_URL} />
        <div style={{ borderTop: `1px solid ${colors.line}` }} />

        <SectionTitle>{t("about.recommended")}</SectionTitle>
        <LinkRow title="DeckyGCM" description={t("about.gcmHint")} note={t("about.plugin")} url={DECKYGCM_URL} icon={logo(DECKYGCM_LOGO)} />
        <LinkRow title="CreamDeck" description={t("about.creamDeckHint")} note={t("about.plugin")} url={CREAMDECK_URL} icon={logo(CREAMDECK_LOGO)} />
        <LinkRow title="DeckyDSH" description={t("about.deckyDshHint")} note={t("about.plugin")} url={DECKYDSH_URL} icon={logo(DECKYDSH_LOGO)} />
        <div style={{ borderTop: `1px solid ${colors.line}` }} />
      </Focusable>

      {/* The log gets the whole right half, down to the button hints. */}
      <Focusable flow-children="column" style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <SectionTitle first>{t("about.log")}</SectionTitle>
        <LogPanel />
      </Focusable>
    </Focusable>
  </>;
};
