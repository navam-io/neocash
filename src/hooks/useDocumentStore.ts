"use client";

import { get, set, del, keys, entries } from "idb-keyval";
import type { DocumentRecord } from "@/types";

const DOC_PREFIX = "doc:";

function docKey(id: string) {
  return `${DOC_PREFIX}${id}`;
}

export async function getDocument(
  id: string,
): Promise<DocumentRecord | undefined> {
  return get<DocumentRecord>(docKey(id));
}

export async function saveDocument(doc: DocumentRecord): Promise<void> {
  await set(docKey(doc.id), doc);
}

export async function deleteDocument(id: string): Promise<void> {
  await del(docKey(id));
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const allEntries = await entries();
  const docs = allEntries
    .filter(([k]) => typeof k === "string" && k.startsWith(DOC_PREFIX))
    .map(([, v]) => v as DocumentRecord)
    .sort((a, b) => b.createdAt - a.createdAt);

  return docs;
}

export async function listUniqueDocuments(): Promise<DocumentRecord[]> {
  const all = await listDocuments();
  const seen = new Map<string, DocumentRecord>();
  for (const doc of all) {
    if (!seen.has(doc.filename)) {
      seen.set(doc.filename, doc);
    }
  }
  return Array.from(seen.values());
}

export async function updateDocumentMetadata(
  id: string,
  metadata: string,
): Promise<void> {
  const doc = await getDocument(id);
  if (doc) {
    doc.metadata = metadata;
    await set(docKey(id), doc);
  }
}

export async function deleteDocumentsForChat(
  chatId: string,
): Promise<void> {
  const allKeys = await keys();
  const docKeys = allKeys.filter(
    (k) => typeof k === "string" && k.startsWith(DOC_PREFIX),
  );

  for (const key of docKeys) {
    const doc = await get<DocumentRecord>(key as string);
    if (doc && doc.chatId === chatId) {
      await del(key);
    }
  }
}
