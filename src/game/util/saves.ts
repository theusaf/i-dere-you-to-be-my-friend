import { parse } from "yaml";

export interface Saveable<T> {
  toYAML(): string;
  toMap(): T;
}

export async function getLatestSave<T>(): Promise<T | null> {
  if (window.Gluon) {
    // TODO: Implement latest save
  } else {
    const saveData = localStorage.getItem("latestSave");
    if (saveData && typeof saveData === "string") return load(saveData);
  }
  return null;
}

export async function save<T>(data: Saveable<T>, id: string): Promise<void> {
  if (window.Gluon) {
    // TODO: Implement save
  } else {
    localStorage.setItem(`save/${id}`, data.toYAML());
    localStorage.setItem("latestSave", id);
  }
}

export async function load<T>(id: string): Promise<T | null> {
  if (window.Gluon) {
    // TODO: Implement load
    return null;
  } else {
    const data = localStorage.getItem(`save/${id}`);
    if (!data) return null;
    return parse(data);
  }
}

export async function deleteSave(id: string): Promise<void> {
  if (window.Gluon) {
    // TODO: Implement deletion
  } else {
    localStorage.removeItem(`save/${id}`);
  }
}

export async function getSaveList(): Promise<string[]> {
  if (window.Gluon) {
    // TODO: Implement save list
    return [];
  } else {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith("save/"))
      .map((key) => key.slice(5));
  }
}
