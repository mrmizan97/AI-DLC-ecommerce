import api from "./api";

export async function uploadMedia({ file, mediable_type, mediable_id, collection = "default", is_thumbnail = false }) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("mediable_type", mediable_type);
  fd.append("mediable_id", String(mediable_id));
  fd.append("collection", collection);
  fd.append("is_thumbnail", String(is_thumbnail));
  const res = await api.post("/media/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function deleteMedia(id) {
  await api.delete(`/media/${id}`);
}

export async function setThumbnail(id) {
  const res = await api.patch(`/media/${id}/thumbnail`);
  return res.data.data;
}

export function getThumbnail(record) {
  const list = record?.media || [];
  const thumb = list.find((m) => m.is_thumbnail);
  if (thumb) return thumb.url;
  if (list[0]) return list[0].url;
  return record?.image_url || null;
}

export function getGallery(record) {
  const list = record?.media || [];
  const sorted = [...list].sort((a, b) => {
    if (a.is_thumbnail !== b.is_thumbnail) return a.is_thumbnail ? -1 : 1;
    return (a.sort_order || 0) - (b.sort_order || 0);
  });
  const urls = sorted.map((m) => m.url);
  if (urls.length === 0 && record?.image_url) urls.push(record.image_url);
  return urls;
}

export function getProfilePhoto(user) {
  const list = user?.media || [];
  const profile = list.find((m) => m.collection === "profile");
  return profile?.url || null;
}

export function getCoverPhoto(record) {
  const list = record?.media || [];
  const cover = list.find((m) => m.collection === "cover");
  return cover?.url || null;
}
