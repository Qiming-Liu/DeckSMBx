import { Focusable, Navigation, TextField } from "@decky/ui";
import { FC, useEffect, useState } from "react";
import { FaFileAlt, FaKey, FaTrash } from "react-icons/fa";
import { exportLogs, getSambaStatus, setSambaPassword, uninstallSamba } from "../api";
import { t } from "../i18n/translations";
import { Button, Note, Page, Row, SectionTitle, colors, mono } from "../ui";

/** Everything that is not used every day, on one page: password, logs, uninstall. */
const Settings: FC = () => {
  const [installed, setInstalled] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordInfo, setPasswordInfo] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [logInfo, setLogInfo] = useState<{ ok: boolean; text: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [uninstalling, setUninstalling] = useState(false);
  const [uninstallError, setUninstallError] = useState("");

  useEffect(() => { getSambaStatus().then((s) => setInstalled(s.installed)).catch(() => {}); }, []);

  const savePassword = async () => {
    if (!password) {
      setPasswordInfo({ ok: false, text: t("server.passwordEmpty") });
      return;
    }
    setSavingPassword(true);
    const result = await setSambaPassword(password).catch((e) => ({ success: false, error: String(e) }));
    setPasswordInfo(result.success ? { ok: true, text: t("settings.passwordSaved") } : { ok: false, text: result.error || t("server.passwordFailed") });
    if (result.success) setPassword("");
    setSavingPassword(false);
  };

  const saveLogs = async () => {
    setExporting(true);
    const result = await exportLogs().catch((e) => ({ success: false, error: String(e), path: "" }));
    setLogInfo(result.success ? { ok: true, text: String(result.path) } : { ok: false, text: result.error || t("logs.failed") });
    setExporting(false);
  };

  const uninstall = async () => {
    setUninstalling(true);
    setUninstallError("");
    const result = await uninstallSamba().catch((e) => ({ success: false, error: String(e) }));
    setUninstalling(false);
    setConfirming(false);
    if (result.success) Navigation.NavigateBack();
    else setUninstallError(result.error || t("settings.uninstallFailed"));
  };

  return <Page title={t("settings.title")}>
    <Focusable flow-children="column" style={{ width: "100%", maxWidth: 720, display: "flex", flexDirection: "column" }}>
      {installed && <>
        <SectionTitle first>{t("settings.password")}</SectionTitle>
        <Row icon={<FaKey />} title={t("settings.passwordTitle")}
          description={passwordInfo ? passwordInfo.text : t("settings.passwordHint")}>
          <div style={{ width: 200 }}>
            <TextField bIsPassword value={password} onChange={(e: any) => setPassword(e?.target?.value ?? "")} />
          </div>
          <Button primary disabled={savingPassword} onClick={savePassword}>{t("settings.save")}</Button>
        </Row>
        {passwordInfo && !passwordInfo.ok && <Note tone="danger" style={{ marginTop: 6 }}>{passwordInfo.text}</Note>}
        <Note style={{ marginTop: 8 }}>
          {t("settings.windowsCache")} <span style={mono}>net use \\STEAMDECK\IPC$ /delete</span>
        </Note>
      </>}

      <SectionTitle first={!installed}>{t("settings.feedback")}</SectionTitle>
      <Row icon={<FaFileAlt />} title={t("logs.export")} code={logInfo?.ok}
        description={logInfo ? logInfo.text : t("settings.logsHint")}>
        <Button disabled={exporting} onClick={saveLogs}>{exporting ? t("logs.exporting") : t("settings.export")}</Button>
      </Row>

      {installed && <>
        <SectionTitle>{t("settings.danger")}</SectionTitle>
        {confirming ? (
          <Focusable flow-children="row" style={{
            display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: 12, borderRadius: 4,
            background: "rgba(227,91,91,.08)", border: "1px solid rgba(227,91,91,.3)",
          }}>
            <span style={{ flex: "1 1 240px", fontSize: 13, color: colors.soft }}>{t("settings.uninstallConfirm")}</span>
            <Button ghost disabled={uninstalling} onClick={() => setConfirming(false)}>{t("modal.cancel")}</Button>
            <Button disabled={uninstalling} onClick={uninstall} style={{ background: colors.danger }}>
              {uninstalling ? t("uninstall.removing") : t("settings.uninstall")}
            </Button>
          </Focusable>
        ) : (
          <Row icon={<FaTrash color={colors.danger} />} title={t("server.uninstallSamba")} description={t("settings.uninstallHint")}>
            <Button danger onClick={() => setConfirming(true)}>{t("settings.uninstall")}…</Button>
          </Row>
        )}
        {uninstallError && <Note tone="danger" style={{ marginTop: 6 }}>{uninstallError}</Note>}
      </>}
    </Focusable>
  </Page>;
};

export default Settings;
