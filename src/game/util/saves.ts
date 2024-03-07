import { parse } from "yaml";
import semver from "semver";
import packageJson from "../../../package.json";

export interface Saveable<T> {
  toYAML(): string;
  toMap(): T;
}

export async function getLatestSave<T>(): Promise<T | null> {
  if (window.Gluon) {
    const saveId = await window.Gluon.ipc.getLatestSave();
    if (saveId) return load(saveId);
  } else {
    const saveData = localStorage.getItem("latestSave");
    if (saveData && typeof saveData === "string") return load(saveData);
  }
  return null;
}

export async function save<T>(data: Saveable<T>, id: string): Promise<void> {
  if (window.Gluon) {
    await window.Gluon.ipc.save(data.toYAML(), id);
    await window.Gluon.ipc.setLatestSave(id);
  } else {
    localStorage.setItem(`save/${id}`, data.toYAML());
    localStorage.setItem("latestSave", id);
  }
}

export async function load<T>(id: string): Promise<T | null> {
  const data = window.Gluon
    ? await window.Gluon.ipc.load(id)
    : localStorage.getItem(`save/${id}`);
  if (!data) return null;
  return parse(data);
}

export async function deleteSave(id: string): Promise<void> {
  if (window.Gluon) {
    await window.Gluon.ipc.delete(id);
  } else {
    localStorage.removeItem(`save/${id}`);
  }
}

export async function getSaveList(): Promise<string[]> {
  if (window.Gluon) {
    return window.Gluon.ipc.list();
  } else {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith("save/"))
      .map((key) => key.slice(5));
  }
}

export function isSaveCompatible(version: string): boolean {
  return semver.satisfies(version, packageJson.compatibleWith);
}
