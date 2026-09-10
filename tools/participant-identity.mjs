export function participantIdentity(meta) {
  const source = meta?.recruitment_source || "prolific";
  const raw = source === "local" ? meta.participant_id : meta?.prolific_pid;
  if (typeof raw !== "string" || !raw || !["prolific", "local"].includes(source)) return null;
  const id = source === "prolific" ? raw.toLowerCase() : raw;
  if (meta.recruitment_source) {
    if (meta.participant_id !== raw) return null;
    if (source === "local" ? !/^L-[a-f0-9]{32}$/.test(id) || Boolean(meta.prolific_pid)
      : !/^[a-f0-9]{24}$/.test(id)) return null;
  }
  return { id, source, key: `${source}:${id}` };
}
