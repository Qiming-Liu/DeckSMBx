import { callable } from "@decky/api";

export interface SambaStatus {
  installed: boolean;
  active: boolean;
  ip: string;
  netbios_name: string;
  discovery: { avahi: boolean; wsdd: boolean };
}

export interface SshStatus {
  available: boolean;
  active: boolean;
  ip: string;
}

export interface Share {
  name: string;
  path: string;
  enabled: boolean;
}

export interface Result {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

export const getSambaStatus = callable<[], SambaStatus>("get_smb_status");
export const installSamba = callable<[], Result>("install_smb");
export const uninstallSamba = callable<[], Result>("uninstall_samba");
export const toggleSamba = callable<[boolean], Result>("toggle_smb");
export const listDirs = callable<[string], { success: boolean; path: string; dirs: string[]; error?: string }>("list_dirs");
export const getShares = callable<[], Share[]>("get_shares");
export const addShare = callable<[string, string], Result>("add_share");
export const removeShare = callable<[string], Result>("remove_share");
export const toggleShare = callable<[string, boolean], Result>("toggle_share");
export const setSambaPassword = callable<[string], Result>("set_smb_password");
export const checkAndRepair = callable<[], Result>("check_and_repair");
export const exportLogs = callable<[], Result>("export_logs");
export const getSshStatus = callable<[], SshStatus>("get_ssh_status");
export const toggleSsh = callable<[boolean], Result>("toggle_ssh");

/** The share name a folder gets: its last path part. */
export const shareNameOf = (path: string) => path.replace(/\/+$/, "").split("/").pop() || "root";
