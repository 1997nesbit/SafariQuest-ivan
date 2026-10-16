import { apiUpload } from '../lib/api'

/** What spot the image is for, so the server can enforce a minimum resolution
 * for that spot (backend/uploads/views.py IMAGE_DIMENSION_REQUIREMENTS). An
 * unlisted or omitted purpose still gets a low floor — this is never the only
 * check, just lets the server ask for more where the design needs it. */
export async function uploadImage(file: File, purpose?: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  if (purpose) formData.append('purpose', purpose)
  const { url } = await apiUpload<{ url: string }>('/api/uploads/images/', formData)
  return url
}

/** Uploads a hero background video (MP4 or WebM, up to 50MB, checked again on
 * the server by the file's own bytes) and returns its URL. */
export async function uploadVideo(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const { url } = await apiUpload<{ url: string }>('/api/uploads/videos/', formData)
  return url
}
