import { Focusable, ModalRoot, Navigation, TextField, showModal } from "@decky/ui";
import { FC, ReactNode, useEffect, useState } from "react";
import { SambaStatus, exportLogs, getSambaStatus, setSambaPassword, uninstallSamba } from "../api";
import { t } from "../i18n/translations";
import { Button, Card, Note, Page, PageStyle, Row, SectionTitle, colors, mono } from "../ui";

const value = (text: ReactNode, code = true) => (
  <div style={{ fontSize: 16, color: colors.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", ...(code ? { ...mono, fontSize: 15 } : {}) }}>{text}</div>
);

const PasswordModal: FC<{ closeModal?: () => void; onSaved: () => void }> = ({ closeModal, onSaved }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!password) {
      setError(t("server.passwordEmpty"));
      return;
    }
    setSaving(true);
    const result = await setSambaPassword(password).catch((e) => ({ success: false, error: String(e) }));
    setSaving(false);
    if (!result.success) {
      setError(result.error || t("server.passwordFailed"));
      return;
    }
    onSaved();
    closeModal?.();
  };
  return <ModalRoot closeModal={closeModal} className="smb-font smb-dialog">
    <PageStyle />
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>{t("settings.changePassword")}</div>
      <div style={{ fontSize: 13, color: colors.muted }}>{t("settings.passwordFor")}</div>
      <TextField bIsPassword value={password} onChange={(e: any) => setPassword(e?.target?.value ?? "")} />
      {error && <Note tone="danger">{error}</Note>}
      <Focusable flow-children="row" style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
        <Button ghost onClick={closeModal}>{t("modal.cancel")}</Button>
        <Button primary disabled={saving} onClick={save} style={{ padding: "0 22px" }}>{t("settings.save")}</Button>
      </Focusable>
    </div>
  </ModalRoot>;
};

/** Settings in two columns like DeckyGCM's: actions on the left, how to connect on the right. */
const Settings: FC = () => {
  const [samba, setSamba] = useState<SambaStatus | null>(null);
  const [message, setMessage] = useState<{ tone: "warning" | "danger"; text: string } | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [logPath, setLogPath] = useState("");
  const [exporting, setExporting] = useState(false);
  const [uninstall, setUninstall] = useState<"idle" | "confirm" | "busy">("idle");

  useEffect(() => { getSambaStatus().then(setSamba).catch(() => {}); }, []);

  const saveLogs = async () => {
    setExporting(true);
    setMessage(null);
    const result = await exportLogs().catch((e) => ({ success: false, error: String(e), path: "" }));
    if (result.success) setLogPath(String(result.path));
    else setMessage({ tone: "danger", text: result.error || t("logs.failed") });
    setExporting(false);
  };

  // A second press confirms, like DeckyGCM's reset.
  const pressUninstall = async () => {
    if (uninstall === "idle") {
      setUninstall("confirm");
      return;
    }
    setUninstall("busy");
    setMessage(null);
    const result = await uninstallSamba().catch((e) => ({ success: false, error: String(e) }));
    if (result.success) {
      Navigation.NavigateBack();
      return;
    }
    setMessage({ tone: "danger", text: result.error || t("settings.uninstallFailed") });
    setUninstall("idle");
  };

  const installed = Boolean(samba?.installed);
  const ip = samba?.ip || "";
  const host = (samba?.netbios_name || "steamdeck").toUpperCase();

  return <Page title={t("settings.title")}>
    {message && <Note tone={message.tone}>{message.text}</Note>}
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0 clamp(24px, 4vw, 56px)", alignItems: "flex-start" }}>
      <Focusable flow-children="column" style={{ flex: "1 1 420px", minWidth: 0, display: "flex", flexDirection: "column" }}>
        {installed && <>
          <SectionTitle first>Samba</SectionTitle>
          <Row title={t("settings.changePassword")}
            description={passwordSaved ? t("settings.passwordSaved") : t("settings.passwordHint")}>
            <Button onClick={() => showModal(<PasswordModal onSaved={() => setPasswordSaved(true)} />)}>{t("settings.change")}</Button>
          </Row>
          <Row title={t("server.uninstallSamba")} titleColor={uninstall === "confirm" ? colors.danger : undefined}
            description={uninstall === "confirm" ? t("settings.uninstallConfirm") : t("settings.uninstallHint")}>
            <Button danger={uninstall === "idle"} disabled={uninstall === "busy"} onClick={pressUninstall}
              style={uninstall === "confirm" ? { background: colors.danger } : undefined}>
              {uninstall === "busy" ? t("uninstall.removing") : uninstall === "confirm" ? t("settings.uninstallAgain") : t("settings.uninstall")}
            </Button>
          </Row>
        </>}
        <SectionTitle first={!installed}>{t("settings.feedback")}</SectionTitle>
        <Row title={t("logs.export")} code={Boolean(logPath)} description={logPath || t("settings.logsHint")}>
          <Button disabled={exporting} onClick={saveLogs}>{exporting ? t("logs.exporting") : t("settings.export")}</Button>
        </Row>
        <div style={{ borderTop: `1px solid ${colors.line}` }} />
      </Focusable>

      <Focusable flow-children="column" style={{ flex: "1 1 360px", minWidth: 0, display: "flex", flexDirection: "column" }}>
        <SectionTitle first>{t("settings.connect")}</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {installed ? <>
          <Card label="Windows" hint={<>{t("settings.windowsCache")} <span style={mono}>net use \\{host}\IPC$ /delete</span></>}>
            {value(`\\\\${host}`)}
          </Card>
          <Card label="Mac / Linux" hint={t("settings.userHint")}>
            {value(`smb://${ip || `${samba?.netbios_name || "steamdeck"}.local`}`)}
          </Card>
        </> : (
          <Card label="Samba" hint={t("settings.installFromPanel")}>{value(t("install.notInstalled"), false)}</Card>
        )}
        </div>
      </Focusable>
    </div>
  </Page>;
};

export default Settings;
