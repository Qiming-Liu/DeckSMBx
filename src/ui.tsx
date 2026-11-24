import { DialogButton, Focusable, Navigation, PanelSectionRow } from "@decky/ui";
import type { CSSProperties, ReactNode } from "react";
import { FaArrowLeft, FaChevronRight } from "react-icons/fa";

// Building blocks shared by the Quick Access panel and the full-screen pages,
// in the style of DeckyGCM: dark wells, thin row lines, switches on the right.

export const colors = {
  text: "#ffffff", soft: "#dcdedf", muted: "#8b929a", dim: "#6b7480", accent: "#1a9fff", accentText: "#7cc4ff",
  warning: "#f5b942", danger: "#e35b5b", success: "#8ee06f", well: "rgba(0,0,0,.28)", line: "rgba(255,255,255,.08)",
  button: "#3d4450",
} as const;

export const mono: CSSProperties = { fontFamily: "ui-monospace, Menlo, Consolas, monospace", fontSize: 12 };
const ellipsis: CSSProperties = { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };

// An inline background hides Steam's focus colour, so these elements bring their own.
export const FOCUS_CSS = `
.smb-ghost.gpfocus, .smb-solid.gpfocus, .smb-link.gpfocus { background: #dcdedf !important; color: #0e141b !important; }
.smb-row.gpfocus, .smb-row.gpfocuswithin { background: rgba(255,255,255,.1) !important; }
`;
export const Style = () => <style>{FOCUS_CSS}</style>;

export function SectionTitle({ children, first, aside }: { children: ReactNode; first?: boolean; aside?: ReactNode }) {
  return <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: colors.muted, fontWeight: 500, padding: `${first ? 2 : 16}px 4px 6px` }}>
    <span>{children}</span>{aside}
  </div>;
}

export interface RowProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Monospace description, for paths and addresses. */
  code?: boolean;
  off?: boolean;
  onActivate?: () => void;
  /** Opened with the Y button or a long press. */
  onOptions?: () => void;
  optionsLabel?: string;
  /** Controls at the row's end: buttons, a switch. */
  children?: ReactNode;
  boxed?: boolean;
}

/** One list row: icon, title + description, controls on the right. */
export function Row({ icon, title, description, code, off, onActivate, onOptions, optionsLabel, children, boxed }: RowProps) {
  const main = <>
    {icon && <span aria-hidden style={{ display: "inline-flex", flex: "0 0 auto", color: colors.muted }}>{icon}</span>}
    <div style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
      <div style={{ fontSize: 15, color: off ? colors.muted : colors.text, ...ellipsis }}>{title}</div>
      {description && <div style={{ fontSize: 12, color: colors.muted, ...ellipsis, ...(code ? mono : {}) }}>{description}</div>}
    </div>
  </>;
  const mainStyle: CSSProperties = { flex: "1 1 auto", minWidth: 0, display: "flex", alignItems: "center", gap: 12, padding: "9px 0 9px 12px" };
  return <Focusable flow-children="row" className="smb-row"
    onOptionsButton={onOptions} onOptionsActionDescription={onOptions ? optionsLabel : undefined}
    style={{
      display: "flex", alignItems: "center", gap: 10, paddingRight: 10, borderRadius: boxed ? 4 : 3,
      ...(boxed ? { background: colors.well } : { borderTop: `1px solid ${colors.line}` }),
    }}>
    {onActivate ? <Focusable onActivate={onActivate} onClick={onActivate} style={mainStyle}>{main}</Focusable> : <div style={mainStyle}>{main}</div>}
    {children && <Focusable flow-children="row" style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>{children}</Focusable>}
  </Focusable>;
}

export function Button({ primary, danger, ghost, style, className, ...props }: Parameters<typeof DialogButton>[0] & { primary?: boolean; danger?: boolean; ghost?: boolean }) {
  return <DialogButton {...props} className={[className, primary ? "smb-solid" : "smb-ghost"].join(" ")} style={{
    width: "auto", minWidth: 0, height: 36, padding: "0 16px", fontSize: 14, whiteSpace: "nowrap",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    background: primary ? colors.accent : ghost || danger ? "transparent" : colors.button,
    color: danger ? colors.danger : ghost ? "#a9b1b8" : colors.text, ...style,
  }} />;
}

export function IconButton({ label, style, children, ...props }: Parameters<typeof DialogButton>[0] & { label: string }) {
  return <DialogButton {...props} aria-label={label} className="smb-ghost" style={{
    width: 34, minWidth: 34, height: 34, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center",
    background: "transparent", color: "#a9b1b8", ...style,
  }}>{children}</DialogButton>;
}

/** A coloured note: warning (yellow) or error (red). */
export function Note({ tone = "warning", children, style }: { tone?: "warning" | "danger"; children: ReactNode; style?: CSSProperties }) {
  return <div role="status" style={{
    padding: "8px 12px", borderRadius: 3, fontSize: 12.5, lineHeight: 1.45, overflowWrap: "anywhere",
    background: tone === "warning" ? "rgba(245,185,66,.12)" : "rgba(227,91,91,.12)", color: tone === "warning" ? colors.warning : "#ff9b9b", ...style,
  }}>{children}</div>;
}

/** A link in the Quick Access panel that opens a full-screen page. */
export function PanelLink({ route, icon, children }: { route: string; icon: ReactNode; children: ReactNode }) {
  const open = () => { Navigation.Navigate(route); Navigation.CloseSideMenus(); };
  return <PanelSectionRow>
    <Focusable className="smb-link" onActivate={open} onClick={open} style={{
      display: "flex", alignItems: "center", gap: 10, height: 44, boxSizing: "border-box", padding: "0 12px", borderRadius: 4,
      background: colors.well, color: colors.text, fontSize: 14, marginTop: 14,
    }}>
      {icon}<span style={{ flex: "1 1 auto" }}>{children}</span><FaChevronRight size={12} />
    </Focusable>
  </PanelSectionRow>;
}

/** A full-screen page with a back button and a title, clear of Steam's top bar and button hints. */
export function Page({ title, children, actions, onSecondary, secondaryLabel }: {
  title: string; children: ReactNode; actions?: ReactNode; onSecondary?: () => void; secondaryLabel?: string;
}) {
  return <Focusable flow-children="column" onSecondaryButton={onSecondary} onSecondaryActionDescription={onSecondary ? secondaryLabel : undefined}
    style={{
      position: "absolute", inset: 0, boxSizing: "border-box", overflowY: "auto",
      padding: "clamp(48px, 8.5vh, 68px) clamp(24px, 4vw, 48px) clamp(52px, 8vh, 64px)",
      background: "linear-gradient(180deg, #0e141b 0%, #151c24 100%)", color: colors.soft, display: "flex", flexDirection: "column", gap: 12,
    }}>
    <Style />
    <Focusable flow-children="row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <IconButton label="Back" style={{ background: colors.button, color: colors.text, width: 40, minWidth: 40, height: 40 }}
        onClick={() => Navigation.NavigateBack()}><FaArrowLeft /></IconButton>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.text, flex: "1 1 auto", minWidth: 0, ...ellipsis }}>{title}</h1>
      {actions}
    </Focusable>
    {children}
  </Focusable>;
}
