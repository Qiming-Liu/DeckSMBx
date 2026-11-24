import { Focusable, Menu, MenuItem, Navigation, PanelSection, PanelSectionRow, Toggle, showContextMenu, useQuickAccessVisible } from "@decky/ui";
import { addEventListener, removeEventListener } from "@decky/api";
import { FC, useEffect, useRef, useState } from "react";
import { FaCog, FaEllipsisH, FaFolder, FaPlus, FaSdCard, FaTerminal } from "react-icons/fa";
import {
  SambaStatus, Share, SshStatus, addShare, checkAndRepair, getSambaStatus, getShares, getSshStatus, installSamba,
  removeShare, toggleSamba, toggleShare, toggleSsh,
} from "./api";
import { t } from "./i18n/translations";
import { PICKER_ROUTE, SETTINGS_ROUTE } from "./routes";
import { Button, Note, PanelLink, Row, SectionTitle, Style, colors, mono } from "./ui";

/** SSH sits on top: it works whether or not Samba is installed. */
const SshRow: FC = () => {
  const [status, setStatus] = useState<SshStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = () => getSshStatus().then(setStatus).catch(() => setStatus(null));
  useEffect(() => { refresh(); }, []);
  if (!status?.available) return null;

  const toggle = async (value: boolean) => {
    setBusy(true);
    setError("");
    try {
      const result = await toggleSsh(value);
      if (!result.success) setError(result.error || t("ssh.failed"));
    } catch (e) {
      setError(String(e));
    }
    await refresh();
    setBusy(false);
  };

  let description = status.active ? t("ssh.running") : t("ssh.stopped");
  if (busy) description = status.active ? t("ssh.stopping") : t("ssh.starting");
  else if (status.active && status.ip) description = `ssh deck@${status.ip}`;

  // Its own bottom space, so nothing is left behind when SSH is missing.
  return <div style={{ marginBottom: 14 }}>
    <SectionTitle first>{t("ssh.title")}</SectionTitle>
    <Row boxed icon={<FaTerminal />} title="SSH" description={description} code={status.active && !busy} off={!status.active}>
      <Toggle value={status.active} disabled={busy} onChange={toggle} />
    </Row>
    {error && <Note tone="danger" style={{ marginTop: 6 }}>{error}</Note>}
  </div>;
};

const INSTALL_STEPS = ["readonly", "pacman", "package", "config", "password", "firewall", "discovery", "services"];

const InstallCard: FC<{ onInstalled: () => void }> = ({ onInstalled }) => {
  const [step, setStep] = useState(-1);
  const [error, setError] = useState("");
  const count = useRef(0);

  useEffect(() => {
    // The backend sends one message per step, in order.
    const listener = addEventListener<[string]>("install_progress", () => {
      setStep(Math.min(count.current++, INSTALL_STEPS.length - 1));
    });
    return () => { removeEventListener("install_progress", listener); };
  }, []);

  const install = async () => {
    count.current = 0;
    setStep(0);
    setError("");
    try {
      const result = await installSamba();
      if (result.success) {
        onInstalled();
        return;
      }
      setError(result.error || t("install.installFailed"));
    } catch (e) {
      setError(String(e));
    }
    setStep(-1);
  };

  const running = step >= 0;
  const percent = Math.round((Math.max(step, 0) / INSTALL_STEPS.length) * 100);
  return <>
    <Focusable flow-children="column" style={{ background: colors.well, borderRadius: 4, padding: "12px 12px 12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
      <StatusLine on={false} title={t("install.notInstalled")} subtitle={t("install.why")} />
      {running ? <>
        <div role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}
          style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,.1)", overflow: "hidden" }}>
          <div style={{ width: `${percent}%`, height: "100%", background: colors.accent }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12.5 }}>
          {INSTALL_STEPS.map((key, i) => (
            <div key={key} style={{ display: "flex", gap: 8, color: i < step ? colors.muted : i === step ? colors.text : colors.dim }}>
              <span style={{ width: 12, textAlign: "center" }}>{i < step ? "✓" : i === step ? "›" : "·"}</span>
              {t(`install.steps.${key}`)}
            </div>
          ))}
        </div>
      </> : <Button primary onClick={install} style={{ width: "100%" }}>{t("install.installButton")}</Button>}
    </Focusable>
    {error && <Note tone="danger" style={{ marginTop: 8 }}>{error}</Note>}
    <Note style={{ marginTop: 10 }}>{t("install.note")}</Note>
  </>;
};

const StatusLine: FC<{ on: boolean; title: string; subtitle: string }> = ({ on, title, subtitle }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: "1 1 auto", minWidth: 0 }}>
    <span aria-hidden style={{
      width: 10, height: 10, borderRadius: 5, flex: "0 0 auto", background: on ? colors.success : colors.dim,
      boxShadow: on ? "0 0 0 4px rgba(142,224,111,.15)" : undefined,
    }} />
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 16, fontWeight: 500, color: colors.text }}>{title}</div>
      <div style={{ fontSize: 12, color: colors.muted }}>{subtitle}</div>
    </div>
  </div>
);

const Address: FC<{ label: string; value: string; on: boolean }> = ({ label, value, on }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: colors.muted }}>
    <span style={{ width: 72, flex: "0 0 auto" }}>{label}</span>
    <span style={{
      ...mono, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      color: on ? colors.soft : colors.dim, textDecoration: on ? undefined : "line-through",
    }}>{value}</span>
  </div>
);

const StatusCard: FC<{ status: SambaStatus; shared: number; onChanged: () => Promise<void> }> = ({ status, shared, onChanged }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const on = status.active;

  const toggle = async (value: boolean) => {
    setBusy(true);
    setError("");
    try {
      const result = await toggleSamba(value);
      if (!result.success) setError(result.error || t("server.toggleFailed"));
    } catch (e) {
      setError(String(e));
    }
    await onChanged();
    setBusy(false);
  };

  const title = busy ? (on ? t("server.stopping") : t("server.starting")) : on ? t("server.sharing") : t("server.notSharing");
  const host = (status.netbios_name || "steamdeck").toUpperCase();
  return <>
    <Focusable flow-children="column" style={{ background: colors.well, borderRadius: 4, padding: "12px 12px 10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
      <Focusable flow-children="row" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <StatusLine on={on} title={title} subtitle={t("server.summary", { count: String(shared) })} />
        <Toggle value={on} disabled={busy} onChange={toggle} />
      </Focusable>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <Address label="Windows" value={`\\\\${host}`} on={on} />
        <Address label="Mac / Linux" value={`smb://${status.ip || `${status.netbios_name || "steamdeck"}.local`}`} on={on} />
      </div>
    </Focusable>
    {error && <Note tone="danger" style={{ marginTop: 6 }}>{error}</Note>}
  </>;
};

const ShareList: FC<{ shares: Share[]; onChanged: () => Promise<void> }> = ({ shares, onChanged }) => {
  const [removed, setRemoved] = useState<Share | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const setEnabled = async (share: Share, enabled: boolean) => {
    await toggleShare(share.name, enabled);
    await onChanged();
  };
  const remove = async (share: Share) => {
    await removeShare(share.name);
    setRemoved(share);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setRemoved(null), 6000);
    await onChanged();
  };
  const undo = async () => {
    const share = removed;
    if (!share) return;
    setRemoved(null);
    await addShare(share.name, share.path);
    if (!share.enabled) await toggleShare(share.name, false);
    await onChanged();
  };
  const openMenu = (share: Share, target?: EventTarget) => showContextMenu(
    <Menu label={share.name}>
      <MenuItem onSelected={() => setEnabled(share, !share.enabled)}>{share.enabled ? t("shares.pause") : t("shares.resume")}</MenuItem>
      <MenuItem tone="destructive" onSelected={() => remove(share)}>{t("shares.remove")}</MenuItem>
    </Menu>,
    target ?? window,
  );

  return <>
    <SectionTitle aside={<span>{shares.length}</span>}>{t("shares.title")}</SectionTitle>
    {shares.length === 0 && <div style={{ fontSize: 13, color: colors.muted, padding: "6px 4px" }}>{t("shares.noShares")}</div>}
    {shares.map((share) => (
      <Row key={share.name} icon={share.path.startsWith("/run/media") ? <FaSdCard /> : <FaFolder />}
        title={share.name} description={share.path} code off={!share.enabled}
        onOptions={() => openMenu(share)} optionsLabel={t("shares.more")}>
        <Button ghost aria-label={t("shares.more")} onClick={(e: any) => openMenu(share, e?.currentTarget)}
          style={{ width: 34, minWidth: 34, padding: 0 }}><FaEllipsisH /></Button>
        <Toggle value={share.enabled} onChange={(value) => setEnabled(share, value)} />
      </Row>
    ))}
    {removed && (
      <Focusable flow-children="row" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "4px 4px 4px 12px", borderRadius: 4, background: "#2d333c", fontSize: 13 }}>
        <span style={{ flex: "1 1 auto", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {t("shares.removed", { name: removed.name })}
        </span>
        <Button ghost onClick={undo} style={{ color: colors.accentText, height: 30, padding: "0 10px" }}>{t("shares.undo")}</Button>
      </Focusable>
    )}
    <Button ghost onClick={() => { Navigation.Navigate(PICKER_ROUTE); Navigation.CloseSideMenus(); }} style={{
      width: "100%", justifyContent: "flex-start", marginTop: 8, color: colors.accentText, border: "1px dashed rgba(124,196,255,.3)",
    }}><FaPlus size={12} />{t("server.addFolders")}</Button>
  </>;
};

const Panel: FC = () => {
  const visible = useQuickAccessVisible();
  const [status, setStatus] = useState<SambaStatus | null>(null);
  const [shares, setShares] = useState<Share[]>([]);

  const refresh = async () => {
    try {
      const [s, sh] = await Promise.all([getSambaStatus(), getShares()]);
      setStatus(s);
      setShares(sh);
    } catch (e) {
      console.error("Failed to get status:", e);
    }
  };

  useEffect(() => {
    checkAndRepair().catch((e) => console.error("check_and_repair failed:", e));
  }, []);
  // Folders may be added or Samba removed from the full-screen pages.
  useEffect(() => { if (visible) refresh(); }, [visible]);

  return <PanelSection>
    <Style />
    <PanelSectionRow>
      <Focusable flow-children="column" style={{ display: "flex", flexDirection: "column" }}>
        <SshRow />
        <SectionTitle first>{t("server.title")}</SectionTitle>
        {!status && <div style={{ fontSize: 13, color: colors.muted, padding: "6px 4px" }}>{t("server.loading")}</div>}
        {status && !status.installed && <InstallCard onInstalled={refresh} />}
        {status?.installed && <>
          <StatusCard status={status} shared={shares.filter((s) => s.enabled).length} onChanged={refresh} />
          <ShareList shares={shares} onChanged={refresh} />
        </>}
      </Focusable>
    </PanelSectionRow>
    <PanelLink route={SETTINGS_ROUTE} icon={<FaCog />}>{t("settings.title")}</PanelLink>
  </PanelSection>;
};

export default Panel;
