import { DialogButton, Focusable, Navigation } from "@decky/ui";
import { FC, useEffect, useState } from "react";
import { FaChevronRight, FaFolder, FaHdd, FaHome } from "react-icons/fa";
import { addShare, getShares, listDirs, shareNameOf } from "../api";
import { t } from "../i18n/translations";
import { Button, Note, Page, Row, SideTab, colors, mono } from "../ui";

const HOME = "/home/deck";
const MEDIA = "/run/media";

const join = (dir: string, name: string) => (dir === "/" ? `/${name}` : `${dir}/${name}`);
const parentOf = (path: string) => path.replace(/\/[^/]+\/?$/, "") || "/";

/** Full-screen folder picker: places on the left, a path you can jump back along, then the subfolders. */
const FolderPicker: FC = () => {
  const [path, setPath] = useState(HOME);
  const [dirs, setDirs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [taken, setTaken] = useState<string[]>([]);
  const [error, setError] = useState("");

  const browse = async (to: string) => {
    setLoading(true);
    setError("");
    const result = await listDirs(to);
    if (result.success) {
      setPath(result.path);
      setDirs(result.dirs);
    } else {
      setError(result.error || "");
    }
    setLoading(false);
  };

  useEffect(() => {
    browse(HOME);
    getShares().then((shares) => setTaken(shares.map((s) => s.path))).catch(() => {});
  }, []);

  const exists = taken.includes(path);
  const share = async () => {
    if (exists) return;
    const result = await addShare(shareNameOf(path), path);
    if (result.success) Navigation.NavigateBack();
    else setError(result.error || t("folderBrowser.shareAlreadyExists"));
  };

  const parts = path === "/" ? [] : path.split("/").slice(1);
  return <Page title={t("folderBrowser.title")} onSecondary={exists ? undefined : share} secondaryLabel={t("folderBrowser.shareThisFolder")}
    actions={<Button primary disabled={exists || loading} onClick={share}>{t("folderBrowser.shareThisFolder")}</Button>}>
    <div style={{ display: "flex", gap: 20, flex: "1 1 auto", minHeight: 0 }}>
      <Focusable flow-children="column" style={{ flex: "0 0 200px", display: "flex", flexDirection: "column", gap: 2 }}>
        <SideTab icon={<FaHome />} label={t("folderBrowser.home")} current={path === HOME || path.startsWith(HOME + "/")} onClick={() => browse(HOME)} />
        <SideTab icon={<FaHdd />} label={t("folderBrowser.removable")} current={path === MEDIA || path.startsWith(MEDIA + "/")} onClick={() => browse(MEDIA)} />
      </Focusable>
      <Focusable flow-children="column" style={{ flex: "1 1 auto", minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Focusable flow-children="row" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, marginBottom: 8 }}>
          {["/", ...parts].map((part, i) => {
            const to = i === 0 ? "/" : "/" + parts.slice(0, i).join("/");
            return <Focusable key={to} flow-children="row" style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {i > 1 && <span style={{ color: colors.dim, ...mono }}>/</span>}
              <DialogButton className="smb-ghost" onClick={() => browse(to)} style={{
                width: "auto", minWidth: 0, height: 28, padding: "0 6px", background: "transparent", color: colors.accentText, ...mono,
              }}>{part}</DialogButton>
            </Focusable>;
          })}
        </Focusable>
        <div style={{ fontSize: 12, color: exists ? colors.warning : colors.muted, marginBottom: 6 }}>
          {exists ? t("folderBrowser.shareAlreadyExists") : t("folderBrowser.willShareAs", { name: shareNameOf(path) })}
        </div>
        {error && <Note tone="danger" style={{ marginBottom: 8 }}>{error}</Note>}
        {path !== "/" && <Row icon={<FaFolder />} title=".." onActivate={() => browse(parentOf(path))} />}
        {loading
          ? <div style={{ fontSize: 13, color: colors.muted, padding: 12 }}>{t("folderBrowser.loading")}</div>
          : dirs.map((dir) => (
            <Row key={dir} icon={<FaFolder />} title={dir} onActivate={() => browse(join(path, dir))}>
              <FaChevronRight size={12} color={colors.muted} />
            </Row>
          ))}
        {!loading && dirs.length === 0 && <div style={{ fontSize: 13, color: colors.muted, padding: 12 }}>{t("folderBrowser.noSubfolders")}</div>}
      </Focusable>
    </div>
  </Page>;
};

export default FolderPicker;
